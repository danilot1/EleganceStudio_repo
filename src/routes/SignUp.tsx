import { ArrowRight, Gift, Lock, Mail, Phone, ShieldCheck, Sparkles, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthField, AuthShell } from '../components/AuthShell'
import { DemoNotice, FieldError, InfoNote } from '../components/ui'
import { maskPhone, passwordStrength } from '../lib/format'
import { useAppState } from '../state/AppState'

const STRENGTH_WIDTH = { fraca: '25%', regular: '50%', boa: '75%', forte: '100%' } as const

/** Tela "Crie sua Conta" — selo Novo cadastro. */
export function SignUp() {
  const { signUp } = useAppState()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const strength = passwordStrength(password)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (password !== confirm) {
      setError('As senhas não conferem.')
      return
    }
    if (!accepted) {
      setError('É necessário aceitar os Termos de Uso e a Política de Privacidade.')
      return
    }
    const result = signUp({ name, email, phone, password })
    if (!result.ok) {
      setError(result.error ?? 'Não foi possível criar a conta.')
      return
    }
    setError(null)
    navigate('/meus-agendamentos', { replace: true })
  }

  return (
    <AuthShell
      badge="Novo cadastro"
      title="Crie sua Conta"
      subtitle="Agende horários em segundos, receba lembretes no WhatsApp e desfrute de experiências exclusivas."
      footer={
        <div className="mt-5 space-y-3">
          <p className="text-center text-[13px] text-ink-soft">
            Já tem uma conta?{' '}
            <Link to="/entrar" className="font-semibold text-gold">
              Entrar
            </Link>
          </p>
          <div className="flex items-center justify-center gap-4 text-ink-muted">
            <Lock className="size-4" aria-hidden />
            <Sparkles className="size-3.5 text-gold-soft" aria-hidden />
            <ShieldCheck className="size-4" aria-hidden />
            <Sparkles className="size-3.5 text-gold-soft" aria-hidden />
            <Sparkles className="size-4" aria-hidden />
          </div>
          <DemoNotice>
            Cadastro local de demonstração: os dados ficam apenas neste navegador e a senha não é
            criptografada. Um sistema real precisa de back-end e hash de senha.
          </DemoNotice>
        </div>
      }
    >
      <div className="flex gap-3 rounded-[16px] border border-line bg-gold-tint/70 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-gold">
          <Gift className="size-5" aria-hidden />
        </span>
        <div>
          <p className="eyebrow">Benefício exclusivo</p>
          <p className="text-[13px] font-semibold leading-snug text-ink">
            10% de cortesia no primeiro agendamento
          </p>
          <p className="text-[11px] text-ink-muted">Válido para qualquer procedimento presencial.</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField
          id="signup-name"
          label="Nome completo"
          icon={<UserRound className="size-4" aria-hidden />}
          placeholder="Ex.: Mariana Silveira"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />

        <AuthField
          id="signup-phone"
          label="Telefone / WhatsApp"
          icon={<Phone className="size-4" aria-hidden />}
          inputMode="tel"
          placeholder="(11) 98765-4321"
          value={phone}
          onChange={(event) => setPhone(maskPhone(event.target.value))}
          hint="Para envio de avisos e lembretes de agenda."
          right={<span className="text-[11px] font-medium text-gold">Confirmação imediata</span>}
        />

        <AuthField
          id="signup-email"
          label="E-mail"
          icon={<Mail className="size-4" aria-hidden />}
          type="email"
          placeholder="mariana@exemplo.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <div>
          <AuthField
            id="signup-password"
            label="Senha"
            icon={<Lock className="size-4" aria-hidden />}
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            right={
              <button
                type="button"
                className="text-[11px] font-medium text-ink-muted"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            }
          />
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
              <div
                className="h-full rounded-full bg-gold transition-all"
                style={{ width: password ? STRENGTH_WIDTH[strength] : '0%' }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-ink-soft">
                Segurança:{' '}
                <span className="font-semibold capitalize text-ink">{password ? strength : '—'}</span>
              </span>
              <span className="text-ink-muted">Mínimo 8 caracteres</span>
            </div>
          </div>
        </div>

        <AuthField
          id="signup-confirm"
          label="Confirmar senha"
          icon={<Lock className="size-4" aria-hidden />}
          type={showPassword ? 'text' : 'password'}
          placeholder="Repita sua senha"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        <label className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-soft">
          <input
            type="checkbox"
            className="mt-0.5 size-4 accent-[var(--color-gold)]"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
          <span>
            Li e concordo com os <span className="font-semibold text-gold underline">Termos de Uso</span> e
            a <span className="font-semibold text-gold underline">Política de Privacidade</span> do
            EleganceStudio.
          </span>
        </label>

        <FieldError>{error}</FieldError>

        <button type="submit" className="btn-primary w-full">
          Criar minha conta
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </form>

      <InfoNote icon={ShieldCheck} title="Confirmação imediata">
        O telefone informado é a chave dos lembretes de agenda — que só existirão quando houver
        um serviço de mensagens integrado.
      </InfoNote>
    </AuthShell>
  )
}
