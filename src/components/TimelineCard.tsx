import {
  Banknote,
  CircleCheck,
  Eye,
  Pencil,
  Play,
  RotateCcw,
  UserPlus,
  UserX,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { findProfessional, findService } from '../data/catalog'
import { durationLabel, minutesToTime, shortDateLabel } from '../lib/dates'
import { formatBRL } from '../lib/format'
import { canRegisterNoShow } from '../lib/noShow'
import { PAYMENT_LABEL, type Appointment, type PaymentMethod } from '../lib/types'
import { useAppState } from '../state/AppState'
import { SlotPicker } from './SlotPicker'
import { Avatar, DemoNotice, StatusBadge, cx } from './ui'

const PAYMENT_OPTIONS: PaymentMethod[] = ['pix', 'debito', 'credito', 'dinheiro']

/** Bloco da agenda do dia no Painel Executivo. */
export function TimelineCard({ appointment }: { appointment: Appointment }) {
  const {
    setAppointmentStatus,
    registerNoShow,
    registerPayment,
    createAppointment,
    rescheduleAppointment,
  } = useAppState()
  const [showDetails, setShowDetails] = useState(false)
  const [noShowError, setNoShowError] = useState<string | null>(null)
  const [showEdit, setShowEdit] = useState(false)
  const [showFitIn, setShowFitIn] = useState(false)
  const [fitInName, setFitInName] = useState('')
  const [fitInError, setFitInError] = useState<string | null>(null)
  const [editMessage, setEditMessage] = useState<string | null>(null)

  const service = findService(appointment.serviceId)
  const professional = findProfessional(appointment.professionalId)
  const title = appointment.title ?? service?.name ?? 'Atendimento'
  const cancelled = appointment.status === 'cancelado'

  return (
    <article
      className={cx(
        'space-y-3 rounded-[16px] border border-line bg-surface p-3.5 shadow-card',
        cancelled && 'opacity-75',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-medium text-ink-muted">
          <span className="text-[13px] font-semibold text-ink">
            {minutesToTime(appointment.startMin)}
          </span>
          <span className="px-1">•</span>
          {durationLabel(appointment.durationMin)}
        </p>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="space-y-0.5">
        <h3 className={cx('text-[19px] leading-tight text-ink', cancelled && 'line-through')}>
          {appointment.clientName}
        </h3>
        <p className="text-[13px] text-ink-soft">
          {title}
          <span className="px-1.5 text-ink-muted">•</span>
          <span className="font-semibold">{formatBRL(appointment.price)}</span>
        </p>
        <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
          <Avatar
            name={professional?.name ?? 'Estúdio'}
            accent={professional?.accent}
            size="sm"
            imageKey={professional ? `professional${professional.name.split(' ')[0]}` : undefined}
          />
          Profissional: {professional?.name ?? 'Estúdio'}
          <span className="px-0.5">•</span>
          {shortDateLabel(appointment.dateISO)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-line pt-2.5">
        <div className="min-w-0 flex-1">
          {appointment.status === 'concluido' ? (
            <p className="text-[11px] font-medium text-ink-muted">
              {appointment.payment === 'pago'
                ? `Comanda Paga • ${appointment.paymentMethod ? PAYMENT_LABEL[appointment.paymentMethod] : 'PIX'}`
                : 'Atendimento concluído • pagamento pendente'}
            </p>
          ) : cancelled ? (
            <p className="text-[11px] font-medium text-ink-muted">{appointment.note ?? 'Vaga disponível no app'}</p>
          ) : appointment.status === 'faltou' ? (
            <p className="text-[11px] font-medium text-warn">
              Cliente não compareceu • horário liberado no app
            </p>
          ) : (
            <button
              type="button"
              className="btn-outline btn-sm w-full"
              onClick={() =>
                setAppointmentStatus(
                  appointment.id,
                  appointment.status === 'em-atendimento' ? 'concluido' : 'em-atendimento',
                )
              }
            >
              {appointment.status === 'em-atendimento' ? (
                <>
                  <CircleCheck className="size-3.5" aria-hidden />
                  Concluir Atendimento
                </>
              ) : (
                <>
                  <Play className="size-3.5" aria-hidden />
                  Iniciar Atendimento
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {cancelled ? (
            <button
              type="button"
              className="btn-primary btn-sm"
              onClick={() => setShowFitIn((value) => !value)}
            >
              <UserPlus className="size-3.5" aria-hidden />
              Encaixar Cliente
            </button>
          ) : null}
          <button
            type="button"
            className="icon-btn"
            aria-label="Ver detalhes"
            aria-expanded={showDetails}
            onClick={() => setShowDetails((value) => !value)}
          >
            <Eye className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label="Editar atendimento"
            aria-expanded={showEdit}
            onClick={() => setShowEdit((value) => !value)}
          >
            <Pencil className="size-4" aria-hidden />
          </button>
        </div>
      </div>

      {showDetails ? (
        <div className="space-y-1.5 rounded-[14px] border border-line bg-surface-2 p-3 text-[12px] text-ink-soft">
          <p>
            <span className="font-semibold text-ink">Cliente: </span>
            {appointment.clientName}
            {appointment.clientUserId ? ' (conta no app)' : ' (atendimento de balcão)'}
          </p>
          <p>
            <span className="font-semibold text-ink">Serviço: </span>
            {service?.name ?? title}
          </p>
          <p>
            <span className="font-semibold text-ink">Horário: </span>
            {minutesToTime(appointment.startMin)} –{' '}
            {minutesToTime(appointment.startMin + appointment.durationMin)}
          </p>
          <p>
            <span className="font-semibold text-ink">Pagamento: </span>
            {appointment.payment === 'pago'
              ? `Pago • ${appointment.paymentMethod ? PAYMENT_LABEL[appointment.paymentMethod] : ''}`
              : 'Pendente'}
          </p>
        </div>
      ) : null}

      {showEdit ? (
        <div className="space-y-3 rounded-[14px] border border-line bg-surface-2 p-3">
          <div className="space-y-2">
            <p className="eyebrow">Status do atendimento</p>
            <div className="flex flex-wrap gap-2">
              {(['aguardando', 'confirmado', 'em-atendimento', 'concluido', 'cancelado'] as const).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    className={cx('chip', appointment.status === status && 'chip-active')}
                    onClick={() => setAppointmentStatus(appointment.id, status)}
                  >
                    {status === 'em-atendimento' ? 'Em Atendimento' : status === 'aguardando' ? 'Aguardando' : status === 'concluido' ? 'Concluído' : status === 'cancelado' ? 'Cancelado' : 'Confirmado'}
                  </button>
                ),
              )}
            </div>

            {appointment.status === 'faltou' ? (
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => {
                  setAppointmentStatus(appointment.id, 'confirmado')
                  setNoShowError(null)
                }}
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Reverter falta
              </button>
            ) : canRegisterNoShow(appointment) ? (
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => {
                  const result = registerNoShow(appointment.id)
                  setNoShowError(result.ok ? null : (result.error ?? 'Não foi possível registrar.'))
                }}
              >
                <UserX className="size-3.5" aria-hidden />
                Registrar falta
              </button>
            ) : appointment.status !== 'concluido' && appointment.status !== 'cancelado' ? (
              <p className="text-[11px] text-ink-muted">
                A falta só pode ser registrada depois do horário marcado.
              </p>
            ) : null}

            {noShowError ? (
              <p role="alert" className="text-[11px] font-medium text-danger">
                {noShowError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="eyebrow flex items-center gap-1.5">
              <Wallet className="size-3.5" aria-hidden />
              Registrar pagamento
            </p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_OPTIONS.map((method) => (
                <button
                  key={method}
                  type="button"
                  className="chip"
                  onClick={() => registerPayment(appointment.id, method)}
                >
                  <Banknote className="size-3.5" aria-hidden />
                  {PAYMENT_LABEL[method]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="eyebrow">Reagendar</p>
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
                setEditMessage(
                  result.ok
                    ? 'Atendimento reagendado nesta agenda.'
                    : (result.error ?? 'Não foi possível reagendar.'),
                )
              }}
            />
            {editMessage ? (
              <p className="text-[11px] font-medium text-gold">{editMessage}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showFitIn ? (
        <div className="space-y-2 rounded-[14px] border border-line bg-surface-2 p-3">
          <p className="eyebrow">Encaixar cliente nesta vaga</p>
          <input
            className="field-input"
            placeholder="Nome da cliente"
            value={fitInName}
            onChange={(event) => setFitInName(event.target.value)}
          />
          {fitInError ? <p className="text-[12px] text-danger">{fitInError}</p> : null}
          <div className="flex gap-2">
            <button type="button" className="btn-ghost btn-sm flex-1" onClick={() => setShowFitIn(false)}>
              <X className="size-3.5" aria-hidden />
              Fechar
            </button>
            <button
              type="button"
              className="btn-primary btn-sm flex-1"
              onClick={() => {
                const name = fitInName.trim()
                if (!name) {
                  setFitInError('Informe o nome da cliente.')
                  return
                }
                const result = createAppointment({
                  serviceId: appointment.serviceId,
                  professionalId: appointment.professionalId,
                  dateISO: appointment.dateISO,
                  startMin: appointment.startMin,
                  durationMin: appointment.durationMin,
                  price: appointment.price,
                  clientName: name,
                  status: 'confirmado',
                  origin: 'balcao',
                  title: appointment.title,
                })
                if (!result.ok) {
                  setFitInError(result.error ?? 'Não foi possível encaixar.')
                  return
                }
                setFitInError(null)
                setFitInName('')
                setShowFitIn(false)
              }}
            >
              Encaixar
            </button>
          </div>
          <DemoNotice>
            O encaixe cria o atendimento localmente e já o marca como confirmado, como faria a
            recepção. Não há envio de mensagem para a cliente.
          </DemoNotice>
        </div>
      ) : null}
    </article>
  )
}

