import type { Backend } from './types'
import { createLocalBackend } from './local'

/**
 * Backend em uso.
 *
 * Fase atual do plano: camada de dados isolada, ainda em modo local (idêntico ao
 * protótipo). O adaptador Firestore implementa este mesmo contrato e passa a ser
 * escolhido por `isFirebaseConfigured` quando as variáveis do `.env` existirem —
 * sem que nenhum componente mude.
 */
export const backend: Backend = createLocalBackend()

export type { Backend } from './types'
