import { describe, expect, it } from 'vitest'
import {
  buildMail,
  isReminderDue,
  mailDocument,
  reminderMailId,
} from './notifications'
import type { Appointment } from './types'

function appointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'apt-1',
    clientName: 'Mariana Silveira',
    clientUserId: 'user-mariana',
    serviceId: 'podologia-procedimento-basico',
    professionalId: 'simone',
    dateISO: '2026-11-10',
    startMin: 14 * 60 + 30,
    durationMin: 45,
    status: 'aguardando',
    payment: 'pendente',
    origin: 'app',
    ...overrides,
  }
}

describe('avisos por e-mail', () => {
  it('monta o pedido recebido com serviço, profissional e horário', () => {
    const mail = buildMail({
      kind: 'confirmacao',
      appointment: appointment(),
      to: 'mariana@exemplo.com',
    })

    expect(mail.subject).toContain('Pedido recebido')
    expect(mail.text).toContain('Olá, Mariana!')
    expect(mail.text).toContain('Procedimento básico') // nome do serviço do catálogo
    expect(mail.text).toContain('Simone')
    expect(mail.text).toContain('14:30')
    expect(mail.text).toContain('Pagamento no local')
    expect(mail.text).not.toContain('R$')
    expect(mail.to).toBe('mariana@exemplo.com')
    expect(mail.appointmentId).toBe('apt-1')
  })

  it('usa o nome livre do atendimento de balcão, quando existe', () => {
    const mail = buildMail({
      kind: 'confirmado',
      appointment: appointment({ title: 'Balayage Champagne + Gloss', clientName: 'Ana' }),
      to: 'ana@exemplo.com',
    })

    expect(mail.subject).toContain('Balayage Champagne + Gloss')
    expect(mail.subject).toContain('Horário confirmado')
    expect(mail.text).toContain('Olá, Ana!')
  })

  it('o lembrete chama a cliente pelo primeiro nome e diz que é amanhã', () => {
    const mail = buildMail({
      kind: 'lembrete',
      appointment: appointment({ dateISO: '2026-11-11' }),
      to: 'mariana@exemplo.com',
    })

    expect(mail.subject).toContain('Lembrete')
    expect(mail.subject).toContain('amanhã')
    expect(mail.text).toContain('remarcar')
  })

  it('o html acompanha o texto (o e-mail tem as duas versões)', () => {
    const mail = buildMail({ kind: 'confirmacao', appointment: appointment(), to: 'x@y.com' })

    expect(mail.html).toContain('EleganceStudio')
    expect(mail.html).toContain('14:30')
    expect(mail.html.length).toBeGreaterThan(mail.text.length)
  })
})

describe('lembrete de véspera', () => {
  it('vale para atendimento de amanhã ainda pendente ou confirmado', () => {
    expect(isReminderDue(appointment({ dateISO: '2026-11-11' }), '2026-11-10T09:00:00')).toBe(true)
    expect(
      isReminderDue(appointment({ dateISO: '2026-11-11', status: 'confirmado' }), '2026-11-10T23:00:00'),
    ).toBe(true)
  })

  it('não vale para hoje, para depois de amanhã nem para atendimento encerrado', () => {
    expect(isReminderDue(appointment({ dateISO: '2026-11-10' }), '2026-11-10T09:00:00')).toBe(false)
    expect(isReminderDue(appointment({ dateISO: '2026-11-12' }), '2026-11-10T09:00:00')).toBe(false)
    expect(
      isReminderDue(appointment({ dateISO: '2026-11-11', status: 'cancelado' }), '2026-11-10T09:00:00'),
    ).toBe(false)
    expect(
      isReminderDue(appointment({ dateISO: '2026-11-11', status: 'concluido' }), '2026-11-10T09:00:00'),
    ).toBe(false)
  })

  it('atravessa a virada de mês', () => {
    expect(isReminderDue(appointment({ dateISO: '2026-12-01' }), '2026-11-30T20:00:00')).toBe(true)
  })

  it('o id do lembrete é o mesmo para o mesmo atendimento', () => {
    expect(reminderMailId('apt-1')).toBe('lembrete-apt-1')
    expect(reminderMailId('apt-1')).toBe(reminderMailId('apt-1'))
  })
})

describe('documento da coleção mail', () => {
  it('segue o formato da extensão de e-mail do Firebase', () => {
    const draft = buildMail({ kind: 'confirmado', appointment: appointment(), to: 'a@b.com' })
    const document = mailDocument(draft, '2026-11-05T12:00:00.000Z')

    expect(document.to).toBe('a@b.com')
    expect(document.message.subject).toBe(draft.subject)
    expect(document.message.text).toBe(draft.text)
    expect(document.message.html).toBe(draft.html)
    // A extensão troca o estado depois de enviar; nasce sempre pendente.
    expect(document.delivery).toEqual({ state: 'PENDING' })
    expect(document.appointmentId).toBe('apt-1')
    expect(document.createdAtISO).toBe('2026-11-05T12:00:00.000Z')
  })
})
