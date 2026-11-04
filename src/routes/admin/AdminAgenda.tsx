import {
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CircleSlash,
  Mail,
  Phone,
  Plus,
  TrendingUp,
  UserX,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { AgendaCalendar, type AgendaView } from '../../components/AgendaCalendar'
import { RequireRole } from '../../components/guards'
import { SlotPicker } from '../../components/SlotPicker'
import { TimelineCard } from '../../components/TimelineCard'
import { Avatar, DemoNotice, Stat, cx } from '../../components/ui'
import { SERVICE_GROUPS } from '../../data/catalog'
import { appointmentsOfDay, occupancyOf, summarizeDay } from '../../lib/agenda'
import { fullDateLabel, numericDayMonth, todayISO, weekdayDateLabel } from '../../lib/dates'
import { formatBRL } from '../../lib/format'
import { noShowStats } from '../../lib/noShow'
import { useAppState } from '../../state/AppState'

type PanelTab = 'agenda' | 'servicos' | 'clientes' | 'profissionais'

const PANEL_TABS: Array<{ id: PanelTab; label: string }> = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'servicos', label: 'Serviços' },
  { id: 'clientes', label: 'Clientes' },
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
  const { appointments, professionals, services, users, createAppointment } = useAppState()
  const today = todayISO()

  const [tab, setTab] = useState<PanelTab>('agenda')
  const [view, setView] = useState<AgendaView>('mes')
  const [selectedDateISO, setSelectedDateISO] = useState(today)
  const [professionalFilter, setProfessionalFilter] = useState<string | null>(null)

  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [newServiceId, setNewServiceId] = useState(services[0]?.id ?? '')
  const [newProfessionalId, setNewProfessionalId] = useState(professionals[0]?.id ?? '')
  const [newSlot, setNewSlot] = useState<{ dateISO: string; startMin: number } | null>(null)
  const [newError, setNewError] = useState<string | null>(null)

  // O filtro por profissional vale para o calendário, os números e a lista do dia.
  const visibleProfessionals = useMemo(
    () =>
      professionalFilter
        ? professionals.filter((professional) => professional.id === professionalFilter)
        : professionals,
    [professionals, professionalFilter],
  )

  const dayAppointments = useMemo(
    () => appointmentsOfDay({ dateISO: selectedDateISO, appointments }),
    [appointments, selectedDateISO],
  )

  const filteredDay = useMemo(
    () =>
      professionalFilter
        ? dayAppointments.filter(
            (appointment) => appointment.professionalId === professionalFilter,
          )
        : dayAppointments,
    [dayAppointments, professionalFilter],
  )

  const summary = useMemo(
    () =>
      summarizeDay({
        dateISO: selectedDateISO,
        professionalIds: professionals.map((professional) => professional.id),
        appointments,
      }),
    [selectedDateISO, professionals, appointments],
  )

  // ---------------------------------------------------------------- indicadores do dia
  const active = dayAppointments.filter(
    (appointment) => appointment.status !== 'cancelado' && appointment.status !== 'faltou',
  )
  const revenue = active.reduce((total, appointment) => total + appointment.price, 0)
  const paidCount = active.filter((appointment) => appointment.payment === 'pago').length
  const cancelled = dayAppointments.filter(
    (appointment) => appointment.status === 'cancelado',
  ).length
  const occupancy = occupancyOf(summary)

  // No-show: faltas ÷ atendimentos com desfecho no dia selecionado.
  const noShow = noShowStats(dayAppointments, selectedDateISO, selectedDateISO)

  const selectedNewService = services.find((service) => service.id === newServiceId)

  // ---------------------------------------------------------------- clientes (aba)
  const clientRows = useMemo(
    () =>
      users.map((user) => {
        const mine = appointments.filter((appointment) => appointment.clientUserId === user.id)
        const completed = mine.filter((appointment) => appointment.status === 'concluido')
        const upcoming = mine
          .filter(
            (appointment) =>
              appointment.dateISO >= today &&
              !['concluido', 'cancelado', 'faltou'].includes(appointment.status),
          )
          .sort((a, b) => (a.dateISO === b.dateISO ? a.startMin - b.startMin : a.dateISO < b.dateISO ? -1 : 1))
        return {
          user,
          total: mine.length,
          completed: completed.length,
          spent: completed.reduce((total, appointment) => total + appointment.price, 0),
          lastISO: completed.map((appointment) => appointment.dateISO).sort().at(-1),
          next: upcoming[0],
        }
      }),
    [users, appointments, today],
  )

  const guestAppointments = appointments.filter((appointment) => !appointment.clientUserId).length

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
            <p className="text-[12px] text-ink-muted">Agenda, equipe e clientes do estúdio</p>
          </div>
          <button
            type="button"
            className="btn-primary btn-sm shrink-0"
            onClick={() => setShowNew((value) => !value)}
          >
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

          {newError ? (
            <p role="alert" className="text-[12px] font-medium text-danger">
              {newError}
            </p>
          ) : null}

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
              // Leva a agenda para o dia do novo atendimento, para ele aparecer na hora.
              setSelectedDateISO(newSlot.dateISO)
              setNewError(null)
              setNewName('')
              setNewSlot(null)
              setShowNew(false)
            }}
          >
            Criar atendimento confirmado
          </button>
          <DemoNotice>
            O atendimento é criado apenas neste navegador e entra como “Confirmado”, como faria a
            recepção ao atender por telefone. Ele passa a ocupar o horário na agenda e no
            agendamento da cliente imediatamente.
          </DemoNotice>
        </section>
      ) : null}

      {tab === 'agenda' ? (
        <>
          <section className="grid grid-cols-2 gap-3">
            <Stat
              icon={CalendarClock}
              label="Atendimentos"
              value={String(summary.appointments)}
              hint={numericDayMonth(selectedDateISO)}
              progress={occupancy}
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
              label="Vagas Livres"
              value={String(summary.free)}
              hint={summary.closed ? 'fechado' : 'blocos de 30 min'}
            />
          </section>

          <AgendaCalendar
            appointments={appointments}
            professionals={visibleProfessionals}
            selectedDateISO={selectedDateISO}
            onSelectDate={setSelectedDateISO}
            view={view}
            onViewChange={setView}
            onPickSlot={(professionalId, startMin) => {
              setNewProfessionalId(professionalId)
              const suggestion = services.find(
                (service) => service.professionalId === professionalId,
              )
              if (suggestion) setNewServiceId(suggestion.id)
              setNewSlot({ dateISO: selectedDateISO, startMin })
              setNewError(null)
              setShowNew(true)
            }}
          />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[10px] font-medium text-ink-muted">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-success" aria-hidden />
              Disponível
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-danger" aria-hidden />
              Ocupado
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-line-strong" aria-hidden />
              Fechado
            </span>
            <span className="ml-auto">Dom fechado • almoço 12h–13h</span>
          </div>

          <section className="space-y-2">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="eyebrow">Filtrar por profissional</p>
                <p className="text-[11px] text-ink-muted">
                  {cancelled} cancelado{cancelled === 1 ? '' : 's'} neste dia
                </p>
              </div>
            </div>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <button
                type="button"
                className={cx('chip', !professionalFilter && 'chip-active')}
                onClick={() => setProfessionalFilter(null)}
              >
                Todas
                <span
                  className={cx(
                    'text-[10px]',
                    !professionalFilter ? 'text-white/80' : 'text-ink-muted',
                  )}
                >
                  {dayAppointments.length}
                </span>
              </button>
              {professionals.map((professional) => {
                const count = dayAppointments.filter(
                  (appointment) => appointment.professionalId === professional.id,
                ).length
                return (
                  <button
                    key={professional.id}
                    type="button"
                    className={cx(
                      'chip',
                      professionalFilter === professional.id && 'chip-active',
                    )}
                    onClick={() =>
                      setProfessionalFilter((current) =>
                        current === professional.id ? null : professional.id,
                      )
                    }
                  >
                    {professional.name.split(' ')[0]}
                    <span
                      className={cx(
                        'text-[10px]',
                        professionalFilter === professional.id ? 'text-white/80' : 'text-ink-muted',
                      )}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="card space-y-2 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <p className="eyebrow flex items-center gap-1.5">
                <UserX className="size-3.5 text-warn" aria-hidden />
                Qualidade do dia • {numericDayMonth(selectedDateISO)}
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

          <section className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="text-[19px] leading-tight text-ink">Agenda do dia</h2>
                <p className="text-[11px] text-ink-muted">{fullDateLabel(selectedDateISO)}</p>
              </div>
              <p className="text-[11px] font-medium text-ink-muted">
                {summary.free} vagas livres
              </p>
            </div>

            {filteredDay.length === 0 ? (
              <p className="rounded-[14px] border border-line bg-surface-2 p-4 text-[13px] leading-relaxed text-ink-muted">
                Nenhum atendimento neste dia para este filtro. Escolha a visão{' '}
                <span className="font-semibold text-ink-soft">Dia</span> no calendário e toque em
                um bloco verde para agendar, ou use o botão “Novo”.
              </p>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {filteredDay.map((appointment) => (
                  <TimelineCard key={appointment.id} appointment={appointment} />
                ))}
              </div>
            )}

            <DemoNotice>
              Os indicadores e o calendário são calculados a partir dos atendimentos registrados
              neste navegador — por isso os números mudam quando você agenda, cancela, conclui,
              falta ou reagenda.
            </DemoNotice>
          </section>
        </>
      ) : null}

      {tab === 'servicos' ? (
        <section className="space-y-3">
          <h2 className="text-[19px] text-ink">Serviços cadastrados</h2>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            A duração definida aqui é a que reserva o horário na agenda: um serviço de 60 minutos
            ocupa dois blocos de 30 minutos na visão Dia.
          </p>
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
            A edição de duração e preço pela gestão ainda não está implementada: o catálogo é
            fixo em <span className="font-semibold text-ink-soft">src/data/catalog.ts</span>. A
            agenda já respeita a duração de cada serviço ao reservar os blocos.
          </DemoNotice>
        </section>
      ) : null}

      {tab === 'clientes' ? (
        <section className="space-y-3">
          <div>
            <h2 className="text-[19px] text-ink">Clientes</h2>
            <p className="text-[12px] text-ink-muted">
              Contatos e histórico de quem tem conta no app.
            </p>
          </div>

          <div className="space-y-2">
            {clientRows.map(({ user, total, completed, spent, lastISO, next }) => (
              <article key={user.id} className="card space-y-2">
                <div className="flex items-start gap-3">
                  <Avatar name={user.name} imageKey="clientAvatar" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-ink">{user.name}</p>
                    <span
                      className={cx(
                        'badge',
                        user.role === 'admin'
                          ? 'bg-gold-tint text-gold'
                          : 'bg-surface-2 text-ink-soft',
                      )}
                    >
                      {user.role === 'admin' ? 'Gestão' : 'Cliente'}
                    </span>
                  </div>
                  <p className="shrink-0 text-right text-[11px] text-ink-muted">
                    {total} agendamento{total === 1 ? '' : 's'}
                    <br />
                    {completed} concluído{completed === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="space-y-1 rounded-[12px] bg-surface-2 p-2.5 text-[11px] text-ink-soft">
                  <p className="flex items-center gap-1.5 truncate">
                    <Mail className="size-3.5 shrink-0 text-gold" aria-hidden />
                    {user.email}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="size-3.5 shrink-0 text-gold" aria-hidden />
                    {user.phone}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-muted">
                  <span>
                    {pastLabel(lastISO)}
                    {spent > 0 ? ` • ${formatBRL(spent)} em atendimentos` : ''}
                  </span>
                  {next ? (
                    <span className="font-medium text-gold">
                      Próximo: {numericDayMonth(next.dateISO)}
                    </span>
                  ) : (
                    <span>Sem próximo agendamento</span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {guestAppointments > 0 ? (
            <p className="rounded-[14px] border border-line bg-surface-2 p-3 text-[12px] leading-relaxed text-ink-muted">
              {guestAppointments} atendimento{guestAppointments === 1 ? '' : 's'} foi
              {guestAppointments === 1 ? '' : 'ram'} feito sem conta no app (balcão ou convidada),
              então não aparece{guestAppointments === 1 ? '' : 'm'} na lista acima.
            </p>
          ) : null}

          <DemoNotice>
            Os dados vêm do cadastro local do navegador. A senha nunca é exibida aqui — e, por ser
            um protótipo, ela ainda é guardada sem hash (ver STATUS.md).
          </DemoNotice>
        </section>
      ) : null}

      {tab === 'profissionais' ? (
        <section className="space-y-3">
          <h2 className="text-[19px] text-ink">Equipe do estúdio</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {professionals.map((professional) => {
              const count = dayAppointments.filter(
                (appointment) =>
                  appointment.professionalId === professional.id &&
                  appointment.status !== 'cancelado' &&
                  appointment.status !== 'faltou',
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
                    {count} atendimento{count === 1 ? '' : 's'} em{' '}
                    {numericDayMonth(selectedDateISO)}
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

/** Texto auxiliar da última visita; separado para o card ficar legível. */
function pastLabel(lastISO?: string): string {
  if (!lastISO) return 'Sem atendimento concluído'
  return `Última visita: ${numericDayMonth(lastISO)}`
}
