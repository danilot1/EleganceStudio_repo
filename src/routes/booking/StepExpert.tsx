import { ArrowRight, BadgeCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ProfessionalCard } from '../../components/cards'
import { DemoNotice } from '../../components/ui'
import { findService } from '../../data/catalog'
import { useAppState } from '../../state/AppState'
import { useBooking } from '../../state/BookingContext'
import { ServiceSummaryCard } from './BookingSummary'

/**
 * Etapa 2 — Expert.
 * Também sem print: a profissional sugerida é a do catálogo e as outras ficam
 * disponíveis, com a disponibilidade calculada individualmente na etapa seguinte.
 */
export function StepExpert() {
  const { professionals } = useAppState()
  const { draft, update, clearFrom } = useBooking()
  const navigate = useNavigate()
  const service = findService(draft.serviceId)
  const selected = draft.professionalId ?? service?.professionalId

  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <p className="eyebrow">Etapa 2 de 4</p>
        <h1 className="text-[24px] leading-tight text-ink">Com quem você quer ser atendida?</h1>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          A especialista sugerida é quem normalmente realiza este procedimento. Você pode
          escolher outra profissional do estúdio.
        </p>
      </header>

      <ServiceSummaryCard serviceId={draft.serviceId} />

      <div className="space-y-2.5">
        {professionals.map((professional) => {
          const isSuggested = professional.id === service?.professionalId
          return (
            <div key={professional.id} className="space-y-1">
              <ProfessionalCard
                professional={professional}
                imageKey={`professional${professional.name.split(' ')[0]}`}
                compact
                selected={selected === professional.id}
                onSelect={() => update({ professionalId: professional.id })}
              />
              {isSuggested ? (
                <p className="flex items-center gap-1.5 pl-1 text-[11px] font-medium text-gold">
                  <BadgeCheck className="size-3.5" aria-hidden />
                  Sugerida para {service?.name}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <button
        type="button"
        className="btn-primary w-full"
        disabled={!selected}
        onClick={() => {
          // Trocar de profissional invalida o horário já escolhido.
          if (draft.professionalId !== selected) clearFrom('datetime')
          update({ professionalId: selected })
          navigate('/agendar/horario')
        }}
      >
        Ver horários disponíveis
        <ArrowRight className="size-4" aria-hidden />
      </button>

      <DemoNotice>
        Etapa montada a partir do stepper: no protótipo ela não foi enviada como imagem.
      </DemoNotice>
    </div>
  )
}
