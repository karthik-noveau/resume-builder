import { useState } from 'react'
import { LayoutGrid } from 'lucide-react'
import type { Resume } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useTemplateStore } from '@/shared/stores/template.store'
import { AVAILABLE_FONT_PRESETS, CUSTOM_THEME_ID, DEFAULT_CUSTOM_PRIMARY_COLOR } from '@/shared/stores/theme.store'
import { Button } from '@/shared/components/ui/Button/Button'
import { Select } from '@/shared/components/ui/Select/Select'
import { ThemeSwatchPicker } from '@/shared/components/ThemeSwatchPicker/ThemeSwatchPicker'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { TemplatePickerModal } from '@/shared/components/TemplatePickerModal/TemplatePickerModal'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import styles from './AppearancePanel.module.css'

interface AppearancePanelProps {
  resume: Resume
}

export function AppearancePanel({ resume }: AppearancePanelProps) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const updateResume = useResumeStore((s) => s.updateResume)
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)

  const currentTemplate = availableTemplates.find((t) => t.id === resume.templateId)

  const isCustom = resume.themeId === CUSTOM_THEME_ID
  const customColor = resume.customPrimaryColor || DEFAULT_CUSTOM_PRIMARY_COLOR

  const handleTemplateSwitch = (templateId: string) => {
    useTemplateStore.getState().switchTemplate(templateId)
    updateResume({ templateId })
  }

  return (
    <div className={styles.root}>
      {/* Always expanded — appearance controls are the panel's primary purpose,
          so there is no collapse toggle. */}
      <div className={styles.header}>
        <h2 className={styles.heading}>
          Appearance
        </h2>
      </div>

      {/* Stacked, not tabbed — three short controls that fit together, laid out
          like the Properties panel's fields so the two sidebars read alike.
          Tabs hid two thirds of the panel to save space it did not need. */}
      <div className={styles.body}>
        <div className={styles.field}>
          <span className={styles.fieldLabel}>Template</span>
          <div className={styles.templateRow}>
            <ResumePreview
              layoutTree={getTemplatePreviewTree(resume.templateId)}
              widthPx={56}
              className={styles.currentPreview}
            />
            <div className={styles.templateMeta}>
              <p className={styles.currentName}>{currentTemplate?.name ?? 'Unknown template'}</p>
              <p className={styles.currentLayout}>
                {currentTemplate?.layout === 'single-column' ? 'One column' : 'Two column'}
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsPickerOpen(true)}
            className={styles.changeButton}
          >
            <LayoutGrid size={15} aria-hidden="true" />
            Change template
          </Button>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Color</span>
          <ThemeSwatchPicker
            themeId={resume.themeId}
            customPrimaryColor={resume.customPrimaryColor}
            onChange={(value) => { updateResume(value) }}
          />
          {isCustom && (
            <p className={styles.customColorLabel}>{customColor}</p>
          )}
        </div>

        <div className={styles.field}>
          <Select
            label="Font family"
            value={resume.fontPresetId}
            onChange={(e) => { updateResume({ fontPresetId: e.target.value }) }}
            options={AVAILABLE_FONT_PRESETS.map((fp) => ({ value: fp.id, label: fp.name }))}
          />
        </div>
      </div>

      <TemplatePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentTemplateId={resume.templateId}
        onSelect={handleTemplateSwitch}
      />
    </div>
  )
}
