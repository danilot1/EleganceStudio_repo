import { describe, expect, it } from 'vitest'
import { canRegisterNoShow, noShowStats } from './noShow'
import type { Appointment } from './types'

function appointment(partial: Partial<Appointment> = {}): Appointment {
  return {
    id: 'apt-teste',
    clientName: 'Cliente',
    serviceId: 'corte-visagismo',
    professionalId: 'camila',
    dateISO: '2026-10-20',
    startMin: 10 * 60,
    durationMin: 50,
    price: 180,
    status: 'confirmado',
    payment: 'pendente',
    origin: 'app',
    ...partial,
  }
}

// Referência fixa: 20/10/2026 às 12:00 (horário local), para o teste não depender do relógio.
const NOON = new Date(2026, 9, 20, 12, 0)

describe('registro de falta', () => {
  it('aceita falta de atendimento que já começou', () => {
    expect(canRegisterNoShow(appointment({ startMin: 10 * 60 }), NOON)).toBe(true)
  })

  it('aceita também quando o atendimento está em andamento', () => {
    expect(
      canRegisterNoShow(appointment({ startMin: 11 * 60, status: 'em-atendimento' }), NOON),
    ).toBe(true)
  })

  it('recusa falta antes do horário marcado', () => {
    expect(canRegisterNoShow(appointment({ startMin: 15 * 60 }), NOON)).toBe(false)
  })

  it('recusa falta em outro dia futuro', () => {
    expect(canRegisterNoShow(appointment({ dateISO: '2026-10-21' }), NOON)).toBe(false)
  })

  it('recusa falta de atendimento já concluído, cancelado ou com falta registrada', () => {
    for (const status of ['concluido', 'cancelado', 'faltou'] as const) {
      expect(canRegisterNoShow(appointment({ status }), NOON)).toBe(false)
    }
  })
})

describe('indicador de no-show', () => {
  const appointments: Appointment[] = [
    appointment({ id: 'a', dateISO: '2026-10-19', status: 'concluido' }),
    appointment({ id: 'b', dateISO: '2026-10-19', status: 'concluido' }),
    appointment({ id: 'c', dateISO: '2026-10-20', status: 'concluido' }),
    appointment({ id: 'd', dateISO: '2026-10-20', status: 'faltou' }),
    appointment({ id: 'e', dateISO: '2026-10-20', status: 'cancelado' }),
    appointment({ id: 'f', dateISO: '2026-10-20', status: 'confirmado' }),
  ]

  it('calcula a taxa só sobre atendimentos com desfecho', () => {
    const stats = noShowStats(appointments, '2026-10-19', '2026-10-20')
    expect(stats.noShows).toBe(1)
    expect(stats.completed).toBe(3)
    expect(stats.cancelled).toBe(1)
    expect(stats.resolved).toBe(4)
    expect(stats.rate).toBe(25)
  })

  it('respeita o intervalo de datas', () => {
    const stats = noShowStats(appointments, '2026-10-20', '2026-10-20')
    expect(stats.completed).toBe(1)
    expect(stats.noShows).toBe(1)
    expect(stats.rate).toBe(50)
  })

  it('devolve zero quando ainda não houve desfecho', () => {
    const stats = noShowStats(appointments, '2026-10-25', '2026-10-31')
    expect(stats.resolved).toBe(0)
    expect(stats.rate).toBe(0)
  })
})
