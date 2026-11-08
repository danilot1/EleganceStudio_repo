import { findProfessional, findService } from '../data/catalog'
import { minutesToTime, shortDateLabel } from './dates'
import { formatBRL } from './format'
import type { Appointment } from './types'

/**
 * Avisos por e-mail.
 *
 * O aplicativo não envia e-mail: ele **escreve o pedido**. O documento segue o formato
 * da coleção `mail/` que a extensão oficial "Trigger Email from Firestore" consome —
 * `to` + `message.{subject,text,html}` — então ligar o envio de verdade é instalar a
 * extensão e apontar um servidor SMTP, sem mexer em nenhuma tela.
 *
 * Até lá, no modo demonstração o pedido fica registrado no navegador (`outbox`) e o
 * comprovante avisa que o envio depende da configuração. Nada finge ter saído.
 */

/** Tipos de aviso que o sistema sabe montar. */
export type MailKind = 'confirmacao' | 'confirmado' | 'lembrete'

export interface MailDraft {
  kind: MailKind
  to: string
  subject: string
  text: string
  html: string
  appointmentId?: string
  /** Id determinístico: é o que impede o mesmo lembrete sair duas vezes. */
  id?: string
}

/** Pedido já registrado (modo demonstração). */
export interface OutgoingMail extends MailDraft {
  id: string
  createdAtISO: string
}

const STUDIO = 'EleganceStudio'
const SIGNATURE = `Equipe ${STUDIO}`

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || 'cliente'
}

function details(appointment: Appointment) {
  const service = findService(appointment.serviceId)
  const professional = findProfessional(appointment.professionalId)
  return {
    title: appointment.title ?? service?.name ?? 'Atendimento',
    professional: professional?.name ?? 'Estúdio',
    when: `${shortDateLabel(appointment.dateISO)} às ${minutesToTime(appointment.startMin)}`,
    price: formatBRL(appointment.price),
  }
}

function paragraph(title: string, body: string): string {
  return `<p style="margin:0 0 14px;font:16px/1.6 Georgia,serif;color:#3a3226">${title}${body}</p>`
}

function htmlBody(
  greeting: string,
  intro: string,
  lines: Array<[string, string]>,
  closing: string,
): string {
  return [
    '<div style="background:#F6F1E7;padding:28px">',
    '<div style="max-width:520px;margin:0 auto;background:#fffdf8;border:1px solid #e6ddcb;border-radius:16px;padding:26px">',
    `<p style="margin:0 0 6px;font:12px/1.4 Arial,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#8B6B2E">${STUDIO}</p>`,
    `<h1 style="margin:0 0 18px;font:24px/1.3 Georgia,serif;color:#2c2519">${greeting}</h1>`,
    paragraph('', intro),
    '<div style="border-top:1px solid #e6ddcb;padding-top:14px;margin-bottom:16px">',
    lines
      .map(
        ([label, value]) =>
          `<p style="margin:0 0 6px;font:14px/1.5 Arial,sans-serif;color:#3a3226"><span style="color:#8a7c63">${label}: </span>${value}</p>`,
      )
      .join(''),
    '</div>',
    paragraph('', closing),
    `<p style="margin:0;font:12px/1.5 Arial,sans-serif;color:#8a7c63">${SIGNATURE}</p>`,
    '</div></div>',
  ].join('')
}

/**
 * Monta o aviso de um atendimento. Três momentos diferentes, o mesmo formato:
 * o pedido foi recebido, o horário está confirmado, ou o atendimento é amanhã.
 */
export function buildMail(input: {
  kind: MailKind
  appointment: Appointment
  to: string
}): MailDraft {
  const { kind, appointment, to } = input
  const { title, professional, when, price } = details(appointment)
  const name = firstName(appointment.clientName)

  const intro =
    kind === 'confirmacao'
      ? 'Recebemos o seu pedido de horário. Ele ainda aparece como “Aguardando Confirmação” até a nossa equipe confirmar.'
      : kind === 'confirmado'
        ? 'Seu horário está confirmado. Estamos te esperando no estúdio.'
        : 'Passando para lembrar do seu atendimento amanhã.'

  const subject =
    kind === 'confirmacao'
      ? `Pedido recebido: ${title} — ${when}`
      : kind === 'confirmado'
        ? `Horário confirmado: ${title} — ${when}`
        : `Lembrete: ${title} amanhã às ${minutesToTime(appointment.startMin)}`

  const closing =
    'Precisa remarcar? O cancelamento e o reagendamento são gratuitos até 2 horas antes do atendimento, pelo próprio aplicativo.'

  const text = [
    `Olá, ${name}!`,
    '',
    intro,
    '',
    `Serviço: ${title}`,
    `Profissional: ${professional}`,
    `Quando: ${when}`,
    `Valor: ${price} (pagamento no local)`,
    '',
    closing,
    '',
    SIGNATURE,
  ].join('\n')

  const html = htmlBody(`Olá, ${name}!`, intro, [
    ['Serviço', title],
    ['Profissional', professional],
    ['Quando', when],
    ['Valor', `${price} (pagamento no local)`],
  ], closing)

  return { kind, to, subject, text, html, appointmentId: appointment.id }
}

/** Id determinístico do lembrete: um por atendimento, para nunca sair duas vezes. */
export function reminderMailId(appointmentId: string): string {
  return `lembrete-${appointmentId}`
}

/**
 * Só vale lembrete para atendimento de amanhã que ainda vai acontecer.
 * Cancelado, falta ou concluído não recebem aviso — seria ruído para a cliente.
 */
export function isReminderDue(appointment: Appointment, nowISO: string): boolean {
  if (appointment.status !== 'aguardando' && appointment.status !== 'confirmado') return false
  const today = nowISO.slice(0, 10)
  const tomorrow = new Date(`${today}T12:00:00`)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  return appointment.dateISO === tomorrowISO
}

/**
 * Documento gravado em `mail/`, no formato da extensão oficial.
 * `delivery` nasce PENDING — a extensão o atualiza depois do envio.
 */
export function mailDocument(draft: MailDraft, createdAtISO: string) {
  return {
    to: draft.to,
    message: { subject: draft.subject, text: draft.text, html: draft.html },
    kind: draft.kind,
    appointmentId: draft.appointmentId ?? null,
    createdAtISO,
    delivery: { state: 'PENDING' },
  }
}
