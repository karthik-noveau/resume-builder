import { useEffect, useState } from 'react'
import { AppRouter } from './router'
import { fontRegistry } from '@/shared/services/font.registry'
import { fontsReady } from './bootstrap'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'

export function Application() {
  const [ready, setReady] = useState(fontRegistry.isReady())
  useEffect(() => {
    let mounted = true
    void fontsReady.finally(() => {
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
      <Spinner size={28} label="Opening Resume Builder…" />
    </main>
  )
}
