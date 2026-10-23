/**
 * Tipos do domínio do EleganceStudio.
 * Derivados das telas do protótipo (Home, Serviços, Agendamento, Meus Agendamentos, Painel).
 */

export type CategoryId = 'cabelos' | 'maos-pes' | 'podologia' | 'estetica'

export interface Category {
  id: CategoryId | 'todos'
  label: string
}

export interface Professional {
  id: string
  name: string
  role: string
  specialties: string[]
  rating: number
  reviews: number
  chair?: string
  /** Tom usado no avatar quando não há foto (o protótipo usa fotos). */
  accent: string
}

export interface Service {
  id: string
  name: string
  groupId: string
  categoryId: CategoryId
  professionalId: string
  durationMin: number
  price: number
  /**
   * true quando o preço não aparece em nenhuma tela do protótipo e foi estimado.
   * Ver STATUS.md.
   */
  priceEstimated?: boolean
  description: string
  featured?: boolean
  /** Aviso extra exibido abaixo do serviço (ex.: protocolo estéril). */
  note?: string
  /** false = não aparece no catálogo, mas existe porque há agendamento usando o serviço. */
  catalogVisible?: boolean
  popular?: boolean
}

export type AppointmentStatus =
  | 'aguardando'
  | 'confirmado'
  | 'em-atendimento'
  | 'concluido'
  | 'cancelado'
  | 'faltou'

export type PaymentMethod = 'pix' | 'dinheiro' | 'debito' | 'credito'
export type PaymentStatus = 'pendente' | 'pago-no-local' | 'pago'

export interface Appointment {
  id: string
  clientName: string
  clientUserId?: string
  serviceId: string
  professionalId: string
  /**
   * Nome livre do procedimento, usado em atendimentos de balcão que não existem no
   * catálogo (ex.: "Balayage Champagne + Gloss"). Quando ausente, o nome exibido é o
   * do serviço do catálogo.
   */
  title?: string
  /** Marca os registros que vieram da carga inicial de demonstração. */
  seeded?: boolean
  /** 'YYYY-MM-DD' no fuso local. */
  dateISO: string
  /** Início em minutos desde 00:00 (ex.: 10:00 = 600). */
  startMin: number
  durationMin: number
  price: number
  status: AppointmentStatus
  payment: PaymentStatus
  paymentMethod?: PaymentMethod
  origin: 'app' | 'balcao'
  note?: string
}

export type UserRole = 'cliente' | 'admin'

/**
 * O mínimo que a agenda precisa saber de um atendimento para calcular horários.
 * A coleção `agenda` no Firestore usa exatamente estes campos (sem nome, telefone
 * ou observação), porque qualquer pessoa autenticada pode ler esses blocos.
 */
export type BusySlot = Pick<
  Appointment,
  'id' | 'professionalId' | 'dateISO' | 'startMin' | 'durationMin' | 'status'
>

export interface Session {
  userId: string
  name: string
  email: string
  role: UserRole
}

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  aguardando: 'Aguardando Confirmação',
  confirmado: 'Confirmado',
  'em-atendimento': 'Em Atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  faltou: 'Faltou',
}

/**
 * Status que liberam o horário na agenda.
 * Cancelado e falta não ocupam a profissional — a vaga volta para o app.
 */
export function freesSlot(status: AppointmentStatus): boolean {
  return status === 'cancelado' || status === 'faltou'
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  debito: 'Débito',
  credito: 'Crédito',
}
