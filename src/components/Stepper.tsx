import { Check } from 'lucide-react'
import { cx } from './ui'

export interface StepDefinition {
  id: string
  label: string
  to: string
}

/** Stepper de 4 etapas do fluxo de agendamento (Serviço › Expert › Data & Hora › Revisão). */
export function Stepper({
  steps,
  currentIndex,
  onNavigate,
}: {
  steps: StepDefinition[]
  currentIndex: number
  /** Só permite voltar para etapas já concluídas. */
  onNavigate?: (step: StepDefinition, index: number) => void
}) {
  return (
    <ol className="flex items-start justify-between gap-1" aria-label="Etapas do agendamento">
      {steps.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const clickable = Boolean(onNavigate) && done

        return (
          <li key={step.id} className="flex flex-1 flex-col items-center gap-1.5 text-center">
            <button
              type="button"
              disabled={!clickable}
              onClick={() => clickable && onNavigate?.(step, index)}
              aria-current={active ? 'step' : undefined}
              className={cx(
                'grid size-9 place-items-center rounded-full border text-[13px] font-semibold transition-colors',
                done && 'border-gold bg-gold text-white',
                active && 'border-gold bg-gold-tint text-gold',
                !done && !active && 'border-line bg-surface text-ink-muted',
                clickable && 'cursor-pointer',
              )}
            >
              {done ? <Check className="size-4" aria-hidden /> : index + 1}
            </button>
            <span
              className={cx(
                'text-[10px] font-medium leading-tight',
                active ? 'text-gold' : 'text-ink-muted',
              )}
            >
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
