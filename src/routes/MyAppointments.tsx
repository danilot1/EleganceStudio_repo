import { CalendarPlus, Coffee, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppointmentCard } from '../components/AppointmentCard'
import { RequireRole } from '../components/guards'
import { DemoNotice, Eyebrow, cx } from '../components/ui'
import { sortAppointments, todayISO } from '../lib/dates'
import { firstNameOf } from '../lib/format'
import type { Appointment } from '../lib/types'
import { useAppState } from '../state/AppState'

/** "Meus Agendamentos" — abas Próximos / Histórico. */
export function MyAppointments() {
  const { session } = useAppState()
  return (
    <RequireRole>
      {session ? <MyAppointmentsContent userId={session.userId} name={session.name} /> : null}
    </RequireRole>
  )
}

function MyAppointmentsContent({ userId, name }: { userId: string; name: string }) {
  const { appointments } = useAppState()
  const [tab, setTab] = useState<'proximos' | 'historico'>('proximos')

  const mine = useMemo(
    () =>
      appointments
        .filter((appointment) => appointment.clientUserId === userId)
        .sort(sortAppointments),
    [appointments, userId],
  )

  const isUpcoming = (appointment: Appointment) =>
    !['concluido', 'cancelado', 'faltou'].includes(appointment.status) &&
    appointment.dateISO >= todayISO()

  const upcoming = mine.filter(isUpcoming)
  const history = mine.filter((appointment) => !isUpcoming(appointment)).reverse()
  const list = tab === 'proximos' ? upcoming : history

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Gestão pessoal</Eyebrow>
          <h1 className="text-[26px] leading-tight text-ink">Meus Agendamentos</h1>
          <p className="text-[12px] text-ink-muted">
            Olá, {firstNameOf(name)}. Aqui ficam seus atendimentos no estúdio.
          </p>
        </div>
        <Link to="/agendar" className="btn-primary btn-sm shrink-0">
          <CalendarPlus className="size-3.5" aria-hidden />
          Novo
        </Link>
      </header>

      <div className="flex gap-2 rounded-full border border-line bg-surface p-1">
        {(
          [
            { id: 'proximos', label: 'Próximos', count: upcoming.length },
            { id: 'historico', label: 'Histórico', count: history.length },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
            className={cx(
              'flex-1 rounded-full px-3 py-2 text-[12px] font-semibold transition-colors',
              tab === item.id ? 'bg-gold text-white' : 'text-ink-soft hover:bg-surface-2',
            )}
          >
            {item.label} ({item.count})
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <section className="card space-y-2 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-gold-tint text-gold">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <p className="text-[14px] font-semibold text-ink">
            {tab === 'proximos'
              ? 'Você ainda não tem agendamentos futuros'
              : 'Nenhum atendimento no histórico'}
          </p>
          <p className="text-[12px] text-ink-muted">
            {tab === 'proximos'
              ? 'Escolha um procedimento para reservar seu próximo momento de cuidado.'
              : 'Seus atendimentos concluídos, faltas e cancelamentos aparecerão aqui.'}
          </p>
          <Link to="/agendar" className="btn-primary btn-sm mx-auto">
            Agendar agora
          </Link>
        </section>
      ) : (
        <div className="space-y-3">
          {list.map((appointment, index) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              variant={tab === 'proximos' && index === 0 ? 'detailed' : 'compact'}
            />
          ))}
        </div>
      )}

      <section className="card flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-gold">
          <Coffee className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-ink">Boas-vindas Elegance</p>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            Chegue com 10 minutos de antecedência para desfrutar do nosso menu de chás e café
            gourmet.
          </p>
        </div>
      </section>

      <DemoNotice>
        Os agendamentos vêm do Firestore, vinculados à sua conta: abrir o site em outro
        computador mostra o mesmo histórico. O cancelamento e o reagendamento são gravados na
        hora — e a gestão vê a mudança sem recarregar a página.
      </DemoNotice>
    </div>
  )
}
