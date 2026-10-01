import { Toaster } from 'sonner'
import { Check, CircleAlert, Info, TriangleAlert, X } from 'lucide-react'
import { useThemeStore } from '@/shared/stores/theme.store'
import styles from './AppToaster.module.css'

/** Reserve floating notices for results that need attention; forms and saving
 * report their status inline. Keep notices away from the header and clear of
 * the mobile editor's bottom action rows. */
export function AppToaster() {
  const isDark = useThemeStore((s) => s.activeThemeId === 'dark')

  return (
    <Toaster
      theme={isDark ? 'dark' : 'light'}
      className={styles.toaster}
      position="bottom-right"
      duration={5000}
      offset={{ bottom: 24, right: 24, left: 24 }}
      mobileOffset={{ bottom: 'calc(112px + env(safe-area-inset-bottom))', right: 12, left: 12 }}
      gap={8}
      visibleToasts={2}
      expand
      closeButton
      icons={{
        success: <Check size={18} strokeWidth={2.5} aria-hidden="true" />,
        error: <CircleAlert size={18} aria-hidden="true" />,
        warning: <TriangleAlert size={18} aria-hidden="true" />,
        info: <Info size={18} aria-hidden="true" />,
        close: <X size={14} aria-hidden="true" />,
      }}
      toastOptions={{
        classNames: {
          toast: styles.toast,
          content: styles.content,
          title: styles.title,
          description: styles.description,
          icon: styles.icon,
          closeButton: styles.closeButton,
        },
      }}
    />
  )
}
