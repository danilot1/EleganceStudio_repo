import {
  Bell,
  CalendarCheck,
  CalendarPlus,
  Home,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { firstNameOf } from '../lib/format'
import { useAppState } from '../state/AppState'
import { Avatar, DemoNotice, cx } from './ui'

/** Rótulo de contexto exibido sob a marca, como no protótipo. */
function contextFor(pathname: string): string {
  if (pathname.startsWith('/servicos')) return 'Menu de procedimentos'
  if (pathname.startsWith('/agendar')) return 'Agendar'
  if (pathname.startsWith('/meus-agendamentos')) return 'Meus agendamentos'
  return 'Início'
}

const NAV_ITEMS = [
  { to: '/', label: 'Início', icon: Home },
  { to: '/servicos', label: 'Serviços', icon: Sparkles },
  { to: '/agendar', label: 'Agendar', icon: CalendarPlus, highlight: true },
  { to: '/meus-agendamentos', label: 'Agenda', icon: CalendarCheck },
  { to: '/painel', label: 'Gestão', icon: ShieldCheck },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-canvas/95 backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-[560px] items-stretch justify-between px-2 py-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon, highlight }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex flex-col items-center gap-1 rounded-[14px] px-1 py-1.5 text-[10px] font-medium tracking-wide transition-colors',
                  isActive ? 'text-gold' : 'text-ink-muted hover:text-ink-soft',
                  highlight && isActive && 'text-gold',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cx(
                      'grid size-8 place-items-center rounded-full transition-colors',
                      highlight ? 'bg-gold text-white' : isActive ? 'bg-gold-tint text-gold' : 'text-current',
                    )}
                  >
                    <Icon className="size-[18px]" aria-hidden />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/**
 * Monograma do cartão do estúdio: "E" em capitais romanas dentro de um duplo
 * anel dourado.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'relative grid size-9 shrink-0 place-items-center rounded-full border border-gold/45 bg-gold-tint/60',
        className,
      )}
      aria-hidden
    >
      <span className="absolute inset-[2px] rounded-full border border-gold/20" />
      <span className="brand-wordmark text-[16px] leading-none">E</span>
    </span>
  )
}

/** Wordmark EMPILHADO: ELEGANCE sobre STUDIO, como no cartão. */
export function BrandWordmark() {
  return (
    <span className="flex flex-col">
      <span className="brand-wordmark">Elegance</span>
      <span className="brand-sub">Studio</span>
    </span>
  )
}

export function TopBar({ context }: { context?: string }) {
  const { session, logout } = useAppState()
  const navigate = useNavigate()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAccount, setShowAccount] = useState(false)

  return (
    <header className="relative border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[560px] items-center gap-3 px-4 py-3">
        <BrandMark />
        <div className="min-w-0 flex-1">
          <BrandWordmark />
          <p className="eyebrow mt-1 truncate">{context}</p>
        </div>

        <button
          type="button"
          className="icon-btn"
          aria-label="Notificações"
          aria-expanded={showNotifications}
          onClick={() => {
            setShowNotifications((value) => !value)
            setShowAccount(false)
          }}
        >
          <Bell className="size-[18px]" aria-hidden />
        </button>

        <button
          type="button"
          className="rounded-full"
          aria-label="Conta"
          aria-expanded={showAccount}
          onClick={() => {
            setShowAccount((value) => !value)
            setShowNotifications(false)
          }}
        >
          {session ? (
            <Avatar name={session.name} size="sm" imageKey="clientAvatar" />
          ) : (
            <span className="icon-btn">
              <LogIn className="size-[18px]" aria-hidden />
            </span>
          )}
        </button>
      </div>

      {showNotifications ? (
        <div className="mx-auto w-full max-w-[560px] px-4 pb-3">
          <DemoNotice>
            Lembretes por WhatsApp e notificações push ainda não existem: dependem de um serviço
            de mensagens. Nada é enviado.
          </DemoNotice>
        </div>
      ) : null}

      {showAccount ? (
        <div className="mx-auto w-full max-w-[560px] px-4 pb-3">
          <div className="card space-y-3">
            {session ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={session.name} imageKey="clientAvatar" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold text-ink">{session.name}</p>
                    <p className="truncate text-[12px] text-ink-muted">{session.email}</p>
                    <p className="eyebrow mt-0.5">
                      {session.role === 'admin' ? 'Gestão' : 'Cliente'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <NavLink to="/meus-agendamentos" className="btn-ghost btn-sm flex-1">
                    Meus agendamentos
                  </NavLink>
                  <button
                    type="button"
                    className="btn-outline btn-sm flex-1"
                    onClick={() => {
                      void logout().then(() => {
                        setShowAccount(false)
                        navigate('/')
                      })
                    }}
                  >
                    <LogOut className="size-3.5" aria-hidden />
                    Sair
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-[13px] text-ink-soft">
                  Você não está conectada. Entre para ver seus agendamentos e histórico.
                </p>
                <div className="flex gap-2">
                  <NavLink to="/entrar" className="btn-primary btn-sm flex-1">
                    Entrar
                  </NavLink>
                  <NavLink to="/criar-conta" className="btn-ghost btn-sm flex-1">
                    Criar conta
                  </NavLink>
                </div>
              </>
            )}
            <p className="text-[11px] leading-relaxed text-ink-muted">
              Olá{ session ? `, ${firstNameOf(session.name)}` : ''} — a sessão é gerenciada pelo
              Firebase Authentication e os agendamentos ficam no Firestore.
            </p>
          </div>
        </div>
      ) : null}
    </header>
  )
}

/** Moldura das telas do cliente e da gestão: topo + conteúdo + barra inferior. */
export function ClientShell() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh bg-canvas pb-24">
      <TopBar context={contextFor(pathname)} />
      <main className="mx-auto w-full max-w-[560px] px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
