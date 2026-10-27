import { Lock, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import type { UserRole } from '../lib/types'
import { DemoNotice } from './ui'

/**
 * Proteção de rota no lado do cliente.
 * ATENÇÃO: isto organiza a navegação, mas NÃO é segurança — sem servidor, qualquer
 * pessoa pode alterar o estado no navegador. Ver STATUS.md.
 */
export function RequireRole({
  role,
  children,
}: {
  role?: UserRole
  children: ReactNode
}) {
  const { session, logout } = useAppState()
  const location = useLocation()
  const navigate = useNavigate()

  if (!session) {
    return <Navigate to="/entrar" replace state={{ from: location.pathname }} />
  }

  if (role && session.role !== role) {
    return (
      <section className="card space-y-3 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-gold-tint text-gold">
          <Lock className="size-5" aria-hidden />
        </span>
        <h1 className="text-[21px] text-ink">Área restrita à gestão</h1>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Você está conectada como <span className="font-semibold text-ink">{session.name}</span>{' '}
          (perfil de cliente). O Painel Executivo é exclusivo da equipe do estúdio.
        </p>
        <button
          type="button"
          className="btn-outline btn-sm mx-auto"
          onClick={() => {
            logout()
            navigate('/entrar', { state: { from: '/painel' } })
          }}
        >
          <LogOut className="size-3.5" aria-hidden />
          Entrar com conta de gestão
        </button>
        <Link to="/" className="text-[12px] font-medium text-gold">
          Voltar para o início
        </Link>
        <DemoNotice>
          A verificação de perfil acontece só no navegador: não substitui autenticação real.
        </DemoNotice>
      </section>
    )
  }

  return <>{children}</>
}
