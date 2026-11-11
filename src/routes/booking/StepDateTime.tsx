import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { SlotPicker, type SlotSelection } from '../../components/SlotPicker'
import { InfoNote } from '../../components/ui'
import { canPerform } from '../../data/catalog'
import { minutesToTime, shortDateLabel } from '../../lib/dates'
import { useAppState } from '../../state/AppState'
import { useBooking } from '../../state/BookingContext'
import { ProfessionalSummaryCard, ServiceSummaryCard } from './BookingSummary'

/** Etapa 3 — Data & Hora (tela enviada como print). */
export function StepDateTime() {
  const { draft, update } = useBooking()
  const { services } = useAppState()
  const navigate = useNavigate()
  // Catálogo vindo do estado: respeita a duração ajustada pela gestão.
  const service = services.find((item) => item.id === draft.serviceId)
  // Permite ver a grade antes de clicar: o horário só é gravado quando escolhido.
  const [selection, setSelection] = useState<SlotSelection | undefined>(
    draft.dateISO && draft.startMin !== undefined
      ? { dateISO: draft.dateISO, startMin: draft.startMin }
      : undefined,
  )

  if (!service || !draft.professionalId) return null
  // Profissional de outra categoria (o serviço foi trocado depois): volta à escolha.
  if (!canPerform(draft.professionalId, service.id)) return <Navigate to="/agendar/expert" replace />

  return (
    <div className="space-y-4">
      <ServiceSummaryCard serviceId={service.id} />
      <ProfessionalSummaryCard professionalId={draft.professionalId} />

      <SlotPicker
        professionalId={draft.professionalId}
        durationMin={service.durationMin}
        value={selection}
        onChange={(next) => {
          setSelection(next)
          update({ dateISO: next.dateISO, startMin: next.startMin })
        }}
      />

      <InfoNote icon={ShieldCheck} title="Garantia de Flexibilidade">
        Cancelamento ou reagendamento sem custo até 2 horas antes do atendimento.
      </InfoNote>

      <div className="sticky bottom-24 z-20 -mx-4 mt-2 border-t border-line bg-canvas/95 px-4 pb-2 pt-3 backdrop-blur">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Horário selecionado</p>
            <p className="text-[14px] font-semibold text-ink">
              {selection
                ? `${shortDateLabel(selection.dateISO).split(',')[0]} ${shortDateLabel(selection.dateISO).split(', ')[1]} às ${minutesToTime(selection.startMin)}`
                : 'Escolha um horário acima'}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn-primary mt-3 w-full"
          disabled={!selection}
          onClick={() => navigate('/agendar/revisao')}
        >
          Continuar para Revisão
          <ArrowRight className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
