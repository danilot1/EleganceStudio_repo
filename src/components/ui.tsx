import { ImageIcon, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { IMAGE_SOURCES } from '../data/images'
import { initialsOf } from '../lib/format'
import { STATUS_LABEL, type AppointmentStatus } from '../lib/types'

export function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ')
}

/**
 * Renderiza a foto quando ela existe em `IMAGE_SOURCES`; caso contrário mostra um
 * placeholder elegante no mesmo lugar, sem quebrar o layout.
 */
export function Photo({
  imageKey,
  alt,
  className,
  caption,
}: {
  imageKey: string
  alt: string
  className?: string
  caption?: string
}) {
  const src = IMAGE_SOURCES[imageKey]
  if (src) {
    return <img src={src} alt={alt} className={cx('h-full w-full object-cover', className)} />
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className={cx(
        'grid h-full w-full place-items-center bg-[linear-gradient(135deg,var(--color-gold-tint),var(--color-surface-3)_55%,var(--color-surface-2))] text-gold/70',
        className,
      )}
    >
      <div className="flex flex-col items-center gap-1 px-3 text-center">
        <ImageIcon className="size-5" aria-hidden />
        {caption ? (
          <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-ink-muted">
            {caption}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function Avatar({
  name,
  accent,
  size = 'md',
  imageKey,
}: {
  name: string
  accent?: string
  size?: 'sm' | 'md' | 'lg'
  imageKey?: string
}) {
  const dimension = size === 'sm' ? 'size-8 text-[11px]' : size === 'lg' ? 'size-14 text-base' : 'size-11 text-[13px]'
  const src = imageKey ? IMAGE_SOURCES[imageKey] : undefined

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cx(dimension, 'shrink-0 rounded-full border border-line object-cover')}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cx(
        dimension,
        'grid shrink-0 place-items-center rounded-full border border-line font-semibold text-white',
      )}
      style={{ backgroundColor: accent ?? 'var(--color-gold)' }}
    >
      {initialsOf(name)}
    </span>
  )
}

const STATUS_CLASS: Record<AppointmentStatus, string> = {
  aguardando: 'bg-info-tint text-info',
  confirmado: 'bg-success-tint text-success',
  'em-atendimento': 'bg-gold text-white',
  concluido: 'bg-surface-3 text-ink-soft',
  cancelado: 'bg-danger-tint text-danger',
  faltou: 'bg-warn-tint text-warn',
}

export function StatusBadge({
  status,
  children,
  className,
}: {
  status: AppointmentStatus
  children?: ReactNode
  className?: string
}) {
  return (
    <span className={cx('badge', STATUS_CLASS[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children ?? STATUS_LABEL[status]}
    </span>
  )
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('eyebrow', className)}>{children}</p>
}

export function SectionHeading({
  icon: Icon,
  title,
  action,
}: {
  icon?: LucideIcon
  title: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-end justify-between gap-3 py-1">
      <h2 className="flex items-center gap-2 text-[19px] text-ink">
        {Icon ? <Icon className="size-4 text-gold" aria-hidden /> : null}
        {title}
      </h2>
      {action}
    </div>
  )
}

export function InfoNote({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex gap-3 rounded-[16px] border border-line bg-surface-2 p-3.5">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-surface text-gold">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="space-y-0.5">
        <p className="text-[13px] font-semibold text-ink">{title}</p>
        <p className="text-[12px] leading-relaxed text-ink-muted">{children}</p>
      </div>
    </div>
  )
}

/** Aviso honesto sobre o que é demonstração e não funciona de verdade. */
export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[14px] border border-dashed border-line-strong bg-surface px-3 py-2 text-[11px] leading-relaxed text-ink-muted">
      {children}
    </p>
  )
}

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
  progress,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
  progress?: number
}) {
  return (
    <div className="card gap-2 p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="eyebrow">{label}</p>
        <Icon className="size-3.5 text-gold/70" aria-hidden />
      </div>
      <p className="font-display text-[26px] leading-none text-ink">
        {value}
        {hint ? <span className="ml-1 text-[12px] text-ink-muted">{hint}</span> : null}
      </p>
      {typeof progress === 'number' ? (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-3">
          <div
            className="h-full rounded-full bg-gold"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null
  return (
    <p role="alert" className="text-[12px] font-medium text-danger">
      {children}
    </p>
  )
}

export function SuccessNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-[12px] bg-success-tint px-3 py-2 text-[12px] font-medium text-success">
      {children}
    </p>
  )
}
