import type {
  Appointment,
  AppointmentStatus,
  BusySlot,
  PaymentMethod,
  Session,
} from '../types'

/**
 * Contrato da camada de dados.
 *
 * Tudo o que a interface conhece do "servidor" passa por aqui. A implementação real é
 * `firestore.ts` (Firebase Auth + Firestore); os testes usam uma implementação em
 * memória com o mesmo contrato.
 */

export interface ActionResult {
  ok: boolean
  error?: string
}

export interface SessionResult extends ActionResult {
  session?: Session
}

export interface SignUpInput {
  name: string
  email: string
  phone: string
  password: string
}

export interface NewAppointmentInput {
  serviceId: string
  professionalId: string
  dateISO: string
  startMin: number
  durationMin: number
  price: number
  clientName: string
  clientNote?: string
  /** Usado pelo encaixe no balcão: entra já confirmado. */
  status?: AppointmentStatus
  origin?: Appointment['origin']
  title?: string
}

export type AppointmentResult = ActionResult & { appointment?: Appointment }

export interface Backend {
  /** Avisa quando o usuário entra ou sai; emite `null` sem sessão. */
  watchSession(listener: (session: Session | null) => void): () => void
  signIn(email: string, password: string, remember: boolean): Promise<SessionResult>
  signUp(input: SignUpInput): Promise<SessionResult>
  signOut(): Promise<void>
  sendPasswordReset(email: string): Promise<ActionResult>
  /** Agendamentos visíveis para a sessão: os próprios (cliente) ou todos (gestão). */
  watchAppointments(session: Session, listener: (appointments: Appointment[]) => void): () => void
  /** Blocos de agenda sem dado pessoal — base do cálculo de horários livres. */
  watchAgenda(listener: (agenda: BusySlot[]) => void): () => void
  createAppointment(
    input: NewAppointmentInput,
    session: Session | null,
  ): Promise<AppointmentResult>
  setAppointmentStatus(id: string, status: AppointmentStatus): Promise<ActionResult>
  registerNoShow(id: string): Promise<ActionResult>
  registerPayment(id: string, method: PaymentMethod): Promise<ActionResult>
  rescheduleAppointment(id: string, dateISO: string, startMin: number): Promise<ActionResult>
}
