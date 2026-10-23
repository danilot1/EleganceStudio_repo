import { Sunset, Sunrise } from 'lucide-react'
import { useMemo, useState } from 'react'
import { countAvailableSlots, buildDaySlots, isDayFull } from '../lib/availability'
import {
  addDaysISO,
  dayOfMonth,
  fullDateLabel,
  minutesToTime,
  monthYearLabel,
  todayISO,
  weekdayShort,
} from '../lib/dates'
import { useAppState } from '../state/AppState'
import { cx } from './ui'

export interface SlotSelection {
  dateISO: string
  startMin: number
}

/**
 * Faixa de dias + grade de horários. Usado no passo "Data & Hora" do agendamento e
 * também no reagendamento (cliente) e na agenda da gestão.
 */
export function SlotPicker({
  professionalId,
  durationMin,
  value,
  onChange,
  ignoreAppointmentId,
  days = 7,
  startDateISO = todayISO(),
}: {
  professionalId: string
  durationMin: number
  value?: SlotSelection
  onChange: (selection: SlotSelection) => void
  ignoreAppointmentId?: string
  days?: number
  startDateISO?: string
}) {
  const { agenda } = useAppState()
  const [selectedDate, setSelectedDate] = useState(value?.dateISO ?? startDateISO)

  const dateOptions = useMemo(
    () => Array.from({ length: days }, (_, index) => addDaysISO(startDateISO, index)),
    [days, startDateISO],
  )

  const slots = buildDaySlots({
    dateISO: selectedDate,
    durationMin,
    professionalId,
    appointments: agenda,
    ignoreAppointmentId,
  })

  const availableCount = countAvailableSlots({
    dateISO: selectedDate,
    durationMin,
    professionalId,
    appointments: agenda,
  })

  const morning = slots.filter((slot) => slot.startMin < 12 * 60)
  const afternoon = slots.filter((slot) => slot.startMin >= 12 * 60)
  const isClosed = slots.length === 0

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[17px] text-ink">Data do Atendimento</p>
          <p className="eyebrow">{monthYearLabel(selectedDate)}</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Escolha o dia">
          {dateOptions.map((dateISO) => {
            const full = isDayFull({ dateISO, durationMin, professionalId, appointments: agenda })
            const active = dateISO === selectedDate
            return (
              <button
                key={dateISO}
                type="button"
                onClick={() => setSelectedDate(dateISO)}
                aria-pressed={active}
                className={cx(
                  'flex w-[58px] shrink-0 flex-col items-center gap-0.5 rounded-[14px] border px-2 py-2 transition-colors',
                  active
                    ? 'border-gold bg-gold text-white'
                    : 'border-line bg-surface text-ink hover:border-gold-soft',
                )}
              >
                <span className={cx('text-[10px] font-medium', active ? 'text-white/80' : 'text-ink-muted')}>
                  {weekdayShort(dateISO)}
                </span>
                <span className="font-display text-[19px] leading-none">{dayOfMonth(dateISO)}</span>
                <span
                  className={cx(
                    'text-[9px] font-semibold uppercase tracking-wide',
                    active ? 'text-white/80' : full ? 'text-danger' : 'text-transparent',
                  )}
                >
                  {full ? 'Lotado' : '·'}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between text-[12px]">
          <p className="text-ink-soft">
            Selecionado: <span className="font-semibold text-ink">{fullDateLabel(selectedDate)}</span>
          </p>
          <p className="font-semibold text-gold">
            {isClosed ? 'Fechado' : `${availableCount} vagas`}
          </p>
        </div>
      </div>

      {isClosed ? (
        <p className="rounded-[14px] border border-line bg-surface-2 px-3 py-3 text-[12px] text-ink-muted">
          Neste dia o estúdio está fechado (domingos não há atendimento). Escolha outro dia.
        </p>
      ) : (
        (['morning', 'afternoon'] as const).map((period) => {
          const list = period === 'morning' ? morning : afternoon
          if (list.length === 0) return null
          const Icon = period === 'morning' ? Sunrise : Sunset
          return (
            <div key={period} className="space-y-2">
              <p className="eyebrow flex items-center gap-1.5">
                <Icon className="size-3.5" aria-hidden />
                {period === 'morning' ? 'Manhã' : 'Tarde'}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {list.map((slot) => {
                  const active = value?.dateISO === selectedDate && value?.startMin === slot.startMin
                  return (
                    <button
                      key={slot.startMin}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => onChange({ dateISO: selectedDate, startMin: slot.startMin })}
                      aria-pressed={active}
                      className={cx(
                        'flex flex-col items-center gap-0.5 rounded-[14px] border px-2 py-2.5 transition-colors',
                        active && 'border-gold bg-gold text-white',
                        !active && slot.available && 'border-line bg-surface text-ink hover:border-gold-soft',
                        !slot.available && 'cursor-not-allowed border-line bg-surface-2 text-ink-muted',
                      )}
                    >
                      <span className={cx('text-[15px] font-semibold', !slot.available && 'line-through')}>
                        {minutesToTime(slot.startMin)}
                      </span>
                      <span className={cx('text-[10px]', active ? 'text-white/80' : 'text-ink-muted')}>
                        {slot.available ? `até ${minutesToTime(slot.endMin)}` : 'ocupado'}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
