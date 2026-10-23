import { Lock, LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAppState } from '../state/AppState'
import type { UserRole } from '../lib/types'
import { DemoNotice } from './ui'

/**
 * Proteção de rota.
 *
 * O papel (cliente/gestão) vem do documento `users/{uid}` no Firestore, e as regras de
 * segurança repetem essa checagem no servidor: esconder a tela aqui é navegação, não
 * a única barreira. Ver `firestore.rules`.
 */
export function RequireRole({
  role,
  children,
}: {
  role?: UserRole
  children: ReactNode
}) {
  const { session, ready, logout } = useAppState()
  const location = useLocation()
  const navigate = useNavigate()

  // Enquanto o Firebase não responde quem está conectado, não dá para decidir nada:
  // redirecionar aqui mandaria para o login toda sessão válida ao recarregar a página.
  if (!ready) {
    return (
      <section className="card space-y-1" aria-busy="true">
        <p className="eyebrow">Conectando</p>
        <p className="text-[13px] text-ink-muted">Verificando sua sessão no Firebase…</p>
      </section>
    )
  }

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
            void logout().then(() => navigate('/entrar', { state: { from: '/painel' } }))
          }}
        >
          <LogOut className="size-3.5" aria-hidden />
          Entrar com conta de gestão
        </button>
        <Link to="/" className="text-[12px] font-medium text-gold">
          Voltar para o início
        </Link>
        <DemoNotice>
          O perfil de gestão é o campo role = "admin" no documento do usuário no Firestore. Sem
          esse campo, a conta entra como cliente — inclusive aqui.
        </DemoNotice>
      </section>
    )
  }

  return <>{children}</>
}
