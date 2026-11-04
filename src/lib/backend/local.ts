import { fitsWorkWindow, hasConflict } from '../availability'
import { isValidEmail, onlyDigits } from '../format'
import { canRegisterNoShow } from '../noShow'
import {
  loadDatabase,
  resetDatabase,
  saveDatabase,
  subscribeToDatabase,
  type Database,
} from '../storage'
import type { Appointment, PaymentMethod, Session, User } from '../types'
import { SELF_SIGNUP_ROLE, type Backend, type SessionResult } from './types'

/**
 * Backend de demonstração: `localStorage`.
 *
 * Mantém exatamente o comportamento do protótipo (é o único lugar que ainda grava no
 * navegador) e serve de referência para o backend Firebase, que implementa o mesmo
 * contrato. Nenhuma regra de negócio nova mora aqui: disponibilidade e conflito vêm de
 * `availability.ts`, falta vem de `noShow.ts`.
 */

type Listener = (db: Database) => void

function sessionOf(user: User): Session {
  return { userId: user.id, name: user.name, email: user.email, role: user.role }
}

export function createLocalBackend(): Backend {
  const listeners = new Set<Listener>()
  let stopCrossTab: (() => void) | null = null

  /** Sempre relê o storage: outra aba pode ter gravado desde a última chamada. */
  function read(): Database {
    return loadDatabase()
  }

  function publish(next: Database): void {
    for (const listener of listeners) listener(next)
  }

  function write(next: Database): Database {
    saveDatabase(next)
    publish(next)
    return next
  }

  function mapAppointment(
    id: string,
    change: (item: Appointment) => Appointment,
  ): Database {
    const current = read()
    return write({
      ...current,
      appointments: current.appointments.map((item) => (item.id === id ? change(item) : item)),
    })
  }

  return {
    mode: 'local',

    subscribe(listener) {
      listeners.add(listener)
      // O evento `storage` só chega às outras abas: é o que faz uma reserva feita em
      // outro dispositivo do mesmo navegador aparecer ocupada aqui.
      if (!stopCrossTab) {
        stopCrossTab = subscribeToDatabase((next) => publish(next))
      }
      // Snapshot atual na hora da assinatura: a tela não precisa de uma leitura extra
      // (que poderia chegar depois e sobrescrever um agendamento recém-criado).
      listener(read())
      return () => {
        listeners.delete(listener)
        if (listeners.size === 0 && stopCrossTab) {
          stopCrossTab()
          stopCrossTab = null
        }
      }
    },

    async signIn(email, password): Promise<SessionResult> {
      const db = read()
      const user = db.users.find(
        (item) => item.email.toLowerCase() === email.trim().toLowerCase(),
      )
      if (!user || user.password !== password) {
        return { ok: false, error: 'E-mail ou senha não conferem.' }
      }
      return { ok: true, session: sessionOf(user) }
    },

    async signUp(input): Promise<SessionResult> {
      const db = read()
      const email = input.email.trim().toLowerCase()
      if (!input.name.trim()) return { ok: false, error: 'Informe o nome completo.' }
      if (!isValidEmail(email)) return { ok: false, error: 'Informe um e-mail válido.' }
      if (onlyDigits(input.phone).length < 10) {
        return { ok: false, error: 'Informe um telefone/WhatsApp válido com DDD.' }
      }
      if (input.password.length < 8) {
        return { ok: false, error: 'A senha precisa ter no mínimo 8 caracteres.' }
      }
      if (db.users.some((item) => item.email.toLowerCase() === email)) {
        return { ok: false, error: 'Já existe uma conta com este e-mail.' }
      }

      const user: User = {
        id: `user-${Date.now()}`,
        name: input.name.trim(),
        email,
        phone: input.phone,
        password: input.password,
        role: SELF_SIGNUP_ROLE,
        createdAtISO: new Date().toISOString(),
      }
      write({ ...db, users: [...db.users, user] })
      return { ok: true, session: sessionOf(user) }
    },

    async signOut() {
      // Sessão local é limpa pelo AppState (localStorage/sessionStorage).
    },

    async requestPasswordReset(identifier) {
      const db = read()
      const value = identifier.trim().toLowerCase()
      const user = db.users.find(
        (item) =>
          item.email.toLowerCase() === value || onlyDigits(item.phone) === onlyDigits(value),
      )
      if (!user) {
        return { ok: false, error: 'Não encontramos uma conta com este e-mail ou WhatsApp.' }
      }
      return { ok: true }
    },

    async createAppointment(input, session) {
      const db = read()

      if (
        !fitsWorkWindow({
          dateISO: input.dateISO,
          startMin: input.startMin,
          durationMin: input.durationMin,
        })
      ) {
        return {
          ok: false,
          error: 'Este serviço não cabe no expediente do dia. Escolha outro horário.',
        }
      }

      if (
        hasConflict({
          dateISO: input.dateISO,
          startMin: input.startMin,
          durationMin: input.durationMin,
          professionalId: input.professionalId,
          appointments: db.appointments,
        })
      ) {
        return { ok: false, error: 'Este horário acabou de ser ocupado. Escolha outro.' }
      }

      const appointment: Appointment = {
        id: `apt-${Date.now()}`,
        clientName: input.clientName.trim(),
        clientUserId: session?.role === 'cliente' ? session.userId : undefined,
        serviceId: input.serviceId,
        title: input.title,
        professionalId: input.professionalId,
        dateISO: input.dateISO,
        startMin: input.startMin,
        durationMin: input.durationMin,
        price: input.price,
        status: input.status ?? 'aguardando',
        payment: 'pendente',
        origin: input.origin ?? 'app',
        note: input.clientNote?.trim() || undefined,
      }

      write({ ...db, appointments: [...db.appointments, appointment] })
      return { ok: true, appointment }
    },

    async setAppointmentStatus(id, status) {
      mapAppointment(id, (item) => ({ ...item, status }))
    },

    async registerNoShow(id) {
      const target = read().appointments.find((item) => item.id === id)
      if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
      if (!canRegisterNoShow(target)) {
        return {
          ok: false,
          error:
            'Só é possível registrar falta depois do horário marcado e antes de concluir ou cancelar o atendimento.',
        }
      }
      mapAppointment(id, (item) => ({
        ...item,
        status: 'faltou',
        note: 'Cliente não compareceu',
      }))
      return { ok: true }
    },

    async registerPayment(id, method: PaymentMethod) {
      mapAppointment(id, (item) => ({ ...item, payment: 'pago', paymentMethod: method }))
    },

    async rescheduleAppointment(id, dateISO, startMin) {
      const db = read()
      const target = db.appointments.find((item) => item.id === id)
      if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
      if (!fitsWorkWindow({ dateISO, startMin, durationMin: target.durationMin })) {
        return { ok: false, error: 'Este serviço não cabe no expediente do dia escolhido.' }
      }
      if (
        hasConflict({
          dateISO,
          startMin,
          durationMin: target.durationMin,
          professionalId: target.professionalId,
          appointments: db.appointments,
          ignoreAppointmentId: id,
        })
      ) {
        return { ok: false, error: 'Horário indisponível para esta profissional.' }
      }
      mapAppointment(id, (item) => ({ ...item, dateISO, startMin, status: 'aguardando' }))
      return { ok: true }
    },

    async resetDemo() {
      write(resetDatabase())
    },
  }
}
