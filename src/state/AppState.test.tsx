import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addDaysISO, todayISO } from '../lib/dates'
import type { Appointment } from '../lib/types'
import { AppStateProvider, useAppState } from './AppState'

afterEach(cleanup)

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

function renderState() {
  return renderHook(() => useAppState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AppStateProvider>{children}</AppStateProvider>
    ),
  })
}

/** Cria um atendimento de balcão em um dia relativo a hoje e devolve o registro gravado. */
function createAtDaysFromToday(result: { current: ReturnType<typeof useAppState> }, days: number) {
  act(() => {
    result.current.createAppointment({
      serviceId: 'corte-visagismo',
      professionalId: 'simone',
      dateISO: addDaysISO(todayISO(), days),
      startMin: 16 * 60,
      durationMin: 30,
      price: 120,
      clientName: 'Cliente de Teste',
      origin: 'balcao',
      status: 'confirmado',
    })
  })
  const created = result.current.appointments.at(-1)
  if (!created) throw new Error('o atendimento não foi criado')
  return created as Appointment
}

describe('registro de falta no estado', () => {
  it('não deixa marcar falta de um atendimento futuro', () => {
    const { result } = renderState()
    const created = createAtDaysFromToday(result, 5)

    let outcome: ReturnType<typeof result.current.registerNoShow> | undefined
    act(() => {
      outcome = result.current.registerNoShow(created.id)
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.error).toMatch(/depois do horário marcado/)
    expect(result.current.appointments.find((item) => item.id === created.id)?.status).toBe(
      'confirmado',
    )
  })

  it('marca a falta de um atendimento passado e libera o horário', () => {
    const { result } = renderState()
    const created = createAtDaysFromToday(result, -10)

    act(() => {
      result.current.registerNoShow(created.id)
    })

    const updated = result.current.appointments.find((item) => item.id === created.id)
    expect(updated?.status).toBe('faltou')

    const stored = JSON.parse(
      window.localStorage.getItem('elegance-studio:v1') ?? '{"appointments":[]}',
    ) as { appointments: Appointment[] }
    expect(stored.appointments.find((item) => item.id === created.id)?.status).toBe('faltou')
  })

  it('não deixa marcar falta de atendimento já concluído', () => {
    const { result } = renderState()
    const created = createAtDaysFromToday(result, -10)

    act(() => {
      result.current.setAppointmentStatus(created.id, 'concluido')
    })
    let outcome: ReturnType<typeof result.current.registerNoShow> | undefined
    act(() => {
      outcome = result.current.registerNoShow(created.id)
    })

    expect(outcome?.ok).toBe(false)
    expect(result.current.appointments.find((item) => item.id === created.id)?.status).toBe(
      'concluido',
    )
  })
})
