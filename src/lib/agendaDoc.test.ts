import { describe, expect, it } from 'vitest'
import { hasConflict } from './availability'
import {
  agendaDocId,
  blocksOf,
  busyAppointments,
  removeBlock,
  upsertBlock,
  type AgendaBlock,
} from './agendaDoc'

const BLOCKS: AgendaBlock[] = [
  { appointmentId: 'a1', startMin: 9 * 60, durationMin: 90, status: 'confirmado' },
  { appointmentId: 'a2', startMin: 11 * 60, durationMin: 45, status: 'cancelado' },
]

describe('documento de agenda', () => {
  it('monta um id de documento por profissional e dia', () => {
    expect(agendaDocId('camila', '2026-11-06')).toBe('camila__2026-11-06')
  })

  it('normaliza os blocos gravados e descarta entradas inválidas', () => {
    const blocks = blocksOf({
      blocks: [
        { appointmentId: 'ok', startMin: 600, durationMin: 60, status: 'confirmado' },
        { appointmentId: 'sem-inicio', startMin: 'x', durationMin: 30 },
        { appointmentId: '', startMin: 600, durationMin: 30 },
        { appointmentId: 'duracao-zero', startMin: 600, durationMin: 0 },
        { appointmentId: 'status-desconhecido', startMin: 780, durationMin: 30, status: '??? ' },
      ],
    })

    expect(blocks.map((block) => block.appointmentId)).toEqual([
      'ok',
      'status-desconhecido',
    ])
    expect(blocks[1]?.status).toBe('aguardando')
  })

  it('ignora dados ausentes ou corrompidos', () => {
    expect(blocksOf(null)).toEqual([])
    expect(blocksOf({ blocks: 'nada' })).toEqual([])
    expect(blocksOf({ blocks: [null, 42] })).toEqual([])
  })

  it('enxerga conflito de um atendimento de 90 minutos com um de 30 dentro dele', () => {
    const busy = busyAppointments('camila', '2026-11-06', BLOCKS)

    expect(
      hasConflict({
        dateISO: '2026-11-06',
        startMin: 10 * 60,
        durationMin: 30,
        professionalId: 'camila',
        appointments: busy,
      }),
    ).toBe(true)
  })

  it('libera o horário de um bloco cancelado', () => {
    const busy = busyAppointments('camila', '2026-11-06', BLOCKS)

    // a2 é 11:00–11:45 e está cancelado: o horário volta a ser ofertado.
    expect(
      hasConflict({
        dateISO: '2026-11-06',
        startMin: 11 * 60,
        durationMin: 45,
        professionalId: 'camila',
        appointments: busy,
      }),
    ).toBe(false)
  })

  it('permite o atendimento que se sobrepõe a si mesmo no reagendamento', () => {
    const busy = busyAppointments('camila', '2026-11-06', BLOCKS)

    expect(
      hasConflict({
        dateISO: '2026-11-06',
        startMin: 9 * 60 + 30,
        durationMin: 60,
        professionalId: 'camila',
        appointments: busy,
        ignoreAppointmentId: 'a1',
      }),
    ).toBe(false)
  })

  it('substitui o bloco do mesmo atendimento em vez de duplicar', () => {
    const updated = upsertBlock(BLOCKS, {
      appointmentId: 'a1',
      startMin: 15 * 60,
      durationMin: 60,
      status: 'aguardando',
    })

    expect(updated.filter((block) => block.appointmentId === 'a1')).toHaveLength(1)
    expect(updated.map((block) => block.startMin)).toEqual([11 * 60, 15 * 60])
  })

  it('remove o bloco do atendimento que saiu do dia', () => {
    expect(removeBlock(BLOCKS, 'a1').map((block) => block.appointmentId)).toEqual(['a2'])
  })
})
