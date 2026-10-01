import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, ChevronLeft, FileText, Globe2, MousePointerClick, Palette, UserRound } from 'lucide-react'
import type { Resume, SectionTitleKey, SectionType } from '@/shared/types/resume.types'
import type { LayoutNode, LayoutTree } from '@/shared/types/layout.types'
import { PersonalInfoForm } from './PersonalInfoForm'
import { SectionProperties } from './SectionProperties'
import { AppearancePanel } from '../Sidebar/AppearancePanel'
import { GlobalTextStyles, ResetAllStyling, SelectedElementStyle } from './StyleInspector'
import { useEditorStore } from '@/shared/stores/editor.store'
import type { SectionTitleEditRef } from './SectionTitleField'
import styles from './PropertiesPanel.module.css'
import type { EditorTourStepId } from '../EditorTour/editorTour.steps'
import mobile from '@/shared/styles/mobileEditor.module.css'

interface PropertiesPanelProps {
  tourStep?: EditorTourStepId
  resume: Resume
  layoutTree: LayoutTree | null
  selectedSectionType: SectionType | null
  onClearSelection: () => void
}

function findSectionTitleEditRef(layoutTree: LayoutTree | null, sectionType: SectionTitleKey): SectionTitleEditRef | undefined {
  if (!layoutTree) return undefined
  const visit = (nodes: LayoutNode[]): SectionTitleEditRef | undefined => {
    for (const node of nodes) {
      if (node.editRef?.kind === 'section-title' && node.editRef.sectionType === sectionType) {
        return node.editRef
      }
      const nested = visit(node.children)
      if (nested) return nested
    }
    return undefined
  }
  for (const page of layoutTree.pages) {
    const match = visit(page.nodes)
    if (match) return match
  }
  return undefined
}

export function PropertiesPanel({ resume, layoutTree, selectedSectionType, onClearSelection, tourStep }: PropertiesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const inspectorMode = useEditorStore((state) => state.inspectorMode)
  const setInspectorMode = useEditorStore((state) => state.setInspectorMode)
  const [globalOpen, setGlobalOpen] = useState(false)
  const [selectedOpen, setSelectedOpen] = useState(true)
  // Tour previews are temporary; the user's tab and accordion choices stay intact.
  const activeMode = tourStep === 'content' ? 'content'
    : tourStep === 'global-design' || tourStep === 'selected-design' ? 'design' : inspectorMode
  const personalInfoOpenRequest = useEditorStore((state) => state.personalInfoOpenRequest)
  const personalInfoFocusTarget = useEditorStore((state) => state.personalInfoFocusTarget)
  const contentFocusTarget = useEditorStore((state) => state.contentFocusTarget)
  const contentFocusRequest = useEditorStore((state) => state.contentFocusRequest)
  const designOpenRequest = useEditorStore((state) => state.designOpenRequest)
  const contactTitleEditRef = findSectionTitleEditRef(layoutTree, 'contact')
  const selectedTitleEditRef = selectedSectionType && selectedSectionType !== 'custom'
    ? findSectionTitleEditRef(layoutTree, selectedSectionType)
    : undefined

  useEffect(() => {
    if (!designOpenRequest) return
    setSelectedOpen(true)
    setGlobalOpen(false)
    panelRef.current?.scrollTo?.({ top: 0, behavior: 'instant' })
  }, [designOpenRequest])

  // Content selections preserve the user's tab. Decorative elements explicitly
  // open Design because they have no content form.

  // Scrolling back to the top belongs to Content, where a new selection swaps
  // the form out entirely. In Design the controls stay put and only their
  // target changes, so moving the panel would just lose the user's place.
  useEffect(() => {
    const panel = panelRef.current
    if (activeMode !== 'content' || !panel || tourStep) return
    const focusField = (field: HTMLElement) => {
      field.closest('details')?.setAttribute('open', '')
      field.focus({ preventScroll: true })
      const rect = field.getBoundingClientRect()
      const headerHeight = panel.querySelector('header')?.getBoundingClientRect().height ?? 0
      panel.scrollTo?.({
        top: Math.max(0, panel.scrollTop + rect.top - panel.getBoundingClientRect().top
          - Math.max(headerHeight + 24, (panel.clientHeight - rect.height) / 2)),
        behavior: 'instant',
      })
    }
    if (contentFocusTarget) {
      const target = contentFocusTarget
      const entryId = 'entryId' in target ? target.entryId
        : target.kind === 'custom-section-title' ? target.sectionId : null
      const scope = entryId
        ? Array.from(panel.querySelectorAll<HTMLElement>('[data-entry-id]')).find((entry) => entry.dataset.entryId === entryId)
        : panel
      const name = target.kind === 'entry-field' ? target.field
        : target.kind === 'summary' ? 'content'
        : target.kind === 'section-title' ? 'sectionTitle'
        : target.kind === 'custom-section-title' ? 'title' : null
      let field = name ? Array.from(scope?.querySelectorAll<HTMLElement>('[name]') ?? [])
        .find((input) => input.getAttribute('name') === name) : undefined
      if (target.kind === 'entry-list-item') {
        field = scope?.querySelector<HTMLElement>(`[data-list-field="${target.field}"] [data-list-index="${target.index}"] textarea`) ?? undefined
      }
      field ??= scope?.querySelector<HTMLElement>('input:not([type="hidden"]):not(:disabled), textarea:not(:disabled)') ?? undefined
      if (field) {
        focusField(field)
        return
      }
    }
    if (!selectedSectionType && personalInfoFocusTarget) {
      const group = panel.querySelector(`[data-personal-info-field="${personalInfoFocusTarget}"]`)
      const details = group?.closest('details')
      if (details) details.open = true
      const field = panel.querySelector<HTMLElement>(`input[name="${personalInfoFocusTarget}"]`)
        ?? group?.querySelector<HTMLElement>('input:checked')
        ?? group?.querySelector<HTMLElement>('input:not([type="file"]):not(:disabled), button:not(:disabled)')
      if (field) {
        focusField(field)
        return
      }
    }
    panel.scrollTo?.({ top: 0, behavior: 'instant' })
  }, [activeMode, selectedSectionType, personalInfoOpenRequest, personalInfoFocusTarget, contentFocusTarget, contentFocusRequest, tourStep])

  return (
    <div ref={panelRef} className={clsx(styles.root, mobile.controls)} data-editor-tour-scroll="properties">
      {/* The tabs alone. A "Customize" title named the panel for someone who
          is looking straight at it, and the panel's own contents say what it
          does — so the row goes entirely to the control that does something. */}
      <header className={styles.inspectorHeader} data-editor-tour="properties">
        <div
          className={styles.modeTabs}
          role="tablist"
          aria-label="Inspector mode"
          data-active={activeMode}
        >
          {/* The moving half, drawn once and slid between the two positions.
              Giving each button its own background instead meant the highlight
              blinked out on one side and in on the other, which reads as two
              separate things changing rather than one thing moving. */}
          <span className={styles.modeThumb} aria-hidden="true" />
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'content'}
            data-editor-tour="content"
            className={styles.modeTab}
            onClick={() => setInspectorMode('content')}
          >
            <FileText size={14} aria-hidden="true" />
            Content
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'design'}
            className={styles.modeTab}
            onClick={() => setInspectorMode('design')}
          >
            <Palette size={14} aria-hidden="true" />
            Design
          </button>
        </div>
      </header>

      {/* One destination at a time. Personal info used to be pinned above
          whatever you were editing, so a section's fields always opened below a
          card you were not looking at; it is now what the panel shows when
          nothing else is selected, and the back arrow returns to it. Clicking
          the name or a contact line on the canvas still routes here, via
          openPersonalInfo() clearing the selection. */}
      {activeMode === 'content' ? (
        selectedSectionType ? (
          <section aria-label={`${selectedSectionType} settings`} className={styles.selectedSection}>
            <div className={styles.selectedSectionHeader}>
              <button
                type="button"
                onClick={onClearSelection}
                aria-label="Back to personal info"
                className={styles.backButton}
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <div>
                <h2 className={styles.selectedSectionTitle}>{selectedSectionType}</h2>
                <p className={styles.selectedSectionDescription}>Content, visibility and ordering</p>
              </div>
            </div>
            <SectionProperties
              resume={resume}
              sectionType={selectedSectionType}
              titleEditRef={selectedTitleEditRef}
            />
          </section>
        ) : (
          <section aria-label="Personal information" className={styles.selectedSection}>
            <div className={styles.selectedSectionHeader}>
              <span className={styles.sectionIcon} aria-hidden="true"><UserRound size={15} /></span>
              <div>
                <h2 className={styles.selectedSectionTitle}>Personal info</h2>
                <p className={styles.selectedSectionDescription}>Identity and contact details</p>
              </div>
            </div>
            <PersonalInfoForm
              resumeId={resume.id}
              personalInfo={resume.personalInfo}
              contactTitleEditRef={contactTitleEditRef}
            />
          </section>
        )
      ) : (
        <div className={styles.designBody}>
          {/* Global first so the ordering matches the cascade — a text style is
              what an element inherits until it overrides it — but collapsed,
              because the selected element is what you came here for. */}
          <DesignAccordion
            label="Global design"
            tourTarget="global-design"
            description="Fonts, colours and text styles"
            icon={<Globe2 size={15} aria-hidden="true" />}
            open={tourStep === 'global-design' || (tourStep !== 'selected-design' && globalOpen)}
            onToggle={() => setGlobalOpen((v) => !v)}
          >
            <ResetAllStyling resume={resume} />
            <AppearancePanel resume={resume} />
            <GlobalTextStyles resume={resume} />
          </DesignAccordion>

          <DesignAccordion
            label="Selected design"
            tourTarget="selected-design"
            description="Only what you select on the page"
            icon={<MousePointerClick size={15} aria-hidden="true" />}
            open={tourStep === 'selected-design' || (tourStep !== 'global-design' && selectedOpen)}
            onToggle={() => setSelectedOpen((v) => !v)}
          >
            <SelectedElementStyle resume={resume} layoutTree={layoutTree} />
          </DesignAccordion>
        </div>
      )}
    </div>
  )
}

function DesignAccordion({
  label, description, icon, open, onToggle, children, tourTarget,
}: {
  label: string
  tourTarget: string
  description: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className={styles.accordion} aria-label={label}>
      <button
        type="button"
        className={styles.accordionToggle}
        aria-expanded={open}
        data-editor-tour={tourTarget}
        onClick={onToggle}
      >
        <span className={styles.accordionIcon} aria-hidden="true">{icon}</span>
        <span className={styles.accordionCopy}>
          <span className={styles.accordionLabel}>{label}</span>
          <span className={styles.accordionDescription}>{description}</span>
        </span>
        <ChevronDown
          size={15}
          className={clsx(styles.accordionChevron, open && styles.accordionChevronOpen)}
          aria-hidden="true"
        />
      </button>
      {open && <div className={styles.accordionBody}>{children}</div>}
    </section>
  )
}
