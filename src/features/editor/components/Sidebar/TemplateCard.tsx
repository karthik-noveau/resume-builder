import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Resume } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useTemplateStore } from '@/shared/stores/template.store'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { TemplatePickerModal } from '@/shared/components/TemplatePickerModal/TemplatePickerModal'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import styles from './TemplateCard.module.css'

/**
 * The resume's template, shown with a live thumbnail of itself.
 *
 * Lives in the left rail beside the section list and page setup: those three
 * are the document's own structure, as against the right panel, which styles
 * whatever is currently selected.
 */
export function TemplateCard({ resume }: { resume: Resume }) {
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const updateResume = useResumeStore((s) => s.updateResume)
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)
  const currentTemplate = availableTemplates.find((t) => t.id === resume.templateId)

  const handleTemplateSwitch = (templateId: string) => {
    useTemplateStore.getState().switchTemplate(templateId)
    updateResume({ templateId })
  }

  return (
    <div className={styles.root}>
      <div className={styles.row}>
        <div className={styles.previewStage}>
          <ResumePreview
            layoutTree={getTemplatePreviewTree(resume.templateId)}
            widthPx={66}
            className={styles.preview}
          />
        </div>
        <div className={styles.meta}>
          <span className={styles.eyebrow}>Current design</span>
          <p className={styles.name}>{currentTemplate?.name ?? 'Unknown template'}</p>
          {currentTemplate && (
            <>
              <p className={styles.layout}>
                {currentTemplate.layout === 'single-column' ? 'One column' : 'Two columns'}
              </p>
              <span className={styles.styleTag}>{currentTemplate.designStyle}</span>
            </>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        className={styles.changeButton}
        data-editor-tour="template"
        aria-haspopup="dialog"
        aria-expanded={isPickerOpen}
      >
        <span>Change template</span>
        <ArrowRight size={15} className={styles.actionArrow} aria-hidden="true" />
      </button>

      <TemplatePickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        currentTemplateId={resume.templateId}
        onSelect={handleTemplateSwitch}
      />
    </div>
  )
}
