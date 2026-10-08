import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './app/providers'
import { Application } from './app/Application'
import { fontsReady } from './app/bootstrap'
import { routerReady } from './app/router'
import { RootErrorBoundary } from './shared/components/errors/RootErrorBoundary'
import './styles/globals.css'

const rootEl = document.getElementById('root')
function mount() {
  if (!rootEl) return
  // React owns the tags after startup; remove the build's copies once, so
  // navigation cannot leave duplicate titles, canonicals, or social metadata.
  document.querySelectorAll('[data-seo]').forEach((tag) => tag.remove())
  createRoot(rootEl).render(
    <StrictMode>
      <RootErrorBoundary>
        <Providers>
          <Application />
        </Providers>
      </RootErrorBoundary>
    </StrictMode>
  )
}

if (document.documentElement.dataset.prerendered) {
  // Keep the useful, styled HTML on screen while editor fonts and the route load.
  void Promise.all([fontsReady, routerReady]).then(mount)
} else {
  mount()
}
