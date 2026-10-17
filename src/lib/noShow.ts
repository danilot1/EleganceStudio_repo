import { fromISODate } from './dates'
import type { Appointment, AppointmentStatus } from './types'

/**
 * Regras de falta (no-show) do atendimento.
 *
 * A falta é registrada pela gestão quando a cliente não aparece. Ela é diferente do
 * cancelamento: a cliente não avisou, mas o horário também fica livre para o app.
 * Ver STATUS.md — o registro é local, como todo o resto do protótipo.
 */

/** Status em que ainda faz sentido registrar falta. */
const PENDING_STATUSES: AppointmentStatus[] = ['aguardando', 'confirmado', 'em-atendimento']

/** Momento exato de início do atendimento (data + minutos desde 00:00). */
export function appointmentStart(appointment: Appointment): Date {
  const date = fromISODate(appointment.dateISO)
  date.setMinutes(date.getMinutes() + appointment.startMin)
  return date
}

/**
 * Só é possível marcar falta depois do horário marcado e antes de o atendimento ser
 * concluído ou cancelado. Evita marcar falta de uma cliente que ainda vai chegar.
 */
export function canRegisterNoShow(appointment: Appointment, now = new Date()): boolean {
  if (!PENDING_STATUSES.includes(appointment.status)) return false
  return appointmentStart(appointment).getTime() <= now.getTime()
}

export interface NoShowStats {
  /** Faltas registradas no período. */
  noShows: number
  /** Atendimentos concluídos no período. */
  completed: number
  /** Cancelamentos no período (aparecem no resumo, mas não entram na taxa). */
  cancelled: number
  /** Atendimentos com desfecho (concluídos + faltas). */
  resolved: number
  /** Faltas ÷ atendimentos com desfecho, em %. */
  rate: number
}

/**
 * Indicador de faltas de um intervalo de datas (inclusive).
 * A taxa usa como denominador só os atendimentos que já tiveram desfecho, porque
 * agendamentos futuros ainda podem virar presença ou falta.
 */
export function noShowStats(
  appointments: Appointment[],
  fromISO: string,
  toISO: string,
): NoShowStats {
  const inRange = appointments.filter(
    (appointment) => appointment.dateISO >= fromISO && appointment.dateISO <= toISO,
  )
  const noShows = inRange.filter((appointment) => appointment.status === 'faltou').length
  const completed = inRange.filter((appointment) => appointment.status === 'concluido').length
  const cancelled = inRange.filter((appointment) => appointment.status === 'cancelado').length
  const resolved = noShows + completed

  return {
    noShows,
    completed,
    cancelled,
    resolved,
    rate: resolved > 0 ? Math.round((noShows / resolved) * 100) : 0,
  }
}
