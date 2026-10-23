import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addDaysISO, todayISO } from '../lib/dates'
import { fakeAppointments, fakeSignInAs, resetFakeBackend } from '../test/fakeBackend'
import { AppStateProvider, useAppState } from './AppState'

vi.mock('../lib/backend', async () => {
  const { fakeBackend } = await import('../test/fakeBackend')
  return { backend: fakeBackend }
})

afterEach(cleanup)

beforeEach(() => {
  resetFakeBackend()
  // Criar atendimento exige sessão, como no Firestore (as regras exigem login).
  fakeSignInAs('admin')
})

async function renderState() {
  const view = renderHook(() => useAppState(), {
    wrapper: ({ children }: { children: ReactNode }) => (
      <AppStateProvider>{children}</AppStateProvider>
    ),
  })
  await waitFor(() => expect(view.result.current.ready).toBe(true))
  return view
}

/** Cria um atendimento de balcão em um dia relativo a hoje e devolve o registro gravado. */
async function createAtDaysFromToday(
  result: { current: ReturnType<typeof useAppState> },
  days: number,
) {
  await act(async () => {
    await result.current.createAppointment({
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
  // A agenda de exemplo tem registros em datas mais distantes, então o criado não é
  // necessariamente o último da lista: procura pelo nome usado no teste.
  const created = result.current.appointments.find(
    (item) => item.clientName === 'Cliente de Teste',
  )
  if (!created) throw new Error('o atendimento não foi criado')
  return created
}

describe('registro de falta no estado', () => {
  it('não deixa marcar falta de um atendimento futuro', async () => {
    const { result } = await renderState()
    const created = await createAtDaysFromToday(result, 5)

    let outcome: Awaited<ReturnType<typeof result.current.registerNoShow>> | undefined
    await act(async () => {
      outcome = await result.current.registerNoShow(created.id)
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.error).toMatch(/depois do horário marcado/)
    expect(result.current.appointments.find((item) => item.id === created.id)?.status).toBe(
      'confirmado',
    )
  })

  it('marca a falta de um atendimento passado e grava no banco', async () => {
    const { result } = await renderState()
    const created = await createAtDaysFromToday(result, -10)

    await act(async () => {
      await result.current.registerNoShow(created.id)
    })

    expect(
      result.current.appointments.find((item) => item.id === created.id)?.status,
    ).toBe('faltou')
    expect(fakeAppointments().find((item) => item.id === created.id)?.status).toBe('faltou')
  })

  it('não deixa marcar falta de atendimento já concluído', async () => {
    const { result } = await renderState()
    const created = await createAtDaysFromToday(result, -10)

    await act(async () => {
      await result.current.setAppointmentStatus(created.id, 'concluido')
    })

    let outcome: Awaited<ReturnType<typeof result.current.registerNoShow>> | undefined
    await act(async () => {
      outcome = await result.current.registerNoShow(created.id)
    })

    expect(outcome?.ok).toBe(false)
    expect(result.current.appointments.find((item) => item.id === created.id)?.status).toBe(
      'concluido',
    )
  })
})
