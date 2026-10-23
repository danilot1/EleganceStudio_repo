import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CircleSlash,
  Plus,
  TrendingUp,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { RequireRole } from '../../components/guards'
import { TimelineCard } from '../../components/TimelineCard'
import { SlotPicker } from '../../components/SlotPicker'
import { DemoNotice, Stat, cx } from '../../components/ui'
import { SERVICE_GROUPS } from '../../data/catalog'
import { buildDaySlots, workWindows } from '../../lib/availability'
import { addDaysISO, startOfWeekISO, todayISO, weekdayDateLabel } from '../../lib/dates'
import { formatBRL } from '../../lib/format'
import { noShowStats } from '../../lib/noShow'
import { useAppState } from '../../state/AppState'

type PanelTab = 'agenda' | 'servicos' | 'profissionais'

const PANEL_TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'profissionais', label: 'Profissionais' },
]

/** Painel Executivo — visão de gestão do estúdio. */
export function AdminAgenda() {
  return (
    <RequireRole role="admin">
      <AdminPanel />
    </RequireRole>
  )
}

function AdminPanel() {
  const { appointments, agenda, professionals, services, createAppointment } = useAppState()
  const today = todayISO()
  const [tab, setTab] = useState<PanelTab>('agenda')
  const [period, setPeriod] = useState<'hoje' | 'semana'>('hoje')
  const [professionalFilter, setProfessionalFilter] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newServiceId, setNewServiceId] = useState(services[0]?.id ?? '')
  const [newProfessionalId, setNewProfessionalId] = useState(professionals[0]?.id ?? '')
  const [newSlot, setNewSlot] = useState<{ dateISO: string; startMin: number } | null>(null)
  const [newError, setNewError] = useState<string | null>(null)

  const weekStart = startOfWeekISO(today)
  const weekEnd = addDaysISO(weekStart, 6)

  const todayAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.dateISO === today),
    [appointments, today],
  )

  const periodAppointments = useMemo(() => {
    const list =
      period === 'hoje'
        ? todayAppointments
        : appointments.filter(
            (appointment) => appointment.dateISO >= weekStart && appointment.dateISO <= weekEnd,
          )
    return list
      .filter(
        (appointment) =>
          !professionalFilter || appointment.professionalId === professionalFilter,
      )
      .sort((a, b) =>
        a.dateISO === b.dateISO ? a.startMin - b.startMin : a.dateISO < b.dateISO ? -1 : 1,
      )
  }, [appointments, period, todayAppointments, weekStart, weekEnd, professionalFilter])

  // ---------------------------------------------------------------- indicadores (calculados)
  const active = todayAppointments.filter((appointment) => appointment.status !== 'cancelado')
  const revenue = active.reduce((total, appointment) => total + appointment.price, 0)
  const paidCount = active.filter((appointment) => appointment.payment === 'pago').length

  const bookedMinutes = active.reduce((total, appointment) => total + appointment.durationMin, 0)
  const capacityMinutes = professionals.reduce(
    (total) =>
      total + workWindows(today).reduce((sum, window) => sum + (window.endMin - window.startMin), 0),
    0,
  )
  const occupancy = capacityMinutes > 0 ? Math.round((bookedMinutes / capacityMinutes) * 100) : 0

  const cancelledToday = todayAppointments.filter(
    (appointment) => appointment.status === 'cancelado',
  ).length

  // No-show: faltas ÷ atendimentos com desfecho (concluídos + faltas) do período selecionado.
  const noShow = noShowStats(
    periodAppointments,
    period === 'hoje' ? today : weekStart,
    period === 'hoje' ? today : weekEnd,
  )

  const freeSlots = professionals.reduce((total, professional) => {
    const slots = buildDaySlots({
      dateISO: today,
      durationMin: 30,
      professionalId: professional.id,
      appointments: agenda,
    })
    return total + slots.filter((slot) => slot.available).length
  }, 0)

  const professionalsWithBookings = professionals.filter((professional) =>
    periodAppointments.some((appointment) => appointment.professionalId === professional.id),
  )

  const selectedNewService = services.find((service) => service.id === newServiceId)

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="badge bg-gold-tint text-gold">
            <BadgeCheck className="size-3.5" aria-hidden />
            Modo gestão
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
            <CalendarDays className="size-3.5" aria-hidden />
            {weekdayDateLabel(today)}
          </span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[26px] leading-tight text-ink">Painel Executivo</h1>
            <p className="text-[12px] text-ink-muted">Visão em tempo real do salão</p>
          </div>
          <button type="button" className="btn-primary btn-sm shrink-0" onClick={() => setShowNew((value) => !value)}>
            <Plus className="size-3.5" aria-hidden />
            Novo
          </button>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4">
          {PANEL_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cx('chip', tab === item.id && 'chip-active')}
              aria-pressed={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {showNew ? (
        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[14px] font-semibold text-ink">Novo atendimento de balcão</p>
            <button
              type="button"
              className="icon-btn"
              aria-label="Fechar"
              onClick={() => setShowNew(false)}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div>
            <label className="field-label" htmlFor="new-client">
              Cliente
            </label>
            <input
              id="new-client"
              className="field-input"
              placeholder="Nome da cliente"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="new-service">
                Serviço
              </label>
              <select
                id="new-service"
                className="field-input"
                value={newServiceId}
                onChange={(event) => setNewServiceId(event.target.value)}
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} • {service.durationMin} min
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="new-professional">
                Profissional
              </label>
              <select
                id="new-professional"
                className="field-input"
                value={newProfessionalId}
                onChange={(event) => setNewProfessionalId(event.target.value)}
              >
                {professionals.map((professional) => (
                  <option key={professional.id} value={professional.id}>
                    {professional.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedNewService ? (
            <SlotPicker
              professionalId={newProfessionalId}
              durationMin={selectedNewService.durationMin}
              value={newSlot ?? undefined}
              onChange={setNewSlot}
            />
          ) : null}

          {newError ? <p className="text-[12px] text-danger">{newError}</p> : null}

          <button
            type="button"
            className="btn-primary w-full"
            disabled={!newSlot || !selectedNewService}
            onClick={async () => {
              if (!newName.trim()) {
                setNewError('Informe o nome da cliente.')
                return
              }
              if (!newSlot || !selectedNewService) return
              const result = await createAppointment({
                serviceId: selectedNewService.id,
                professionalId: newProfessionalId,
                dateISO: newSlot.dateISO,
                startMin: newSlot.startMin,
                durationMin: selectedNewService.durationMin,
                price: selectedNewService.price,
                clientName: newName,
                status: 'confirmado',
                origin: 'balcao',
              })
              if (!result.ok) {
                setNewError(result.error ?? 'Não foi possível criar o atendimento.')
                return
              }
              setNewError(null)
              setNewName('')
              setNewSlot(null)
              setShowNew(false)
            }}
          >
            Criar atendimento confirmado
          </button>
          <DemoNotice>
            O atendimento é gravado no Firestore e entra como “Confirmado”, como faria a recepção
            ao atender por telefone. O conflito de horário é checado dentro de uma transação.
          </DemoNotice>
        </section>
      ) : null}

      {tab === 'agenda' ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <Stat
              icon={CalendarClock}
              label="Atendimentos"
              value={String(active.length)}
              hint="hoje"
              progress={capacityMinutes ? (bookedMinutes / capacityMinutes) * 100 : 0}
            />
            <Stat
              icon={TrendingUp}
              label="Previsto"
              value={formatBRL(revenue).replace(/\s/g, ' ')}
              hint={`${paidCount} pagos`}
            />
            <Stat
              icon={BarChart3}
              label="Ocupação"
              value={`${occupancy}%`}
              hint={occupancy >= 75 ? 'Alta' : occupancy >= 45 ? 'Média' : 'Baixa'}
              progress={occupancy}
            />
            <Stat
              icon={CircleSlash}
              label="Cancelados"
              value={`${cancelledToday}`}
              hint="hoje"
            />
          </section>

          <section className="card space-y-2 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow flex items-center gap-1.5">
                <UserX className="size-3.5 text-warn" aria-hidden />
                Qualidade da agenda • {period === 'hoje' ? 'hoje' : 'semana'}
              </p>
              <span className="badge bg-warn-tint text-warn">{noShow.rate}% no-show</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-warn"
                style={{ width: `${Math.min(100, noShow.rate)}%` }}
              />
            </div>
            <p className="text-[11px] text-ink-muted">
              {noShow.noShows} falta{noShow.noShows === 1 ? '' : 's'} em {noShow.resolved}{' '}
              atendimento{noShow.resolved === 1 ? '' : 's'} com desfecho
              {noShow.cancelled > 0
                ? ` • ${noShow.cancelled} cancelado${noShow.cancelled === 1 ? '' : 's'}`
                : ''}
            </p>
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Falta não é cancelamento: a cliente não avisou, mas o horário também volta para o
              app. Registre em <span className="font-semibold text-ink-soft">Editar → Registrar falta</span>.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex gap-2 rounded-full border border-line bg-surface p-1">
              {(['hoje', 'semana'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={period === item}
                  className={cx(
                    'flex-1 rounded-full px-3 py-2 text-[12px] font-semibold capitalize transition-colors',
                    period === item ? 'bg-gold text-white' : 'text-ink-soft hover:bg-surface-2',
                  )}
                  onClick={() => setPeriod(item)}
                >
                  {item === 'hoje' ? `Hoje (${numericToday(today)})` : 'Semana'}
                </button>
              ))}
            </div>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <button
                type="button"
                className={cx('chip', !professionalFilter && 'chip-active')}
                onClick={() => setProfessionalFilter(null)}
              >
                Todas
                <span className={cx('text-[10px]', !professionalFilter ? 'text-white/80' : 'text-ink-muted')}>
                  {professionalsWithBookings.length}
                </span>
              </button>
              {professionalsWithBookings.map((professional) => (
                <button
                  key={professional.id}
                  type="button"
                  className={cx('chip', professionalFilter === professional.id && 'chip-active')}
                  onClick={() => setProfessionalFilter(professional.id)}
                >
                  {professional.name}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <h2 className="text-[19px] text-ink">Linha do Tempo</h2>
              <p className="text-[11px] font-medium text-ink-muted">
                {freeSlots} horários livres hoje
              </p>
            </div>

            {periodAppointments.length === 0 ? (
              <p className="rounded-[14px] border border-line bg-surface-2 p-4 text-[13px] text-ink-muted">
                Nenhum atendimento encontrado para este filtro.
              </p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {periodAppointments.map((appointment) => (
                  <TimelineCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}

            <DemoNotice>
              Indicadores calculados a partir dos atendimentos gravados no Firestore — por isso
              os números mudam quando você cancela, conclui ou reagenda. No protótipo eles eram
              valores fixos na tela.
            </DemoNotice>
          </section>
        </>
      ) : null}

      {tab === 'servicos' ? (
        <section className="space-y-3">
          <h2 className="text-[19px] text-ink">Serviços cadastrados</h2>
          <div className="space-y-2">
            {SERVICE_GROUPS.map((group) => {
              const items = services.filter((service) => service.groupId === group.id)
              if (items.length === 0) return null
              return (
                <div key={group.id} className="card space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[15px] font-semibold text-ink">{group.label}</p>
                    <span className="badge bg-surface-2 text-ink-soft">{items.length} serviços</span>
                  </div>
                  <ul className="space-y-1.5 text-[12px]">
                    {items.map((service) => (
                      <li
                        key={service.id}
                        className="flex items-center justify-between gap-2 border-b border-line pb-1.5 last:border-b-0 last:pb-0"
                      >
                        <span className="min-w-0 flex-1 text-ink-soft">{service.name}</span>
                        <span className="shrink-0 text-ink-muted">{service.durationMin} min</span>
                        <span className="shrink-0 font-semibold text-ink">
                          {formatBRL(service.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
          <DemoNotice>
            A aba de Serviços aparece cortada no print enviado, então mostramos apenas a leitura do
            catálogo (duração e valor). Editar serviço pela gestão não foi implementado porque o
            protótipo não define esse fluxo. Valores sem confirmação no protótipo estão marcados em
            STATUS.md.
          </DemoNotice>
        </section>
      ) : null}

      {tab === 'profissionais' ? (
        <section className="space-y-3">
          <h2 className="text-[19px] text-ink">Equipe do estúdio</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {professionals.map((professional) => {
              const count = todayAppointments.filter(
                (appointment) =>
                  appointment.professionalId === professional.id &&
                  appointment.status !== 'cancelado',
              ).length
              return (
                <div key={professional.id} className="card space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[15px] font-semibold text-ink">{professional.name}</p>
                      <p className="text-[12px] text-ink-muted">{professional.role}</p>
                    </div>
                    <span className="badge bg-gold-tint text-gold">
                      {professional.rating.toFixed(1)} ★
                    </span>
                  </div>
                  <p className="flex flex-wrap gap-1.5">
                    {professional.specialties.map((specialty) => (
                      <span key={specialty} className="badge bg-surface-2 text-ink-soft">
                        {specialty}
                      </span>
                    ))}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
                    <Users className="size-3.5" aria-hidden />
                    {count} atendimentos hoje
                    {professional.chair ? ` • ${professional.chair}` : ''}
                  </p>
                </div>
              )
            })}
          </div>
          <DemoNotice>
            A lista usa os profissionais do catálogo. Cadastro de novos profissionais e vínculo de
            serviços não estavam definidos no protótipo.
          </DemoNotice>
        </section>
      ) : null}
    </div>
  )
}

function numericToday(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${day}/${month}`
}
