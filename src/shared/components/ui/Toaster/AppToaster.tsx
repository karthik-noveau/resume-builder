import { Toaster } from 'sonner'
import { Check, CircleAlert, Info, TriangleAlert, X } from 'lucide-react'
import { useThemeStore } from '@/shared/stores/theme.store'
import styles from './AppToaster.module.css'

/** Height of the app header / editor toolbar the toast must clear. */
const HEADER_OFFSET_PX = 76

/**
 * Application toast surface.
 *
 * Wraps sonner so its appearance is driven by the app's tokens rather than its
 * own defaults. Two things it fixes:
 *
 * - sonner defaults to `theme="light"`. Without binding it to the theme store,
 *   a success toast rendered as pale mint on the dark UI.
 * - the default top-right position sits at y=0, overlapping the editor
 *   toolbar and covering the Export and Guided Setup buttons.
 *
 * `richColors` is deliberately not used: it forces sonner's own green/red
 * palette, which does not match --color-success / --color-error.
 */
export function AppToaster() {
  const isDark = useThemeStore((s) => s.activeThemeId === 'dark')

  return (
    <Toaster
      theme={isDark ? 'dark' : 'light'}
      position="top-right"
      duration={4000}
      offset={{ top: HEADER_OFFSET_PX, right: 24, bottom: 24, left: 24 }}
      mobileOffset={{ top: HEADER_OFFSET_PX, right: 12, bottom: 12, left: 12 }}
      gap={10}
      closeButton
      icons={{
        success: <Check size={16} strokeWidth={2.25} aria-hidden="true" />,
        error: <CircleAlert size={16} aria-hidden="true" />,
        warning: <TriangleAlert size={16} aria-hidden="true" />,
        info: <Info size={16} aria-hidden="true" />,
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
