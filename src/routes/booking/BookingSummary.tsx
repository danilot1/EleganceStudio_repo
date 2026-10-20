import { CalendarDays, Clock, Star, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Avatar } from '../../components/ui'
import { findProfessional, findService } from '../../data/catalog'
import { appointmentRange, durationLabel, shortDateLabel } from '../../lib/dates'
import { formatBRL } from '../../lib/format'

/** Réplica do cartão "Experiência selecionada" do protótipo. */
export function ServiceSummaryCard({ serviceId }: { serviceId?: string }) {
  const navigate = useNavigate()
  const service = findService(serviceId)
  if (!service) return null

  return (
    <section className="card space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow flex items-center gap-1.5">
          <Wand2 className="size-3 text-gold" aria-hidden />
          Experiência selecionada
        </p>
        <button
          type="button"
          className="text-[12px] font-medium text-ink-muted underline-offset-2 hover:text-gold hover:underline"
          onClick={() => navigate('/agendar/servico')}
        >
          Alterar
        </button>
      </div>
      <h2 className="text-[22px] leading-tight text-ink">{service.name}</h2>
      <p className="flex items-center gap-3 text-[12px] text-ink-muted">
        <span className="flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden />
          {durationLabel(service.durationMin)}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1 rounded-full bg-gold-soft" aria-hidden />
          {formatBRL(service.price)}
        </span>
      </p>
    </section>
  )
}

export function ProfessionalSummaryCard({ professionalId }: { professionalId?: string }) {
  const navigate = useNavigate()
  const professional = findProfessional(professionalId)
  if (!professional) return null

  return (
    <section className="flex items-center gap-3 rounded-[16px] border border-line bg-surface p-3 shadow-card">
      <Avatar
        name={professional.name}
        accent={professional.accent}
        imageKey={`professional${professional.name.split(' ')[0]}`}
        size="lg"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-semibold text-ink">{professional.name}</p>
          <span className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-gold">
            <Star className="size-3.5 fill-current" aria-hidden />
            {professional.rating.toFixed(1)}
          </span>
        </div>
        <p className="truncate text-[12px] text-ink-muted">{professional.role}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {professional.specialties.map((specialty) => (
            <span key={specialty} className="badge bg-gold-tint text-gold">
              Especialista em {specialty}
            </span>
          ))}
          <button
            type="button"
            className="text-[11px] font-medium text-ink-muted underline-offset-2 hover:text-gold hover:underline"
            onClick={() => navigate('/agendar/expert')}
          >
            Alterar
          </button>
        </div>
      </div>
    </section>
  )
}

/** Linha de horário escolhido usada na revisão e no comprovante. */
export function ScheduleLine({
  dateISO,
  startMin,
  durationMin,
}: {
  dateISO: string
  startMin: number
  durationMin: number
}) {
  return (
    <p className="flex items-center gap-2 text-[13px] text-ink-soft">
      <CalendarDays className="size-4 text-gold" aria-hidden />
      <span className="font-semibold text-ink">{shortDateLabel(dateISO)}</span>
      <span className="text-ink-muted">
        {appointmentRange(startMin, durationMin)} ({durationLabel(durationMin)})
      </span>
    </p>
  )
}
