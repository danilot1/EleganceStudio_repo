import { freesSlot, type BusySlot } from '../lib/types'
import { fromISODate, isPast, minutesToTime, todayISO } from './dates'

/** Expediente de cada profissional. Domingo fechado. */
export interface WorkWindow {
  startMin: number
  endMin: number
}

/** Intervalo reservado para almoço — nenhum serviço começa dentro dele. */
const LUNCH: WorkWindow = { startMin: 12 * 60, endMin: 13 * 60 }

/** Grade mínima entre horários oferecidos. */
export const SLOT_STEP_MIN = 30

export const OPENING_HOURS_TEXT = {
  weekdays: 'Seg a Sex: 08:00 - 18:00',
  saturday: 'Sábado: 08:00 - 14:00',
}

export function workWindows(dateISO: string): WorkWindow[] {
  const dow = fromISODate(dateISO).getDay()
  if (dow === 0) return [] // domingo
  if (dow === 6) return [{ startMin: 8 * 60, endMin: 14 * 60 }]
  return [{ startMin: 9 * 60, endMin: 19 * 60 }]
}

export interface DaySlot {
  startMin: number
  endMin: number
  available: boolean
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

/** Agendamentos que ocupam a agenda (cancelados e faltas liberam o horário). */
function busyBlocks(appointments: BusySlot[], professionalId: string): WorkWindow[] {
  return appointments
    .filter((item) => item.professionalId === professionalId && !freesSlot(item.status))
    .map((item) => ({ startMin: item.startMin, endMin: item.startMin + item.durationMin }))
}

/**
 * Monta os horários de um dia para um serviço/profissional.
 * A grade é gerada por regra (passo de 30 min dentro do expediente) e cada horário é
 * marcado como ocupado quando colide com outro agendamento, com o almoço ou quando já
 * passou. Os horários exatos variam por dia — o print mostra um dia específico.
 */
export function buildDaySlots(options: {
  dateISO: string
  durationMin: number
  professionalId: string
  appointments: BusySlot[]
  ignoreAppointmentId?: string
}): DaySlot[] {
  const { dateISO, durationMin, professionalId } = options
  const appointments = options.ignoreAppointmentId
    ? options.appointments.filter((item) => item.id !== options.ignoreAppointmentId)
    : options.appointments

  const windows = workWindows(dateISO)
  if (windows.length === 0) return []

  const busy = busyBlocks(appointments, professionalId)
  const slots: DaySlot[] = []

  for (const window of windows) {
    const lastStart = window.endMin - durationMin
    for (let start = window.startMin; start <= lastStart; start += SLOT_STEP_MIN) {
      const end = start + durationMin
      const hitsLunch = overlaps(start, end, LUNCH.startMin, LUNCH.endMin)
      const hitsBooking = busy.some((block) => overlaps(start, end, block.startMin, block.endMin))
      const alreadyPast = isPast(dateISO, start)
      slots.push({
        startMin: start,
        endMin: end,
        available: !hitsLunch && !hitsBooking && !alreadyPast,
      })
    }
  }

  return slots
}

/** Quantidade de vagas livres (o "7 vagas" do protótipo). */
export function countAvailableSlots(options: {
  dateISO: string
  durationMin: number
  professionalId: string
  appointments: BusySlot[]
}): number {
  return buildDaySlots(options).filter((slot) => slot.available).length
}

export function isDayFull(options: {
  dateISO: string
  durationMin: number
  professionalId: string
  appointments: BusySlot[]
}): boolean {
  const slots = buildDaySlots(options)
  if (slots.length === 0) return true // fechado
  return slots.every((slot) => !slot.available)
}

/** Verdadeiro quando o profissional já tem atendimento no mesmo intervalo. */
export function hasConflict(options: {
  dateISO: string
  startMin: number
  durationMin: number
  professionalId: string
  appointments: BusySlot[]
  ignoreAppointmentId?: string
}): boolean {
  const end = options.startMin + options.durationMin
  return options.appointments
    .filter(
      (item) =>
        item.professionalId === options.professionalId &&
        item.dateISO === options.dateISO &&
        !freesSlot(item.status) &&
        item.id !== options.ignoreAppointmentId,
    )
    .some((item) => overlaps(options.startMin, end, item.startMin, item.startMin + item.durationMin))
}

export function slotLabel(slot: DaySlot): string {
  return `${minutesToTime(slot.startMin)} até ${minutesToTime(slot.endMin)}`
}

export { todayISO }
