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
import { backend } from '../lib/backend'
import type {
  ActionResult,
  CreateResult,
  NewAppointmentInput,
  SignUpInput,
} from '../lib/backend/types'
import { loadDatabase, type Database } from '../lib/storage'
import type { Appointment, AppointmentStatus, PaymentMethod, Session, User } from '../lib/types'

export type { ActionResult, NewAppointmentInput, SignUpInput }

const SESSION_KEY = 'elegance-studio:session'

interface AppStateValue {
  services: typeof SERVICES
  professionals: typeof PROFESSIONALS
  groups: typeof SERVICE_GROUPS
  categories: typeof CATEGORIES
  appointments: Appointment[]
  /** Contas cadastradas — usadas pela gestão para consultar os dados das clientes. */
  users: User[]
  session: Session | null
  login: (email: string, password: string, remember?: boolean) => Promise<ActionResult>
  signUp: (input: SignUpInput) => Promise<ActionResult>
  logout: () => void
  requestPasswordReset: (identifier: string) => Promise<ActionResult>
  createAppointment: (input: NewAppointmentInput) => Promise<CreateResult>
  setAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<void>
  /** Marca a falta da cliente e libera o horário na agenda. */
  registerNoShow: (id: string) => Promise<ActionResult>
  registerPayment: (id: string, method: PaymentMethod) => Promise<void>
  rescheduleAppointment: (id: string, dateISO: string, startMin: number) => Promise<ActionResult>
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

/**
 * Fachada única entre as telas e o banco.
 *
 * Nenhum componente conhece `localStorage` nem Firestore: tudo passa por aqui. O
 * backend concreto vem de `lib/backend` (local hoje, Firebase quando configurado).
 * O estado inicial é lido do cache local para o primeiro paint sair igual ao protótipo,
 * e é substituído pelos dados do backend assim que ele responde.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(() => loadDatabase())
  const [session, setSession] = useState<Session | null>(() => readSession())

  useEffect(() => {
    // A assinatura cobre os três casos — gravação nesta aba, em outra aba e no servidor —
    // e já entrega o snapshot atual. Antes existiam dois caminhos (efeito de save e
    // evento `storage`), e a leitura inicial assíncrona podia sobrescrever uma reserva
    // feita logo depois de a tela abrir.
    return backend.subscribe((next) => setDb(next))
  }, [])

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
    async (email: string, password: string, remember = true): Promise<ActionResult> => {
      const result = await backend.signIn(email, password)
      if (result.ok && result.session) persistSession(result.session, remember)
      return { ok: result.ok, error: result.error }
    },
    [persistSession],
  )

  const signUp = useCallback(
    async (input: SignUpInput): Promise<ActionResult> => {
      const result = await backend.signUp(input)
      if (result.ok && result.session) persistSession(result.session)
      return { ok: result.ok, error: result.error }
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    persistSession(null)
    void backend.signOut()
  }, [persistSession])

  const requestPasswordReset = useCallback(
    (identifier: string): Promise<ActionResult> => backend.requestPasswordReset(identifier),
    [],
  )

  const createAppointment = useCallback(
    (input: NewAppointmentInput): Promise<CreateResult> =>
      backend.createAppointment(input, session),
    [session],
  )

  const setAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus): Promise<void> =>
      backend.setAppointmentStatus(id, status),
    [],
  )

  const registerNoShow = useCallback(
    (id: string): Promise<ActionResult> => backend.registerNoShow(id),
    [],
  )

  const registerPayment = useCallback(
    (id: string, method: PaymentMethod): Promise<void> => backend.registerPayment(id, method),
    [],
  )

  const rescheduleAppointment = useCallback(
    (id: string, dateISO: string, startMin: number): Promise<ActionResult> =>
      backend.rescheduleAppointment(id, dateISO, startMin),
    [],
  )

  const resetDemo = useCallback(() => {
    persistSession(null)
    void backend.resetDemo()
  }, [persistSession])

  const value = useMemo<AppStateValue>(
    () => ({
      services: SERVICES,
      professionals: PROFESSIONALS,
      groups: SERVICE_GROUPS,
      categories: CATEGORIES,
      appointments: db.appointments,
      users: db.users,
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
      db.users,
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
