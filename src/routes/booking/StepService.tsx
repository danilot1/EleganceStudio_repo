import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ServiceRowCard } from '../../components/cards'
import { ServiceSummaryCard } from './BookingSummary'
import { DemoNotice, cx } from '../../components/ui'
import { CATEGORIES } from '../../data/catalog'
import type { CategoryId } from '../../lib/types'
import { useAppState } from '../../state/AppState'
import { useBooking } from '../../state/BookingContext'

/**
 * Etapa 1 — Serviço.
 * Não existe print desta etapa no protótipo: a tela reutiliza as mesmas linhas do
 * catálogo (nome, duração, valor e botão) e o mesmo padrão de filtros.
 */
export function StepService() {
  const { services } = useAppState()
  const { draft, update } = useBooking()
  const navigate = useNavigate()
  const [category, setCategory] = useState<CategoryId | 'todos'>('todos')

  const list = services.filter(
    (service) => category === 'todos' || service.categoryId === category,
  )

  return (
    <div className="space-y-4">
      <header className="space-y-1.5">
        <p className="eyebrow">Etapa 1 de 4</p>
        <h1 className="text-[24px] leading-tight text-ink">Qual serviço você deseja?</h1>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Ao escolher, o sistema já sugere a especialista responsável e calcula a duração para
          montar os horários disponíveis.
        </p>
      </header>

      {draft.serviceId ? <ServiceSummaryCard serviceId={draft.serviceId} /> : null}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATEGORIES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx('chip', category === item.id && 'chip-active')}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {list.map((service) => (
          <ServiceRowCard
            key={service.id}
            service={service}
            selected={draft.serviceId === service.id}
            onSelect={() => update({ serviceId: service.id })}
          />
        ))}
      </div>

      <button
        type="button"
        className="btn-primary w-full"
        disabled={!draft.serviceId}
        onClick={() => navigate('/agendar/expert')}
      >
        Escolher profissional
        <ArrowRight className="size-4" aria-hidden />
      </button>

      <DemoNotice>
        Esta etapa não aparece nos prints enviados; ela foi montada a partir do stepper do
        protótipo e do catálogo de Serviços.
      </DemoNotice>
    </div>
  )
}
