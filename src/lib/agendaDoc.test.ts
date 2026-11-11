import { describe, expect, it } from 'vitest'
import { hasConflict } from './availability'
import {
  agendaDocId,
  agendaDocsFrom,
  blocksOf,
  busyAppointments,
  mergeBlocks,
  removeBlock,
  upsertBlock,
  type AgendaBlock,
} from './agendaDoc'
import type { Appointment } from './types'

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

function appointment(patch: Partial<Appointment> & Pick<Appointment, 'id'>): Appointment {
  return {
    clientName: 'Cliente',
    serviceId: 'corte-visagismo',
    professionalId: 'camila',
    dateISO: '2026-11-06',
    startMin: 9 * 60,
    durationMin: 30,
    status: 'confirmado',
    payment: 'pendente',
    origin: 'app',
    ...patch,
  }
}

describe('backfill dos documentos de agenda', () => {
  it('agrupa os atendimentos por profissional e dia', () => {
    const docs = agendaDocsFrom([
      appointment({ id: 'a', startMin: 11 * 60, durationMin: 45 }),
      appointment({ id: 'b', startMin: 9 * 60, status: 'aguardando' }),
      appointment({ id: 'c', professionalId: 'juliana', status: 'cancelado' }),
      appointment({ id: 'd', dateISO: '2026-11-07', durationMin: 60, status: 'faltou' }),
    ])

    expect(docs.map((doc) => doc.docId)).toEqual([
      'camila__2026-11-06',
      'camila__2026-11-07',
      'juliana__2026-11-06',
    ])
    // Ordenados por horário dentro do dia, com o status real preservado.
    expect(docs[0]?.blocks.map((block) => block.appointmentId)).toEqual(['b', 'a'])
    expect(docs[0]?.blocks.map((block) => block.status)).toEqual(['aguardando', 'confirmado'])
    expect(docs[1]?.blocks[0]?.status).toBe('faltou')
    expect(docs[2]?.blocks[0]?.status).toBe('cancelado')
  })

  it('descarta atendimentos sem profissional, sem data ou com duração inválida', () => {
    const docs = agendaDocsFrom([
      appointment({ id: 'sem-profissional', professionalId: '' }),
      appointment({ id: 'sem-data', dateISO: '' }),
      appointment({ id: 'duracao-zero', durationMin: 0 }),
      appointment({ id: 'ok' }),
    ])

    expect(docs).toHaveLength(1)
    expect(docs[0]?.blocks.map((block) => block.appointmentId)).toEqual(['ok'])
  })

  it('o documento derivado já bloqueia o horário na checagem de conflito', () => {
    const [day] = agendaDocsFrom([
      appointment({ id: 'a', startMin: 14 * 60, durationMin: 75 }),
    ])
    const blocks = blocksOf({ blocks: day?.blocks })

    expect(
      hasConflict({
        dateISO: '2026-11-06',
        startMin: 15 * 60,
        durationMin: 30,
        professionalId: 'camila',
        appointments: busyAppointments('camila', '2026-11-06', blocks),
      }),
    ).toBe(true)
  })

  it('preserva bloco órfão e corrige o bloco desatualizado ao mesclar', () => {
    const existing: AgendaBlock[] = [
      // Bloco de um atendimento que a leitura não trouxe: não pode desaparecer.
      { appointmentId: 'orfao', startMin: 8 * 60, durationMin: 30, status: 'confirmado' },
      // Bloco do a1 com horário antigo: o derivado manda.
      { appointmentId: 'a1', startMin: 9 * 60, durationMin: 90, status: 'confirmado' },
    ]
    const merged = mergeBlocks(existing, [
      { appointmentId: 'a1', startMin: 16 * 60, durationMin: 45, status: 'faltou' },
    ])

    expect(merged).toEqual([
      { appointmentId: 'orfao', startMin: 8 * 60, durationMin: 30, status: 'confirmado' },
      { appointmentId: 'a1', startMin: 16 * 60, durationMin: 45, status: 'faltou' },
    ])
  })
})
