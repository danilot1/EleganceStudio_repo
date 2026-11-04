import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  AGENDA_TIMES,
  agendaSlotLabel,
  appointmentsOfDay,
  buildAgendaDay,
  summarizeDay,
  type DaySummary,
  type AgendaSlot,
} from '../lib/agenda'
import {
  addDaysISO,
  addMonthsISO,
  dayOfMonth,
  fullDateLabel,
  isSameMonth,
  minutesToTime,
  monthGridISO,
  monthYearLabel,
  shortDateLabel,
  todayISO,
  weekDaysISO,
  weekRangeLabel,
  weekdayShort,
} from '../lib/dates'
import { firstNameOf } from '../lib/format'
import type { Appointment, Professional } from '../lib/types'
import { cx } from './ui'

/**
 * Calendário da agenda: mês, semana e dia, sempre mostrando o estado de cada horário.
 *
 * A grade não é decorativa: cada célula do mês vem de `summarizeDay`, que usa a mesma
 * regra de expediente/almoço/conflito do agendamento do cliente.
 */

export type AgendaView = 'mes' | 'semana' | 'dia'

const VIEW_LABEL: Record<AgendaView, string> = {
  mes: 'Mês',
  semana: 'Semana',
  dia: 'Dia',
}

const WEEKDAY_HEADERS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function AgendaCalendar({
  appointments,
  professionals,
  selectedDateISO,
  onSelectDate,
  view,
  onViewChange,
  onPickSlot,
}: {
  appointments: Appointment[]
  professionals: Professional[]
  selectedDateISO: string
  onSelectDate: (dateISO: string) => void
  view: AgendaView
  onViewChange: (view: AgendaView) => void
  /** Clique num bloco livre da visão diária (abre o novo atendimento já preenchido). */
  onPickSlot?: (professionalId: string, startMin: number) => void
}) {
  const today = todayISO()
  const [cursorISO, setCursorISO] = useState(selectedDateISO)
  const professionalIds = useMemo(
    () => professionals.map((professional) => professional.id),
    [professionals],
  )

  const monthDays = useMemo(() => monthGridISO(cursorISO), [cursorISO])
  const weekDays = useMemo(() => weekDaysISO(cursorISO), [cursorISO])

  const monthSummaries = useMemo(() => {
    const map = new Map<string, DaySummary>()
    for (const dateISO of monthDays) {
      map.set(dateISO, summarizeDay({ dateISO, appointments, professionalIds }))
    }
    return map
  }, [monthDays, appointments, professionalIds])

  const weekSummaries = useMemo(() => {
    const map = new Map<string, DaySummary>()
    for (const dateISO of weekDays) {
      map.set(dateISO, summarizeDay({ dateISO, appointments, professionalIds }))
    }
    return map
  }, [weekDays, appointments, professionalIds])

  const daySummary = useMemo(
    () => summarizeDay({ dateISO: selectedDateISO, appointments, professionalIds }),
    [selectedDateISO, appointments, professionalIds],
  )

  const dayColumns = useMemo(
    () =>
      professionals.map((professional) => ({
        professional,
        slots: buildAgendaDay({
          dateISO: selectedDateISO,
          professionalId: professional.id,
          appointments,
        }),
      })),
    [professionals, selectedDateISO, appointments],
  )

  const step = (direction: -1 | 1) => {
    if (view === 'mes') setCursorISO((current) => addMonthsISO(current, direction))
    else if (view === 'semana') setCursorISO((current) => addDaysISO(current, direction * 7))
    else setCursorISO((current) => addDaysISO(current, direction))
  }

  /** Navegar troca o período e seleciona um dia dentro dele (dia 1 / hoje / mesmo dia). */
  const moveTo = (nextISO: string) => {
    setCursorISO(nextISO)
    onSelectDate(nextISO)
  }

  const goToday = () => moveTo(today)

  const periodLabel =
    view === 'mes'
      ? monthYearLabel(cursorISO)
      : view === 'semana'
        ? weekRangeLabel(cursorISO)
        : fullDateLabel(cursorISO)

  const selectedAppointments = appointmentsOfDay({
    dateISO: selectedDateISO,
    appointments,
  }).filter((appointment) => professionalIds.includes(appointment.professionalId))

  return (
    <section className="card space-y-3 p-3 sm:p-4" aria-label="Calendário da agenda">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="icon-btn"
            aria-label="Período anterior"
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Próximo período"
            onClick={() => step(1)}
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-[14px] font-semibold capitalize text-ink sm:text-[16px]">
          {periodLabel}
        </p>
        <button type="button" className="btn-ghost btn-sm shrink-0" onClick={goToday}>
          Hoje
        </button>
      </div>

      <div className="flex gap-1 rounded-full border border-line bg-surface-2 p-1" role="group" aria-label="Visualização do calendário">
        {(Object.keys(VIEW_LABEL) as AgendaView[]).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={view === item}
            className={cx(
              'flex-1 rounded-full px-2 py-1.5 text-[12px] font-semibold transition-colors',
              view === item ? 'bg-gold text-white' : 'text-ink-soft hover:bg-surface',
            )}
            onClick={() => onViewChange(item)}
          >
            {VIEW_LABEL[item]}
          </button>
        ))}
      </div>

      {view === 'mes' ? (
        <div className="space-y-1">
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_HEADERS.map((label) => (
              <span
                key={label}
                className="pb-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-muted sm:text-[10px]"
              >
                {label}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1" aria-label="Dias do mês">
            {monthDays.map((dateISO) => {
              const summary = monthSummaries.get(dateISO)
              const inMonth = isSameMonth(dateISO, cursorISO)
              const selected = dateISO === selectedDateISO
              const isToday = dateISO === today
              const closed = summary?.closed ?? false
              const free = summary?.free ?? 0
              const label = closed ? 'Fechado' : free === 0 ? 'Lotado' : `${free} vagas`

              return (
                <button
                  key={dateISO}
                  type="button"
                  aria-pressed={selected}
                  aria-label={`${fullDateLabel(dateISO)} — ${label}`}
                  onClick={() => moveTo(dateISO)}
                  className={cx(
                    'flex min-h-[54px] flex-col gap-1 rounded-[10px] border p-1 text-left transition-colors sm:min-h-[82px] sm:p-1.5',
                    inMonth ? 'bg-surface' : 'bg-transparent opacity-50',
                    selected
                      ? 'border-gold ring-1 ring-gold/40'
                      : 'border-line/70 hover:border-gold-soft',
                    isToday && !selected && 'border-gold/50 bg-gold-tint/25',
                  )}
                >
                  <span
                    className={cx(
                      'flex w-full items-center justify-between gap-1 text-[10px] font-semibold sm:text-[12px]',
                      inMonth ? 'text-ink' : 'text-ink-muted',
                    )}
                  >
                    {dayOfMonth(dateISO)}
                    {isToday ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-gold" aria-hidden />
                    ) : null}
                  </span>
                  <span
                    className={cx(
                      'text-[8px] font-semibold leading-tight sm:text-[10px]',
                      closed ? 'text-ink-muted' : free === 0 ? 'text-danger' : 'text-success',
                    )}
                  >
                    {label}
                  </span>
                  <span
                    className="mt-auto flex h-1 w-full overflow-hidden rounded-full bg-surface-3"
                    aria-hidden
                  >
                    {summary ? <AvailabilityBar summary={summary} /> : null}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {view === 'semana' ? (
        <div className="grid gap-2 sm:grid-cols-7">
          {weekDays.map((dateISO) => {
            const summary = weekSummaries.get(dateISO)
            const list = appointmentsOfDay({
              dateISO,
              appointments,
            }).filter((appointment) => professionalIds.includes(appointment.professionalId))
            const selected = dateISO === selectedDateISO
            const isToday = dateISO === today
            return (
              <div
                key={dateISO}
                className={cx(
                  'rounded-[14px] border p-2',
                  selected
                    ? 'border-gold bg-gold-tint/20'
                    : 'border-line bg-surface',
                  isToday && !selected && 'border-gold/50',
                )}
              >
                <div className="flex items-center gap-2 sm:flex-col sm:items-start sm:gap-0.5">
                  <button
                    type="button"
                    className="flex items-center gap-1.5"
                    aria-pressed={selected}
                    aria-label={`${fullDateLabel(dateISO)} — ${
                      summary?.closed ? 'Fechado' : `${summary?.free ?? 0} vagas`
                    }`}
                    onClick={() => moveTo(dateISO)}
                  >
                    <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                      {weekdayShort(dateISO)}
                    </span>
                    <span className="font-display text-[16px] leading-none text-ink">
                      {dayOfMonth(dateISO)}
                    </span>
                  </button>
                  <span
                    className={cx(
                      'ml-auto text-[10px] font-semibold sm:ml-0',
                      summary?.closed ? 'text-ink-muted' : (summary?.free ?? 0) === 0 ? 'text-danger' : 'text-success',
                    )}
                  >
                    {summary?.closed ? 'Fechado' : `${summary?.free ?? 0} vagas`}
                  </span>
                </div>

                <ul className="mt-1.5 flex flex-wrap gap-1 sm:flex-col">
                  {list.slice(0, 4).map((appointment) => (
                    <li key={appointment.id} className="min-w-0 sm:w-full">
                      <button
                        type="button"
                        onClick={() => moveTo(dateISO)}
                        title={`${minutesToTime(appointment.startMin)} • ${appointment.clientName}`}
                        className={cx(
                          'flex w-full items-center gap-1 rounded-[8px] border px-1.5 py-1 text-left text-[9px] font-semibold sm:text-[10px]',
                          appointment.status === 'cancelado' || appointment.status === 'faltou'
                            ? 'border-line bg-surface-2 text-ink-muted line-through'
                            : 'border-danger/25 bg-danger-tint text-danger',
                        )}
                      >
                        <span className="shrink-0">{minutesToTime(appointment.startMin)}</span>
                        <span className="truncate">{firstNameOf(appointment.clientName)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                {list.length > 4 ? (
                  <p className="mt-1 text-[9px] font-medium text-ink-muted">
                    +{list.length - 4} atendimento{list.length - 4 === 1 ? '' : 's'}
                  </p>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      {view === 'dia' ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] font-medium text-ink-soft">
              {shortDateLabel(selectedDateISO)}
            </p>
            <p className="text-[11px] text-ink-muted">
              {daySummary.closed ? (
                'Estúdio fechado neste dia'
              ) : (
                <>
                  <span className="font-semibold text-success">{daySummary.free} livres</span>
                  <span className="px-1">•</span>
                  <span className="font-semibold text-danger">{daySummary.occupied} ocupados</span>
                </>
              )}
            </p>
          </div>

          {professionals.length === 0 ? (
            <p className="rounded-[14px] border border-line bg-surface-2 p-3 text-[12px] text-ink-muted">
              Nenhuma profissional selecionada no filtro.
            </p>
          ) : (
            <div className="-mx-1 overflow-x-auto px-1 pb-1">
              <div className="min-w-[520px] space-y-1">
                <div
                  className="grid items-end gap-1"
                  style={{
                    gridTemplateColumns: `44px repeat(${professionals.length}, minmax(0, 1fr))`,
                  }}
                >
                  <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
                    Hora
                  </span>
                  {professionals.map((professional) => (
                    <span
                      key={professional.id}
                      className="truncate text-center text-[10px] font-semibold text-ink-soft"
                      title={professional.name}
                    >
                      {professional.name.split(' ')[0]}
                    </span>
                  ))}
                </div>

                {AGENDA_TIMES.map((startMin, rowIndex) => (
                  <div
                    key={startMin}
                    className="grid gap-1"
                    style={{
                      gridTemplateColumns: `44px repeat(${professionals.length}, minmax(0, 1fr))`,
                    }}
                  >
                    <span className="pt-1 text-right text-[9px] font-medium tabular-nums text-ink-muted sm:text-[10px]">
                      {minutesToTime(startMin)}
                    </span>
                    {dayColumns.map(({ professional, slots }) => (
                      <AgendaCell
                        key={professional.id}
                        slot={slots[rowIndex]!}
                        professional={professional}
                        onPick={onPickSlot}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-ink-muted">
            {selectedAppointments.length === 0
              ? 'Nenhum atendimento neste dia. Toque em um bloco verde para agendar.'
              : `${selectedAppointments.length} atendimento${
                  selectedAppointments.length === 1 ? '' : 's'
                } neste dia. Toque em um bloco verde para encaixar outra cliente.`}
          </p>
        </div>
      ) : null}
    </section>
  )
}

function AvailabilityBar({ summary }: { summary: DaySummary }) {
  const total = summary.free + summary.occupied + summary.closedSlots
  if (total === 0) return null
  const width = (value: number) => `${(value / total) * 100}%`
  return (
    <>
      <span className="h-full bg-success/70" style={{ width: width(summary.free) }} />
      <span className="h-full bg-danger/70" style={{ width: width(summary.occupied) }} />
      <span className="h-full bg-line-strong/70" style={{ width: width(summary.closedSlots) }} />
    </>
  )
}

function AgendaCell({
  slot,
  professional,
  onPick,
}: {
  slot: AgendaSlot
  professional: Professional
  onPick?: (professionalId: string, startMin: number) => void
}) {
  const label = `${agendaSlotLabel(slot)} com ${professional.name}`

  if (slot.state === 'ocupado' && slot.appointment) {
    const appointment = slot.appointment
    const startsHere = slot.startMin === appointment.startMin
    const endsHere = slot.endMin >= appointment.startMin + appointment.durationMin
    const released = appointment.status === 'cancelado' || appointment.status === 'faltou'
    return (
      <div
        title={`${minutesToTime(appointment.startMin)} – ${minutesToTime(
          appointment.startMin + appointment.durationMin,
        )} • ${appointment.clientName}`}
        className={cx(
          'flex h-8 items-center gap-1 overflow-hidden border px-1.5 text-[9px] font-semibold sm:text-[10px]',
          released
            ? 'border-line bg-surface-2 text-ink-muted'
            : 'border-danger/25 bg-danger-tint text-danger',
          startsHere ? 'rounded-t-[8px]' : 'rounded-t-none border-t-0',
          endsHere ? 'rounded-b-[8px]' : 'rounded-b-none border-b-0',
        )}
      >
        {startsHere ? (
          <>
            <span className="truncate">{firstNameOf(appointment.clientName)}</span>
            <span className="ml-auto hidden shrink-0 text-[8px] tabular-nums opacity-70 sm:inline">
              {minutesToTime(appointment.startMin + appointment.durationMin)}
            </span>
          </>
        ) : (
          <span className="sr-only">continuação de {appointment.clientName}</span>
        )}
      </div>
    )
  }

  if (slot.state === 'fechado') {
    return (
      <div
        aria-label={`${label} — fechado`}
        title={slot.reason === 'passado' ? 'Horário já passou' : 'Fora do expediente'}
        className="h-8 rounded-[8px] border border-line/60 bg-surface-2/70"
      />
    )
  }

  return (
    <button
      type="button"
      aria-label={`${label} — livre`}
      title={`${label} • livre`}
      disabled={!onPick}
      onClick={() => onPick?.(professional.id, slot.startMin)}
      className={cx(
        'flex h-8 items-center justify-center rounded-[8px] border border-success/25 bg-success-tint text-success transition-colors',
        onPick && 'hover:bg-success hover:text-white',
      )}
    >
      <Plus className="size-3" aria-hidden />
    </button>
  )
}
