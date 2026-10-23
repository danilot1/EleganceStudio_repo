import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { CATEGORIES, PROFESSIONALS, SERVICE_GROUPS, SERVICES } from '../data/catalog'
import { backend } from '../lib/backend'
import type {
  ActionResult,
  AppointmentResult,
  NewAppointmentInput,
  SignUpInput,
} from '../lib/backend/types'
import { isValidEmail } from '../lib/format'
import { canRegisterNoShow } from '../lib/noShow'
import type {
  Appointment,
  AppointmentStatus,
  BusySlot,
  PaymentMethod,
  Session,
} from '../lib/types'

export type { NewAppointmentInput, SignUpInput }

/** Canal escolhido na tela de recuperação de senha. */
export type RecoveryChannel = 'email' | 'whatsapp'

interface AppStateValue {
  services: typeof SERVICES
  professionals: typeof PROFESSIONALS
  groups: typeof SERVICE_GROUPS
  categories: typeof CATEGORIES
  /** Atendimentos visíveis para quem está conectado (próprios ou todos, se gestão). */
  appointments: Appointment[]
  /** Blocos de agenda usados para calcular horários livres. */
  agenda: BusySlot[]
  session: Session | null
  /** false enquanto o Firebase ainda não respondeu quem é o usuário. */
  ready: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<ActionResult>
  signUp: (input: SignUpInput) => Promise<ActionResult>
  logout: () => Promise<void>
  requestPasswordReset: (identifier: string, channel?: RecoveryChannel) => Promise<ActionResult>
  createAppointment: (input: NewAppointmentInput) => Promise<AppointmentResult>
  setAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<ActionResult>
  /** Marca a falta da cliente e libera o horário na agenda. */
  registerNoShow: (id: string) => Promise<ActionResult>
  registerPayment: (id: string, method: PaymentMethod) => Promise<ActionResult>
  rescheduleAppointment: (id: string, dateISO: string, startMin: number) => Promise<ActionResult>
}

const AppStateContext = createContext<AppStateValue | null>(null)

/**
 * Estado do app sobre o Firebase.
 *
 * O Firestore é a fonte da verdade: os agendamentos chegam por `onSnapshot`, então
 * qualquer alteração feita em outro dispositivo aparece aqui sem recarregar.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [agenda, setAgenda] = useState<BusySlot[]>([])

  useEffect(
    () =>
      backend.watchSession((next) => {
        setSession(next)
        setReady(true)
      }),
    [],
  )

  // A consulta muda com o perfil: cliente lê os próprios atendimentos, gestão lê todos.
  const userId = session?.userId
  const role = session?.role
  useEffect(() => {
    if (!ready || !session) {
      setAppointments([])
      return
    }
    return backend.watchAppointments(session, setAppointments)
    // `session` só muda quando o login muda; usar os campos evita reassinar à toa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, userId, role])

  useEffect(() => {
    if (!ready) return
    return backend.watchAgenda(setAgenda)
  }, [ready])

  const login = useCallback(
    async (email: string, password: string, remember = true): Promise<ActionResult> => {
      const result = await backend.signIn(email, password, remember)
      if (result.session) {
        setSession(result.session)
        setReady(true)
      }
      return result.ok ? { ok: true } : { ok: false, error: result.error }
    },
    [],
  )

  const signUp = useCallback(async (input: SignUpInput): Promise<ActionResult> => {
    const result = await backend.signUp(input)
    if (result.session) {
      setSession(result.session)
      setReady(true)
    }
    return result.ok ? { ok: true } : { ok: false, error: result.error }
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    try {
      await backend.signOut()
    } finally {
      setSession(null)
    }
  }, [])

  const requestPasswordReset = useCallback(
    async (identifier: string, channel: RecoveryChannel = 'email'): Promise<ActionResult> => {
      if (channel === 'whatsapp') {
        return {
          ok: false,
          error:
            'A recuperação por WhatsApp não existe: o Firebase envia o link de redefinição apenas por e-mail.',
        }
      }
      const email = identifier.trim()
      if (!isValidEmail(email)) return { ok: false, error: 'Informe um e-mail válido.' }
      return backend.sendPasswordReset(email)
    },
    [],
  )

  const createAppointment = useCallback(
    (input: NewAppointmentInput): Promise<AppointmentResult> =>
      backend.createAppointment(input, session),
    [session],
  )

  const setAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus): Promise<ActionResult> =>
      backend.setAppointmentStatus(id, status),
    [],
  )

  const registerNoShow = useCallback(
    async (id: string): Promise<ActionResult> => {
      const target = appointments.find((item) => item.id === id)
      if (!target) return { ok: false, error: 'Agendamento não encontrado.' }
      if (!canRegisterNoShow(target)) {
        return {
          ok: false,
          error:
            'Só é possível registrar falta depois do horário marcado e antes de concluir ou cancelar o atendimento.',
        }
      }
      return backend.registerNoShow(id)
    },
    [appointments],
  )

  const registerPayment = useCallback(
    (id: string, method: PaymentMethod): Promise<ActionResult> =>
      backend.registerPayment(id, method),
    [],
  )

  const rescheduleAppointment = useCallback(
    (id: string, dateISO: string, startMin: number): Promise<ActionResult> =>
      backend.rescheduleAppointment(id, dateISO, startMin),
    [],
  )

  const value = useMemo<AppStateValue>(
    () => ({
      services: SERVICES,
      professionals: PROFESSIONALS,
      groups: SERVICE_GROUPS,
      categories: CATEGORIES,
      appointments,
      agenda,
      session,
      ready,
      login,
      signUp,
      logout,
      requestPasswordReset,
      createAppointment,
      setAppointmentStatus,
      registerNoShow,
      registerPayment,
      rescheduleAppointment,
    }),
    [
      appointments,
      agenda,
      session,
      ready,
      login,
      signUp,
      logout,
      requestPasswordReset,
      createAppointment,
      setAppointmentStatus,
      registerNoShow,
      registerPayment,
      rescheduleAppointment,
    ],
  )

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState precisa estar dentro de <AppStateProvider>')
  return context
}
