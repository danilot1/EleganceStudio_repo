import { ArrowRight, CalendarCheck, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldError, InfoNote } from '../../components/ui'
import { findProfessional, findService } from '../../data/catalog'
import { durationLabel } from '../../lib/dates'
import { formatBRL } from '../../lib/format'
import { useAppState } from '../../state/AppState'
import { useBooking } from '../../state/BookingContext'
import { ProfessionalSummaryCard, ScheduleLine, ServiceSummaryCard } from './BookingSummary'

/** Etapa 4 — Revisão (etapa final antes do comprovante). */
export function StepReview() {
  const { draft, update } = useBooking()
  const { createAppointment, session } = useAppState()
  const navigate = useNavigate()
  const [name, setName] = useState(draft.clientName ?? session?.name ?? '')
  const [note, setNote] = useState(draft.clientNote ?? '')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const service = findService(draft.serviceId)
  const professional = findProfessional(draft.professionalId)
  const ready = Boolean(service && professional && draft.dateISO && draft.startMin !== undefined)

  if (!ready) return null

  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <p className="eyebrow">Etapa 4 de 4</p>
        <h1 className="text-[24px] leading-tight text-ink">Confira os detalhes</h1>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Revise o serviço, a profissional e o horário antes de confirmar.
        </p>
      </header>

      <ServiceSummaryCard serviceId={service!.id} />
      <ProfessionalSummaryCard professionalId={professional!.id} />

      <section className="card space-y-3">
        <p className="eyebrow">Horário</p>
        <ScheduleLine
          dateISO={draft.dateISO!}
          startMin={draft.startMin!}
          durationMin={service!.durationMin}
        />
        <div className="flex items-center justify-between border-t border-line pt-3">
          <div>
            <p className="eyebrow">Valor total</p>
            <p className="font-display text-[22px] text-ink">{formatBRL(service!.price)}</p>
          </div>
          <p className="text-right text-[11px] leading-snug text-ink-muted">
            {durationLabel(service!.durationMin)}
            <br />
            Pagamento no local
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <label className="field-label" htmlFor="client-name">
            Para quem é o agendamento?
          </label>
          <div className="relative">
            <UserRound
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              id="client-name"
              className="field-input pl-10"
              placeholder="Nome completo"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="client-note">
            Observações (opcional)
          </label>
          <textarea
            id="client-note"
            className="field-input min-h-20 resize-y"
            placeholder="Ex.: alergia a algum produto, preferência de profissional…"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </div>
      </section>

      {!session ? (
        <section className="card space-y-2">
          <p className="text-[13px] font-semibold text-ink">Entre para concluir</p>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            O agendamento fica gravado no Firestore do estúdio, vinculado a uma conta. Entre ou
            crie uma conta para confirmar este horário.
          </p>
          <div className="flex gap-2">
            <Link to="/entrar" className="btn-ghost btn-sm flex-1">
              Entrar
            </Link>
            <Link to="/criar-conta" className="btn-outline btn-sm flex-1">
              Criar conta
            </Link>
          </div>
        </section>
      ) : null}

      <InfoNote icon={ShieldCheck} title="Garantia de Flexibilidade">
        Cancelamento ou reagendamento sem custo até 2 horas antes do atendimento.
      </InfoNote>

      <FieldError>{error}</FieldError>

      <button
        type="button"
        className="btn-primary w-full"
        disabled={busy || !session}
        onClick={async () => {
          if (!session) {
            setError('Entre na sua conta para confirmar o agendamento.')
            return
          }
          if (!name.trim()) {
            setError('Informe o nome de quem vai ser atendida.')
            return
          }
          setBusy(true)
          const result = await createAppointment({
            serviceId: service!.id,
            professionalId: professional!.id,
            dateISO: draft.dateISO!,
            startMin: draft.startMin!,
            durationMin: service!.durationMin,
            price: service!.price,
            clientName: name,
            clientNote: note,
          })
          setBusy(false)
          if (!result.ok || !result.appointment) {
            setError(result.error ?? 'Não foi possível concluir o agendamento.')
            return
          }
          // Guarda o nome para os próximos agendamentos. O rascunho só é limpo quando o
          // comprovante aparece: limpar aqui faria a proteção do fluxo devolver o usuário
          // para a etapa 1 antes da confirmação ser exibida.
          update({ clientName: name, clientNote: note })
          navigate('/agendar/confirmado', {
            replace: true,
            state: { appointmentId: result.appointment.id },
          })
        }}
      >
        <CalendarCheck className="size-4" aria-hidden />
        {busy ? 'Confirmando…' : session ? 'Confirmar Agendamento' : 'Entre para confirmar'}
        <ArrowRight className="size-4" aria-hidden />
      </button>

      <p className="text-center text-[11px] text-ink-muted">
        Ao confirmar você aceita os Termos de Uso e a Política de Privacidade do EleganceStudio.
      </p>
    </div>
  )
}
