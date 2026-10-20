import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  CATEGORIES,
  PROFESSIONALS,
  SERVICE_GROUPS,
  SERVICES,
} from '../data/catalog'
import { hasConflict } from '../lib/availability'
import { isValidEmail, onlyDigits } from '../lib/format'
import { canRegisterNoShow } from '../lib/noShow'
import { loadDatabase, resetDatabase, saveDatabase, type Database } from '../lib/storage'
import type {
  Appointment,
  AppointmentStatus,
  PaymentMethod,
  Session,
  User,
} from '../lib/types'

const SESSION_KEY = 'elegance-studio:session'

export interface SignUpInput {
  name: string
  email: string
  phone: string
  password: string
}

export interface NewAppointmentInput {
  serviceId: string
  professionalId: string
  dateISO: string
  startMin: number
  durationMin: number
  price: number
  clientName: string
  clientNote?: string
  /** Usado pelo encaixe no balcão: entra já confirmado. */
  status?: AppointmentStatus
  origin?: Appointment['origin']
  title?: string
}

export interface ActionResult {
  ok: boolean
  error?: string
}

interface AppStateValue {
  services: typeof SERVICES
  professionals: typeof PROFESSIONALS
  groups: typeof SERVICE_GROUPS
  categories: typeof CATEGORIES
  appointments: Appointment[]
  session: Session | null
  login: (email: string, password: string, remember?: boolean) => ActionResult
  signUp: (input: SignUpInput) => ActionResult
  logout: () => void
  requestPasswordReset: (identifier: string) => ActionResult
  createAppointment: (input: NewAppointmentInput) => ActionResult & { appointment?: Appointment }
  setAppointmentStatus: (id: string, status: AppointmentStatus) => void
  /** Marca a falta da cliente e libera o horário na agenda. */
  registerNoShow: (id: string) => ActionResult
  registerPayment: (id: string, method: PaymentMethod) => void
  rescheduleAppointment: (id: string, dateISO: string, startMin: number) => ActionResult
  resetDemo: () => void
}

const AppStateContext = createContext<AppStateValue | null>(null)

function readSession(): Session | null {
  try {
    const raw =
      window.localStorage.getItem(SESSION_KEY) ?? window.sessionStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  // App somente no navegador: os dados e a sessão são lidos já na primeira renderização,
  // senão as rotas protegidas redirecionariam para o login antes de saber que há sessão.
  const [db, setDb] = useState<Database>(() => loadDatabase())
  const [session, setSession] = useState<Session | null>(() => readSession())

  useEffect(() => {
    saveDatabase(db)
  }, [db])

  /**
   * "Lembrar-me neste dispositivo" decide onde a sessão é guardada:
   * marcado = localStorage (sobrevive ao fechar o navegador); desmarcado = sessionStorage.
   */
  const persistSession = useCallback((value: Session | null, remember = true) => {
    setSession(value)
    try {
      window.localStorage.removeItem(SESSION_KEY)
      window.sessionStorage.removeItem(SESSION_KEY)
      if (value) {
        const target = remember ? window.localStorage : window.sessionStorage
        target.setItem(SESSION_KEY, JSON.stringify(value))
      }
    } catch {
      // sem storage: sessão só em memória
    }
  }, [])

  const login = useCallback(
    (email: string, password: string, remember = true): ActionResult => {
      const user = db.users.find(
        (item: User) => item.email.toLowerCase() === email.trim().toLowerCase(),
      )
      if (!user || user.password !== password) {
        return { ok: false, error: 'E-mail ou senha não conferem.' }
      }
      persistSession(
        {
          userId: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        remember,
      )
      return { ok: true }
    },
    [db.users, persistSession],
  )

  const signUp = useCallback(
    (input: SignUpInput): ActionResult => {
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
        role: 'cliente',
        createdAtISO: new Date().toISOString(),
      }
      setDb((current) => ({ ...current, users: [...current.users, user] }))
      persistSession({
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      })
      return { ok: true }
    },
    [db.users, persistSession],
  )

  const logout = useCallback(() => persistSession(null), [persistSession])

  /**
   * Recuperação de senha: apenas verifica se o contato existe.
   * NENHUMA mensagem é enviada — não há servidor de e-mail/WhatsApp neste protótipo.
   */
  const requestPasswordReset = useCallback(
    (identifier: string): ActionResult => {
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
    [db.users],
  )

  const createAppointment = useCallback(
    (input: NewAppointmentInput): ActionResult & { appointment?: Appointment } => {
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

      setDb((current) => ({ ...current, appointments: [...current.appointments, appointment] }))
      return { ok: true, appointment }
    },
    [db.appointments, session],
  )

  const setAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
    setDb((current) => ({
      ...current,
      appointments: current.appointments.map((item) =>
        item.id === id
          ? {
              ...item,
              status,
              payment:
                status === 'cancelado' && item.payment === 'pendente' ? 'pendente' : item.payment,
            }
          : item,
      ),
    }))
  }, [])

  const registerNoShow = useCallback(
    (id: string): ActionResult => {
      const target = db.appointments.find((item) => item.id === id)
      if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
      if (!canRegisterNoShow(target)) {
        return {
          ok: false,
          error:
            'Só é possível registrar falta depois do horário marcado e antes de concluir ou cancelar o atendimento.',
        }
      }
      setDb((current) => ({
        ...current,
        appointments: current.appointments.map((item) =>
          item.id === id ? { ...item, status: 'faltou', note: 'Cliente não compareceu' } : item,
        ),
      }))
      return { ok: true }
    },
    [db.appointments],
  )

  const registerPayment = useCallback((id: string, method: PaymentMethod) => {
    setDb((current) => ({
      ...current,
      appointments: current.appointments.map((item) =>
        item.id === id ? { ...item, payment: 'pago', paymentMethod: method } : item,
      ),
    }))
  }, [])

  const rescheduleAppointment = useCallback(
    (id: string, dateISO: string, startMin: number): ActionResult => {
      const target = db.appointments.find((item) => item.id === id)
      if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
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
      setDb((current) => ({
        ...current,
        appointments: current.appointments.map((item) =>
          item.id === id ? { ...item, dateISO, startMin, status: 'aguardando' } : item,
        ),
      }))
      return { ok: true }
    },
    [db.appointments],
  )

  const resetDemo = useCallback(() => {
    setDb(resetDatabase())
    persistSession(null)
  }, [persistSession])

  const value = useMemo<AppStateValue>(
    () => ({
      services: SERVICES,
      professionals: PROFESSIONALS,
      groups: SERVICE_GROUPS,
      categories: CATEGORIES,
      appointments: db.appointments,
      session,
      login,
      signUp,
      logout,
      requestPasswordReset,
      createAppointment,
      setAppointmentStatus,
      registerNoShow,
      registerPayment,
      rescheduleAppointment,
      resetDemo,
    }),
    [
      db.appointments,
      session,
      login,
      signUp,
      logout,
      requestPasswordReset,
      createAppointment,
      setAppointmentStatus,
      registerNoShow,
      registerPayment,
      rescheduleAppointment,
      resetDemo,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState precisa estar dentro de <AppStateProvider>')
  return context
}
