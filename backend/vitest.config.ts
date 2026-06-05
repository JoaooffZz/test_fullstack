import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/helpers/**'],
    // Executa arquivos de test em sequência para evitar race conditions no banco
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
