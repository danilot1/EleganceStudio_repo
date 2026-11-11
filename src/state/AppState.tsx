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
import { backendReady, currentBackend } from '../lib/backend'
import { todayISO } from '../lib/dates'
import { isFirebaseConfigured } from '../lib/firebaseConfig'
import type {
  ActionResult,
  CreateResult,
  NewAppointmentInput,
  ServicePatch,
  SignUpInput,
} from '../lib/backend/types'
import type { MailDraft, OutgoingMail } from '../lib/notifications'
import { loadDatabase, type Database } from '../lib/storage'
import type {
  Appointment,
  AppointmentStatus,
  PaymentMethod,
  Service,
  Session,
  User,
} from '../lib/types'

export type { ActionResult, NewAppointmentInput, SignUpInput }

const SESSION_KEY = 'elegance-studio:session'

interface AppStateValue {
  /** Catálogo em uso: serviços ativos, com os ajustes feitos pela gestão. */
  services: Service[]
  /** Catálogo completo, incluindo os desativados (usado pela aba Serviços da gestão). */
  allServices: Service[]
  professionals: typeof PROFESSIONALS
  groups: typeof SERVICE_GROUPS
  categories: typeof CATEGORIES
  appointments: Appointment[]
  /**
   * Atendimentos que ocupam a agenda, de todas as clientes, só com horário e status.
   * É a base dos horários livres: `appointments` traz apenas o que a pessoa pode ler.
   */
  busyAppointments: Appointment[]
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
  updateService: (id: string, patch: ServicePatch) => Promise<ActionResult>
  /** Avisos por e-mail registrados (modo demonstração; vazio no Firebase). */
  outbox: OutgoingMail[]
  queueMail: (draft: MailDraft) => Promise<ActionResult>
  /** Registra os lembretes de véspera que ainda não existem. Devolve quantos criou. */
  queueReminders: () => Promise<number>
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
  // Com Firebase configurado, começar com a carga de exemplo local faria a agenda real
  // piscar atendimentos fictícios antes do primeiro snapshot do servidor.
  const [db, setDb] = useState<Database>(() =>
    isFirebaseConfigured
      ? {
          version: 1,
          seedDateISO: todayISO(),
          users: [],
          appointments: [],
          serviceOverrides: {},
        }
      : loadDatabase(),
  )
  const [session, setSession] = useState<Session | null>(() => readSession())

  // O catálogo base é `data/catalog.ts`; a gestão só grava ajustes por serviço. Derivar
  // a lista aqui (em vez de espalhar condições pelas telas) mantém preço, duração e
  // disponibilidade consistentes no agendamento, na agenda e no painel.
  const allServices = useMemo<Service[]>(
    () =>
      SERVICES.map((service) => ({
        ...service,
        ...db.serviceOverrides[service.id],
      })),
    [db.serviceOverrides],
  )
  const services = useMemo(
    () => allServices.filter((service) => service.active !== false),
    [allServices],
  )

  useEffect(() => {
    let alive = true
    let stopData = () => {}
    let stopSession = () => {}

    // O backend definitivo pode chegar depois: o Firebase é carregado sob demanda.
    void backendReady().then((api) => {
      if (!alive) return
      stopData = api.subscribe((next) => setDb(next))
      // Só o Firebase avisa a sessão por fora (token renovado, saída em outra aba).
      if (api.subscribeSession) {
        stopSession = api.subscribeSession((next) => {
          // Sem regravar o storage: a sessão restaurada mantém a escolha original de
          // "Lembrar-me" feita no login.
          setSession(next)
        })
      }
    })

    return () => {
      alive = false
      stopData()
      stopSession()
    }
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
      const result = await currentBackend().signIn(email, password, remember)
      if (result.ok && result.session) persistSession(result.session, remember)
      return { ok: result.ok, error: result.error }
    },
    [persistSession],
  )

  const signUp = useCallback(
    async (input: SignUpInput): Promise<ActionResult> => {
      const result = await currentBackend().signUp(input)
      if (result.ok && result.session) persistSession(result.session)
      return { ok: result.ok, error: result.error }
    },
    [persistSession],
  )

  const logout = useCallback(() => {
    persistSession(null)
    void currentBackend().signOut()
  }, [persistSession])

  const requestPasswordReset = useCallback(
    (identifier: string): Promise<ActionResult> => currentBackend().requestPasswordReset(identifier),
    [],
  )

  const createAppointment = useCallback(
    (input: NewAppointmentInput): Promise<CreateResult> =>
      currentBackend().createAppointment(input, session),
    [session],
  )

  const setAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus): Promise<void> =>
      currentBackend().setAppointmentStatus(id, status),
    [],
  )

  const registerNoShow = useCallback(
    (id: string): Promise<ActionResult> => currentBackend().registerNoShow(id),
    [],
  )

  const registerPayment = useCallback(
    (id: string, method: PaymentMethod): Promise<void> => currentBackend().registerPayment(id, method),
    [],
  )

  const rescheduleAppointment = useCallback(
    (id: string, dateISO: string, startMin: number): Promise<ActionResult> =>
      currentBackend().rescheduleAppointment(id, dateISO, startMin),
    [],
  )

  const updateService = useCallback(
    (id: string, patch: ServicePatch): Promise<ActionResult> =>
      currentBackend().updateService(id, patch),
    [],
  )

  const queueMail = useCallback(
    (draft: MailDraft): Promise<ActionResult> => currentBackend().queueMail(draft),
    [],
  )

  const queueReminders = useCallback(
    (): Promise<number> => currentBackend().queueReminders(),
    [],
  )

  const resetDemo = useCallback(() => {
    persistSession(null)
    void currentBackend().resetDemo()
  }, [persistSession])

  const value = useMemo<AppStateValue>(
    () => ({
      services,
      allServices,
      professionals: PROFESSIONALS,
      groups: SERVICE_GROUPS,
      categories: CATEGORIES,
      appointments: db.appointments,
      busyAppointments: db.busy ?? db.appointments,
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
      updateService,
      outbox: db.outbox ?? [],
      queueMail,
      queueReminders,
      resetDemo,
    }),
    [
      db.appointments,
      db.busy,
      db.users,
      session,
      services,
      allServices,
      login,
      signUp,
      logout,
      requestPasswordReset,
      createAppointment,
      setAppointmentStatus,
      registerNoShow,
      registerPayment,
      rescheduleAppointment,
      updateService,
      db.outbox,
      queueMail,
      queueReminders,
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
