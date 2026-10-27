import { ArrowRight, Headphones, Lock, Mail, MessageCircle } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AuthField, AuthShell } from '../components/AuthShell'
import { DemoNotice, FieldError, InfoNote, SuccessNote, cx } from '../components/ui'
import { useAppState } from '../state/AppState'

type Channel = 'email' | 'whatsapp'

/** Tela "Recuperar Senha" — selo Segurança & Acesso. */
export function ForgotPassword() {
  const { requestPasswordReset } = useAppState()
  const [channel, setChannel] = useState<Channel>('email')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = requestPasswordReset(value)
    if (!result.ok) {
      setFound(false)
      setError(result.error ?? 'Não foi possível verificar o contato.')
      return
    }
    setError(null)
    setFound(true)
  }

  return (
    <AuthShell
      badge="Segurança & acesso"
      title="Recuperar Senha"
      subtitle="Informe seu e-mail cadastrado ou WhatsApp para receber as instruções e o código de redefinição de acesso."
      footer={
        <div className="mt-5 space-y-3">
          <p className="text-center text-[13px] text-ink-soft">
            Lembrou sua senha?{' '}
            <Link to="/entrar" className="font-semibold text-gold">
              Voltar para o Login
            </Link>
          </p>
          <p className="flex items-center justify-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            <Lock className="size-3.5" aria-hidden />
            Ambiente seguro EleganceStudio
          </p>
        </div>
      }
    >
      <InfoNote icon={Lock} title="Instruções rápidas">
        Enviaremos um link seguro válido por 30 minutos para você redefinir sua credencial com
        tranquilidade.
      </InfoNote>

      <div className="flex gap-2">
        <button
          type="button"
          className={cx('chip flex-1 justify-center', channel === 'email' && 'chip-active')}
          aria-pressed={channel === 'email'}
          onClick={() => {
            setChannel('email')
            setValue('')
            setFound(false)
          }}
        >
          <Mail className="size-3.5" aria-hidden />
          Por e-mail
        </button>
        <button
          type="button"
          className={cx('chip flex-1 justify-center', channel === 'whatsapp' && 'chip-active')}
          aria-pressed={channel === 'whatsapp'}
          onClick={() => {
            setChannel('whatsapp')
            setValue('')
            setFound(false)
          }}
        >
          <MessageCircle className="size-3.5" aria-hidden />
          WhatsApp
        </button>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <AuthField
          id="recover-value"
          label={channel === 'email' ? 'E-mail cadastrado' : 'WhatsApp cadastrado'}
          icon={
            channel === 'email' ? (
              <Mail className="size-4" aria-hidden />
            ) : (
              <MessageCircle className="size-4" aria-hidden />
            )
          }
          type={channel === 'email' ? 'email' : 'tel'}
          placeholder={channel === 'email' ? 'mariana@exemplo.com' : '(11) 98765-4321'}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          hint={
            channel === 'email'
              ? 'Certifique-se de que é o mesmo e-mail utilizado na criação da sua conta.'
              : 'Use o mesmo número informado no cadastro.'
          }
        />

        <FieldError>{error}</FieldError>

        <button type="submit" className="btn-primary w-full">
          Enviar instruções de recuperação
          <ArrowRight className="size-4" aria-hidden />
        </button>

        {found ? (
          <div className="space-y-2">
            <SuccessNote>
              Conta encontrada. As instruções seriam enviadas por{' '}
              {channel === 'email' ? 'e-mail' : 'WhatsApp'}.
            </SuccessNote>
            <DemoNotice>
              Nada foi enviado de verdade: este protótipo não tem servidor de e-mail nem
              integração com WhatsApp. A tela valida o contato no cadastro local e para por aí.
            </DemoNotice>
          </div>
        ) : null}
      </form>

      <div className="space-y-2">
        <p className="eyebrow text-center">ou precisa de ajuda?</p>
        <button type="button" className="btn-ghost w-full text-[12px]" disabled>
          <Headphones className="size-4" aria-hidden />
          Falar com o concierge da recepção
        </button>
        <DemoNotice>
          O contato direto com a recepção não está disponível porque nenhum telefone, WhatsApp ou
          e-mail do estúdio foi definido no projeto.
        </DemoNotice>
      </div>
    </AuthShell>
  )
}
