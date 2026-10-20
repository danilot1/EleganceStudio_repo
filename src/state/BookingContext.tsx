import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * Estado do fluxo de agendamento (as 4 etapas do protótipo).
 * Fica em `sessionStorage` para o estudante poder recarregar a página sem perder o
 * progresso — mas some ao fechar a aba, como um carrinho de compras.
 */

const BOOKING_KEY = 'elegance-studio:booking'

export interface BookingDraft {
  serviceId?: string
  professionalId?: string
  dateISO?: string
  startMin?: number
  clientName?: string
  clientNote?: string
}

interface BookingValue {
  draft: BookingDraft
  /** false enquanto o rascunho salvo em sessionStorage ainda está sendo lido. */
  ready: boolean
  update: (patch: Partial<BookingDraft>) => void
  clear: () => void
  /** Apago do passo atual para evitar pedidos "pela metade" ao voltar etapas. */
  clearFrom: (step: 'service' | 'professional' | 'datetime') => void
}

const BookingContext = createContext<BookingValue | null>(null)

function readDraft(): BookingDraft {
  try {
    const raw = window.sessionStorage.getItem(BOOKING_KEY)
    return raw ? (JSON.parse(raw) as BookingDraft) : {}
  } catch {
    return {}
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<BookingDraft>({})
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setDraft(readDraft())
    setReady(true)
  }, [])

  useEffect(() => {
    try {
      window.sessionStorage.setItem(BOOKING_KEY, JSON.stringify(draft))
    } catch {
      // sem sessionStorage: estado só em memória
    }
  }, [draft])

  const update = useCallback((patch: Partial<BookingDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
  }, [])

  const clear = useCallback(() => setDraft({}), [])

  const clearFrom = useCallback((step: 'service' | 'professional' | 'datetime') => {
    setDraft((current) => {
      if (step === 'service') {
        return { clientName: current.clientName, clientNote: current.clientNote }
      }
      if (step === 'professional') {
        return {
          serviceId: current.serviceId,
          clientName: current.clientName,
          clientNote: current.clientNote,
        }
      }
      return {
        serviceId: current.serviceId,
        professionalId: current.professionalId,
        clientName: current.clientName,
        clientNote: current.clientNote,
      }
    })
  }, [])

  const value = useMemo<BookingValue>(
    () => ({ draft, ready, update, clear, clearFrom }),
    [draft, ready, update, clear, clearFrom],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

export function useBooking(): BookingValue {
  const context = useContext(BookingContext)
  if (!context) throw new Error('useBooking precisa estar dentro de <BookingProvider>')
  return context
}

/**
 * Inicia o agendamento a partir de um botão "Escolher/Agendar" de qualquer tela:
 * grava o serviço escolhido, limpa as etapas seguintes e segue para a escolha da expert.
 */
export function useStartBooking(): (serviceId: string) => void {
  const navigate = useNavigate()
  const { update, clearFrom } = useBooking()
  return useCallback(
    (serviceId: string) => {
      clearFrom('professional')
      update({ serviceId })
      navigate('/agendar/expert')
    },
    [navigate, update, clearFrom],
  )
}
