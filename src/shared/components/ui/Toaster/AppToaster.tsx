import { Toaster } from 'sonner'
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
      offset={HEADER_OFFSET_PX}
      gap={10}
      closeButton
      toastOptions={{
        classNames: {
          toast: styles.toast,
          title: styles.title,
          description: styles.description,
          icon: styles.icon,
          closeButton: styles.closeButton,
        },
      }}
    />
  )
}
