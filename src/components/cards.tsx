import { Clock, Search, Star } from 'lucide-react'
import { findProfessional, professionalLabel, type ServiceGroup } from '../data/catalog'
import { durationLabel } from '../lib/dates'
import { formatBRL } from '../lib/format'
import type { Professional, Service } from '../lib/types'
import { useStartBooking } from '../state/BookingContext'
import { Avatar, Photo, cx } from './ui'

/** Cartão grande usado em "Serviços Populares" na Home. */
export function FeaturedServiceCard({ service }: { service: Service }) {
  const startBooking = useStartBooking()
  return (
    <article className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-card">
      <div className="relative h-40">
        <Photo imageKey="homeServiceHair" alt={service.name} caption="Foto do protótipo" />
        <span className="absolute left-3 top-3 badge bg-surface/90 text-ink-soft">
          <Clock className="size-3" aria-hidden />
          {durationLabel(service.durationMin)}
        </span>
        <span className="absolute right-3 top-3 badge bg-gold text-white">Mais Pedido</span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-[20px] leading-tight text-ink">{service.name}</h3>
        <p className="text-[12px] leading-relaxed text-ink-muted">{service.description}</p>
        <div className="flex items-end justify-between gap-3 pt-1">
          <div>
            <p className="eyebrow">Valor</p>
            <p className="font-display text-[20px] text-ink">{formatBRL(service.price)}</p>
          </div>
          <button
            type="button"
            className="btn-primary btn-sm"
            onClick={() => startBooking(service.id)}
          >
            Escolher
          </button>
        </div>
      </div>
    </article>
  )
}

/**
 * Linha compacta de serviço (Home e listas).
 * Em `onSelect` a linha apenas marca a escolha (usado na etapa 1 do agendamento);
 * sem `onSelect` o botão inicia o agendamento direto pelo serviço.
 */
export function ServiceRowCard({
  service,
  imageKey,
  onSelect,
  selected,
}: {
  service: Service
  imageKey?: string
  onSelect?: () => void
  selected?: boolean
}) {
  const startBooking = useStartBooking()
  return (
    <article
      className={cx(
        'flex items-stretch gap-3 rounded-[16px] border bg-surface p-3 shadow-card',
        selected ? 'border-gold ring-1 ring-gold/40' : 'border-line',
      )}
    >
      <div className="size-[68px] shrink-0 overflow-hidden rounded-[12px]">
        <Photo imageKey={imageKey ?? 'homeServiceNails'} alt={service.name} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1">
        <div>
          <h3 className="text-[15px] leading-tight text-ink">{service.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-muted">
            <Clock className="size-3" aria-hidden />
            {durationLabel(service.durationMin)}
            <span className="px-0.5">•</span>
            {professionalLabel(service.professionalId)}
          </p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-semibold text-ink">{formatBRL(service.price)}</span>
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => (onSelect ? onSelect() : startBooking(service.id))}
          >
            {selected ? 'Selecionado' : 'Escolher'}
          </button>
        </div>
      </div>
    </article>
  )
}

/** Linha do catálogo completo (tela Serviços), agrupada por categoria. */
export function CatalogServiceRow({
  service,
  group,
}: {
  service: Service
  group: ServiceGroup
}) {
  const startBooking = useStartBooking()
  return (
    <article className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[16px] leading-tight text-ink">{service.name}</h3>
          {service.featured ? (
            <span className="badge bg-gold-tint text-gold">Destaque</span>
          ) : null}
        </div>
        <p className="text-[12px] leading-relaxed text-ink-muted">{service.description}</p>
        {service.note ? (
          <p className="text-[11px] font-medium text-gold">{service.note}</p>
        ) : null}
        <p className="eyebrow pt-0.5">
          {group.professionalId ? `Por ${professionalLabel(group.professionalId)}` : group.studioLabel}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className="badge bg-surface-2 text-ink-soft">
          <Clock className="size-3" aria-hidden />
          {durationLabel(service.durationMin)}
        </span>
        <span className="text-[13px] font-semibold text-ink">{formatBRL(service.price)}</span>
        <button type="button" className="btn-primary btn-sm" onClick={() => startBooking(service.id)}>
          <Search className="size-3" aria-hidden />
          Agendar
        </button>
      </div>
    </article>
  )
}

/** Cartão de profissional usado na Home (chips) e no passo "Expert". */
export function ProfessionalCard({
  professional,
  imageKey,
  selected,
  onSelect,
  compact,
}: {
  professional: Professional
  imageKey?: string
  selected?: boolean
  onSelect?: () => void
  compact?: boolean
}) {
  const content = (
    <>
      <Avatar name={professional.name} accent={professional.accent} imageKey={imageKey} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-ink">{professional.name}</p>
        <p className="truncate text-[12px] text-ink-muted">{professional.role}</p>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-gold">
          <Star className="size-3 fill-current" aria-hidden />
          {professional.rating.toFixed(1)}
          <span className="text-ink-muted">({professional.reviews} avaliações)</span>
        </p>
      </div>
    </>
  )

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cx(
          'flex w-full items-center gap-3 rounded-[16px] border bg-surface p-3 text-left transition-colors',
          selected ? 'border-gold ring-1 ring-gold/40' : 'border-line hover:border-gold-soft',
        )}
      >
        {content}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-line bg-surface p-3 shadow-card">
      {content}
    </div>
  )
}

export function professionalOf(service: Service): Professional | undefined {
  return findProfessional(service.professionalId)
}
