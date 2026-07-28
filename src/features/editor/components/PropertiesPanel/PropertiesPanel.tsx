import { useEffect, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { clsx } from 'clsx'
import type { Resume, SectionType } from '@/shared/types/resume.types'
import { PersonalInfoForm } from './PersonalInfoForm'
import { SectionProperties } from './SectionProperties'
import { LayoutSettingsForm } from './LayoutSettingsForm'
import styles from './PropertiesPanel.module.css'

interface PropertiesPanelProps {
  resume: Resume
  selectedSectionType: SectionType | null
  onClearSelection: () => void
}

export function PropertiesPanel({ resume, selectedSectionType, onClearSelection }: PropertiesPanelProps) {
  const [personalInfoOpen, setPersonalInfoOpen] = useState(true)

  // Auto-collapse Personal Info once a section is selected, so its config is
  // immediately visible instead of buried below the always-shown form.
  useEffect(() => {
    setPersonalInfoOpen(selectedSectionType === null)
  }, [selectedSectionType])

  return (
    <div className={styles.root}>
      <section aria-label="Personal information" className={styles.personalInfoSection}>
        <button
          type="button"
          onClick={() => setPersonalInfoOpen((v) => !v)}
          aria-expanded={personalInfoOpen}
          className={styles.sectionToggle}
        >
          <h2 className={styles.sectionHeading}>
            Personal Info
          </h2>
          <ChevronDown
            size={14}
            className={clsx(styles.chevron, personalInfoOpen && styles.chevronOpen)}
            aria-hidden="true"
          />
        </button>
        {personalInfoOpen && (
          <div className={styles.personalInfoBody}>
            <PersonalInfoForm resumeId={resume.id} personalInfo={resume.personalInfo} />
          </div>
        )}
      </section>

      {/* Selected section form OR Global Layout Settings */}
      {selectedSectionType ? (
        <section aria-label={`${selectedSectionType} settings`} className={styles.selectedSection}>
          <div className={styles.selectedSectionHeader}>
            <button
              type="button"
              onClick={onClearSelection}
              aria-label="Back to layout settings"
              className={styles.backButton}
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <h2 className={styles.selectedSectionTitle}>
              {selectedSectionType}
            </h2>
          </div>
          <SectionProperties resume={resume} sectionType={selectedSectionType} />
        </section>
      ) : (
        <section aria-label="Layout settings" className={styles.layoutSection}>
          <h2 className={styles.layoutSectionTitle}>
            Layout Settings
          </h2>
          <LayoutSettingsForm settings={resume.settings} />
        </section>
      )}
    </div>
  )
}
