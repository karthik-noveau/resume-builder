import { useEffect, useState } from 'react'
import { AppRouter } from './router'
import { fontRegistry } from '@/shared/services/font.registry'
import { logger } from '@/shared/services/logger'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'

const fontsReady = fontRegistry.initialize()

export function Application() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let mounted = true
    void fontsReady
      .catch((error: unknown) => {
        logger.error('Fonts unavailable; using fallback typography', error)
      })
      .finally(() => {
        if (mounted) setReady(true)
      })
    return () => {
      mounted = false
    }
  }, [])
  return ready ? (
    <AppRouter />
  ) : (
    <main className="app-loading">
      <Spinner size={28} label="Opening Resume Studio…" />
    </main>
  )
}
