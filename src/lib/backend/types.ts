import type { Database } from '../storage'
import type { MailDraft } from '../notifications'
import type {
  Appointment,
  AppointmentStatus,
  PaymentMethod,
  Session,
  UserRole,
} from '../types'

/**
 * Contrato da camada de dados.
 *
 * As telas só conhecem `useAppState()`; por baixo dele existe um destes backends:
 * `local` (localStorage, usado na demonstração e nos testes) ou `firebase`
 * (Authentication + Firestore). Trocar de backend não muda nenhum componente visual.
 *
 * As operações são assíncronas porque o Firestore é: a tela recebe o resultado
 * (ok/erro) do mesmo jeito que antes, apenas com `await`.
 */

export interface ActionResult {
  ok: boolean
  error?: string
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

export type SessionResult = ActionResult & { session?: Session }
export type CreateResult = ActionResult & { appointment?: Appointment }

/** Campos do catálogo que a gestão pode ajustar. */
export interface ServicePatch {
  durationMin?: number
  price?: number
  active?: boolean
}

export interface Backend {
  readonly mode: 'local' | 'firebase'
  /**
   * Avisa quando os dados mudam — nesta aba, em outra aba ou no servidor — e entrega o
   * snapshot atual imediatamente na assinatura. É o único caminho pelo qual o estado
   * das telas é atualizado: um segundo caminho de leitura inicial só criava corrida
   * com o primeiro agendamento gravado.
   */
  subscribe(listener: (db: Database) => void): () => void
  /** `remember` decide a persistência da sessão (localStorage x sessionStorage). */
  signIn(email: string, password: string, remember?: boolean): Promise<SessionResult>
  /**
   * Opcional: avisa quando a sessão do servidor muda (Firebase Auth). No modo local a
   * sessão é controlada pelo próprio AppState.
   */
  subscribeSession?: (listener: (session: Session | null) => void) => () => void
  signUp(input: SignUpInput): Promise<SessionResult>
  signOut(): Promise<void>
  requestPasswordReset(identifier: string): Promise<ActionResult>
  createAppointment(
    input: NewAppointmentInput,
    session: Session | null,
  ): Promise<CreateResult>
  setAppointmentStatus(id: string, status: AppointmentStatus): Promise<void>
  registerNoShow(id: string): Promise<ActionResult>
  registerPayment(id: string, method: PaymentMethod): Promise<void>
  rescheduleAppointment(id: string, dateISO: string, startMin: number): Promise<ActionResult>
  /** Ajusta duração, preço ou disponibilidade de um serviço no catálogo. */
  updateService(id: string, patch: ServicePatch): Promise<ActionResult>
  /**
   * Registra um aviso por e-mail para uma cliente.
   *
   * No Firebase vira um documento em `mail/` (formato da extensão oficial de e-mail);
   * no modo local fica na caixa de saída da demonstração. Nenhum backend envia e-mail
   * sozinho — isso é papel do serviço de e-mail configurado no projeto.
   */
  queueMail(draft: MailDraft): Promise<ActionResult>
  /**
   * Registra os lembretes de véspera que ainda não existem.
   * Devolve quantos foram criados; é idempotente (o id do lembrete é derivado do
   * atendimento), então chamar de novo no mesmo dia não duplica aviso.
   */
  queueReminders(nowISO?: string): Promise<number>
  resetDemo(): Promise<void>
}

/** Papel aceito pelo backend ao criar a conta (a gestão nunca se autocadastra). */
export const SELF_SIGNUP_ROLE: UserRole = 'cliente'
