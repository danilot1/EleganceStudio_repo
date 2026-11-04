import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore'

/**
 * Configuração do Firebase.
 *
 * As variáveis `VITE_FIREBASE_*` são públicas por natureza (identificam o projeto, não
 * autorizam nada sozinhas) — a proteção real fica em `firestore.rules`. Quando elas não
 * existem, `isFirebaseConfigured` é `false` e o aplicativo continua no modo local, sem
 * nenhuma tela de erro: a demonstração nunca deixa de abrir.
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const REQUIRED: Array<[string, string | undefined]> = [
  ['VITE_FIREBASE_API_KEY', config.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', config.authDomain],
  ['VITE_FIREBASE_PROJECT_ID', config.projectId],
  ['VITE_FIREBASE_APP_ID', config.appId],
]

/** Nomes das variáveis ausentes — útil em mensagem de documentação, não em tela. */
export const missingFirebaseVars: string[] = REQUIRED.filter(([, value]) => !value).map(
  ([name]) => name,
)

export const isFirebaseConfigured = missingFirebaseVars.length === 0

let app: FirebaseApp | null = null
let auth: Auth | null = null
let firestore: Firestore | null = null
let emulatorsConnected = false

function ensureApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase não configurado: preencha as variáveis VITE_FIREBASE_* no .env.')
  }
  if (!app) {
    app = getApps()[0] ?? initializeApp(config)
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
    const instance = ensureApp()
    auth = getAuth(instance)
  }
  return auth
}

export function firebaseDb(): Firestore {
  if (!firestore) {
    const instance = ensureApp()
    firestore = getFirestore(instance)
    connectEmulators(firebaseAuth(), firestore)
  }
  return firestore
}
