import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CatalogServiceRow, ProfessionalCard } from '../components/cards'
import { Avatar, cx } from '../components/ui'
import { CATEGORIES, SERVICE_GROUPS } from '../data/catalog'
import type { CategoryId } from '../lib/types'
import { useAppState } from '../state/AppState'

export function Services() {
  const { services, professionals } = useAppState()
  const [category, setCategory] = useState<CategoryId | 'todos'>('todos')
  const [query, setQuery] = useState('')
  const [professionalFilter, setProfessionalFilter] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return services.filter((service) => {
      const matchesCategory = category === 'todos' || service.categoryId === category
      const matchesProfessional =
        !professionalFilter || service.professionalId === professionalFilter
      const matchesTerm =
        !term ||
        service.name.toLowerCase().includes(term) ||
        service.description.toLowerCase().includes(term)
      return matchesCategory && matchesProfessional && matchesTerm
    })
  }, [services, category, professionalFilter, query])

  const groups = SERVICE_GROUPS.map((group) => ({
    group,
    items: filtered.filter((service) => service.groupId === group.id),
  })).filter((entry) => entry.items.length > 0)

  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <p className="eyebrow">Menu de procedimentos</p>
        <h1 className="text-[26px] leading-tight text-ink">Nossos Serviços &amp; Cuidados</h1>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Escolha um procedimento para iniciar o agendamento. Valores e duração de cada serviço
          aparecem ao lado do nome.
        </p>
      </header>

      <section className="space-y-2">
        <p className="eyebrow">Nossas especialistas</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          <button
            type="button"
            className={cx('chip', !professionalFilter && 'chip-active')}
            onClick={() => setProfessionalFilter(null)}
          >
            Todas
          </button>
          {professionals.map((professional) => (
            <button
              key={professional.id}
              type="button"
              className={cx('chip', professionalFilter === professional.id && 'chip-active')}
              onClick={() => setProfessionalFilter(professional.id)}
            >
              <Avatar
                name={professional.name}
                accent={professional.accent}
                size="sm"
                imageKey={`professional${professional.name.split(' ')[0]}`}
              />
              {professional.name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <input
            className="field-input pl-10 pr-10"
            placeholder="Procurando por algo específico?"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar serviço"
          />
          {query ? (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-muted"
              aria-label="Limpar busca"
              onClick={() => setQuery('')}
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

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
              <span className={cx('text-[10px]', category === item.id ? 'text-white/80' : 'text-ink-muted')}>
                {item.id === 'todos'
                  ? services.length
                  : services.filter((service) => service.categoryId === item.id).length}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        {groups.map(({ group, items }) => (
          <div key={group.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[18px] text-ink">{group.label}</h2>
              <p className="eyebrow">
                {group.professionalId
                  ? `Por: ${professionals.find((item) => item.id === group.professionalId)?.name}`
                  : group.studioLabel}
              </p>
            </div>
            <div className="divide-y divide-line">
              {items.map((service) => (
                <CatalogServiceRow key={service.id} service={service} group={group} />
              ))}
            </div>
          </div>
        ))}

        {groups.length === 0 ? (
          <p className="rounded-[14px] border border-line bg-surface-2 p-4 text-[13px] text-ink-muted">
            Nenhum serviço encontrado para os filtros atuais.
          </p>
        ) : null}
      </section>

      <section className="card space-y-2">
        <p className="eyebrow">Formas de pagamento aceitas</p>
        <p className="text-[12px] text-ink-muted">
          Aceitamos débito, crédito, dinheiro e PIX. O pagamento é feito no local, ao final do
          atendimento.
        </p>
      </section>

      <section className="space-y-2">
        <p className="eyebrow">Profissionais do estúdio</p>
        <div className="space-y-2">
          {professionals.map((professional) => (
            <ProfessionalCard
              key={professional.id}
              professional={professional}
              imageKey={`professional${professional.name.split(' ')[0]}`}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
