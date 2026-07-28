import { useState, type ReactNode } from 'react'
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
}

/**
 * Three-panel editor shell: toolbar + left sidebar + canvas + right properties panel.
 * Below the `lg` breakpoint, the side panels move into slide-over drawers
 * (toggled by floating buttons) instead of fixed-width columns — there isn't
 * room for a 280px + flexible + 350px layout under ~1024px.
 */
export function EditorLayout({ toolbar, sidebar, canvas, propertiesPanel }: EditorLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobilePropertiesOpen, setMobilePropertiesOpen] = useState(false)

  return (
    <div className={styles.root}>
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
              className={clsx(styles.mobileToggle, styles.mobileToggleLeft)}
            >
              <PanelLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setMobilePropertiesOpen(true)}
              aria-label="Open properties panel"
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
            >
              {sidebar}
            </Drawer>
            <Drawer
              isOpen={mobilePropertiesOpen}
              onClose={() => setMobilePropertiesOpen(false)}
              position="right"
              title="Properties"
              width="320px"
            >
              {propertiesPanel}
            </Drawer>
          </>
        )}
      </div>
    </div>
  )
}
