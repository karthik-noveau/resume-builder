/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import { writeFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import path from 'path'

// Build and test config live together deliberately. They previously sat in two
// files duplicating the same plugins and alias, and because vitest@2 bundles
// vite@5 while this project builds on vite@6, `defineConfig` from
// `vitest/config` produced vite@5 plugin types that would not assign to vite@6
// ones — `tsc -b` failed on exactly that. Using vite's own defineConfig with
// the vitest type reference keeps a single vite version in play.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const siteUrl = new URL(env.VITE_SITE_URL || 'https://resume-studio.netlify.app')
  if (!['http:', 'https:'].includes(siteUrl.protocol))
    throw new Error('VITE_SITE_URL must be an HTTP(S) origin')
  const origin = siteUrl.origin
  return {
    plugins: [
      react(),
      {
        name: 'public-site-metadata',
        apply: 'build',
        writeBundle(options) {
          const directory = options.dir ?? 'dist'
          writeFileSync(
            path.join(directory, 'robots.txt'),
            `User-agent: *\nAllow: /$\nAllow: /templates\nDisallow: /app\nDisallow: /settings\nDisallow: /editor/\n\nSitemap: ${origin}/sitemap.xml\n`
          )
          writeFileSync(
            path.join(directory, 'sitemap.xml'),
            `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url><url><loc>${origin}/templates</loc></url></urlset>\n`
          )
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Fontkit is shared by font-accurate layout measurement and PDF export.
      chunkSizeWarningLimit: 750,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom/client'],
            router: ['react-router'],
            editor: ['@dnd-kit/core', '@dnd-kit/sortable', 'framer-motion'],
            // PDF drawing remains lazy; fontkit is also needed by template layout.
            pdfLib: ['pdf-lib'],
            fontkit: ['@pdf-lib/fontkit'],
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
        exclude: ['src/tests/**', 'src/**/*.types.ts', 'src/**/*.d.ts', 'e2e/**', '*.config.*'],
      },
    },
  }
})
