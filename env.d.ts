/// <reference types="vite/client" />

// Lives at the repo root rather than in src/ on purpose: .gitignore blocks
// src/**/*.d.ts to stop stray tsc emits shadowing sources, which would take a
// hand-written declaration file with it.

interface ImportMetaEnv {
  /** Absolute origin used for canonical, og:url and sitemap links. */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
