import { ArrowLeft, HelpCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from './ClientShell'

/**
 * Moldura das telas de acesso (Entrar, Criar conta, Recuperar senha).
 * No protótipo elas não têm a barra de navegação inferior, por isso ficam fora do
 * ClientShell.
 */
export function AuthShell({
  badge,
  title,
  subtitle,
  children,
  footer,
  showHelp,
}: {
  badge: string
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
  showHelp?: boolean
}) {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto w-full max-w-[560px] px-4 pb-10 pt-4">
        <header className="flex items-center justify-between gap-3 pb-5">
          <button type="button" className="icon-btn" aria-label="Voltar" onClick={() => navigate(-1)}>
            <ArrowLeft className="size-[18px]" aria-hidden />
          </button>
          <span className="badge bg-gold-tint px-3 py-1.5 text-gold">{badge}</span>
          {showHelp ? (
            <span className="icon-btn" aria-hidden>
              <HelpCircle className="size-[18px]" />
            </span>
          ) : (
            <span className="size-9" aria-hidden />
          )}
        </header>

        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <span className="grid size-12 place-items-center rounded-[14px] border border-line bg-surface">
              <BrandMark />
            </span>
          </div>
          <div className="space-y-1.5">
            <h1 className="text-[27px] leading-tight text-ink">{title}</h1>
            <p className="text-[12px] leading-relaxed text-ink-muted">{subtitle}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">{children}</div>
        {footer}
      </div>
    </div>
  )
}

/** Campos de formulário com ícone à esquerda, como no protótipo. */
export function AuthField({
  id,
  label,
  icon,
  hint,
  right,
  ...inputProps
}: {
  id: string
  label: string
  icon: ReactNode
  hint?: ReactNode
  right?: ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label className="field-label mb-0" htmlFor={id}>
          {label}
        </label>
        {right}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
          {icon}
        </span>
        <input id={id} className="field-input pl-10" {...inputProps} />
      </div>
      {hint ? <p className="mt-1.5 text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  )
}
