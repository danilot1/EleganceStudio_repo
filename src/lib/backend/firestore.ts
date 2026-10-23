import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut as signOutFirebase,
  updateProfile,
  type Unsubscribe,
  type User as FirebaseUser,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { hasConflict } from '../availability'
import { addDaysISO, todayISO } from '../dates'
import { isValidEmail, onlyDigits } from '../format'
import { firebaseAuth, firestore } from '../firebase'
import type {
  Appointment,
  AppointmentStatus,
  BusySlot,
  PaymentMethod,
  PaymentStatus,
  Session,
  UserRole,
} from '../types'
import type {
  ActionResult,
  AppointmentResult,
  Backend,
  NewAppointmentInput,
  SessionResult,
  SignUpInput,
} from './types'

/**
 * Back-end real: Firebase Authentication (e-mail/senha) + Cloud Firestore.
 *
 * Coleções:
 *   users/{uid}          perfil (nome, telefone, papel). A senha NUNCA é gravada aqui:
 *                        quem guarda a credencial é o Authentication.
 *   appointments/{id}    atendimento completo — legível só pela dona e pela gestão.
 *   agenda/{prof__data}  um documento por profissional e dia, com a lista de blocos
 *                        ocupados (sem nome, telefone ou observação). Leitura pública:
 *                        a grade de horários precisa funcionar antes do login.
 *
 * Por que a agenda é um documento por dia/profissional: o SDK do Firestore só permite
 * ler DOCUMENTOS dentro de uma transação, não consultas. Com o dia inteiro num
 * documento, a checagem de conflito e a gravação acontecem na mesma transação — duas
 * pessoas disputando o mesmo horário são serializadas e a segunda recebe erro, em vez
 * de sobrescrever a primeira.
 */

const USERS = 'users'
const APPOINTMENTS = 'appointments'
const AGENDA = 'agenda'

/** Erro interno para abortar a transação quando o horário já foi tomado. */
class SlotUnavailable extends Error {}

interface AgendaBlock {
  appointmentId: string
  startMin: number
  durationMin: number
  status: AppointmentStatus
}

function agendaId(professionalId: string, dateISO: string): string {
  return `${professionalId}__${dateISO}`
}

function errorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'E-mail ou senha não conferem.'
    case 'auth/email-already-in-use':
      return 'Já existe uma conta com este e-mail.'
    case 'auth/weak-password':
      return 'A senha precisa ter no mínimo 8 caracteres.'
    case 'auth/too-many-requests':
      return 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
    case 'auth/network-request-failed':
      return 'Sem conexão com o Firebase. Verifique a internet e tente novamente.'
    case 'auth/operation-not-allowed':
      return 'O login por e-mail e senha não está habilitado no console do Firebase.'
    case 'permission-denied':
      return 'Sua conta não tem permissão para esta operação.'
    case 'unavailable':
      return 'Firestore indisponível agora. Tente novamente em instantes.'
    default:
      return 'Não foi possível concluir a operação. Tente novamente.'
  }
}

function toAppointment(id: string, data: DocumentData): Appointment {
  return {
    id,
    clientName: String(data.clientName ?? ''),
    clientUserId: typeof data.clientUserId === 'string' ? data.clientUserId : undefined,
    serviceId: String(data.serviceId ?? ''),
    title: typeof data.title === 'string' ? data.title : undefined,
    professionalId: String(data.professionalId ?? ''),
    dateISO: String(data.dateISO ?? ''),
    startMin: Number(data.startMin ?? 0),
    durationMin: Number(data.durationMin ?? 0),
    price: Number(data.price ?? 0),
    status: (data.status as AppointmentStatus | undefined) ?? 'aguardando',
    payment: (data.payment as PaymentStatus | undefined) ?? 'pendente',
    paymentMethod:
      typeof data.paymentMethod === 'string' ? (data.paymentMethod as PaymentMethod) : undefined,
    origin: data.origin === 'balcao' ? 'balcao' : 'app',
    note: typeof data.note === 'string' ? data.note : undefined,
  }
}

interface AgendaBlockWithDay extends AgendaBlock {
  professionalId: string
  dateISO: string
}

/** Lê os blocos de um documento de dia, já com o dia/profissional anexados. */
function readBlocks(
  professionalId: string,
  dateISO: string,
  data: DocumentData,
): AgendaBlockWithDay[] {
  const blocks = Array.isArray(data.blocks) ? (data.blocks as AgendaBlock[]) : []
  return blocks
    .filter((block) => block && typeof block.appointmentId === 'string')
    .map((block) => ({
      appointmentId: block.appointmentId,
      startMin: Number(block.startMin ?? 0),
      durationMin: Number(block.durationMin ?? 0),
      status: (block.status as AppointmentStatus | undefined) ?? 'confirmado',
      professionalId,
      dateISO,
    }))
}

/** Formato que o cálculo de vagas entende (`BusySlot`). */
function toBusySlots(professionalId: string, dateISO: string, data: DocumentData): BusySlot[] {
  return readBlocks(professionalId, dateISO, data).map((block) => ({
    id: block.appointmentId,
    professionalId: block.professionalId,
    dateISO: block.dateISO,
    startMin: block.startMin,
    durationMin: block.durationMin,
    status: block.status,
  }))
}

/** Blocos como são gravados no documento (sem os campos do dia). */
function blocksOf(professionalId: string, dateISO: string, data: DocumentData): AgendaBlock[] {
  return readBlocks(professionalId, dateISO, data).map(
    ({ appointmentId, startMin, durationMin, status }) => ({
      appointmentId,
      startMin,
      durationMin,
      status,
    }),
  )
}

function withStatus(
  blocks: AgendaBlock[],
  appointmentId: string,
  status: AppointmentStatus,
): AgendaBlock[] {
  return blocks.map((block) =>
    block.appointmentId === appointmentId ? { ...block, status } : block,
  )
}

function sortAppointments(list: Appointment[]): Appointment[] {
  return list.sort((a, b) =>
    a.dateISO === b.dateISO ? a.startMin - b.startMin : a.dateISO < b.dateISO ? -1 : 1,
  )
}

/**
 * Garante um perfil em `users/{uid}` e devolve a sessão usada pela interface.
 * Contas criadas fora do app (pelo console) ganham perfil de cliente no primeiro acesso.
 */
async function ensureProfile(user: FirebaseUser): Promise<Session> {
  const reference = doc(firestore(), USERS, user.uid)
  const snapshot = await getDoc(reference)
  const email = user.email ?? ''

  if (snapshot.exists()) {
    const data = snapshot.data() as { name?: string; email?: string; role?: UserRole }
    return {
      userId: user.uid,
      name: data.name?.trim() || user.displayName || email.split('@')[0] || 'Cliente',
      email: data.email || email,
      role: data.role === 'admin' ? 'admin' : 'cliente',
    }
  }

  const profile = {
    name: user.displayName?.trim() || email.split('@')[0] || 'Cliente',
    email,
    role: 'cliente' as const,
    createdAtISO: new Date().toISOString(),
  }
  // `merge` de propósito: se o cadastro (`signUp`) estiver gravando o perfil completo
  // ao mesmo tempo, este documento não apaga o telefone que ele acabou de escrever.
  await setDoc(reference, profile, { merge: true })
  return { userId: user.uid, name: profile.name, email, role: profile.role }
}

export const firestoreBackend: Backend = {
  watchSession(listener) {
    return onAuthStateChanged(firebaseAuth(), (user) => {
      if (!user) {
        listener(null)
        return
      }
      ensureProfile(user)
        .then(listener)
        .catch(() => {
          // Perfil inacessível (regra ou rede): mantém a sessão para não travar o app.
          listener({
            userId: user.uid,
            name: user.displayName || user.email || 'Cliente',
            email: user.email ?? '',
            role: 'cliente',
          })
        })
    })
  },

  async signIn(email, password, remember): Promise<SessionResult> {
    const auth = firebaseAuth()
    try {
      // "Lembrar-me": persistência local sobrevive a fechar o navegador; a de sessão não.
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      const session = await ensureProfile(credential.user)
      return { ok: true, session }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  },

  async signUp(input: SignUpInput): Promise<SessionResult> {
    const email = input.email.trim().toLowerCase()
    if (!input.name.trim()) return { ok: false, error: 'Informe o nome completo.' }
    if (!isValidEmail(email)) return { ok: false, error: 'Informe um e-mail válido.' }
    if (onlyDigits(input.phone).length < 10) {
      return { ok: false, error: 'Informe um telefone/WhatsApp válido com DDD.' }
    }
    if (input.password.length < 8) {
      return { ok: false, error: 'A senha precisa ter no mínimo 8 caracteres.' }
    }

    const auth = firebaseAuth()
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, input.password)
      await updateProfile(credential.user, { displayName: input.name.trim() })
      await setDoc(doc(firestore(), USERS, credential.user.uid), {
        name: input.name.trim(),
        email,
        phone: input.phone,
        role: 'cliente',
        createdAtISO: new Date().toISOString(),
      })
      return {
        ok: true,
        session: {
          userId: credential.user.uid,
          name: input.name.trim(),
          email,
          role: 'cliente',
        },
      }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  },

  async signOut(): Promise<void> {
    await signOutFirebase(firebaseAuth())
  },

  async sendPasswordReset(email: string): Promise<ActionResult> {
    try {
      await sendPasswordResetEmail(firebaseAuth(), email.trim().toLowerCase())
      return { ok: true }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  },

  watchAppointments(session, listener): Unsubscribe {
    const database = firestore()
    const base = collection(database, APPOINTMENTS)
    // A gestão vê todos; a cliente vê só os que estão ligados à conta dela.
    const target =
      session.role === 'admin'
        ? query(base)
        : query(base, where('clientUserId', '==', session.userId))

    return onSnapshot(
      target,
      (snapshot) => {
        listener(sortAppointments(snapshot.docs.map((item) => toAppointment(item.id, item.data()))))
      },
      (error) => {
        console.error('Falha ao ler os agendamentos', error)
        listener([])
      },
    )
  },

  watchAgenda(listener): Unsubscribe {
    // Só os dias que ainda importam para a grade (uma semana para trás cobre o painel).
    const from = addDaysISO(todayISO(), -8)
    return onSnapshot(
      query(collection(firestore(), AGENDA), where('dateISO', '>=', from)),
      (snapshot) => {
        const slots = snapshot.docs.flatMap((item) => {
          const data = item.data()
          return toBusySlots(String(data.professionalId ?? ''), String(data.dateISO ?? ''), data)
        })
        listener(slots)
      },
      (error) => {
        console.error('Falha ao ler a agenda', error)
        listener([])
      },
    )
  },

  async createAppointment(
    input: NewAppointmentInput,
    session: Session | null,
  ): Promise<AppointmentResult> {
    const database = firestore()
    const id = doc(collection(database, APPOINTMENTS)).id
    const appointmentRef = doc(database, APPOINTMENTS, id)
    const dayRef = doc(database, AGENDA, agendaId(input.professionalId, input.dateISO))
    const status = input.status ?? 'aguardando'
    const clientUserId = session?.role === 'cliente' ? session.userId : null
    const note = input.clientNote?.trim() || null
    const title = input.title ?? null

    try {
      await runTransaction(database, async (transaction) => {
        // Lê o dia inteiro da profissional: é o documento que serializa a disputa.
        const day = await transaction.get(dayRef)
        const busy = day.exists()
          ? toBusySlots(input.professionalId, input.dateISO, day.data())
          : []

        if (
          hasConflict({
            dateISO: input.dateISO,
            startMin: input.startMin,
            durationMin: input.durationMin,
            professionalId: input.professionalId,
            appointments: busy,
          })
        ) {
          throw new SlotUnavailable()
        }

        const blocks = day.exists()
          ? blocksOf(input.professionalId, input.dateISO, day.data())
          : []

        transaction.set(appointmentRef, {
          clientName: input.clientName.trim(),
          clientUserId,
          serviceId: input.serviceId,
          title,
          professionalId: input.professionalId,
          dateISO: input.dateISO,
          startMin: input.startMin,
          durationMin: input.durationMin,
          price: input.price,
          status,
          payment: 'pendente',
          origin: input.origin ?? 'app',
          note,
          createdAt: serverTimestamp(),
        })
        transaction.set(dayRef, {
          professionalId: input.professionalId,
          dateISO: input.dateISO,
          blocks: [
            ...blocks,
            {
              appointmentId: id,
              startMin: input.startMin,
              durationMin: input.durationMin,
              status,
            },
          ],
        })
      })
    } catch (error) {
      if (error instanceof SlotUnavailable) {
        return { ok: false, error: 'Este horário acabou de ser ocupado. Escolha outro.' }
      }
      return { ok: false, error: errorMessage(error) }
    }

    return {
      ok: true,
      appointment: {
        id,
        clientName: input.clientName.trim(),
        clientUserId: clientUserId ?? undefined,
        serviceId: input.serviceId,
        title: title ?? undefined,
        professionalId: input.professionalId,
        dateISO: input.dateISO,
        startMin: input.startMin,
        durationMin: input.durationMin,
        price: input.price,
        status,
        payment: 'pendente',
        origin: input.origin ?? 'app',
        note: note ?? undefined,
      },
    }
  },

  async setAppointmentStatus(id: string, status: AppointmentStatus): Promise<ActionResult> {
    return updateStatus(id, status, {})
  },

  async registerNoShow(id: string): Promise<ActionResult> {
    return updateStatus(id, 'faltou', { note: 'Cliente não compareceu' })
  },

  async registerPayment(id: string, method: PaymentMethod): Promise<ActionResult> {
    try {
      await updateDoc(doc(firestore(), APPOINTMENTS, id), {
        payment: 'pago',
        paymentMethod: method,
      })
      return { ok: true }
    } catch (error) {
      return { ok: false, error: errorMessage(error) }
    }
  },

  async rescheduleAppointment(
    id: string,
    dateISO: string,
    startMin: number,
  ): Promise<ActionResult> {
    const database = firestore()
    const appointmentRef = doc(database, APPOINTMENTS, id)

    try {
      await runTransaction(database, async (transaction) => {
        const appointment = await transaction.get(appointmentRef)
        if (!appointment.exists()) throw new Error('Agendamento não encontrado.')

        const data = appointment.data()
        const professionalId = String(data.professionalId ?? '')
        const durationMin = Number(data.durationMin ?? 0)
        const currentDateISO = String(data.dateISO ?? '')

        const oldDayRef = doc(database, AGENDA, agendaId(professionalId, currentDateISO))
        const newDayRef = doc(database, AGENDA, agendaId(professionalId, dateISO))

        const oldDay = await transaction.get(oldDayRef)
        const newDay =
          currentDateISO === dateISO ? oldDay : await transaction.get(newDayRef)

        const targetBusy = newDay.exists()
          ? toBusySlots(professionalId, dateISO, newDay.data())
          : []
        // O próprio atendimento é retirado da checagem: ele está mudando de lugar.
        const withoutSelf = targetBusy.filter((slot) => slot.id !== id)

        if (
          hasConflict({
            dateISO,
            startMin,
            durationMin,
            professionalId,
            appointments: withoutSelf,
          })
        ) {
          throw new SlotUnavailable()
        }

        const targetBlocks = newDay.exists()
          ? blocksOf(professionalId, dateISO, newDay.data()).filter(
              (block) => block.appointmentId !== id,
            )
          : []

        transaction.update(appointmentRef, { dateISO, startMin, status: 'aguardando' })
        transaction.set(newDayRef, {
          professionalId,
          dateISO,
          blocks: [
            ...targetBlocks,
            { appointmentId: id, startMin, durationMin, status: 'aguardando' },
          ],
        })

        if (currentDateISO !== dateISO && oldDay.exists()) {
          transaction.set(oldDayRef, {
            professionalId,
            dateISO: currentDateISO,
            blocks: blocksOf(professionalId, currentDateISO, oldDay.data()).filter(
              (block) => block.appointmentId !== id,
            ),
          })
        }
      })
    } catch (error) {
      if (error instanceof SlotUnavailable) {
        return { ok: false, error: 'Horário indisponível para esta profissional.' }
      }
      return { ok: false, error: errorMessage(error) }
    }

    return { ok: true }
  },
}

/**
 * Altera status do atendimento e o bloco correspondente na agenda.
 * O bloco continua no dia com o status novo: cancelado e falta liberam o horário,
 * e `freesSlot` é quem decide isso (a vaga volta, o histórico fica).
 */
async function updateStatus(
  id: string,
  status: AppointmentStatus,
  extra: Record<string, unknown>,
): Promise<ActionResult> {
  const database = firestore()
  const appointmentRef = doc(database, APPOINTMENTS, id)

  try {
    await runTransaction(database, async (transaction) => {
      const appointment = await transaction.get(appointmentRef)
      if (!appointment.exists()) throw new Error('Agendamento não encontrado.')

      const data = appointment.data()
      const professionalId = String(data.professionalId ?? '')
      const dateISO = String(data.dateISO ?? '')
      const dayRef = doc(database, AGENDA, agendaId(professionalId, dateISO))
      const day = await transaction.get(dayRef)

      transaction.update(appointmentRef, { status, ...extra })

      if (day.exists()) {
        transaction.set(dayRef, {
          professionalId,
          dateISO,
          blocks: withStatus(blocksOf(professionalId, dateISO, day.data()), id, status),
        })
      }
    })
    return { ok: true }
  } catch (error) {
    return { ok: false, error: errorMessage(error) }
  }
}
