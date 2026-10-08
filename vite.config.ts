/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createReadStream, existsSync } from 'node:fs'
import path from 'path'

// Build and test config live together deliberately. They previously sat in two
// files duplicating the same plugins and alias, and because vitest@2 bundles
// vite@5 while this project builds on vite@6, `defineConfig` from
// `vitest/config` produced vite@5 plugin types that would not assign to vite@6
// ones — `tsc -b` failed on exactly that. Using vite's own defineConfig with
// the vitest type reference keeps a single vite version in play.
export default defineConfig({
    plugins: [react(), {
      name: 'production-route-preview',
      configurePreviewServer(server) {
        // Mirror Netlify's private shells and real 404s in production previews.
        server.middlewares.use((request, response, next) => {
          const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
          const isWorkspace = ['/app', '/app/', '/settings', '/settings/', '/share', '/share/'].includes(pathname) || pathname.startsWith('/editor/')
          const output = path.resolve(server.config.root, server.config.build.outDir)
          const asset = path.resolve(output, `.${pathname}`)
          const isAsset = asset.startsWith(output + path.sep) && existsSync(asset)
          const publicPage = path.join(asset, 'index.html')
          if (!isWorkspace && isAsset && existsSync(publicPage)) {
            response.setHeader('Content-Type', 'text/html; charset=utf-8')
            createReadStream(publicPage).pipe(response)
            return
          }
          if (!isWorkspace && (pathname === '/' || isAsset)) return next()
          response.statusCode = isWorkspace ? 200 : 404
          response.setHeader('Content-Type', 'text/html; charset=utf-8')
          response.setHeader('X-Robots-Tag', 'noindex, nofollow')
          createReadStream(path.join(output, isWorkspace ? 'workspace.html' : '404.html')).pipe(response)
        })
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      manifest: true,
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
})
