import { describe, expect, it } from 'vitest'
import { buildDaySlots, countAvailableSlots, hasConflict, workWindows } from '../lib/availability'
import type { Appointment } from '../lib/types'

function appointment(partial: Partial<Appointment>): Appointment {
  return {
    id: 'apt-teste',
    clientName: 'Cliente',
    serviceId: 'corte-visagismo',
    professionalId: 'camila',
    dateISO: '2026-10-20', // terça-feira
    startMin: 10 * 60,
    durationMin: 60,
    price: 100,
    status: 'confirmado',
    payment: 'pendente',
    origin: 'app',
    ...partial,
  }
}

describe('expediente', () => {
  it('fecha no domingo', () => {
    expect(workWindows('2026-10-18')).toEqual([])
  })

  it('abre em horário reduzido no sábado', () => {
    expect(workWindows('2026-10-17')).toEqual([{ startMin: 8 * 60, endMin: 14 * 60 }])
  })

  it('abre das 9h às 19h de segunda a sexta', () => {
    expect(workWindows('2026-10-20')).toEqual([{ startMin: 9 * 60, endMin: 19 * 60 }])
  })
})

describe('grade de horários', () => {
  it('não oferece horário que termina depois do fechamento', () => {
    const slots = buildDaySlots({
      dateISO: '2026-10-20',
      durationMin: 60,
      professionalId: 'camila',
      appointments: [],
    })
    expect(slots.at(-1)?.startMin).toBe(18 * 60)
    expect(slots.every((slot) => slot.endMin <= 19 * 60)).toBe(true)
  })

  it('marca o almoço (12h às 13h) como indisponível, mantendo o horário visível como ocupado', () => {
    const slots = buildDaySlots({
      dateISO: '2026-10-20',
      durationMin: 60,
      professionalId: 'camila',
      appointments: [],
    })
    const lunch = slots.filter((slot) => slot.startMin >= 12 * 60 && slot.startMin < 13 * 60)
    expect(lunch.length).toBeGreaterThan(0)
    expect(lunch.every((slot) => !slot.available)).toBe(true)
  })

  it('marca como ocupado o horário que colide com agendamento da mesma profissional', () => {
    const slots = buildDaySlots({
      dateISO: '2026-10-20',
      durationMin: 50,
      professionalId: 'camila',
      appointments: [appointment({ startMin: 10 * 60, durationMin: 60 })],
    })
    const slot = slots.find((item) => item.startMin === 10 * 60)
    expect(slot?.available).toBe(false)
    // 10:50 já invadiria o atendimento que vai até 11:00
    expect(slots.find((item) => item.startMin === 10 * 60 + 30)?.available).toBe(false)
  })

  it('não deixa o agendamento de uma profissional bloquear a agenda de outra', () => {
    const slots = buildDaySlots({
      dateISO: '2026-10-20',
      durationMin: 50,
      professionalId: 'cris',
      appointments: [appointment({ professionalId: 'camila' })],
    })
    expect(slots.find((item) => item.startMin === 10 * 60)?.available).toBe(true)
  })

  it('libera o horário quando o agendamento está cancelado', () => {
    const slots = buildDaySlots({
      dateISO: '2026-10-20',
      durationMin: 50,
      professionalId: 'camila',
      appointments: [appointment({ status: 'cancelado' })],
    })
    expect(slots.find((item) => item.startMin === 10 * 60)?.available).toBe(true)
  })

  it('libera o horário quando a cliente faltou', () => {
    const slots = buildDaySlots({
      dateISO: '2026-10-20',
      durationMin: 50,
      professionalId: 'camila',
      appointments: [appointment({ status: 'faltou' })],
    })
    expect(slots.find((item) => item.startMin === 10 * 60)?.available).toBe(true)

    expect(
      hasConflict({
        dateISO: '2026-10-20',
        startMin: 10 * 60,
        durationMin: 50,
        professionalId: 'camila',
        appointments: [appointment({ status: 'faltou' })],
      }),
    ).toBe(false)
  })

  it('conta as vagas livres do dia', () => {
    const total = countAvailableSlots({
      dateISO: '2026-10-20',
      durationMin: 50,
      professionalId: 'camila',
      appointments: [],
    })
    // 9h às 18h em passos de 30 min, menos o almoço
    expect(total).toBe(16)
  })

  it('detecta conflito ao criar novo agendamento', () => {
    const appointments = [appointment({ startMin: 10 * 60, durationMin: 60 })]
    expect(
      hasConflict({
        dateISO: '2026-10-20',
        startMin: 10 * 60 + 30,
        durationMin: 50,
        professionalId: 'camila',
        appointments,
      }),
    ).toBe(true)
    expect(
      hasConflict({
        dateISO: '2026-10-20',
        startMin: 11 * 60,
        durationMin: 50,
        professionalId: 'camila',
        appointments,
      }),
    ).toBe(false)
    // o próprio agendamento sendo reagendado não conflita consigo mesmo
    expect(
      hasConflict({
        dateISO: '2026-10-20',
        startMin: 10 * 60,
        durationMin: 60,
        professionalId: 'camila',
        appointments,
        ignoreAppointmentId: 'apt-teste',
      }),
    ).toBe(false)
  })
})
