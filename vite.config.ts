/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Build and test config live together deliberately. They previously sat in two
// files duplicating the same plugins and alias, and because vitest@2 bundles
// vite@5 while this project builds on vite@6, `defineConfig` from
// `vitest/config` produced vite@5 plugin types that would not assign to vite@6
// ones — `tsc -b` failed on exactly that. Using vite's own defineConfig with
// the vitest type reference keeps a single vite version in play.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router'],
          editor: ['@dnd-kit/core', '@dnd-kit/sortable', 'framer-motion'],
          pdfLib: ['pdf-lib'],
          storage: ['dexie'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup/test.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      exclude: [
        'src/tests/**',
        'src/**/*.types.ts',
        'src/**/*.d.ts',
        'e2e/**',
        '*.config.*',
      ],
    },
  },
})
