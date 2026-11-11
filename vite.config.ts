import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'

// O dev server precisa escutar em 0.0.0.0 para o preview do Freebuff alcançá-lo.
// Hosts adicionais são passados por variável de ambiente (não versionados aqui).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    // Os testes do aplicativo rodam sempre no modo local. Sem isto, o `.env` de quem
    // publica (com as chaves do projeto real) seria carregado e os testes gravariam
    // agendamentos de verdade no Firestore de produção.
    env: {
      VITE_FIREBASE_API_KEY: '',
      VITE_FIREBASE_AUTH_DOMAIN: '',
      VITE_FIREBASE_PROJECT_ID: '',
      VITE_FIREBASE_STORAGE_BUCKET: '',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '',
      VITE_FIREBASE_APP_ID: '',
      VITE_USE_EMULATORS: 'false',
    },
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
  },
})
