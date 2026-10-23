import type {
  ActionResult,
  AppointmentResult,
  Backend,
  NewAppointmentInput,
  SessionResult,
  SignUpInput,
} from '../lib/backend/types'
import { hasConflict } from '../lib/availability'
import { isValidEmail, onlyDigits } from '../lib/format'
import type {
  Appointment,
  AppointmentStatus,
  BusySlot,
  PaymentMethod,
  Session,
  UserRole,
} from '../lib/types'
import { createSeedAppointments, DEMO_ACCOUNTS, type DemoAccount } from './fixtures'

/**
 * Back-end em memória com o mesmo contrato do Firestore.
 *
 * Existe para a suíte de testes rodar sem rede, sem conta no Firebase e sem carregar
 * o SDK. As regras de negócio que importam (conflito de horário, falta só no passado,
 * agendamento ligado à conta) são replicadas aqui.
 */

let accounts: DemoAccount[] = []
let appointments: Appointment[] = []
let session: Session | null = null

const sessionListeners = new Set<(value: Session | null) => void>()
const appointmentListeners = new Set<(value: Appointment[]) => void>()
const agendaListeners = new Set<(value: BusySlot[]) => void>()

function toBusySlot(appointment: Appointment): BusySlot {
  return {
    id: appointment.id,
    professionalId: appointment.professionalId,
    dateISO: appointment.dateISO,
    startMin: appointment.startMin,
    durationMin: appointment.durationMin,
    status: appointment.status,
  }
}

function visibleAppointments(): Appointment[] {
  const current = session
  if (!current) return []
  const list =
    current.role === 'admin'
      ? [...appointments]
      : appointments.filter((item) => item.clientUserId === current.userId)
  return list.sort((a, b) =>
    a.dateISO === b.dateISO ? a.startMin - b.startMin : a.dateISO < b.dateISO ? -1 : 1,
  )
}

function emitAppointments(): void {
  const list = visibleAppointments()
  appointmentListeners.forEach((listener) => listener(list))
}

function emitAgenda(): void {
  const blocks = appointments.map(toBusySlot)
  agendaListeners.forEach((listener) => listener(blocks))
}

function setSession(next: Session | null): void {
  session = next
  sessionListeners.forEach((listener) => listener(next))
  emitAppointments()
}

function accountFor(email: string): DemoAccount | undefined {
  return accounts.find((item) => item.email === email.trim().toLowerCase())
}

function findAppointment(id: string): Appointment | undefined {
  return appointments.find((item) => item.id === id)
}

/** Volta ao estado inicial: contas de exemplo, agenda de exemplo e ninguém conectado. */
export function resetFakeBackend(): void {
  accounts = DEMO_ACCOUNTS.map((item) => ({ ...item }))
  appointments = createSeedAppointments()
  session = null
  sessionListeners.clear()
  appointmentListeners.clear()
  agendaListeners.clear()
}

resetFakeBackend()

/** Agenda completa (inclusive o que a cliente não enxerga), para as asserções dos testes. */
export function fakeAppointments(): Appointment[] {
  return appointments
}

/** Conecta direto, sem passar pela tela de login. */
export function fakeSignInAs(role: UserRole): Session {
  const account = accounts.find((item) => item.role === role)
  if (!account) throw new Error(`Conta de exemplo com papel ${role} não existe`)
  const next: Session = {
    userId: account.userId,
    name: account.name,
    email: account.email,
    role: account.role,
  }
  setSession(next)
  return next
}

let sequence = 0

export const fakeBackend: Backend = {
  watchSession(listener) {
    sessionListeners.add(listener)
    listener(session)
    return () => sessionListeners.delete(listener)
  },

  async signIn(email, password): Promise<SessionResult> {
    const account = accountFor(email)
    if (!account || account.password !== password) {
      return { ok: false, error: 'E-mail ou senha não conferem.' }
    }
    const next: Session = {
      userId: account.userId,
      name: account.name,
      email: account.email,
      role: account.role,
    }
    setSession(next)
    return { ok: true, session: next }
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
    if (accountFor(email)) return { ok: false, error: 'Já existe uma conta com este e-mail.' }

    const account: DemoAccount = {
      userId: `user-${++sequence}`,
      name: input.name.trim(),
      email,
      phone: input.phone,
      password: input.password,
      role: 'cliente',
    }
    accounts.push(account)
    const next: Session = {
      userId: account.userId,
      name: account.name,
      email: account.email,
      role: account.role,
    }
    setSession(next)
    return { ok: true, session: next }
  },

  async signOut(): Promise<void> {
    setSession(null)
  },

  async sendPasswordReset(): Promise<ActionResult> {
    // O Firebase responde igual exista ou não a conta (evita descobrir e-mails cadastrados).
    return { ok: true }
  },

  watchAppointments(_session, listener) {
    appointmentListeners.add(listener)
    listener(visibleAppointments())
    return () => appointmentListeners.delete(listener)
  },

  watchAgenda(listener) {
    agendaListeners.add(listener)
    listener(appointments.map(toBusySlot))
    return () => agendaListeners.delete(listener)
  },

  async createAppointment(
    input: NewAppointmentInput,
    currentSession: Session | null,
  ): Promise<AppointmentResult> {
    if (!currentSession) {
      return { ok: false, error: 'Entre na sua conta para confirmar o agendamento.' }
    }
    if (
      hasConflict({
        dateISO: input.dateISO,
        startMin: input.startMin,
        durationMin: input.durationMin,
        professionalId: input.professionalId,
        appointments,
      })
    ) {
      return { ok: false, error: 'Este horário acabou de ser ocupado. Escolha outro.' }
    }

    const appointment: Appointment = {
      id: `apt-${++sequence}`,
      clientName: input.clientName.trim(),
      clientUserId: currentSession.role === 'cliente' ? currentSession.userId : undefined,
      serviceId: input.serviceId,
      title: input.title,
      professionalId: input.professionalId,
      dateISO: input.dateISO,
      startMin: input.startMin,
      durationMin: input.durationMin,
      price: input.price,
      status: input.status ?? 'aguardando',
      payment: 'pendente',
      origin: input.origin ?? 'app',
      note: input.clientNote?.trim() || undefined,
    }
    appointments.push(appointment)
    emitAppointments()
    emitAgenda()
    return { ok: true, appointment }
  },

  async setAppointmentStatus(id: string, status: AppointmentStatus): Promise<ActionResult> {
    const target = findAppointment(id)
    if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
    target.status = status
    emitAppointments()
    emitAgenda()
    return { ok: true }
  },

  async registerNoShow(id: string): Promise<ActionResult> {
    const target = findAppointment(id)
    if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
    target.status = 'faltou'
    target.note = 'Cliente não compareceu'
    emitAppointments()
    emitAgenda()
    return { ok: true }
  },

  async registerPayment(id: string, method: PaymentMethod): Promise<ActionResult> {
    const target = findAppointment(id)
    if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
    target.payment = 'pago'
    target.paymentMethod = method
    emitAppointments()
    return { ok: true }
  },

  async rescheduleAppointment(
    id: string,
    dateISO: string,
    startMin: number,
  ): Promise<ActionResult> {
    const target = findAppointment(id)
    if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
    if (
      hasConflict({
        dateISO,
        startMin,
        durationMin: target.durationMin,
        professionalId: target.professionalId,
        appointments,
        ignoreAppointmentId: id,
      })
    ) {
      return { ok: false, error: 'Horário indisponível para esta profissional.' }
    }
    target.dateISO = dateISO
    target.startMin = startMin
    target.status = 'aguardando'
    emitAppointments()
    emitAgenda()
    return { ok: true }
  },
}
