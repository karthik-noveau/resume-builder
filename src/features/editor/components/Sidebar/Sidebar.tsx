import { useMemo } from 'react'
import { clsx } from 'clsx'
import type { Resume, SectionType } from '@/shared/types/resume.types'
import { SectionList } from './SectionList'
import { AddSectionMenu } from './AddSectionMenu'
import { AppearancePanel } from './AppearancePanel'
import { calculateCompleteness } from '@/features/resume/utils/resumeCompleteness'
import styles from './Sidebar.module.css'

interface SidebarProps {
  resume: Resume
  selectedSectionType: SectionType | null
  onSelectSection: (type: SectionType) => void
  onAddSection: (type: SectionType) => void
  onReorderBlocks: (fromIndex: number, toIndex: number) => void
  onToggleVisibility: (type: SectionType) => void
}

export function Sidebar({
  resume,
  selectedSectionType,
  onSelectSection,
  onAddSection,
  onReorderBlocks,
  onToggleVisibility,
}: SidebarProps) {
  const completeness = useMemo(() => calculateCompleteness(resume), [resume])

  return (
    <div className={styles.root}>
      {/* Résumé-wide metric, so it stands on its own above the section list
          rather than under the "Sections" heading — that heading labels the
          list, and anything between the two reads as part of it. */}
      <div className={styles.strength}>
        <div className={styles.completenessRow}>
          <span className={styles.completenessLabel}>Profile strength</span>
          <span className={styles.completenessValue}>{completeness}%</span>
        </div>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Profile strength"
          aria-valuenow={completeness}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={clsx(
              styles.fill,
              completeness >= 80 ? styles.fillHigh : completeness >= 40 ? styles.fillMedium : styles.fillLow
            )}
            style={{ width: `${completeness}%` }}
          />
        </div>
      </div>

      <h2 className={styles.heading}>Sections</h2>

      <SectionList
        resume={resume}
        selectedSectionType={selectedSectionType}
        onSelectSection={onSelectSection}
        onReorderBlocks={onReorderBlocks}
        onToggleVisibility={onToggleVisibility}
      />

      <AppearancePanel resume={resume} />
      <AddSectionMenu onAdd={onAddSection} />
    </div>
  )
}
