import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Providers } from './app/providers'
import { AppRouter } from './app/router'
import { fontRegistry } from './shared/services/font.registry'
import { logger } from './shared/services/logger'
import './styles/globals.css'

async function bootstrap() {
  await fontRegistry.initialize()
  logger.info('Application starting')

  const rootEl = document.getElementById('root')
  if (!rootEl) throw new Error('Root element #root not found in index.html')

  createRoot(rootEl).render(
    <StrictMode>
      <Providers>
        <AppRouter />
      </Providers>
    </StrictMode>
  )
}

bootstrap().catch((err: unknown) => {
  logger.error('Failed to start application', err)
})
