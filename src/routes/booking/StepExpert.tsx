import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { ProfessionalCard } from '../../components/cards'
import { CATEGORIES, findService, professionalsForService } from '../../data/catalog'
import { useBooking } from '../../state/BookingContext'
import { ServiceSummaryCard } from './BookingSummary'

/**
 * Etapa 2 — Expert.
 * Só aparecem as profissionais que atendem a categoria do serviço escolhido: quem faz
 * podologia não aparece para corte, e vice-versa. Com uma única opção, ela já vem
 * marcada; com mais de uma, a cliente escolhe.
 */
export function StepExpert() {
  const { draft, update, clearFrom } = useBooking()
  const navigate = useNavigate()
  const service = findService(draft.serviceId)
  const options = professionalsForService(draft.serviceId)
  const category = CATEGORIES.find((item) => item.id === service?.categoryId)
  // Uma escolha anterior só vale se a profissional atende este serviço.
  const selected = options.some((item) => item.id === draft.professionalId)
    ? draft.professionalId
    : options.length === 1
      ? options[0].id
      : undefined

  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <p className="eyebrow">Etapa 2 de 4</p>
        <h1 className="text-[24px] leading-tight text-ink">Com quem você quer ser atendida?</h1>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          {options.length === 1
            ? `${options[0].name} é quem realiza ${category ? category.label.toLowerCase() : 'este serviço'} no estúdio.`
            : `Estas são as profissionais que realizam ${category ? category.label.toLowerCase() : 'este serviço'}. Escolha com quem prefere ser atendida.`}
        </p>
      </header>

      <ServiceSummaryCard serviceId={draft.serviceId} />

      <div className="space-y-2.5">
        {options.map((professional) => (
          <ProfessionalCard
            key={professional.id}
            professional={professional}
            imageKey={`professional${professional.name.split(' ')[0]}`}
            compact
            selected={selected === professional.id}
            onSelect={() => update({ professionalId: professional.id })}
          />
        ))}
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
    </div>
  )
}
