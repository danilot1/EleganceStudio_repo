/**
 * Tipos do domínio do EleganceStudio.
 * Derivados das telas do protótipo (Home, Serviços, Agendamento, Meus Agendamentos, Painel).
 */

export type CategoryId = 'maos-pes' | 'podologia' | 'depilacao'

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
  /** Ausente = "Sob consulta": o folheto não traz valores; a gestão pode definir no painel. */
  price?: number
  description: string
  featured?: boolean
  /** Aviso extra exibido abaixo do serviço (ex.: protocolo estéril). */
  note?: string
  /** false = não aparece no catálogo, mas existe porque há agendamento usando o serviço. */
  catalogVisible?: boolean
  /**
   * false = desativado pela gestão: some do catálogo e não pode ser agendado, mas o
   * histórico de atendimentos continua exibindo o nome e o preço registrados.
   */
  active?: boolean
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
  /**
   * E-mail informado no agendamento. A convidada não tem conta, mas ainda quer receber os
   * avisos — por isso o endereço mora no próprio atendimento, não só no cadastro.
   */
  clientEmail?: string
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
  /** Valor registrado no agendamento; ausente quando o serviço é "Sob consulta". */
  price?: number
  status: AppointmentStatus
  payment: PaymentStatus
  paymentMethod?: PaymentMethod
  origin: 'app' | 'balcao'
  note?: string
}

export type UserRole = 'cliente' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  phone: string
  /**
   * MOCK ACADÊMICO: senha em texto puro no localStorage, apenas para o protótipo
   * demonstrar os fluxos. Em produção isto nunca deve existir — ver STATUS.md.
   */
  password: string
  role: UserRole
  createdAtISO: string
}

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
