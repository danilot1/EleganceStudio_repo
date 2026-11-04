import { defineConfig } from 'vite'

/**
 * Build do script de seed/backfill.
 *
 * O script compartilha tipos e funções puras com o aplicativo (`src/lib/agendaDoc.ts`,
 * `src/lib/storage.ts`), então ele é empacotado pelo próprio Vite em vez de duplicar
 * dados ou mexer nas extensões dos imports. As dependências do Node (firebase-admin)
 * ficam externas e são resolvidas do `node_modules` na hora de rodar.
 */
export default defineConfig({
  // O script não serve arquivos estáticos: sem isto o build copiaria `public/` junto.
  publicDir: false,
  build: {
    ssr: 'scripts/seed.ts',
    outDir: 'dist-seed',
    emptyOutDir: true,
    target: 'node22',
    rollupOptions: {
      output: { entryFileNames: 'seed.mjs' },
    },
  },
})
