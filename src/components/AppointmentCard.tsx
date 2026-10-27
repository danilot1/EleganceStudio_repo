import { CalendarDays, Eye, Phone, RefreshCw, X } from 'lucide-react'
import { useState } from 'react'
import { findProfessional, findService } from '../data/catalog'
import {
  appointmentRange,
  durationLabel,
  isPast,
  minutesToTime,
  relativeDayLabel,
  shortDateLabel,
} from '../lib/dates'
import { formatBRL } from '../lib/format'
import { PAYMENT_LABEL, type Appointment, type CategoryId } from '../lib/types'
import { useAppState } from '../state/AppState'
import { SlotPicker } from './SlotPicker'
import { Avatar, DemoNotice, StatusBadge, SuccessNote, cx } from './ui'

/** Rótulo de área usado nos cards do cliente (diferente dos filtros do catálogo). */
const CATEGORY_LABEL: Record<CategoryId, string> = {
  cabelos: 'Cabelo & Estilo',
  'maos-pes': 'Mãos & Pés',
  podologia: 'Podologia',
  estetica: 'Estética Facial',
}

export function AppointmentCard({
  appointment,
  variant = 'compact',
}: {
  appointment: Appointment
  variant?: 'detailed' | 'compact'
}) {
  const { rescheduleAppointment, setAppointmentStatus } = useAppState()
  const [showDetails, setShowDetails] = useState(false)
  const [showReschedule, setShowReschedule] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const service = findService(appointment.serviceId)
  const professional = findProfessional(appointment.professionalId)
  const title = appointment.title ?? service?.name ?? 'Atendimento'
  const category = service ? CATEGORY_LABEL[service.categoryId] : 'Atendimento'
  const finished =
    appointment.status === 'concluido' ||
    appointment.status === 'cancelado' ||
    appointment.status === 'faltou'
  const canChange = !finished && !isPast(appointment.dateISO, appointment.startMin)

  const actions = canChange ? (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          className="btn-ghost btn-sm flex-1"
          aria-expanded={showDetails}
          onClick={() => setShowDetails((value) => !value)}
        >
          <Eye className="size-3.5" aria-hidden />
          Ver Detalhes
        </button>
        <button
          type="button"
          className="btn-outline btn-sm flex-1"
          aria-expanded={showReschedule}
          onClick={() => setShowReschedule((value) => !value)}
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Reagendar
        </button>
      </div>
      {!confirmCancel ? (
        <button
          type="button"
          className="flex w-full items-center justify-center gap-1.5 py-1 text-[12px] font-medium text-ink-muted hover:text-danger"
          onClick={() => setConfirmCancel(true)}
        >
          <X className="size-3.5" aria-hidden />
          Cancelar Agendamento
        </button>
      ) : (
        <div className="space-y-2 rounded-[14px] border border-danger/40 bg-danger-tint/60 p-3">
          <p className="text-[12px] font-medium text-danger">
            Confirmar o cancelamento deste agendamento?
          </p>
          <p className="text-[11px] text-ink-muted">
            Pelo protótipo, cancelamentos com mais de 2 horas de antecedência são gratuitos.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-outline btn-sm flex-1"
              onClick={() => setConfirmCancel(false)}
            >
              Manter
            </button>
            <button
              type="button"
              className="btn-primary btn-sm flex-1"
              onClick={() => {
                setAppointmentStatus(appointment.id, 'cancelado')
                setConfirmCancel(false)
                setMessage('Agendamento cancelado. O horário já está livre para outras clientes.')
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null

  return (
    <article className={cx('card space-y-3', finished && 'opacity-80')}>
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={appointment.status} />
        <span className="text-[11px] font-medium text-ink-muted">
          {relativeDayLabel(appointment.dateISO)}
        </span>
      </div>

      <div>
        <p className="eyebrow">{category}</p>
        <h3 className="text-[21px] leading-tight text-ink">{title}</h3>
      </div>

      {variant === 'detailed' ? (
        <>
          <div className="flex items-start gap-3 rounded-[14px] border border-line bg-surface-2 p-3">
            <CalendarDays className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <div>
              <p className="text-[14px] font-semibold text-ink">
                {shortDateLabel(appointment.dateISO)}
              </p>
              <p className="text-[12px] text-ink-muted">
                {appointmentRange(appointment.startMin, appointment.durationMin)}{' '}
                ({durationLabel(appointment.durationMin)})
              </p>
            </div>
          </div>

          {professional ? (
            <div className="flex items-center gap-3">
              <Avatar
                name={professional.name}
                accent={professional.accent}
                imageKey={`professional${professional.name.split(' ')[0]}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-ink">{professional.name}</p>
                <p className="text-[12px] text-ink-muted">
                  {professional.role}
                  {professional.chair ? ` • ${professional.chair}` : ''}
                </p>
              </div>
              <span className="icon-btn" aria-hidden>
                <Phone className="size-4" />
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface-2 p-3">
            <div>
              <p className="eyebrow">Valor Estimado</p>
              <p className="font-display text-[20px] text-ink">{formatBRL(appointment.price)}</p>
            </div>
            <p className="text-right text-[11px] leading-snug text-ink-muted">
              {appointment.status === 'faltou'
                ? 'Cliente não compareceu'
                : appointment.payment === 'pago'
                  ? `Pago • ${appointment.paymentMethod ? PAYMENT_LABEL[appointment.paymentMethod] : ''}`
                  : 'Pagamento no local'}
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="flex items-center gap-2 text-[12px] text-ink-muted">
            <CalendarDays className="size-3.5 text-gold" aria-hidden />
            {shortDateLabel(appointment.dateISO)} às {minutesToTime(appointment.startMin)}
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {professional ? (
                <Avatar
                  name={professional.name}
                  accent={professional.accent}
                  size="sm"
                  imageKey={`professional${professional.name.split(' ')[0]}`}
                />
              ) : null}
              <span className="text-[12px] text-ink-soft">{professional?.name}</span>
            </div>
            <span className="text-[14px] font-semibold text-ink">{formatBRL(appointment.price)}</span>
          </div>
        </>
      )}

      {showDetails ? (
        <div className="space-y-1.5 rounded-[14px] border border-line bg-surface-2 p-3 text-[12px] text-ink-soft">
          <p>
            <span className="font-semibold text-ink">Serviço: </span>
            {service?.name ?? appointment.title}
          </p>
          <p>
            <span className="font-semibold text-ink">Duração: </span>
            {durationLabel(appointment.durationMin)}
          </p>
          <p>
            <span className="font-semibold text-ink">Origem: </span>
            {appointment.origin === 'app' ? 'Agendado pelo aplicativo' : 'Agendado no balcão'}
          </p>
          <p>
            <span className="font-semibold text-ink">Pagamento: </span>
            {appointment.payment === 'pago'
              ? `Pago${appointment.paymentMethod ? ` • ${PAYMENT_LABEL[appointment.paymentMethod]}` : ''}`
              : appointment.payment === 'pago-no-local'
                ? 'A pagar no local'
                : 'Pendente'}
          </p>
          {appointment.note ? (
            <p>
              <span className="font-semibold text-ink">Observação: </span>
              {appointment.note}
            </p>
          ) : null}
          <DemoNotice>
            O botão de telefone do protótipo não foi implementado: exige um serviço de
            mensagens e o contato do estúdio, que não constam no projeto.
          </DemoNotice>
        </div>
      ) : null}

      {showReschedule && canChange ? (
        <div className="space-y-3 rounded-[14px] border border-line bg-surface p-3">
          <p className="text-[13px] font-semibold text-ink">Escolha o novo horário</p>
          <SlotPicker
            professionalId={appointment.professionalId}
            durationMin={appointment.durationMin}
            ignoreAppointmentId={appointment.id}
            onChange={(selection) => {
              const result = rescheduleAppointment(
                appointment.id,
                selection.dateISO,
                selection.startMin,
              )
              if (result.ok) {
                setShowReschedule(false)
                setMessage('Agendamento reagendado e enviado para nova confirmação.')
              } else {
                setMessage(result.error ?? 'Não foi possível reagendar.')
              }
            }}
          />
          <button
            type="button"
            className="btn-ghost btn-sm w-full"
            onClick={() => setShowReschedule(false)}
          >
            Fechar
          </button>
        </div>
      ) : null}

      {actions}
      {message ? <SuccessNote>{message}</SuccessNote> : null}
    </article>
  )
}
