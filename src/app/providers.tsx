import { type ReactNode, useEffect } from 'react'
import { ConfigProvider } from 'antd'
import { AppToaster } from '@/shared/components/ui/Toaster/AppToaster'
import { useThemeStore } from '@/shared/stores/theme.store'
import { getAntdThemeConfig } from './antdTheme'

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const activeThemeId = useThemeStore((s) => s.activeThemeId)
  const isDark = activeThemeId === 'dark'

  useEffect(() => {
    useThemeStore.getState().applyActiveTheme()
  }, [])

  return (
    <ConfigProvider theme={getAntdThemeConfig(isDark)}>
      {children}
      <AppToaster />
    </ConfigProvider>
  )
}
