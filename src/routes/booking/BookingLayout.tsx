import { useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Stepper, type StepDefinition } from '../../components/Stepper'
import { DemoNotice } from '../../components/ui'
import { useBooking } from '../../state/BookingContext'

export const BOOKING_STEPS: StepDefinition[] = [
  { id: 'servico', label: 'Serviço', to: '/agendar/servico' },
  { id: 'expert', label: 'Expert', to: '/agendar/expert' },
  { id: 'horario', label: 'Data & Hora', to: '/agendar/horario' },
  { id: 'revisao', label: 'Revisão', to: '/agendar/revisao' },
]

export function bookingStepIndex(pathname: string): number {
  const index = BOOKING_STEPS.findIndex((step) => pathname.endsWith(step.id))
  return index === -1 ? 0 : index
}

/**
 * Moldura das 4 etapas. Protege o fluxo: sem serviço escolhido não faz sentido abrir as
 * etapas seguintes, e voltar para uma etapa anterior limpa as decisões posteriores
 * (trocar o serviço reinicia o horário, porque a duração muda).
 */
export function BookingLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { draft, ready, clearFrom } = useBooking()
  const isConfirmation = pathname.endsWith('confirmado')
  const index = bookingStepIndex(pathname)

  useEffect(() => {
    if (!ready || isConfirmation) return
    if (!draft.serviceId && index > 0) navigate('/agendar/servico', { replace: true })
    if (draft.serviceId && !draft.professionalId && index > 1) {
      navigate('/agendar/expert', { replace: true })
    }
    if (draft.serviceId && draft.professionalId && !draft.dateISO && index > 2) {
      navigate('/agendar/horario', { replace: true })
    }
  }, [ready, isConfirmation, draft, index, navigate])

  if (isConfirmation) return <Outlet />

  return (
    <div className="space-y-5">
      <Stepper
        steps={BOOKING_STEPS}
        currentIndex={index}
        onNavigate={(step, stepIndex) => {
          if (stepIndex >= index) return
          if (step.id === 'servico') clearFrom('service')
          if (step.id === 'expert') clearFrom('professional')
          if (step.id === 'horario') clearFrom('datetime')
          navigate(step.to)
        }}
      />
      <Outlet />
      {index === 3 ? (
        <DemoNotice>
          A confirmação grava o agendamento no Firestore e ele passa a aparecer na agenda da
          gestão. Nenhuma mensagem é enviada à cliente.
        </DemoNotice>
      ) : null}
    </div>
  )
}
