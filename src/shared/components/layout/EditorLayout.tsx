import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PanelLeft, PanelRight } from 'lucide-react'
import { Drawer } from '@/shared/components/ui/Drawer/Drawer'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { clsx } from 'clsx'
import styles from './EditorLayout.module.css'

interface EditorLayoutProps {
  toolbar: ReactNode
  sidebar: ReactNode
  canvas: ReactNode
  propertiesPanel: ReactNode
  tourOpen?: boolean
  propertiesRequest?: string
}

/**
 * Three-panel editor shell: toolbar + left sidebar + canvas + right properties panel.
 * Below the `lg` breakpoint, the side panels move into slide-over drawers
 * (toggled by floating buttons) instead of fixed-width columns — there isn't
 * room for a 280px + flexible + 350px layout under ~1024px.
 */
export function EditorLayout({ toolbar, sidebar, canvas, propertiesPanel, tourOpen = false, propertiesRequest }: EditorLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false)
  const previousRequest = useRef(propertiesRequest)

  useEffect(() => {
    if (propertiesRequest === previousRequest.current) return
    previousRequest.current = propertiesRequest
    if (!isDesktop && !tourOpen) {
      setMobileSidebarOpen(false)
      setMobilePropertiesOpen(true)
    }
  }, [propertiesRequest, isDesktop, tourOpen])

  return (
    <div className={styles.root} inert={tourOpen}>
      {/* Toolbar — 64px */}
      <header className={styles.header}>
        {toolbar}
      </header>

      <div className={styles.body}>
        {isDesktop && (
          <aside
            className={styles.sidebar}
            aria-label="Resume sections"
            tabIndex={0}
          >
            {sidebar}
          </aside>
        )}

        {/* Canvas — flexible. Purely a layout slot: the actual interactive,
            labeled, focusable scroll region is Canvas.tsx's own element. */}
        <main className={styles.canvas}>
          {canvas}
        </main>

        {isDesktop && (
          <aside
            className={styles.propertiesPanel}
            aria-label="Properties panel"
            tabIndex={0}
          >
            {propertiesPanel}
          </aside>
        )}

        {!isDesktop && (
          <>
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sections panel"
              data-editor-tour="sections-toggle"
              className={clsx(styles.mobileToggle, styles.mobileToggleLeft)}
            >
              <PanelLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setMobilePropertiesOpen(true)}
              aria-label="Open properties panel"
              data-editor-tour="properties-toggle"
              className={clsx(styles.mobileToggle, styles.mobileToggleRight)}
            >
              <PanelRight size={18} aria-hidden="true" />
            </button>

            <Drawer
              isOpen={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
              position="left"
              title="Sections"
              width="280px"
              flush
            >
              {sidebar}
            </Drawer>
            <Drawer
              isOpen={mobilePropertiesOpen}
              onClose={() => setMobilePropertiesOpen(false)}
              position="right"
              title="Properties"
              width="384px"
              flush
            >
              {propertiesPanel}
            </Drawer>
          </>
        )}
      </div>
    </div>
  )
}
