import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { SERVICES } from '../../data/catalog'
import {
  agendaDocId,
  blocksOf,
  busyAppointments,
  removeBlock,
  upsertBlock,
} from '../agendaDoc'
import { fitsWorkWindow, hasConflict } from '../availability'
import { addDaysISO, todayISO } from '../dates'
import { isValidEmail, onlyDigits } from '../format'
import { firebaseAuth, firebaseDb } from '../firebase'
import {
  buildMail,
  isReminderDue,
  mailDocument,
  reminderMailId,
} from '../notifications'
import { canRegisterNoShow } from '../noShow'
import type { Database, ServiceOverrides } from '../storage'
import {
  freesSlot,
  type Appointment,
  type AppointmentStatus,
  type PaymentMethod,
  type PaymentStatus,
  type Session,
  type User,
} from '../types'
import { validateServicePatch } from './servicePatch'
import type { ActionResult, Backend, SessionResult } from './types'

/**
 * Adaptador Firebase: Authentication para a sessão e Firestore para os dados.
 *
 * Reserva transacional (fase 3): cada profissional/dia tem um documento em `agenda`
 * com os blocos ocupados. Criar ou reagendar lê esse documento e grava o atendimento +
 * o bloco na MESMA transação — duas tentativas simultâneas no mesmo horário são
 * serializadas pelo Firestore, e a segunda recebe "horário ocupado".
 *
 * Limite conhecido: a transação roda no cliente (o SDK do Firestore só aceita leitura
 * de documento dentro de transação, e não há Cloud Functions neste projeto). Por isso
 * as regras de `agenda` são permissivas — um cliente malicioso poderia corromper o
 * documento do dia. As regras impedem acesso a dados de outras clientes em
 * `appointments`, mas não conseguem validar sobreposição de horário.
 */

const USERS = 'users'
const APPOINTMENTS = 'appointments'
const AGENDA = 'agenda'
const SERVICE_OVERRIDES = 'serviceOverrides'
/** Coleção lida pela extensão oficial de e-mail (Trigger Email from Firestore). */
const MAIL = 'mail'

/** Janela de histórico carregada no painel (dias para trás). */
const HISTORY_DAYS = 90

/** Erro de domínio: horário já ocupado dentro da transação. */
class SlotTaken extends Error {}

interface ProfileData {
  name?: string
  email?: string
  phone?: string
  role?: string
  createdAtISO?: string
}

function describeError(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'E-mail ou senha não conferem.'
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com este e-mail.'
    case 'auth/invalid-email':
      return 'Informe um e-mail válido.'
    case 'auth/weak-password':
      return 'A senha precisa ter no mínimo 8 caracteres.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Tente novamente em alguns minutos.'
    case 'auth/network-request-failed':
      return 'Sem conexão com o servidor. Verifique a internet e tente novamente.'
    case 'permission-denied':
      return 'Seu perfil não tem permissão para esta ação.'
    case 'unavailable':
      return 'Serviço indisponível no momento. Tente novamente.'
    default:
      return 'Não foi possível concluir a operação. Tente novamente.'
  }
}

function asRecord(data: unknown): Record<string, unknown> {
  return (data ?? {}) as Record<string, unknown>
}

function toAppointment(id: string, raw: unknown): Appointment {
  const data = asRecord(raw)
  return {
    id,
    clientName: String(data.clientName ?? ''),
    clientUserId: data.clientUserId ? String(data.clientUserId) : undefined,
    clientEmail: data.clientEmail ? String(data.clientEmail) : undefined,
    serviceId: String(data.serviceId ?? ''),
    title: data.title ? String(data.title) : undefined,
    professionalId: String(data.professionalId ?? ''),
    dateISO: String(data.dateISO ?? ''),
    startMin: Number(data.startMin ?? 0),
    durationMin: Number(data.durationMin ?? 0),
    price: Number(data.price ?? 0),
    status: (data.status as AppointmentStatus) ?? 'aguardando',
    payment: (data.payment as PaymentStatus) ?? 'pendente',
    paymentMethod: (data.paymentMethod as PaymentMethod | null) ?? undefined,
    origin: data.origin === 'balcao' ? 'balcao' : 'app',
    note: data.note ? String(data.note) : undefined,
  }
}

function toUser(id: string, raw: unknown): User {
  const data = asRecord(raw) as ProfileData
  return {
    id,
    name: data.name ?? '',
    email: data.email ?? '',
    phone: data.phone ?? '',
    // A senha nunca é lida do Firestore: quem autentica é o Firebase Auth.
    password: '',
    role: data.role === 'admin' ? 'admin' : 'cliente',
    createdAtISO: data.createdAtISO ?? '',
  }
}

async function sessionFor(user: FirebaseUser): Promise<Session> {
  const snapshot = await getDoc(doc(firebaseDb(), USERS, user.uid))
  const profile = (snapshot.data() ?? {}) as ProfileData
  return {
    userId: user.uid,
    name: profile.name ?? user.displayName ?? user.email ?? 'Cliente',
    email: profile.email ?? user.email ?? '',
    role: profile.role === 'admin' ? 'admin' : 'cliente',
  }
}

/** Documento de agenda da profissional naquele dia. */
function agendaRef(professionalId: string, dateISO: string) {
  return doc(firebaseDb(), AGENDA, agendaDocId(professionalId, dateISO))
}

function dayPayload(professionalId: string, dateISO: string, blocks: unknown) {
  return {
    professionalId,
    dateISO,
    blocks,
    updatedAt: serverTimestamp(),
  }
}

export function createFirestoreBackend(): Backend {
  return {
    mode: 'firebase',

    subscribe(listener) {
      const database = firebaseDb()
      let appointments: Appointment[] = []
      let users: User[] = []
      let overrides: ServiceOverrides = {}

      const emit = () => {
        const payload: Database = {
          version: 1,
          // O Firestore não usa a carga de exemplo deslocada por dia: o campo existe
          // apenas porque é o formato comum aos dois backends.
          seedDateISO: todayISO(),
          users,
          appointments,
          serviceOverrides: overrides,
        }
        listener(payload)
      }

      const from = addDaysISO(todayISO(), -HISTORY_DAYS)
      const stopAppointments = onSnapshot(
        query(collection(database, APPOINTMENTS), where('dateISO', '>=', from)),
        (snapshot) => {
          appointments = snapshot.docs.map((item) => toAppointment(item.id, item.data()))
          emit()
        },
        (error) => console.error('Falha ao ler os agendamentos', error),
      )

      const stopOverrides = onSnapshot(
        collection(database, SERVICE_OVERRIDES),
        (snapshot) => {
          overrides = {}
          for (const item of snapshot.docs) {
            overrides[item.id] = item.data() as ServiceOverrides[string]
          }
          emit()
        },
        (error) => console.error('Falha ao ler os ajustes de serviço', error),
      )

      // A lista de contas é da gestão. Para uma cliente a consulta é negada pelas
      // regras — o erro é esperado e só significa "sem acesso à lista de clientes".
      const stopUsers = onSnapshot(
        collection(database, USERS),
        (snapshot) => {
          users = snapshot.docs.map((item) => toUser(item.id, item.data()))
          emit()
        },
        () => {
          users = []
        },
      )

      return () => {
        stopAppointments()
        stopOverrides()
        stopUsers()
      }
    },

    subscribeSession(listener) {
      return onAuthStateChanged(firebaseAuth(), (user) => {
        if (!user) {
          listener(null)
          return
        }
        void sessionFor(user)
          .then(listener)
          .catch(() => listener(null))
      })
    },

    async signIn(email, password, remember = true): Promise<SessionResult> {
      try {
        const auth = firebaseAuth()
        // "Lembrar-me" aqui é a persistência nativa do Firebase Auth.
        await setPersistence(
          auth,
          remember ? browserLocalPersistence : browserSessionPersistence,
        )
        const credential = await signInWithEmailAndPassword(
          auth,
          email.trim().toLowerCase(),
          password,
        )
        return { ok: true, session: await sessionFor(credential.user) }
      } catch (error) {
        return { ok: false, error: describeError(error) }
      }
    },

    async signUp(input): Promise<SessionResult> {
      const email = input.email.trim().toLowerCase()
      if (!input.name.trim()) return { ok: false, error: 'Informe o nome completo.' }
      if (!isValidEmail(email)) return { ok: false, error: 'Informe um e-mail válido.' }
      if (onlyDigits(input.phone).length < 10) {
        return { ok: false, error: 'Informe um telefone/WhatsApp válido com DDD.' }
      }
      if (input.password.length < 8) {
        return { ok: false, error: 'A senha precisa ter no mínimo 8 caracteres.' }
      }

      try {
        const credential = await createUserWithEmailAndPassword(
          firebaseAuth(),
          email,
          input.password,
        )
        const name = input.name.trim()
        await updateProfile(credential.user, { displayName: name })
        await setDoc(doc(firebaseDb(), USERS, credential.user.uid), {
          name,
          email,
          phone: input.phone,
          role: 'cliente',
          createdAtISO: new Date().toISOString(),
          createdAt: serverTimestamp(),
        })
        return { ok: true, session: { userId: credential.user.uid, name, email, role: 'cliente' } }
      } catch (error) {
        return { ok: false, error: describeError(error) }
      }
    },

    async signOut() {
      await signOut(firebaseAuth())
    },

    async requestPasswordReset(identifier) {
      const value = identifier.trim().toLowerCase()
      if (!isValidEmail(value)) {
        return {
          ok: false,
          error: 'No modo Firebase a recuperação é por e-mail. Informe o e-mail cadastrado.',
        }
      }
      try {
        await sendPasswordResetEmail(firebaseAuth(), value)
        return { ok: true }
      } catch (error) {
        return { ok: false, error: describeError(error) }
      }
    },

    async createAppointment(input, session) {
      if (
        !fitsWorkWindow({
          dateISO: input.dateISO,
          startMin: input.startMin,
          durationMin: input.durationMin,
        })
      ) {
        return {
          ok: false,
          error: 'Este serviço não cabe no expediente do dia. Escolha outro horário.',
        }
      }

      const database = firebaseDb()
      const appointmentRef = doc(collection(database, APPOINTMENTS))
      const dayRef = agendaRef(input.professionalId, input.dateISO)
      const status = input.status ?? 'aguardando'
      const appointment: Appointment = {
        id: appointmentRef.id,
        clientName: input.clientName.trim(),
        clientUserId: session?.role === 'cliente' ? session.userId : undefined,
        clientEmail: input.clientEmail?.trim() || undefined,
        serviceId: input.serviceId,
        title: input.title,
        professionalId: input.professionalId,
        dateISO: input.dateISO,
        startMin: input.startMin,
        durationMin: input.durationMin,
        price: input.price,
        status,
        payment: 'pendente',
        origin: input.origin ?? 'app',
        note: input.clientNote?.trim() || undefined,
      }

      try {
        await runTransaction(database, async (transaction) => {
          // Lê o dia inteiro da profissional: é este documento que serializa a disputa.
          const day = await transaction.get(dayRef)
          const blocks = blocksOf(day.exists() ? day.data() : null)

          if (
            hasConflict({
              dateISO: input.dateISO,
              startMin: input.startMin,
              durationMin: input.durationMin,
              professionalId: input.professionalId,
              appointments: busyAppointments(input.professionalId, input.dateISO, blocks),
            })
          ) {
            throw new SlotTaken()
          }

          transaction.set(appointmentRef, {
            clientName: appointment.clientName,
            clientUserId: appointment.clientUserId ?? null,
            clientEmail: appointment.clientEmail ?? null,
            serviceId: appointment.serviceId,
            title: appointment.title ?? null,
            professionalId: appointment.professionalId,
            dateISO: appointment.dateISO,
            startMin: appointment.startMin,
            durationMin: appointment.durationMin,
            price: appointment.price,
            status: appointment.status,
            payment: appointment.payment,
            paymentMethod: null,
            origin: appointment.origin,
            note: appointment.note ?? null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          })

          transaction.set(
            dayRef,
            dayPayload(
              input.professionalId,
              input.dateISO,
              upsertBlock(blocks, {
                appointmentId: appointmentRef.id,
                startMin: input.startMin,
                durationMin: input.durationMin,
                status,
              }),
            ),
          )
        })

        return { ok: true, appointment }
      } catch (error) {
        if (error instanceof SlotTaken) {
          return { ok: false, error: 'Este horário acabou de ser ocupado. Escolha outro.' }
        }
        return { ok: false, error: describeError(error) }
      }
    },

    async setAppointmentStatus(id, status) {
      const database = firebaseDb()
      const appointmentRef = doc(database, APPOINTMENTS, id)

      try {
        await runTransaction(database, async (transaction) => {
          const snapshot = await transaction.get(appointmentRef)
          if (!snapshot.exists()) return

          const appointment = toAppointment(snapshot.id, snapshot.data())
          const dayRef = agendaRef(appointment.professionalId, appointment.dateISO)
          const day = await transaction.get(dayRef)

          transaction.update(appointmentRef, { status, updatedAt: serverTimestamp() })

          // Cancelado/falta liberam a vaga: o bloco continua no dia com o novo status,
          // e `hasConflict` o ignora.
          if (day.exists()) {
            transaction.set(
              dayRef,
              dayPayload(
                appointment.professionalId,
                appointment.dateISO,
                upsertBlock(blocksOf(day.data()), {
                  appointmentId: id,
                  startMin: appointment.startMin,
                  durationMin: appointment.durationMin,
                  status,
                }),
              ),
            )
          }
        })
      } catch (error) {
        console.error('Falha ao mudar o status do atendimento', error)
      }
    },

    async registerNoShow(id) {
      const database = firebaseDb()
      const appointmentRef = doc(database, APPOINTMENTS, id)
      let outcome: ActionResult = { ok: true }

      try {
        await runTransaction(database, async (transaction) => {
          const snapshot = await transaction.get(appointmentRef)
          if (!snapshot.exists()) {
            outcome = { ok: false, error: 'Agendamento não encontrado.' }
            return
          }

          const appointment = toAppointment(snapshot.id, snapshot.data())
          if (!canRegisterNoShow(appointment)) {
            outcome = {
              ok: false,
              error:
                'Só é possível registrar falta depois do horário marcado e antes de concluir ou cancelar o atendimento.',
            }
            return
          }

          const dayRef = agendaRef(appointment.professionalId, appointment.dateISO)
          const day = await transaction.get(dayRef)

          transaction.update(appointmentRef, {
            status: 'faltou',
            note: 'Cliente não compareceu',
            updatedAt: serverTimestamp(),
          })

          if (day.exists()) {
            transaction.set(
              dayRef,
              dayPayload(
                appointment.professionalId,
                appointment.dateISO,
                upsertBlock(blocksOf(day.data()), {
                  appointmentId: id,
                  startMin: appointment.startMin,
                  durationMin: appointment.durationMin,
                  status: 'faltou',
                }),
              ),
            )
          }
        })

        return outcome
      } catch (error) {
        return { ok: false, error: describeError(error) }
      }
    },

    async registerPayment(id, method) {
      try {
        await updateDoc(doc(firebaseDb(), APPOINTMENTS, id), {
          payment: 'pago',
          paymentMethod: method,
          updatedAt: serverTimestamp(),
        })
      } catch (error) {
        console.error('Falha ao registrar o pagamento', error)
      }
    },

    async rescheduleAppointment(id, dateISO, startMin) {
      const database = firebaseDb()
      const appointmentRef = doc(database, APPOINTMENTS, id)
      let outcome: ActionResult = { ok: true }

      try {
        await runTransaction(database, async (transaction) => {
          const snapshot = await transaction.get(appointmentRef)
          if (!snapshot.exists()) {
            outcome = { ok: false, error: 'Agendamento não encontrado.' }
            return
          }

          const target = toAppointment(snapshot.id, snapshot.data())
          if (!fitsWorkWindow({ dateISO, startMin, durationMin: target.durationMin })) {
            outcome = {
              ok: false,
              error: 'Este serviço não cabe no expediente do dia escolhido.',
            }
            return
          }

          const fromRef = agendaRef(target.professionalId, target.dateISO)
          const toRef = agendaRef(target.professionalId, dateISO)
          const fromDay = await transaction.get(fromRef)
          // Mesmo dia: uma leitura só; a transação exige todas as leituras antes da
          // primeira gravação.
          const toDay = fromRef.path === toRef.path ? fromDay : await transaction.get(toRef)

          const targetBlocks = blocksOf(toDay.exists() ? toDay.data() : null)
          if (
            hasConflict({
              dateISO,
              startMin,
              durationMin: target.durationMin,
              professionalId: target.professionalId,
              appointments: busyAppointments(target.professionalId, dateISO, targetBlocks),
              ignoreAppointmentId: id,
            })
          ) {
            outcome = { ok: false, error: 'Horário indisponível para esta profissional.' }
            return
          }

          transaction.update(appointmentRef, {
            dateISO,
            startMin,
            status: 'aguardando',
            updatedAt: serverTimestamp(),
          })

          transaction.set(
            toRef,
            dayPayload(
              target.professionalId,
              dateISO,
              upsertBlock(targetBlocks, {
                appointmentId: id,
                startMin,
                durationMin: target.durationMin,
                status: 'aguardando',
              }),
            ),
          )

          if (fromRef.path !== toRef.path && fromDay.exists()) {
            transaction.set(
              fromRef,
              dayPayload(
                target.professionalId,
                target.dateISO,
                removeBlock(blocksOf(fromDay.data()), id),
              ),
            )
          }
        })

        return outcome
      } catch (error) {
        return { ok: false, error: describeError(error) }
      }
    },

    async updateService(id, patch) {
      if (!SERVICES.some((service) => service.id === id)) {
        return { ok: false, error: 'Serviço não encontrado no catálogo.' }
      }
      const validation = validateServicePatch(patch)
      if (validation) return { ok: false, error: validation }

      try {
        if (patch.active === false) {
          const snapshot = await getDocs(
            query(
              collection(firebaseDb(), APPOINTMENTS),
              where('serviceId', '==', id),
              where('dateISO', '>=', todayISO()),
            ),
          )
          const scheduled = snapshot.docs.some(
            (item) => !freesSlot(String(item.data().status) as AppointmentStatus),
          )
          if (scheduled) {
            return {
              ok: false,
              error:
                'Há agendamento ativo com este serviço. Cancele ou reagende antes de desativá-lo.',
            }
          }
        }

        await setDoc(
          doc(firebaseDb(), SERVICE_OVERRIDES, id),
          { ...patch, updatedAt: serverTimestamp() },
          { merge: true },
        )
        return { ok: true }
      } catch (error) {
        return { ok: false, error: describeError(error) }
      }
    },

    async queueMail(draft) {
      try {
        const database = firebaseDb()
        // Id determinístico (lembrete) sobrescreve o mesmo documento; sem id, a coleção
        // gera um novo pedido.
        const target = draft.id
          ? doc(database, MAIL, draft.id)
          : doc(collection(database, MAIL))
        await setDoc(target, mailDocument(draft, new Date().toISOString()))
        return { ok: true }
      } catch (error) {
        return { ok: false, error: describeError(error) }
      }
    },

    async queueReminders(nowISO = new Date().toISOString()) {
      const database = firebaseDb()
      const tomorrow = addDaysISO(nowISO.slice(0, 10), 1)
      let created = 0

      try {
        const snapshot = await getDocs(
          query(collection(database, APPOINTMENTS), where('dateISO', '==', tomorrow)),
        )

        for (const item of snapshot.docs) {
          const appointment = toAppointment(item.id, item.data())
          if (!isReminderDue(appointment, nowISO)) continue

          // O e-mail do agendamento vale para a convidada; o do cadastro, para a cliente.
          const email =
            appointment.clientEmail ??
            (appointment.clientUserId
              ? String(
                  (await getDoc(doc(database, USERS, appointment.clientUserId))).data()?.email ??
                    '',
                )
              : '')
          if (!email) continue

          const mailRef = doc(database, MAIL, reminderMailId(appointment.id))
          // O lembrete é um só por atendimento: já pedido, não pede de novo.
          if ((await getDoc(mailRef)).exists()) continue

          await setDoc(
            mailRef,
            mailDocument(buildMail({ kind: 'lembrete', appointment, to: email }), nowISO),
          )
          created += 1
        }
      } catch (error) {
        // Sem permissão (não é gestão) ou sem rede: o painel segue funcionando.
        console.error('Falha ao registrar os lembretes de véspera', error)
        return 0
      }

      return created
    },

    async resetDemo() {
      // No Firebase não existe "recomeçar do zero": os dados são compartilhados com a
      // equipe. Restaurar a demonstração é uma decisão de projeto, não de tela.
      console.info('resetDemo ignorado no modo Firebase.')
    },
  }
}
