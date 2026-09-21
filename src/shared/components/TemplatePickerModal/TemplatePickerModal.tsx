import { useEffect, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { useTemplateStore } from '@/shared/stores/template.store'
import { Button } from '@/shared/components/ui/Button/Button'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { TemplateFilters } from '@/shared/components/TemplateFilters/TemplateFilters'
import { DEFAULT_TEMPLATE_FILTERS, filterTemplates } from '@/shared/utils/templateFilters'
import styles from './TemplatePickerModal.module.css'

interface TemplatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  /** The template the resume currently uses. Omit when picking for a new one. */
  currentTemplateId?: string | null
  onSelect: (templateId: string) => void
  title?: string
  intro?: string
  confirmLabel?: string
  /** Keeps the modal open after confirming, for callers that navigate away themselves. */
  keepOpenOnSelect?: boolean
  isConfirming?: boolean
}

/**
 * Shared template chooser: switching the template of a resume being edited
 * (both editors) and picking one for a brand-new resume (dashboard). Lives in
 * `shared/` because features may not import from one another; it reads the
 * template store the same way its callers do.
 *
 * Select then confirm, rather than applying on click: switching a template
 * reflows the whole resume, so it should not happen while the user is still
 * comparing options.
 */
export function TemplatePickerModal({
  isOpen,
  onClose,
  currentTemplateId = null,
  onSelect,
  title = 'Change template',
  intro = 'Your content stays exactly as it is — only the layout changes.',
  confirmLabel = 'Use template',
  keepOpenOnSelect = false,
  isConfirming = false,
}: TemplatePickerModalProps) {
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState(DEFAULT_TEMPLATE_FILTERS)
  const filteredTemplates = filterTemplates(availableTemplates, filters)
  const selectedTemplate = availableTemplates.find(template => template.id === selectedId)

  // The modal's children are destroyed on hide but this component is not, so
  // the previous pick would still be sitting there on the next open.
  useEffect(() => {
    if (isOpen) {
      setSelectedId(null)
      setFilters(DEFAULT_TEMPLATE_FILTERS)
    }
  }, [isOpen])

  const handleConfirm = () => {
    if (!selectedId) return
    if (selectedId !== currentTemplateId) onSelect(selectedId)
    if (!keepOpenOnSelect) onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="xl">
      <div className={styles.content}>
        <div className={styles.scrollArea}>
          <p className={styles.intro}>{intro}</p>

          <div className={styles.filterBar}>
            <TemplateFilters value={filters} onChange={setFilters} compact />
            <p className={styles.resultCount} role="status" aria-live="polite">
              {filteredTemplates.length} of {availableTemplates.length} templates
            </p>
          </div>

          <div className={styles.grid} role="listbox" aria-label="Templates">
            {filteredTemplates.map((tpl) => {
              const isCurrent = tpl.id === currentTemplateId
              const isSelected = tpl.id === selectedId
              const layoutLabel = tpl.layout === 'single-column' ? 'One column' : 'Two column'
              return (
                <button
                  key={tpl.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  // Named explicitly: the preview is aria-hidden, so leaving the
                  // name to the contents left these options unlabelled.
                  aria-label={`${tpl.name}, ${layoutLabel.toLowerCase()}, ${tpl.designStyle}${isCurrent ? ' (current)' : ''}`}
                  onClick={() => setSelectedId(tpl.id)}
                  className={clsx(styles.option, isSelected && styles.optionActive)}
                >
                  <div className={styles.previewWrap}>
                    <ResumePreview
                      layoutTree={getTemplatePreviewTree(tpl.id)}
                      widthPx={200}
                      className={styles.preview}
                    />
                    {isSelected && (
                      <span className={styles.check}>
                        <Check size={12} strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}
                    {/* Only while unselected — once picked, the selection ring is
                        the thing to read, and two markers would compete. */}
                    {isCurrent && !isSelected && (
                      <span className={styles.currentPill}>Current</span>
                    )}
                  </div>

                  <span className={styles.name}>{tpl.name}</span>
                </button>
              )
            })}
          </div>
          {filteredTemplates.length === 0 && (
            <div className={styles.emptyState}>
              <Search size={24} aria-hidden="true" />
              <p className={styles.emptyTitle}>No templates found</p>
              <p>Try another search or reset the filters.</p>
              <Button variant="secondary" onClick={() => setFilters(DEFAULT_TEMPLATE_FILTERS)}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <p className={styles.selection}>
            {selectedTemplate ? <>Selected: <strong>{selectedTemplate.name}</strong></> : 'Choose a template to continue'}
          </p>
          <div className={styles.footerActions}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!selectedId}
              loading={isConfirming}
              onClick={handleConfirm}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
