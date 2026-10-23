import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/**
 * Inicialização do Firebase.
 *
 * A configuração vem de variáveis de ambiente (`.env`, fora do versionamento) porque
 * muda por projeto e por ambiente. Os valores do app web NÃO são segredos — o que
 * protege os dados são as regras do Firestore (firestore.rules) — mas também não
 * pertencem ao repositório.
 *
 * Ver `.env.example` e o passo a passo no README.
 */

const CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
}

const ENV_VAR_NAME: Record<keyof typeof CONFIG, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
}

/** Nomes das variáveis que ainda faltam, para a tela de configuração. */
export const missingFirebaseVars: string[] = (
  Object.keys(CONFIG) as Array<keyof typeof CONFIG>
)
  .filter((key) => !String(CONFIG[key] ?? '').trim())
  .map((key) => ENV_VAR_NAME[key])

export const isFirebaseConfigured = missingFirebaseVars.length === 0

let app: FirebaseApp | undefined

function firebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured) {
    throw new Error(`Firebase sem configuração. Defina: ${missingFirebaseVars.join(', ')}`)
  }
  // Reutiliza a instância: o StrictMode monta os efeitos duas vezes.
  app ??= initializeApp(CONFIG as Record<string, string>)
  return app
}

/** Instância única do Authentication. */
export function firebaseAuth(): Auth {
  return getAuth(firebaseApp())
}

/** Instância única do Firestore. */
export function firestore(): Firestore {
  return getFirestore(firebaseApp())
}
