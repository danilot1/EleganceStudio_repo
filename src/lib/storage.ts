import type { Appointment, User } from './types'
import type { OutgoingMail } from './notifications'
import { addDaysISO, daysBetween, todayISO } from './dates'
import { SERVICES } from '../data/catalog'

/**
 * Persistência local do protótipo.
 *
 * IMPORTANTE: isto NÃO é um banco de dados. É `localStorage` do navegador, usado
 * apenas para que os fluxos (agendar, cancelar, mudar status) funcionem de verdade
 * durante a demonstração. Os dados vivem só na máquina de quem abre o site.
 * Ver STATUS.md para a lista do que precisa de back-end real.
 */

const STORAGE_KEY = 'elegance-studio:v1'

/** Chave usada para sincronizar abas abertas no mesmo navegador. */
export const DATABASE_STORAGE_KEY = STORAGE_KEY

/**
 * Ajustes do catálogo feitos pela gestão.
 * A duração é a que reserva os blocos na agenda; `active: false` tira o serviço do
 * catálogo sem apagar o histórico de atendimentos que já o usaram.
 */
export interface ServiceOverride {
  durationMin?: number
  active?: boolean
}

export type ServiceOverrides = Record<string, ServiceOverride>

export interface Database {
  version: 1
  /** Data em que a demonstração foi gerada, usada para deslocar os dados de exemplo. */
  seedDateISO: string
  users: User[]
  appointments: Appointment[]
  /**
   * Ocupação da agenda para calcular horários livres, quando `appointments` não traz
   * todos os atendimentos (no Firebase, a cliente só lê os próprios). Ausente no modo
   * local, em que `appointments` já é a agenda inteira.
   */
  busy?: Appointment[]
  /** Vazio quando a gestão nunca editou o catálogo. */
  serviceOverrides: ServiceOverrides
  /**
   * Avisos por e-mail registrados na demonstração. Não há envio real sem o serviço
   * configurado: o pedido fica aqui e isso é dito na tela, em vez de fingir que saiu.
   */
  outbox?: OutgoingMail[]
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
  // Sem `price`: o catálogo do folheto não tem valores, então a demonstração também não.
  return [
    // ---------------------------------------------------------- agenda de HOJE (Painel)
    {
      id: 'apt-hoje-1',
      clientName: 'Renata Álvares',
      serviceId: 'olho-de-peixe',
      professionalId: 'simone',
      dateISO: today,
      startMin: 8 * 60,
      durationMin: 45,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'pix',
      origin: 'balcao',
      seeded: true,
    },
    {
      id: 'apt-hoje-2',
      clientName: 'Isabela Fontes',
      serviceId: 'hidratacao-podal-ozonio',
      professionalId: 'simone',
      dateISO: today,
      startMin: 9 * 60,
      durationMin: 40,
      status: 'em-atendimento',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-3',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'esmaltacao-esfoliacao-pe-mao',
      professionalId: 'cris',
      dateISO: today,
      startMin: 10 * 60 + 30,
      durationMin: 75,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-4',
      clientName: 'Clara Mendonça',
      serviceId: 'depilacao-feminina-meia-perna',
      professionalId: 'simone',
      dateISO: today,
      startMin: 11 * 60 + 15,
      durationMin: 30,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-5',
      clientName: 'Fernanda Uchôa',
      serviceId: 'esmaltacao-pe-mao',
      professionalId: 'cris',
      dateISO: today,
      startMin: 9 * 60 + 30,
      durationMin: 40,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'debito',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-6',
      clientName: 'Priscila Nunes',
      serviceId: 'mao',
      professionalId: 'cris',
      dateISO: today,
      startMin: 13 * 60,
      durationMin: 40,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'dinheiro',
      origin: 'balcao',
      seeded: true,
    },
    {
      id: 'apt-hoje-7',
      clientName: 'Antônio Vieira',
      serviceId: 'podologia-procedimento-basico',
      professionalId: 'simone',
      dateISO: today,
      startMin: 10 * 60,
      durationMin: 60,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'credito',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-8',
      clientName: 'Lúcia Ramos',
      serviceId: 'unha-encravada',
      professionalId: 'simone',
      dateISO: today,
      startMin: 13 * 60 + 30,
      durationMin: 60,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-9',
      clientName: 'Bianca Teles',
      serviceId: 'micose-laser',
      professionalId: 'simone',
      dateISO: today,
      startMin: 15 * 60,
      durationMin: 40,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-10',
      clientName: 'Sabrina Lopes',
      serviceId: 'depilacao-feminina-axila',
      professionalId: 'cris',
      dateISO: today,
      startMin: 14 * 60 + 30,
      durationMin: 15,
      status: 'aguardando',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-11',
      clientName: 'Helena Bustos',
      serviceId: 'mao',
      professionalId: 'cris',
      dateISO: today,
      startMin: 14 * 60,
      durationMin: 40,
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
      serviceId: 'depilacao-feminina-sobrancelha',
      professionalId: 'cris',
      dateISO: today,
      startMin: 9 * 60,
      durationMin: 20,
      status: 'faltou',
      payment: 'pendente',
      origin: 'app',
      note: 'Cliente não compareceu',
      seeded: true,
    },
    {
      id: 'apt-hoje-13',
      clientName: 'Rodrigo Pires',
      serviceId: 'depilacao-masculina-torax',
      professionalId: 'cris',
      dateISO: today,
      startMin: 15 * 60 + 30,
      durationMin: 30,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-14',
      clientName: 'Marta Lins',
      serviceId: 'escova',
      professionalId: 'claudia',
      dateISO: today,
      startMin: 10 * 60,
      durationMin: 45,
      status: 'concluido',
      payment: 'pago',
      paymentMethod: 'pix',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-hoje-15',
      clientName: 'Juliana Prado',
      serviceId: 'corte',
      professionalId: 'claudia',
      dateISO: today,
      startMin: 14 * 60,
      durationMin: 45,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      // Falta de outro dia da semana, para a taxa do período não ficar só no dia de hoje.
      id: 'apt-falta-semana',
      clientName: 'Tereza Coelho',
      serviceId: 'podologia-procedimento-basico',
      professionalId: 'simone',
      dateISO: addDaysISO(today, -3),
      startMin: 16 * 60,
      durationMin: 60,
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
      serviceId: 'spa-dos-pes',
      professionalId: 'cris',
      dateISO: addDaysISO(today, 2),
      startMin: 14 * 60 + 30,
      durationMin: 60,
      status: 'confirmado',
      payment: 'pago-no-local',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-mariana-2',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'depilacao-feminina-sobrancelha',
      professionalId: 'cris',
      dateISO: addDaysISO(today, 8),
      startMin: 16 * 60,
      durationMin: 20,
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
      serviceId: 'mao',
      professionalId: 'cris',
      dateISO: addDaysISO(today, -18),
      startMin: 15 * 60,
      durationMin: 40,
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
      serviceId: 'esmaltacao-pe-mao',
      professionalId: 'cris',
      dateISO: addDaysISO(today, -32),
      startMin: 10 * 60,
      durationMin: 40,
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
      serviceId: 'depilacao-feminina-axila',
      professionalId: 'cris',
      dateISO: addDaysISO(today, -46),
      startMin: 17 * 60,
      durationMin: 15,
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
      serviceId: 'esfoliacao-pe-mao',
      professionalId: 'cris',
      dateISO: addDaysISO(today, -61),
      startMin: 11 * 60 + 30,
      durationMin: 40,
      status: 'cancelado',
      payment: 'pendente',
      origin: 'app',
      seeded: true,
    },
    {
      id: 'apt-his-5',
      clientName: 'Mariana Silveira',
      clientUserId: 'user-mariana',
      serviceId: 'podologia-procedimento-basico',
      professionalId: 'simone',
      dateISO: addDaysISO(today, -75),
      startMin: 9 * 60,
      durationMin: 60,
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
    serviceOverrides: {},
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
    // Demonstração gravada antes da troca do catálogo: os exemplos citam serviços que
    // não existem mais. Só os exemplos (`seeded`) são refeitos; o que a pessoa criou fica.
    const known = new Set(SERVICES.map((service) => service.id))
    if (parsed.appointments.some((item) => item.seeded && !known.has(item.serviceId))) {
      const today = todayISO()
      parsed.seedDateISO = today
      parsed.appointments = [
        ...seedAppointments(today),
        ...parsed.appointments.filter((item) => !item.seeded),
      ]
    }
    // Banco gravado antes da gestão de serviços: completa o campo em vez de descartar.
    return {
      ...parsed,
      serviceOverrides:
        parsed.serviceOverrides && typeof parsed.serviceOverrides === 'object'
          ? parsed.serviceOverrides
          : {},
    }
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

/**
 * Avisa quando outra aba gravou na agenda.
 *
 * O evento `storage` só chega às outras abas — é justamente o que faz uma reserva feita
 * no celular (ou em outra aba) aparecer como ocupada aqui, em vez de continuar livre.
 */
export function subscribeToDatabase(onChange: (db: Database) => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return
    onChange(loadDatabase())
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
