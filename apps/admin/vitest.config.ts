import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, '.'),
      // `server-only` lança fora de um Server Component, e o Vitest roda em
      // node puro. A diretiva continua valendo no build — aqui ela só não
      // pode impedir de testar o módulo.
      'server-only': resolve(import.meta.dirname, 'test/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules/**', '.next/**'],
  },
})
