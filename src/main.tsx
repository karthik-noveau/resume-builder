import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './app/providers'
import { Application } from './app/Application'
import { RootErrorBoundary } from './shared/components/errors/RootErrorBoundary'
import './styles/globals.css'

const rootEl = document.getElementById('root')
if (rootEl) {
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
