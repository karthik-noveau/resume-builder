import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FileText, Palette, MousePointer2, List } from 'lucide-react'
import { Drawer } from '@/shared/components/ui/Drawer/Drawer'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useEditorStore } from '@/shared/stores/editor.store'
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
 * On smaller screens, content and design use the available width and preview
 * has its own view. The section list remains available in a drawer.
 */
export function EditorLayout({
  toolbar,
  sidebar,
  canvas,
  propertiesPanel,
  tourOpen = false,
  propertiesRequest,
}: EditorLayoutProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [mobileView, setMobileView] = useState<'content' | 'design' | 'preview'>('content')
  const setInspectorMode = useEditorStore((state) => state.setInspectorMode)
  const previousRequest = useRef(propertiesRequest)
  const designOpenRequest = useEditorStore((state) => state.designOpenRequest)
  const previousDesignRequest = useRef(designOpenRequest)
  useEffect(() => {
    if (!isDesktop && mobileView !== 'preview') setInspectorMode(mobileView)
  }, [isDesktop, mobileView, setInspectorMode])

  useEffect(() => {
    if (propertiesRequest === previousRequest.current) return
    previousRequest.current = propertiesRequest
    if (!isDesktop && !tourOpen) {
      setMobileSidebarOpen(false)
      setMobileView('content')
      setInspectorMode('content')
    }
  }, [propertiesRequest, isDesktop, tourOpen, setInspectorMode])

  useEffect(() => {
    if (designOpenRequest === previousDesignRequest.current) return
    previousDesignRequest.current = designOpenRequest
    if (!isDesktop && !tourOpen) {
      setMobileSidebarOpen(false)
      setMobileView('design')
      setInspectorMode('design')
    }
  }, [designOpenRequest, isDesktop, tourOpen, setInspectorMode])

  return (
    <div className={styles.root} inert={tourOpen}>
      {/* A full-width toolbar keeps editing controls attached to the workspace. */}
      <header className={styles.header}>{toolbar}</header>

      <div className={styles.body}>
        {isDesktop && (
          <aside className={styles.sidebar} aria-label="Resume sections" tabIndex={0}>
            {sidebar}
          </aside>
        )}

        {/* Canvas — flexible. Purely a layout slot: the actual interactive,
            labeled, focusable scroll region is Canvas.tsx's own element. */}
        <main className={styles.canvas} hidden={!isDesktop && mobileView !== 'preview'}>
          {canvas}
        </main>

        {isDesktop && (
          <aside className={styles.propertiesPanel} aria-label="Properties panel" tabIndex={0}>
            {propertiesPanel}
          </aside>
        )}

        {!isDesktop && (
          <>
            {mobileView !== 'preview' && (
              <main className={styles.mobilePanel} aria-label="Properties panel">
                <div className={styles.mobileSectionBar}>
                  <span>
                    {mobileView === 'content' ? 'Edit your resume' : 'Customize your design'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    data-editor-tour="sections-toggle"
                  >
                    <List size={16} aria-hidden="true" /> Sections
                  </button>
                </div>
                {propertiesPanel}
              </main>
            )}
            <Drawer
              isOpen={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
              position="left"
              title="Sections"
              width="320px"
              flush
            >
              {sidebar}
            </Drawer>
          </>
        )}
      </div>
      {!isDesktop && (
        <nav className={styles.mobileNav} aria-label="Editor views">
          {(
            [
              { id: 'content', label: 'Content', Icon: FileText },
              { id: 'design', label: 'Design', Icon: Palette },
              { id: 'preview', label: 'Canvas', Icon: MousePointer2 },
            ] as const
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={mobileView === id}
              data-editor-tour={id === 'content' ? 'properties-toggle' : undefined}
              onClick={() => {
                setMobileView(id)
                if (id !== 'preview') setInspectorMode(id)
              }}
            >
              <Icon size={19} aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  )
}
