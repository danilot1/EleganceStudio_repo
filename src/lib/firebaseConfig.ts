/**
 * Detecção da configuração do Firebase, sem importar o SDK.
 *
 * Este arquivo é o único que o bundle principal consulta: assim o SDK (Auth +
 * Firestore) só é baixado quando o `.env` existe — o modo de demonstração continua
 * leve e os testes nunca tocam no Firebase.
 *
 * As variáveis `VITE_FIREBASE_*` são públicas por natureza (identificam o projeto, não
 * autorizam nada sozinhas). A proteção real fica em `firestore.rules`.
 */

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const REQUIRED: Array<[string, string | undefined]> = [
  ['VITE_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['VITE_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['VITE_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['VITE_FIREBASE_APP_ID', firebaseConfig.appId],
]

/** Nomes das variáveis ausentes — documentação, não mensagem de tela. */
export const missingFirebaseVars: string[] = REQUIRED.filter(([, value]) => !value).map(
  ([name]) => name,
)

export const isFirebaseConfigured = missingFirebaseVars.length === 0
