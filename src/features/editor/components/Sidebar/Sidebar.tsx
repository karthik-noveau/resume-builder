import { useState } from 'react'
import { clsx } from 'clsx'
import { ChevronDown, LayoutGrid, Settings2 } from 'lucide-react'
import type { Resume, SectionType } from '@/shared/types/resume.types'
import type { LayoutTree } from '@/shared/types/layout.types'
import { SectionList } from './SectionList'
import { LayoutSettingsForm } from './LayoutSettingsForm'
import { TemplateCard } from './TemplateCard'
import { AtsEvaluation } from '../AtsEvaluation'
import styles from './Sidebar.module.css'
import type { EditorTourStepId } from '../EditorTour/editorTour.steps'
import mobile from '@/shared/styles/mobileEditor.module.css'

interface SidebarProps {
  tourStep?: EditorTourStepId
  resume: Resume
  layoutTree?: LayoutTree | null
  selectedSectionType: SectionType | null
  onSelectSection: (type: SectionType) => void
  onReorderBlocks: (fromIndex: number, toIndex: number) => void
  onToggleVisibility: (type: SectionType) => void
}

export function Sidebar({
  tourStep,
  resume,
  layoutTree,
  selectedSectionType,
  onSelectSection,
  onReorderBlocks,
  onToggleVisibility,
}: SidebarProps) {
  const [openBlocks, setOpenBlocks] = useState<Record<string, boolean>>({ template: true })

  const toggleBlock = (block: string) => {
    setOpenBlocks((current) => ({ ...current, [block]: !current[block] }))
  }

  return (
    <div className={clsx(styles.root, mobile.controls)} data-editor-tour-scroll="sections">
      {/* Résumé-wide metric, so it stands on its own above the section list
          rather than under the "Sections" heading — that heading labels the
          list, and anything between the two reads as part of it. */}
      <div className={styles.evaluation}>
        <AtsEvaluation resume={resume} layoutTree={layoutTree} />
      </div>

      {/* Section order lives here; entries are reordered inside their own
          section's form in the right-hand panel. The canvas itself is for
          selecting and editing only. */}
      <h2 className={styles.heading}>Sections</h2>

      <div className={styles.sectionList} data-editor-tour="sections">
        <SectionList
          resume={resume}
          selectedSectionType={selectedSectionType}
          onSelectSection={onSelectSection}
          onReorderBlocks={onReorderBlocks}
          onToggleVisibility={onToggleVisibility}
        />
      </div>

      {/* Document-level choices — which template, and how the page is set up —
          live in this rail rather than the right panel. That panel styles
          whatever is currently selected, and settings belonging to the whole
          resume kept appearing underneath one section's fields as if they were
          part of it. They follow the section list directly rather than being
          pinned to the foot of the rail, which left a tall gap between the two
          whenever the list was short. */}
      <div className={styles.footerBlocks}>
        <FooterBlock
          label="Template"
          tourTarget="template-panel"
          icon={<LayoutGrid size={14} aria-hidden="true" />}
          open={tourStep === 'template' || (tourStep !== 'page-setup' && Boolean(openBlocks.template))}
          onToggle={() => toggleBlock('template')}
        >
          <TemplateCard resume={resume} />
        </FooterBlock>

        <FooterBlock
          label="Page setup"
          tourTarget="page-setup"
          icon={<Settings2 size={14} aria-hidden="true" />}
          open={tourStep === 'page-setup' || (tourStep !== 'template' && Boolean(openBlocks.pageSetup))}
          onToggle={() => toggleBlock('pageSetup')}
        >
          <LayoutSettingsForm settings={resume.settings} />
        </FooterBlock>
      </div>
    </div>
  )
}

function FooterBlock({
  label, icon, open, onToggle, children, tourTarget,
}: {
  label: string
  tourTarget: string
  icon: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <section className={styles.footerBlock} aria-label={label}>
      <button
        type="button"
        className={styles.footerToggle}
        aria-expanded={open}
        data-editor-tour={tourTarget}
        onClick={onToggle}
      >
        <span className={styles.footerIdentity}>
          {icon}
          {label}
        </span>
        <ChevronDown
          size={14}
          className={clsx(styles.footerChevron, open && styles.footerChevronOpen)}
          aria-hidden="true"
        />
      </button>
      {open && <div className={styles.footerBody}>{children}</div>}
    </section>
  )
}
