import { ArrowRight, CalendarCheck, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FieldError, InfoNote } from '../../components/ui'
import { findProfessional } from '../../data/catalog'
import { durationLabel } from '../../lib/dates'
import { isValidEmail } from '../../lib/format'
import { buildMail } from '../../lib/notifications'
import { useAppState } from '../../state/AppState'
import { useBooking } from '../../state/BookingContext'
import { ProfessionalSummaryCard, ScheduleLine, ServiceSummaryCard } from './BookingSummary'

/** Etapa 4 — Revisão (etapa final antes do comprovante). */
export function StepReview() {
  const { draft, update } = useBooking()
  const { createAppointment, queueMail, session, services } = useAppState()
  const navigate = useNavigate()
  const [name, setName] = useState(draft.clientName ?? session?.name ?? '')
  const [email, setEmail] = useState(session?.email ?? '')
  const [note, setNote] = useState(draft.clientNote ?? '')
  const [error, setError] = useState<string | null>(null)

  const service = services.find((item) => item.id === draft.serviceId)
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
        <div className="border-t border-line pt-3">
          <p className="text-[11px] leading-snug text-ink-muted">
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
          <label className="field-label" htmlFor="client-email">
            E-mail para receber os avisos
          </label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              id="client-email"
              type="email"
              className="field-input pl-10"
              placeholder="voce@exemplo.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">
            Usado só para este horário: pedido recebido, confirmação e lembrete de véspera.
          </p>
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
          <p className="text-[13px] font-semibold text-ink">Você não está conectada</p>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            É possível agendar sem conta, mas o agendamento não aparece em “Meus Agendamentos”
            porque não fica vinculado a um cadastro.
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
        onClick={async () => {
          if (!name.trim()) {
            setError('Informe o nome de quem vai ser atendida.')
            return
          }
          const cleanEmail = email.trim()
          if (cleanEmail && !isValidEmail(cleanEmail)) {
            setError('Confira o e-mail: parece incompleto.')
            return
          }
          const result = await createAppointment({
            serviceId: service!.id,
            professionalId: professional!.id,
            dateISO: draft.dateISO!,
            startMin: draft.startMin!,
            durationMin: service!.durationMin,
            clientName: name,
            clientNote: note,
            clientEmail: cleanEmail || undefined,
          })
          if (!result.ok || !result.appointment) {
            setError(result.error ?? 'Não foi possível concluir o agendamento.')
            return
          }
          // O e-mail vem do próprio agendamento (informado acima) e, se houver conta, do
          // cadastro. Sem nenhum dos dois, fica só o comprovante na tela.
          const to = result.appointment.clientEmail ?? session?.email
          if (to) {
            await queueMail(
              buildMail({ kind: 'confirmacao', appointment: result.appointment, to }),
            )
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
        Confirmar Agendamento
        <ArrowRight className="size-4" aria-hidden />
      </button>

      <p className="text-center text-[11px] text-ink-muted">
        Ao confirmar você aceita os Termos de Uso e a Política de Privacidade do EleganceStudio.
      </p>
    </div>
  )
}
