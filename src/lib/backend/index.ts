import { isFirebaseConfigured } from '../firebaseConfig'
import { createLocalBackend } from './local'
import type { Backend } from './types'

/**
 * Ponto único de escolha do backend.
 *
 * - Sem `.env`: modo local (localStorage), como na demonstração.
 * - Com `.env`: o adaptador Firebase entra por `import()`, então o SDK só é baixado
 *   quando é usado. Enquanto ele carrega, `currentBackend()` devolve o local — as
 *   telas não esperam nada para o primeiro paint.
 *
 * Se o carregamento do Firebase falhar (config inválida, rede), o modo local continua
 * funcionando em vez de deixar o aplicativo quebrado.
 */

const local = createLocalBackend()
let active: Backend = local

const ready: Promise<Backend> = isFirebaseConfigured
  ? import('./firestore')
      .then((module) => {
        active = module.createFirestoreBackend()
        return active
      })
      .catch((error: unknown) => {
        console.error('Firebase indisponível; mantendo o modo local.', error)
        return local
      })
  : Promise.resolve(local)

/** Backend em uso agora (local até o Firebase terminar de carregar). */
export function currentBackend(): Backend {
  return active
}

/** Resolve quando o backend definitivo estiver pronto. */
export function backendReady(): Promise<Backend> {
  return ready
}

export type { Backend } from './types'
