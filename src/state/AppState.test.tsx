import { act, cleanup, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addDaysISO, fromISODate, todayISO } from '../lib/dates'
import { buildMail } from '../lib/notifications'
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

type State = ReturnType<typeof useAppState>
type Created = Awaited<ReturnType<State['createAppointment']>>
type Outcome = Awaited<ReturnType<State['registerNoShow']>>

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
  serviceId: 'podologia-procedimento-basico',
  professionalId: 'simone',
  startMin: 16 * 60,
  durationMin: 30,
  price: 120,
  clientName: 'Cliente de Teste',
  status: 'confirmado' as const,
  origin: 'balcao' as const,
}

/**
 * Cria um atendimento de balcão em um dia relativo a hoje e devolve o registro gravado.
 * As operações da camada de dados são assíncronas (o Firestore é), então tudo passa por
 * `act` assíncrono — do contrário a asserção rodaria antes da gravação.
 */
async function createAtDaysFromToday(result: { current: State }, days: number) {
  await act(async () => {
    await result.current.createAppointment({ ...BASE_INPUT, dateISO: weekdayISO(days) })
  })
  const created = result.current.appointments.at(-1)
  if (!created) throw new Error('o atendimento não foi criado')
  return created as Appointment
}

describe('registro de falta no estado', () => {
  it('não deixa marcar falta de um atendimento futuro', async () => {
    const { result } = renderState()
    const created = await createAtDaysFromToday(result, 5)

    let outcome: Outcome | undefined
    await act(async () => {
      outcome = await result.current.registerNoShow(created.id)
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.error).toMatch(/depois do horário marcado/)
    expect(result.current.appointments.find((item) => item.id === created.id)?.status).toBe(
      'confirmado',
    )
  })

  it('marca a falta de um atendimento passado e libera o horário', async () => {
    const { result } = renderState()
    const created = await createAtDaysFromToday(result, -10)

    await act(async () => {
      await result.current.registerNoShow(created.id)
    })

    const updated = result.current.appointments.find((item) => item.id === created.id)
    expect(updated?.status).toBe('faltou')

    const stored = JSON.parse(
      window.localStorage.getItem('elegance-studio:v1') ?? '{"appointments":[]}',
    ) as { appointments: Appointment[] }
    expect(stored.appointments.find((item) => item.id === created.id)?.status).toBe('faltou')
  })

  it('não deixa marcar falta de atendimento já concluído', async () => {
    const { result } = renderState()
    const created = await createAtDaysFromToday(result, -10)

    await act(async () => {
      await result.current.setAppointmentStatus(created.id, 'concluido')
    })
    let outcome: Outcome | undefined
    await act(async () => {
      outcome = await result.current.registerNoShow(created.id)
    })

    expect(outcome?.ok).toBe(false)
    expect(result.current.appointments.find((item) => item.id === created.id)?.status).toBe(
      'concluido',
    )
  })
})

describe('conflito de horários', () => {
  it('recusa o segundo agendamento no mesmo horário da mesma profissional', async () => {
    const { result } = renderState()
    const dateISO = weekdayISO(6)

    let first: Created | undefined
    let second: Created | undefined

    await act(async () => {
      first = await result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'cris',
        dateISO,
        startMin: 10 * 60,
        durationMin: 60,
        clientName: 'Primeira Cliente',
      })
    })
    await act(async () => {
      second = await result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'cris',
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
        (item) => item.dateISO === dateISO && item.professionalId === 'cris',
      ),
    ).toHaveLength(1)
  })

  it('permite o mesmo horário para profissionais diferentes', async () => {
    const { result } = renderState()
    const dateISO = weekdayISO(6)

    let a: Created | undefined
    let b: Created | undefined

    await act(async () => {
      a = await result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'cris',
        dateISO,
        startMin: 10 * 60,
        durationMin: 60,
      })
    })
    await act(async () => {
      b = await result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'beatriz',
        dateISO,
        startMin: 10 * 60,
        durationMin: 60,
      })
    })

    expect(a?.ok).toBe(true)
    expect(b?.ok).toBe(true)
  })

  it('recusa atendimento que terminaria depois do fechamento', async () => {
    const { result } = renderState()
    const dateISO = weekdayISO(6)
    const startMin = 18 * 60 + 30
    let outcome: Created | undefined
    await act(async () => {
      outcome = await result.current.createAppointment({
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

describe('avisos por e-mail', () => {
  it('guarda o e-mail informado no agendamento de convidada', async () => {
    const { result } = renderState()

    let created: Created | undefined
    await act(async () => {
      created = await result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'beatriz',
        dateISO: weekdayISO(6),
        startMin: 17 * 60,
        clientName: 'Convidada Sem Conta',
        clientEmail: 'convidada@exemplo.com',
      })
    })

    expect(created?.ok).toBe(true)
    expect(created?.appointment?.clientEmail).toBe('convidada@exemplo.com')
    // O endereço fica no atendimento: é dele que sai o lembrete de véspera.
    expect(
      result.current.appointments.find((item) => item.id === created?.appointment?.id)
        ?.clientEmail,
    ).toBe('convidada@exemplo.com')
  })

  it('não registra o mesmo aviso duas vezes quando o pedido tem id fixo', async () => {
    const { result } = renderState()

    let created: Created | undefined
    await act(async () => {
      created = await result.current.createAppointment({
        ...BASE_INPUT,
        professionalId: 'beatriz',
        dateISO: weekdayISO(6),
        startMin: 17 * 60 + 30,
        clientName: 'Cliente do Lembrete',
      })
    })
    const appointment = created?.appointment
    expect(appointment).toBeDefined()

    const draft = buildMail({
      kind: 'lembrete',
      appointment: appointment!,
      to: 'lembrete@exemplo.com',
    })
    const id = `lembrete-${appointment!.id}`

    await act(async () => {
      await result.current.queueMail({ ...draft, id })
      await result.current.queueMail({ ...draft, id })
    })

    expect(result.current.outbox.filter((mail) => mail.id === id)).toHaveLength(1)
  })
})

describe('gestão de serviços', () => {
  it('aplica duração e preço novos ao catálogo em uso', async () => {
    const { result } = renderState()

    let outcome: Awaited<ReturnType<State['updateService']>> | undefined
    await act(async () => {
      outcome = await result.current.updateService('mao', {
        durationMin: 60,
        price: 90,
      })
    })

    expect(outcome?.ok).toBe(true)
    const active = result.current.services.find((item) => item.id === 'mao')
    expect(active?.durationMin).toBe(60)
    expect(active?.price).toBe(90)
    expect(
      result.current.allServices.find((item) => item.id === 'mao')?.durationMin,
    ).toBe(60)
  })

  it('preço em branco volta o serviço para "Sob consulta"', async () => {
    const { result } = renderState()
    expect(result.current.services.find((item) => item.id === 'mao')?.price).toBeUndefined()

    await act(async () => {
      await result.current.updateService('mao', { price: 60 })
    })
    expect(result.current.services.find((item) => item.id === 'mao')?.price).toBe(60)

    await act(async () => {
      await result.current.updateService('mao', { price: null })
    })
    expect(result.current.services.find((item) => item.id === 'mao')?.price).toBeUndefined()
  })

  it('recusa duração fora do permitido', async () => {
    const { result } = renderState()

    let outcome: Awaited<ReturnType<State['updateService']>> | undefined
    await act(async () => {
      outcome = await result.current.updateService('mao', { durationMin: 7 })
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.error).toMatch(/entre 15 e 240/)
    expect(
      result.current.services.find((item) => item.id === 'mao')?.durationMin,
    ).toBe(40)
  })

  it('tira do catálogo o serviço desativado, mantendo o registro para a gestão', async () => {
    const { result } = renderState()

    await act(async () => {
      await result.current.updateService('esfoliacao-pe-mao', { active: false })
    })

    expect(result.current.services.some((item) => item.id === 'esfoliacao-pe-mao')).toBe(false)
    expect(
      result.current.allServices.find((item) => item.id === 'esfoliacao-pe-mao')?.active,
    ).toBe(false)
  })

  it('impede desativar serviço com agendamento futuro', async () => {
    const { result } = renderState()
    await act(async () => {
      await result.current.createAppointment({
        ...BASE_INPUT,
        serviceId: 'podologia-procedimento-basico',
        dateISO: weekdayISO(6),
      })
    })

    let outcome: Awaited<ReturnType<State['updateService']>> | undefined
    await act(async () => {
      outcome = await result.current.updateService('podologia-procedimento-basico', { active: false })
    })

    expect(outcome?.ok).toBe(false)
    expect(outcome?.error).toMatch(/agendamento ativo/)
    expect(
      result.current.services.find((item) => item.id === 'podologia-procedimento-basico')?.active,
    ).not.toBe(false)
  })
})

