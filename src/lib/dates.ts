import type { Appointment } from '../lib/types'

export const MINUTES_IN_DAY = 24 * 60

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDaysISO(iso: string, days: number): string {
  const date = fromISODate(iso)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

export function startOfWeekISO(iso: string): string {
  const date = fromISODate(iso)
  const dow = date.getDay() // 0 = domingo
  const diff = dow === 0 ? -6 : 1 - dow // semana começa na segunda
  date.setDate(date.getDate() + diff)
  return toISODate(date)
}

/** Converte minutos desde 00:00 para 'HH:MM'. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Aceita 'HH:MM' e devolve minutos desde 00:00. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

export function durationLabel(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${String(m).padStart(2, '0')}min`
}

const WEEKDAYS_LONG = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export function weekdayLong(iso: string): string {
  return WEEKDAYS_LONG[fromISODate(iso).getDay()]
}

export function weekdayShort(iso: string): string {
  return WEEKDAYS_SHORT[fromISODate(iso).getDay()]
}

export function dayOfMonth(iso: string): number {
  return fromISODate(iso).getDate()
}

export function monthLabel(iso: string): string {
  return MONTHS[fromISODate(iso).getMonth()]
}

export function monthYearLabel(iso: string): string {
  const date = fromISODate(iso)
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

/** 'Quinta-feira, 24 de Outubro' */
export function fullDateLabel(iso: string): string {
  return `${weekdayLong(iso)}, ${dayOfMonth(iso)} de ${monthLabel(iso)}`
}

/** 'Qui, 24 de Outubro' */
export function shortDateLabel(iso: string): string {
  return `${weekdayShort(iso)}, ${dayOfMonth(iso)} de ${monthLabel(iso)}`
}

/** 'Quinta, 24 de Outubro' */
export function weekdayDateLabel(iso: string): string {
  return `${weekdayLong(iso).replace('-feira', '')}, ${dayOfMonth(iso)} de ${monthLabel(iso)}`
}

/** '24/10' */
export function numericDayMonth(iso: string): string {
  const date = fromISODate(iso)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Diferença em dias inteiros entre duas datas ISO. */
export function daysBetween(fromIso: string, toIso: string): number {
  const a = fromISODate(fromIso).getTime()
  const b = fromISODate(toIso).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** 'Hoje', 'Amanhã', 'Em 2 dias', 'Ontem', 'Há 5 dias' */
export function relativeDayLabel(iso: string, referenceISO = todayISO()): string {
  const diff = daysBetween(referenceISO, iso)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return 'Amanhã'
  if (diff === -1) return 'Ontem'
  if (diff > 1) return `Em ${diff} dias`
  return `Há ${Math.abs(diff)} dias`
}

/** Intervalo exibido nos cards: '14:30 - 15:45' */
export function appointmentRange(startMin: number, durationMin: number): string {
  const start = minutesToTime(startMin)
  const end = minutesToTime(startMin + durationMin)
  return `${start} - ${end}`
}

export function isPast(iso: string, startMin: number): boolean {
  const date = fromISODate(iso)
  date.setMinutes(date.getMinutes() + startMin)
  return date.getTime() < Date.now()
}

export function sortAppointments(a: Appointment, b: Appointment): number {
  if (a.dateISO !== b.dateISO) return a.dateISO < b.dateISO ? -1 : 1
  return a.startMin - b.startMin
}
