import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'
import { firebaseConfig, isFirebaseConfigured } from './firebaseConfig'

export { isFirebaseConfigured, missingFirebaseVars } from './firebaseConfig'

/**
 * Inicialização preguiçosa do SDK.
 *
 * Só é chamada pelo adaptador Firestore (`lib/backend/firestore.ts`), que por sua vez é
 * carregado por `import()` quando o `.env` está preenchido. Sem configuração, nada disto
 * entra no bundle e o aplicativo segue no modo local.
 */

let app: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null
let emulatorsConnected = false

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase não configurado: preencha as variáveis VITE_FIREBASE_* no .env.')
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig)
  }
  return app
}

/** Conecta aos emuladores apenas em desenvolvimento e quando pedido explicitamente. */
function connectEmulators(authInstance: Auth, store: Firestore): void {
  if (emulatorsConnected || !import.meta.env.DEV) return
  if (import.meta.env.VITE_USE_EMULATORS !== 'true') return
  connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(store, '127.0.0.1', 8080)
  emulatorsConnected = true
}

export function firebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(ensureApp())
  }
  return auth
}

export function firebaseDb(): Firestore {
  if (!firestore) {
    firestore = getFirestore(ensureApp())
    connectEmulators(firebaseAuth(), firestore)
  }
  return firestore
}
