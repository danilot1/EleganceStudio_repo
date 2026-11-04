import { defineConfig } from 'vitest/config'

/**
 * Testes de regra rodam no Node, contra o emulador do Firestore.
 * Ficam fora do `npm test` (que é rápido, em jsdom e sem rede) e são executados por
 * `npm run test:rules`, que sobe o emulador via `firebase emulators:exec`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
})
