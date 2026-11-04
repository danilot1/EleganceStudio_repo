import { LUNCH_WINDOW, workWindows } from './availability'
import { isPast, minutesToTime } from './dates'
import { freesSlot, type Appointment } from './types'

/**
 * Modelo do calendário da gestão.
 *
 * A tela de agendamento continua usando `buildDaySlots` (só os inícios possíveis para um
 * serviço). O calendário precisa de outra pergunta: "o que está acontecendo neste bloco de
 * 30 minutos?" — e a resposta é livre, ocupado ou fechado, com o atendimento que o ocupa.
 * As duas leem a mesma fonte (expediente, almoço e agendamentos), então não divergem.
 */

export type SlotState = 'livre' | 'ocupado' | 'fechado'

/** Por que o bloco está fechado: fora do expediente/almoço ou porque já passou. */
export type ClosedReason = 'expediente' | 'passado'

export interface AgendaSlot {
  startMin: number
  endMin: number
  state: SlotState
  /** Atendimento que ocupa o bloco (apenas quando `state === 'ocupado'`). */
  appointment?: Appointment
  /** Preenchido apenas quando `state === 'fechado'`. */
  reason?: ClosedReason
}

export const AGENDA_STEP_MIN = 30

/** A grade vertical do dia sempre desenha o expediente mais longo, para as linhas alinharem. */
export const AGENDA_START_MIN = 8 * 60
export const AGENDA_END_MIN = 19 * 60

/** Inícios de bloco exibidos na coluna de horários. */
export const AGENDA_TIMES: number[] = Array.from(
  { length: (AGENDA_END_MIN - AGENDA_START_MIN) / AGENDA_STEP_MIN },
  (_, index) => AGENDA_START_MIN + index * AGENDA_STEP_MIN,
)

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

/** Domingo e feriados sem expediente: `workWindows` vazio. */
export function isDayClosed(dateISO: string): boolean {
  return workWindows(dateISO).length === 0
}

/** Atendimentos que efetivamente ocupam a agenda (cancelado e falta devolvem o bloco). */
function bookedAppointments(options: {
  dateISO: string
  professionalId: string
  appointments: Appointment[]
  ignoreAppointmentId?: string
}): Appointment[] {
  return options.appointments.filter(
    (item) =>
      item.professionalId === options.professionalId &&
      item.dateISO === options.dateISO &&
      !freesSlot(item.status) &&
      item.id !== options.ignoreAppointmentId,
  )
}

/**
 * Monta a grade de um dia para uma profissional, em blocos de 30 min, das 08:00 às 19:00.
 * - `ocupado`: colide com um atendimento ativo (respeitando a duração do serviço);
 * - `fechado`: fora do expediente do dia, dentro do almoço ou já passou;
 * - `livre`: pode receber um novo atendimento.
 */
export function buildAgendaDay(options: {
  dateISO: string
  professionalId: string
  appointments: Appointment[]
  ignoreAppointmentId?: string
}): AgendaSlot[] {
  const windows = workWindows(options.dateISO)
  const booked = bookedAppointments(options)
  const slots: AgendaSlot[] = []

  for (const startMin of AGENDA_TIMES) {
    const endMin = startMin + AGENDA_STEP_MIN
    const insideWindow = windows.some(
      (window) => startMin >= window.startMin && endMin <= window.endMin,
    )
    const hitLunch =
      insideWindow && overlaps(startMin, endMin, LUNCH_WINDOW.startMin, LUNCH_WINDOW.endMin)
    const appointment = booked.find((item) =>
      overlaps(startMin, endMin, item.startMin, item.startMin + item.durationMin),
    )

    if (appointment) {
      slots.push({ startMin, endMin, state: 'ocupado', appointment })
      continue
    }
    if (!insideWindow || hitLunch) {
      slots.push({ startMin, endMin, state: 'fechado', reason: 'expediente' })
      continue
    }
    if (isPast(options.dateISO, startMin)) {
      slots.push({ startMin, endMin, state: 'fechado', reason: 'passado' })
      continue
    }
    slots.push({ startMin, endMin, state: 'livre' })
  }

  return slots
}

export interface ProfessionalAvailability {
  professionalId: string
  free: number
  occupied: number
  closed: number
  /** Minutos de expediente do dia para a profissional (sem almoço). */
  workMinutes: number
}

export interface DaySummary {
  dateISO: string
  closed: boolean
  free: number
  occupied: number
  closedSlots: number
  /** Atendimentos ativos (cancelado e falta não contam). */
  appointments: number
  bookedMinutes: number
  /** Minutos de expediente somados de todas as profissionais consultadas. */
  workMinutes: number
  byProfessional: ProfessionalAvailability[]
}

/**
 * Resumo do dia para o calendário: quantas vagas existem, quantos blocos estão ocupados e
 * quanto do expediente está fechado. É o número exibido em cada célula do mês.
 */
export function summarizeDay(options: {
  dateISO: string
  professionalIds: string[]
  appointments: Appointment[]
}): DaySummary {
  const byProfessional = options.professionalIds.map((professionalId) => {
    const slots = buildAgendaDay({
      dateISO: options.dateISO,
      professionalId,
      appointments: options.appointments,
    })
    // O almoço é fechado para atendimento, mas não é "falta de expediente": não entra na
    // capacidade, senão a ocupação do dia nunca chegaria a 100%.
    const workSlots = slots.filter((slot) => !(slot.state === 'fechado' && slot.reason === 'expediente'))
    return {
      professionalId,
      free: slots.filter((slot) => slot.state === 'livre').length,
      occupied: slots.filter((slot) => slot.state === 'ocupado').length,
      closed: slots.filter((slot) => slot.state === 'fechado').length,
      workMinutes: workSlots.length * AGENDA_STEP_MIN,
    }
  })

  const dayAppointments = options.appointments.filter(
    (item) =>
      item.dateISO === options.dateISO &&
      !freesSlot(item.status) &&
      options.professionalIds.includes(item.professionalId),
  )

  return {
    dateISO: options.dateISO,
    closed: isDayClosed(options.dateISO),
    free: byProfessional.reduce((total, item) => total + item.free, 0),
    occupied: byProfessional.reduce((total, item) => total + item.occupied, 0),
    closedSlots: byProfessional.reduce((total, item) => total + item.closed, 0),
    appointments: dayAppointments.length,
    bookedMinutes: dayAppointments.reduce((total, item) => total + item.durationMin, 0),
    workMinutes: byProfessional.reduce((total, item) => total + item.workMinutes, 0),
    byProfessional,
  }
}

/** '09:00 – 09:30' — rótulo acessível de um bloco. */
export function agendaSlotLabel(slot: AgendaSlot): string {
  return `${minutesToTime(slot.startMin)} – ${minutesToTime(slot.endMin)}`
}

/** Ocupação do dia em %, considerando só o expediente real (sem almoço). */
export function occupancyOf(summary: DaySummary): number {
  if (summary.workMinutes === 0) return 0
  return Math.min(100, Math.round((summary.bookedMinutes / summary.workMinutes) * 100))
}

/**
 * Agendamentos de um dia, opcionalmente de uma profissional, ordenados por horário.
 * Usado pela visão diária, pela semana e pela lista abaixo do calendário.
 */
export function appointmentsOfDay(options: {
  dateISO: string
  appointments: Appointment[]
  professionalId?: string | null
}): Appointment[] {
  return options.appointments
    .filter(
      (item) =>
        item.dateISO === options.dateISO &&
        (!options.professionalId || item.professionalId === options.professionalId),
    )
    .sort((a, b) => a.startMin - b.startMin)
}
