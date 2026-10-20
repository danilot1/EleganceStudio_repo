import {
  ArrowRight,
  AtSign,
  Award,
  CalendarPlus,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserRoundCheck,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FeaturedServiceCard, ServiceRowCard } from '../components/cards'
import { DemoNotice, Eyebrow, InfoNote, Photo, SectionHeading, Stat, cx } from '../components/ui'
import { POPULAR_SERVICE_IDS } from '../data/catalog'
import { formatBRL } from '../lib/format'
import type { CategoryId } from '../lib/types'
import { useAppState } from '../state/AppState'

const STUDIO_ADDRESS = 'Av. das Américas, 4200 - Bloco B, Sala 204 - Barra da Tijuca, RJ'
const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STUDIO_ADDRESS)}`

/** Chips de destaque da Home (rótulos do protótipo). */
const HOME_FILTERS: Array<{ label: string; categories: CategoryId[] | null }> = [
  { label: 'Todos', categories: null },
  { label: 'Cabelo & Tratamento', categories: ['cabelos'] },
  { label: 'Nails & Spa', categories: ['maos-pes', 'podologia'] },
]

/** Horário de funcionamento do estúdio, usado no selo "Aberto agora". */
export function studioIsOpenNow(now = new Date()): boolean {
  const day = now.getDay()
  const minutes = now.getHours() * 60 + now.getMinutes()
  if (day === 0) return false
  if (day === 6) return minutes >= 8 * 60 && minutes < 14 * 60
  return minutes >= 8 * 60 && minutes < 18 * 60
}

const SERVICE_IMAGE: Record<string, string> = {
  'corte-visagismo': 'homeServiceHair',
  'mechas-luzes': 'homeServiceBrows',
  'escova-modeladora': 'homeServiceHair',
  'manicure-classica': 'homeServiceNails',
}

export function Home() {
  const { services, session } = useAppState()
  const [activeFilter, setActiveFilter] = useState(0)
  const [contactNotice, setContactNotice] = useState(false)

  const popular = useMemo(
    () =>
      POPULAR_SERVICE_IDS.map((id) => services.find((service) => service.id === id)).filter(
        (service): service is (typeof services)[number] => Boolean(service),
      ),
    [services],
  )

  const filter = HOME_FILTERS[activeFilter]!
  const visible = popular.filter(
    (service) => !filter.categories || filter.categories.includes(service.categoryId),
  )
  const featured = visible.find((service) => service.featured) ?? visible[0]
  const others = visible.filter((service) => service.id !== featured?.id)

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <Eyebrow className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-gold" aria-hidden />
          Atendimento personalizado e exclusivo
        </Eyebrow>
        <h1 className="text-[30px] leading-[1.15] text-ink">
          Realize sua beleza natural com <em className="text-gold">atendimento exclusivo</em>
        </h1>
        <p className="text-[13px] leading-relaxed text-ink-muted">
          Um santuário de bem-estar e estética dedicado ao cuidado capilar, estética e ritual
          de autocuidado com especialistas renomadas.
        </p>
      </section>

      <section className="relative h-52 overflow-hidden rounded-[20px] border border-line">
        <Photo imageKey="homeHero" alt="Ambiente do EleganceStudio" caption="Foto do protótipo" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/70 to-transparent p-3">
          <span className="badge bg-surface/90 text-ink">
            <Star className="size-3 fill-gold text-gold" aria-hidden />
            4.9 (1.2k+ avaliações)
          </span>
          <span className="badge bg-gold text-white">Studio Premium</span>
        </div>
      </section>

      <section className="flex flex-col gap-2 sm:flex-row">
        <Link to="/agendar" className="btn-primary flex-1">
          <CalendarPlus className="size-4" aria-hidden />
          Agendar agora
        </Link>
        <Link to={session ? '/meus-agendamentos' : '/entrar'} className="btn-outline flex-1">
          {session ? 'Minha conta' : 'Entrar / Minha Conta'}
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Stat
          icon={UserRoundCheck}
          label="Profissionais"
          value="100%"
          hint="especialistas"
        />
        <Stat icon={Award} label="Clientes acolhidas" value="1.200+" hint="este ano" />
      </section>

      <section className="space-y-3">
        <SectionHeading
          title="Serviços Populares"
          action={
            <Link to="/servicos" className="flex items-center gap-1 text-[12px] font-medium text-ink-soft">
              Ver todos
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          }
        />
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {HOME_FILTERS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={cx('chip', index === activeFilter && 'chip-active')}
              aria-pressed={index === activeFilter}
              onClick={() => setActiveFilter(index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {featured ? <FeaturedServiceCard service={featured} /> : null}

        <div className="space-y-2.5">
          {others.map((service) => (
            <ServiceRowCard
              key={service.id}
              service={service}
              imageKey={SERVICE_IMAGE[service.id] ?? 'homeServiceNails'}
            />
          ))}
        </div>

        {visible.length === 0 ? (
          <p className="rounded-[14px] border border-line bg-surface-2 p-3 text-[12px] text-ink-muted">
            Nenhum serviço em destaque nesta categoria. Veja o catálogo completo em Serviços.
          </p>
        ) : null}
      </section>

      <section className="card space-y-3">
        <Eyebrow className="flex items-center gap-1.5">
          <Sparkles className="size-3 text-gold" aria-hidden />
          A experiência Elegance
        </Eyebrow>
        <h2 className="text-[22px] leading-snug text-ink">
          Mais que um salão, um momento de pausa &amp; carinho com você
        </h2>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          O cuidado da nossa arte nos detalhes: chás de especiarias, playlist acústica relaxante e
          estações equipadas com aromaterapia botânica.
        </p>
        <div className="h-44 overflow-hidden rounded-[16px] border border-line">
          <Photo imageKey="homeLounge" alt="Sala de espera do estúdio" caption="Foto do protótipo" />
        </div>
        <div className="space-y-1.5 rounded-[16px] border border-line bg-surface-2 p-3">
          <p className="flex gap-0.5 text-gold" aria-label="5 de 5 estrelas">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star key={index} className="size-3.5 fill-current" aria-hidden />
            ))}
          </p>
          <p className="text-[12px] italic leading-relaxed text-ink-soft">
            “O estúdio mudou a relação com o meu cabelo. O ambiente é aconchegante e a equipe me
            deixa sempre confiante.”
          </p>
          <p className="text-[11px] text-ink-muted">Camila Lourenço • Cliente VIP</p>
        </div>
      </section>

      <section className="card space-y-3">
        <div className="flex items-start justify-between gap-2">
          <SectionHeading icon={MapPin} title="Onde Estamos & Horários" />
          <span
            className={cx(
              'badge shrink-0',
              studioIsOpenNow() ? 'bg-success-tint text-success' : 'bg-surface-3 text-ink-muted',
            )}
          >
            <Clock className="size-3" aria-hidden />
            {studioIsOpenNow() ? 'Aberto agora' : 'Fechado agora'}
          </span>
        </div>
        <div className="flex gap-3">
          <MapPin className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
          <div className="space-y-0.5 text-[12px] text-ink-soft">
            <p>{STUDIO_ADDRESS}</p>
            <p className="text-ink-muted">Seg a Sex: 08:00 - 18:00</p>
            <p className="text-ink-muted">Sábado: 08:00 - 14:00</p>
          </div>
        </div>
        <div className="h-32 overflow-hidden rounded-[14px] border border-line">
          <Photo imageKey="homeLounge" alt="Mapa da localização (placeholder)" caption="Mapa — placeholder" />
        </div>
        <div className="flex gap-2">
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost btn-sm flex-1"
          >
            <Navigation className="size-3.5" aria-hidden />
            Como Chegar
          </a>
          <button
            type="button"
            className="btn-ghost btn-sm flex-1"
            onClick={() => setContactNotice((value) => !value)}
          >
            <Phone className="size-3.5" aria-hidden />
            Falar Conosco
          </button>
        </div>
        {contactNotice ? (
          <DemoNotice>
            Não há canal de atendimento definido no projeto (nenhum telefone ou WhatsApp foi
            fornecido), então este botão não abre conversa. Informe o número na tela para ativá-lo.
          </DemoNotice>
        ) : null}
        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3 text-[11px] text-ink-muted">
          <ShieldCheck className="size-3.5 text-gold" aria-hidden />
          Formas de pagamento: Débito, Crédito, Dinheiro e PIX
          <a
            className="ml-auto flex items-center gap-1 font-medium text-ink-soft"
            href="https://instagram.com"
            target="_blank"
            rel="noreferrer"
          >
            <AtSign className="size-3.5" aria-hidden />
            @eleganceestudio
          </a>
        </div>
      </section>

      <section className="space-y-2 text-center">
        <InfoNote icon={Sparkles} title="EleganceStudio">
          Seu refúgio de beleza e cuidado premium. Serviços a partir de{' '}
          {formatBRL(Math.min(...services.map((service) => service.price)))}.
        </InfoNote>
        <Link
          to="/servicos"
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-gold"
        >
          Ver o menu completo de procedimentos
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </section>
    </div>
  )
}
