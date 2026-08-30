import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
      // `server-only` throws outside a React Server Component graph. The modules
      // under test import it as a guard against client bundling, which is not a
      // concern here, so it resolves to an empty stub.
      'server-only': fileURLToPath(new URL('./test/stubs/server-only.ts', import.meta.url)),
    },
  },
  test: {
    include: ['{server,lib}/**/*.test.ts'],
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
  },
})
