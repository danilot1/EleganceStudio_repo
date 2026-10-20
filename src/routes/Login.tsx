import { ArrowRight, Globe, Lock, Mail, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AuthField, AuthShell } from '../components/AuthShell'
import { DemoNotice, FieldError, InfoNote, Photo } from '../components/ui'
import { useAppState } from '../state/AppState'

/** Tela "Entrar na Conta" — selo Atendimento Privé. */
export function Login() {
  const { login } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [oauthNotice, setOauthNotice] = useState(false)

  const from = (location.state as { from?: string } | null)?.from

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = login(email, password, remember)
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível entrar.')
      return
    }
    setError(null)
    navigate(from ?? '/meus-agendamentos', { replace: true })
  }

  return (
    <AuthShell
      badge="Atendimento privé"
      showHelp
      title="EleganceStudio"
      subtitle="Bem-vindo ao seu refúgio de beleza"
      footer={
        <div className="mt-5 space-y-2 text-center">
          <InfoNote icon={ShieldCheck} title="Ambiente seguro EleganceStudio">
            Seus dados e preferências preservados sob absoluto sigilo.
          </InfoNote>
          <DemoNotice>
            O login desta demonstração é local: as contas ficam no próprio navegador, sem
            servidor de autenticação. A senha não é criptografada.
          </DemoNotice>
        </div>
      }
    >
      <section className="relative h-36 overflow-hidden rounded-[18px] border border-line">
        <Photo imageKey="loginHero" alt="Ambiente do estúdio" caption="Foto do protótipo" />
        <span className="absolute bottom-3 left-3 badge bg-ink/70 text-white">
          Experiência personalizada • Membro VIP
        </span>
      </section>

      <form className="card space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-[21px] text-ink">Acessar Conta</h2>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            Acesse seus agendamentos exclusivos, histórico de atendimentos e benefícios VIP.
          </p>
        </div>

        <AuthField
          id="login-email"
          label="E-mail"
          icon={<Mail className="size-4" aria-hidden />}
          type="email"
          autoComplete="email"
          placeholder="seuemail@exemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <AuthField
          id="login-password"
          label="Senha"
          icon={<Lock className="size-4" aria-hidden />}
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha secreta"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          right={
            <Link to="/recuperar-senha" className="text-[11px] font-medium text-gold">
              Esqueceu sua senha?
            </Link>
          }
        />

        <label className="flex items-center gap-2 text-[12px] text-ink-soft">
          <input
            type="checkbox"
            className="size-4 accent-[var(--color-gold)]"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
          Lembrar-me neste dispositivo
        </label>

        <FieldError>{error}</FieldError>

        <button type="submit" className="btn-primary w-full">
          Entrar na conta
          <ArrowRight className="size-4" aria-hidden />
        </button>

        <div className="flex items-center gap-3">
          <span className="section-rule" />
          <span className="eyebrow shrink-0">ou continue com</span>
          <span className="section-rule" />
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="btn-ghost btn-sm flex-1"
            onClick={() => setOauthNotice(true)}
          >
            Apple
          </button>
          <button
            type="button"
            className="btn-ghost btn-sm flex-1"
            onClick={() => setOauthNotice(true)}
          >
            <Globe className="size-3.5" aria-hidden />
            Google
          </button>
        </div>

        {oauthNotice ? (
          <DemoNotice>
            Entrar com Apple ou Google exige integração OAuth com um provedor de identidade,
            que não faz parte deste projeto. Os botões não autenticam.
          </DemoNotice>
        ) : null}
      </form>

      <section className="card flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-ink">Nova por aqui?</p>
          <p className="text-[12px] leading-relaxed text-ink-muted">
            Ainda não possui uma conta exclusiva? Cadastre-se em segundos.
          </p>
        </div>
        <Link to="/criar-conta" className="btn-primary btn-sm shrink-0">
          Cadastre-se
        </Link>
      </section>

      <section className="card space-y-2">
        <p className="eyebrow">Acesso de demonstração</p>
        <p className="text-[12px] leading-relaxed text-ink-muted">
          Contas criadas automaticamente para testar o sistema:
        </p>
        <div className="space-y-1.5 text-[12px]">
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-[12px] border border-line bg-surface-2 px-3 py-2 text-left"
            onClick={() => {
              setEmail('mariana@exemplo.com')
              setPassword('elegance123')
            }}
          >
            <span>
              <span className="font-semibold text-ink">Cliente</span>
              <br />
              mariana@exemplo.com
            </span>
            <span className="badge bg-gold-tint text-gold">usar</span>
          </button>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-[12px] border border-line bg-surface-2 px-3 py-2 text-left"
            onClick={() => {
              setEmail('gestao@elegance.com')
              setPassword('elegance123')
            }}
          >
            <span>
              <span className="font-semibold text-ink">Gestão (admin)</span>
              <br />
              gestao@elegance.com
            </span>
            <span className="badge bg-gold-tint text-gold">usar</span>
          </button>
        </div>
        <p className="text-[11px] text-ink-muted">Senha das duas contas: elegance123</p>
      </section>
    </AuthShell>
  )
}
