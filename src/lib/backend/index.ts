import { firestoreBackend } from './firestore'
import type { Backend } from './types'

/**
 * Ponto único de acesso ao banco.
 *
 * O `AppState` importa daqui, e os testes substituem este módulo por uma implementação
 * em memória (`src/test/fakeBackend.ts`). Assim o SDK do Firebase não é carregado na
 * suíte de testes e não é preciso rede para rodá-la.
 */
export const backend: Backend = firestoreBackend

export type { ActionResult, AppointmentResult, Backend, NewAppointmentInput, SignUpInput } from './types'
