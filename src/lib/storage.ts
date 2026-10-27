import type { Appointment, User } from './types'
import { addDaysISO, daysBetween, todayISO } from './dates'

/**
 * Persistência local do protótipo.
 *
 * IMPORTANTE: isto NÃO é um banco de dados. É `localStorage` do navegador, usado
 * apenas para que os fluxos (agendar, cancelar, mudar status) funcionem de verdade
 * durante a demonstração. Os dados vivem só na máquina de quem abre o site.
 * Ver STATUS.md para a lista do que precisa de back-end real.
 */

const STORAGE_KEY = 'elegance-studio:v1'

export interface Database {
  version: 1
  /** Data em que a demonstração foi gerada, usada para deslocar os dados de exemplo. */
  seedDateISO: string
  users: User[]
  appointments: Appointment[]
}

function seedUsers(): User[] {
  const createdAtISO = new Date().toISOString()
  return [
    {
      id: 'user-mariana',
      name: 'Mariana Silveira',
      email: 'mariana@exemplo.com',
      phone: '(11) 98765-4321',
      password: 'elegance123',
      role: 'cliente',
      createdAtISO,
    },
    {
      id: 'user-gestao',
      name: 'Gestão Elegance',
      email: 'gestao@elegance.com',
      phone: '(21) 3232-1010',
      password: 'elegance123',
      role: 'admin',
      createdAtISO,
    },
  ]
}

function seedAppointments(today: string): Appointment[] {
  return [
    // ---------------------------------------------------------- agenda de HOJE (Painel)
    {
      id: 'apt-hoje-1',
      clientName: 'Renata Álvares',
      serviceId: 'hidratacao-profunda',
      title: 'Tratamento Cronograma Capilar VIP',
      professionalId: 'camila',
      dateISO: today,
      startMin: 8 * 60,
      durationMin: 45,
      price: 180,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'pix',
      origin: 'balcao',
      seeded: true,
    },
    {
      id: 'apt-hoje-2',
      clientName: 'Isabela Fontes',
      serviceId: 'mechas-luzes',
      title: 'Balayage Champagne + Gloss',
      professionalId: 'camila',
      dateISO: today,
      startMin: 9 * 60,
      durationMin: 60,
      price: 480,
      status: 'em-atendimento',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-3',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'corte-visagismo',
      title: 'Corte Bordado & Escova Modelada',
      professionalId: 'juliana',
      dateISO: today,
      startMin: 10 * 60 + 30,
      durationMin: 45,
      price: 210,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-4',
      clientName: 'Clara Mendonça',
      serviceId: 'design-sobrancelha',
      title: 'Design Sobrancelhas + Lash Lifting',
      professionalId: 'beatriz',
      dateISO: today,
      startMin: 11 * 60 + 15,
      durationMin: 90,
      price: 290,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-5',
      clientName: 'Fernanda Uchôa',
      serviceId: 'escova-modeladora',
      professionalId: 'cris',
      dateISO: today,
      startMin: 9 * 60 + 30,
      durationMin: 45,
      price: 130,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'debito',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-6',
      clientName: 'Priscila Nunes',
      serviceId: 'manicure-classica',
      professionalId: 'cris',
      dateISO: today,
      startMin: 11 * 60,
      durationMin: 40,
      price: 75,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'dinheiro',
      origin: 'balcao',
      seeded: true,
    },
    {
      id: 'apt-hoje-7',
      clientName: 'Antônio Vieira',
      serviceId: 'podologia-completa',
      professionalId: 'simone',
      dateISO: today,
      startMin: 10 * 60,
      durationMin: 60,
      price: 220,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'credito',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-8',
      clientName: 'Lúcia Ramos',
      serviceId: 'combo-pes-mao',
      professionalId: 'simone',
      dateISO: today,
      startMin: 13 * 60 + 30,
      durationMin: 75,
      price: 150,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-9',
      clientName: 'Bianca Teles',
      serviceId: 'mechas-luzes',
      professionalId: 'juliana',
      dateISO: today,
      startMin: 13 * 60,
      durationMin: 150,
      price: 390,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-10',
      clientName: 'Sabrina Lopes',
      serviceId: 'limpeza-pele-led',
      professionalId: 'beatriz',
      dateISO: today,
      startMin: 14 * 60 + 30,
      durationMin: 60,
      price: 210,
      status: 'aguardando',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-11',
      clientName: 'Helena Bustos',
      serviceId: 'manicure-classica',
      title: 'Manicure Express (Reaberto na grade)',
      professionalId: 'camila',
      dateISO: today,
      startMin: 14 * 60,
      durationMin: 30,
      price: 75,
      status: 'cancelado',
      payment: 'pendente',
      origin: 'app',
      note: 'Vaga disponível no app',
      seeded: true,
    },
    {
      // Falta registrada pela recepção: a cliente não veio e o horário voltou para o app.
      // Existe para o indicador de no-show do painel mostrar um valor real (não fixo).
      id: 'apt-hoje-12',
      clientName: 'Paula Andrade',
      serviceId: 'design-sobrancelha',
      professionalId: 'beatriz',
      dateISO: today,
      startMin: 9 * 60,
      durationMin: 35,
      price: 70,
      status: 'faltou',
      payment: 'pendente',
      origin: 'app',
      note: 'Cliente não compareceu',
      seeded: true,
    },
    {
      // Falta de outro dia da semana, para a taxa do período não ficar só no dia de hoje.
      id: 'apt-falta-semana',
      clientName: 'Tereza Coelho',
      serviceId: 'podologia-completa',
      professionalId: 'simone',
      dateISO: addDaysISO(today, -3),
      startMin: 16 * 60,
      durationMin: 60,
      price: 220,
      status: 'faltou',
      payment: 'pendente',
      origin: 'app',
      note: 'Cliente não compareceu',
      seeded: true,
    },

    // ---------------------------------------------------------- próximos de Mariana
    {
      id: 'apt-mariana-1',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'corte-visagismo',
      professionalId: 'camila',
      dateISO: addDaysISO(today, 2),
      startMin: 14 * 60 + 30,
      durationMin: 75,
      price: 180,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-mariana-2',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'limpeza-pele-led',
      professionalId: 'beatriz',
      dateISO: addDaysISO(today, 8),
      startMin: 16 * 60,
      durationMin: 60,
      price: 210,
      status: 'aguardando',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },

    // ---------------------------------------------------------- histórico de Mariana
    {
      id: 'apt-his-1',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'corte-visagismo',
      professionalId: 'camila',
      dateISO: addDaysISO(today, -18),
      startMin: 15 * 60,
      durationMin: 50,
      price: 180,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'pix',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-his-2',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'manicure-classica',
      professionalId: 'cris',
      dateISO: addDaysISO(today, -32),
      startMin: 10 * 60,
      durationMin: 40,
      price: 75,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'dinheiro',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-his-3',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'limpeza-pele-led',
      professionalId: 'beatriz',
      dateISO: addDaysISO(today, -46),
      startMin: 17 * 60,
      durationMin: 60,
      price: 210,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'credito',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-his-4',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'hidratacao-profunda',
      professionalId: 'cris',
      dateISO: addDaysISO(today, -61),
      startMin: 11 * 60 + 30,
      durationMin: 50,
      price: 160,
      status: 'cancelado',
      payment: 'pendente',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-his-5',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'podologia-completa',
      professionalId: 'simone',
      dateISO: addDaysISO(today, -75),
      startMin: 9 * 60,
      durationMin: 60,
      price: 220,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'pix',
      origin: 'app',
      seeded: true,
    },
  ]
}

export function createSeededDatabase(): Database {
  const today = todayISO()
  return {
    version: 1,
    seedDateISO: today,
    users: seedUsers(),
    appointments: seedAppointments(today),
  }
}

/**
 * Mantém a demonstração útil: se o site for aberto em outro dia, os agendamentos de
 * exemplo são deslocados para continuarem caindo "hoje" e nos próximos dias.
 * Registros criados pelo usuário (seeded !== true) nunca são alterados.
 */
function shiftSeedsToToday(db: Database): Database {
  const today = todayISO()
  const delta = daysBetween(db.seedDateISO, today)
  if (delta === 0) return db

  const appointments = db.appointments.map((item) =>
    item.seeded ? { ...item, dateISO: addDaysISO(item.dateISO, delta) } : item,
  )

  // Usuários criados na demonstração continuam válidos, nada a fazer aqui.
  return { ...db, seedDateISO: today, appointments }
}

function readFromStorage(): Database | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Database
    if (parsed.version !== 1 || !Array.isArray(parsed.users) || !Array.isArray(parsed.appointments)) {
      return null
    }
    return parsed
  } catch {
    // Storage indisponível (modo privado) ou JSON corrompido: recomeça do zero.
    return null
  }
}

export function loadDatabase(): Database {
  const stored = readFromStorage()
  const db = stored ? shiftSeedsToToday(stored) : createSeededDatabase()
  if (!stored || JSON.stringify(db) !== JSON.stringify(stored)) {
    saveDatabase(db)
  }
  return db
}

export function saveDatabase(db: Database): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Sem storage: a sessão continua em memória durante a navegação.
  }
}

export function resetDatabase(): Database {
  const db = createSeededDatabase()
  saveDatabase(db)
  return db
}
