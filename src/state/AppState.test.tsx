import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addDaysISO, fromISODate, todayISO } from '../lib/dates'
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

/**
 * Dia útil próximo: domingo não tem expediente e sábado fecha às 14h, então os testes
 * usam segunda a sexta para não dependerem do dia em que a suíte rodar.
 */
function weekdayISO(days: number): string {
  const direction = days >= 0 ? 1 : -1
  let iso = addDaysISO(todayISO(), days)
  while ([0, 6].includes(fromISODate(iso).getDay())) iso = addDaysISO(iso, direction)
  return iso
}

const BASE_INPUT = {
  serviceId: 'corte-visagismo',
  professionalId: 'simone',
  startMin: 16 * 60,
  durationMin: 30,
  price: 120,
  clientName: 'Cliente de Teste',
  status: 'confirmado' as const,
  origin: 'balcao' as const,
}

/** Cria um atendimento de balcão em um dia relativo a hoje e devolve o registro gravado. */
function createAtDaysFromToday(result: { current: ReturnType<typeof useAppState> }, days: number) {
  act(() => {
    result.current.createAppointment({ ...BASE_INPUT, dateISO: weekdayISO(days) })
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

describe('conflito de horários', () => {
  it('recusa o segundo agendamento no mesmo horário da mesma profissional', () => {
    const { result } = renderState()
    const dateISO = weekdayISO(6)

    let first: ReturnType<typeof result.current.createAppointment> | undefined
    let second: ReturnType<typeof result.current.createAppointment> | undefined

    act(() => {
      first = result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'camila',
        dateISO,
        startMin: 10 * 60,
        durationMin: 60,
        clientName: 'Primeira Cliente',
      })
    })
    act(() => {
      second = result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'camila',
        dateISO,
        startMin: 10 * 60 + 30,
        durationMin: 30,
        clientName: 'Segunda Cliente',
      })
    })

    expect(first?.ok).toBe(true)
    expect(second?.ok).toBe(false)
    expect(second?.error).toMatch(/ocupado/)
    expect(
      result.current.appointments.filter(
        (item) => item.dateISO === dateISO && item.professionalId === 'camila',
      ),
    ).toHaveLength(1)
  })

  it('permite o mesmo horário para profissionais diferentes', () => {
    const { result } = renderState()
    const dateISO = weekdayISO(6)

    let a: ReturnType<typeof result.current.createAppointment> | undefined
    let b: ReturnType<typeof result.current.createAppointment> | undefined

    act(() => {
      a = result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'camila',
        dateISO,
        startMin: 10 * 60,
        durationMin: 60,
      })
    })
    act(() => {
      b = result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'juliana',
        dateISO,
        startMin: 10 * 60,
        durationMin: 60,
      })
    })

    expect(a?.ok).toBe(true)
    expect(b?.ok).toBe(true)
  })

  it('recusa atendimento que terminaria depois do fechamento', () => {
    const { result } = renderState()
    const dateISO = weekdayISO(6)
    const startMin = 18 * 60 + 30
    let outcome: ReturnType<typeof result.current.createAppointment> | undefined
    act(() => {
      outcome = result.current.createAppointment({
        ...BASE_INPUT,
        dateISO,
        startMin,
        durationMin: 90,
      })
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.error).toMatch(/expediente/)
    expect(
      result.current.appointments.filter(
        (item) => item.dateISO === dateISO && item.startMin === startMin,
      ),
    ).toHaveLength(0)
  })
})
