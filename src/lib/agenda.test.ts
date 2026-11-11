import { describe, expect, it } from 'vitest'
import {
  AGENDA_TIMES,
  appointmentsOfDay,
  buildAgendaDay,
  occupancyOf,
  summarizeDay,
} from './agenda'
import { fitsWorkWindow } from './availability'
import { addDaysISO, fromISODate, monthGridISO, startOfMonthISO, todayISO } from './dates'
import type { Appointment } from './types'

/**
 * Datas futuras calculadas a partir de hoje: a grade esconde horários que já passaram,
 * então uma data fixa quebraria o teste quando o dia chegasse.
 */
function futureDayOfWeek(weekday: number): string {
  let iso = addDaysISO(todayISO(), 1)
  while (fromISODate(iso).getDay() !== weekday) iso = addDaysISO(iso, 1)
  return iso
}

function appointment(partial: Partial<Appointment> = {}): Appointment {
  return {
    id: 'apt-teste',
    clientName: 'Cliente',
    serviceId: 'corte-visagismo',
    professionalId: 'camila',
    dateISO: futureDayOfWeek(2),
    startMin: 10 * 60,
    durationMin: 60,
    status: 'confirmado',
    payment: 'pendente',
    origin: 'app',
    ...partial,
  }
}

const stateOf = (slots: ReturnType<typeof buildAgendaDay>, startMin: number) =>
  slots.find((slot) => slot.startMin === startMin)?.state

describe('grade do calendário', () => {
  it('fecha o dia inteiro no domingo', () => {
    const sunday = futureDayOfWeek(0)
    const slots = buildAgendaDay({
      dateISO: sunday,
      professionalId: 'camila',
      appointments: [],
    })
    expect(slots).toHaveLength(AGENDA_TIMES.length)
    expect(slots.every((slot) => slot.state === 'fechado')).toBe(true)

    const summary = summarizeDay({
      dateISO: sunday,
      professionalIds: ['camila'],
      appointments: [],
    })
    expect(summary.closed).toBe(true)
    expect(summary.free).toBe(0)
  })

  it('mostra o sábado aberto só até as 14h e com o almoço fechado', () => {
    const saturday = futureDayOfWeek(6)
    const slots = buildAgendaDay({
      dateISO: saturday,
      professionalId: 'cris',
      appointments: [],
    })
    expect(stateOf(slots, 8 * 60)).toBe('livre')
    expect(stateOf(slots, 12 * 60 + 30)).toBe('fechado') // almoço
    expect(stateOf(slots, 13 * 60 + 30)).toBe('livre')
    expect(stateOf(slots, 14 * 60)).toBe('fechado') // depois do fechamento
    expect(stateOf(slots, 18 * 60)).toBe('fechado')
  })

  it('reserva todos os blocos de um atendimento longo sem vazar para outra profissional', () => {
    const dateISO = futureDayOfWeek(2)
    const booked = appointment({ dateISO, startMin: 10 * 60, durationMin: 90 })
    const camila = buildAgendaDay({
      dateISO,
      professionalId: 'camila',
      appointments: [booked],
    })
    expect(stateOf(camila, 10 * 60)).toBe('ocupado')
    expect(stateOf(camila, 10 * 60 + 30)).toBe('ocupado')
    expect(stateOf(camila, 11 * 60)).toBe('ocupado')
    expect(stateOf(camila, 11 * 60 + 30)).toBe('livre')

    const cris = buildAgendaDay({
      dateISO,
      professionalId: 'cris',
      appointments: [booked],
    })
    expect(stateOf(cris, 10 * 60)).toBe('livre')
  })

  it('devolve os blocos quando o atendimento é cancelado ou a cliente falta', () => {
    const dateISO = futureDayOfWeek(2)
    for (const status of ['cancelado', 'faltou'] as const) {
      const slots = buildAgendaDay({
        dateISO,
        professionalId: 'camila',
        appointments: [appointment({ dateISO, status })],
      })
      expect(stateOf(slots, 10 * 60)).toBe('livre')
    }
  })

  it('conta livres, ocupados e fechados do dia e calcula a ocupação', () => {
    const dateISO = futureDayOfWeek(2)
    const empty = summarizeDay({
      dateISO,
      professionalIds: ['camila'],
      appointments: [],
    })
    // 22 blocos de 30 min na grade; 08:00–08:59 e o almoço ficam fechados.
    expect(empty.free).toBe(18)
    expect(empty.occupied).toBe(0)
    expect(empty.closedSlots).toBe(4)
    expect(empty.workMinutes).toBe(18 * 30)
    expect(occupancyOf(empty)).toBe(0)

    const busy = summarizeDay({
      dateISO,
      professionalIds: ['camila'],
      appointments: [appointment({ dateISO, startMin: 10 * 60, durationMin: 60 })],
    })
    expect(busy.occupied).toBe(2)
    expect(busy.free).toBe(16)
    expect(busy.appointments).toBe(1)
    expect(busy.bookedMinutes).toBe(60)
    expect(occupancyOf(busy)).toBe(11)
  })

  it('lista os atendimentos do dia ordenados por horário', () => {
    const dateISO = futureDayOfWeek(2)
    const list = appointmentsOfDay({
      dateISO,
      appointments: [
        appointment({ id: 'b', dateISO, startMin: 15 * 60 }),
        appointment({ id: 'a', dateISO, startMin: 9 * 60 }),
        appointment({ id: 'outro-dia', dateISO: addDaysISO(dateISO, 1) }),
      ],
    })
    expect(list.map((item) => item.id)).toEqual(['a', 'b'])
  })
})

describe('expediente do atendimento', () => {
  it('recusa serviço que terminaria depois do fechamento', () => {
    const dateISO = futureDayOfWeek(2)
    expect(fitsWorkWindow({ dateISO, startMin: 18 * 60, durationMin: 60 })).toBe(true)
    expect(fitsWorkWindow({ dateISO, startMin: 18 * 60 + 30, durationMin: 90 })).toBe(false)
  })

  it('recusa atendimento no domingo', () => {
    expect(
      fitsWorkWindow({ dateISO: futureDayOfWeek(0), startMin: 10 * 60, durationMin: 30 }),
    ).toBe(false)
  })
})

describe('grade do mês', () => {
  it('começa no domingo e cobre seis semanas', () => {
    const month = startOfMonthISO(todayISO())
    const grid = monthGridISO(month)
    expect(grid).toHaveLength(42)
    expect(fromISODate(grid[0]!).getDay()).toBe(0)
    expect(grid).toContain(month)
  })
})
