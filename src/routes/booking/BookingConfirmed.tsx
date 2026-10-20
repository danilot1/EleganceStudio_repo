import { CalendarCheck, CheckCircle2, Home as HomeIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { DemoNotice, StatusBadge } from '../../components/ui'
import { findProfessional, findService } from '../../data/catalog'
import { formatBRL } from '../../lib/format'
import { useAppState } from '../../state/AppState'
import { useBooking } from '../../state/BookingContext'
import { ProfessionalSummaryCard, ScheduleLine, ServiceSummaryCard } from './BookingSummary'

/**
 * Comprovante do agendamento.
 * Não existe print desta tela: ela segue o padrão visual das demais e mostra o que foi
 * realmente gravado.
 */
export function BookingConfirmed() {
  const location = useLocation()
  const { appointments, session } = useAppState()
  const appointmentId = (location.state as { appointmentId?: string } | null)?.appointmentId
  const appointment = appointments.find((item) => item.id === appointmentId)
  const { clear } = useBooking()

  // O rascunho é descartado quando o comprovante aparece (o agendamento já foi gravado).
  useEffect(() => {
    clear()
  }, [clear])

  if (!appointment) return <Navigate to="/agendar/servico" replace />

  const service = findService(appointment.serviceId)
  const professional = findProfessional(appointment.professionalId)

  return (
    <div className="space-y-4">
      <section className="card space-y-2 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-tint text-success">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h1 className="text-[24px] leading-tight text-ink">Agendamento registrado</h1>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Guarde os detalhes abaixo. A confirmação pelo estúdio seria enviada pelo WhatsApp —
          mensagem que ainda não existe neste projeto.
        </p>
        <div className="flex justify-center pt-1">
          <StatusBadge status={appointment.status} />
        </div>
      </section>

      {service ? <ServiceSummaryCard serviceId={service.id} /> : null}
      {professional ? <ProfessionalSummaryCard professionalId={professional.id} /> : null}

      <section className="card space-y-3">
        <p className="eyebrow">Horário</p>
        <ScheduleLine
          dateISO={appointment.dateISO}
          startMin={appointment.startMin}
          durationMin={appointment.durationMin}
        />
        <div className="flex items-center justify-between border-t border-line pt-3">
          <div>
            <p className="eyebrow">Valor</p>
            <p className="font-display text-[22px] text-ink">{formatBRL(appointment.price)}</p>
          </div>
          <p className="text-right text-[11px] text-ink-muted">
            Cliente: {appointment.clientName}
            <br />
            Pagamento no local
          </p>
        </div>
        {appointment.note ? (
          <p className="text-[12px] text-ink-muted">
            <span className="font-semibold text-ink">Observação: </span>
            {appointment.note}
          </p>
        ) : null}
      </section>

      <div className="space-y-2">
        {session ? (
          <Link to="/meus-agendamentos" className="btn-primary w-full">
            <CalendarCheck className="size-4" aria-hidden />
            Ver meus agendamentos
          </Link>
        ) : (
          <Link to="/criar-conta" className="btn-primary w-full">
            <CalendarCheck className="size-4" aria-hidden />
            Criar conta para acompanhar
          </Link>
        )}
        <Link to="/" className="btn-ghost w-full">
          <HomeIcon className="size-4" aria-hidden />
          Voltar ao início
        </Link>
      </div>

      <DemoNotice>
        Este agendamento foi salvo apenas neste navegador. Sem back-end, ele não é visto pelo
        estúdio nem aparece em outro dispositivo.
      </DemoNotice>
    </div>
  )
}
