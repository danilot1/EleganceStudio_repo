import type { Appointment, AppointmentStatus } from './types'

/**
 * Documento de agenda: um por profissional e dia (`agenda/{profissional}__{data}`).
 *
 * É o "cadeado" da reserva. No Firestore, a transação que cria o agendamento lê e
 * grava este documento, então duas tentativas simultâneas no mesmo dia da mesma
 * profissional são serializadas — a segunda enxerga o bloco da primeira e é recusada.
 *
 * O documento guarda só o necessário para a checagem de conflito: identificador do
 * atendimento, início, duração e status. Nome da cliente e preço ficam apenas em
 * `appointments` (o status aqui existe para que cancelamento e falta devolvam o bloco).
 *
 * As funções abaixo são puras de propósito: a regra de sobreposição fica testável sem
 * emulador, e o adaptador Firestore só cuida de leitura/gravação.
 */

export interface AgendaBlock {
  appointmentId: string
  startMin: number
  durationMin: number
  status: AppointmentStatus
}

/** Identificador do documento de agenda (não usar barra: é id de documento). */
export function agendaDocId(professionalId: string, dateISO: string): string {
  return `${professionalId}__${dateISO}`
}

function isStatus(value: unknown): value is AppointmentStatus {
  return (
    value === 'aguardando' ||
    value === 'confirmado' ||
    value === 'em-atendimento' ||
    value === 'concluido' ||
    value === 'cancelado' ||
    value === 'faltou'
  )
}

/**
 * Normaliza os blocos vindos do Firestore.
 * Dados corrompidos não derrubam a agenda: entradas inválidas são descartadas.
 */
export function blocksOf(raw: unknown): AgendaBlock[] {
  if (!raw || typeof raw !== 'object') return []
  const blocks = (raw as { blocks?: unknown }).blocks
  if (!Array.isArray(blocks)) return []

  const parsed: AgendaBlock[] = []
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue
    const value = item as Record<string, unknown>
    const appointmentId = typeof value.appointmentId === 'string' ? value.appointmentId : ''
    const startMin = Number(value.startMin)
    const durationMin = Number(value.durationMin)
    if (!appointmentId || !Number.isFinite(startMin) || !Number.isFinite(durationMin)) continue
    if (durationMin <= 0) continue
    parsed.push({
      appointmentId,
      startMin,
      durationMin,
      status: isStatus(value.status) ? value.status : 'aguardando',
    })
  }
  return parsed
}

/**
 * Converte os blocos no formato que `hasConflict` espera.
 * Só o mínimo: a checagem olha profissional, dia, início, duração, status e id.
 */
export function busyAppointments(
  professionalId: string,
  dateISO: string,
  blocks: AgendaBlock[],
): Appointment[] {
  return blocks.map((block) => ({
    id: block.appointmentId,
    clientName: '',
    serviceId: '',
    professionalId,
    dateISO,
    startMin: block.startMin,
    durationMin: block.durationMin,
    price: 0,
    status: block.status,
    payment: 'pendente',
    origin: 'app',
  }))
}

/** Insere ou substitui o bloco do atendimento (reagendamento e mudança de status). */
export function upsertBlock(blocks: AgendaBlock[], block: AgendaBlock): AgendaBlock[] {
  const withoutCurrent = blocks.filter((item) => item.appointmentId !== block.appointmentId)
  return [...withoutCurrent, block].sort((a, b) => a.startMin - b.startMin)
}

/** Remove o bloco do atendimento (usado quando ele sai deste dia). */
export function removeBlock(blocks: AgendaBlock[], appointmentId: string): AgendaBlock[] {
  return blocks.filter((item) => item.appointmentId !== appointmentId)
}
