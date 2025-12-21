import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    // Environnement de test (node pour les tests serveur, jsdom pour les tests React)
    environment: 'node',
    // Fichier de setup global
    setupFiles: ['./__tests__/setup/vitest.setup.ts'],
    // Patterns pour trouver les fichiers de test
    include: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    // Exclure node_modules
    exclude: ['node_modules', '.next', 'dist'],
    // Configuration de la couverture de code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '**/*.config.*',
        '**/*.d.ts',
        '.next/',
        'dist/',
      ],
    },
    // Timeout global pour les tests (30 secondes)
    testTimeout: 30000,
    // Configuration pour les tests globaux
    globals: true,
  },
  resolve: {
    // Alias pour les imports avec @/
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})

