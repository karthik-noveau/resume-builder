import { AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { useTemplateStore } from '@/shared/stores/template.store'
import { Button } from '@/shared/components/ui/Button/Button'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { TemplateFilters } from '@/shared/components/TemplateFilters/TemplateFilters'
import { DEFAULT_TEMPLATE_FILTERS, filterTemplates } from '@/shared/utils/templateFilters'
import { TemplatePreviewDialog } from './TemplatePreviewDialog'
import type { TemplateDefinition } from '@/shared/types/template.types'
import styles from './TemplatePickerModal.module.css'

interface TemplatePickerModalProps {
  isOpen: boolean
  onClose: () => void
  /** The template the resume currently uses. Omit when picking for a new one. */
  currentTemplateId?: string | null
  onSelect: (templateId: string) => void | Promise<void>
  title?: string
  intro?: string
  pendingLabel?: string
}

/**
 * Shared template chooser: switching the template of a resume being edited
 * (both editors) and picking one for a brand-new resume (dashboard). Lives in
 * `shared/` because features may not import from one another; it reads the
 * template store the same way its callers do.
 *
 * Preview a design without applying it; the separate Use action applies it directly.
 */
export function TemplatePickerModal({
  isOpen,
  onClose,
  currentTemplateId = null,
  onSelect,
  title = 'Change template',
  intro = 'Your content stays exactly as it is — only the layout changes.',
  pendingLabel = 'Applying…',
}: TemplatePickerModalProps) {
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)
  const [preview, setPreview] = useState<TemplateDefinition | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const applying = useRef(false)
  const [filters, setFilters] = useState(DEFAULT_TEMPLATE_FILTERS)
  const filteredTemplates = filterTemplates(availableTemplates, filters)

  useEffect(() => {
    if (isOpen) {
      setPreview(null)
      setError(null)
      setFilters(DEFAULT_TEMPLATE_FILTERS)
    }
  }, [isOpen])

  const handleSelect = async (templateId: string) => {
    if (applying.current || templateId === currentTemplateId) return
    applying.current = true
    setPendingId(templateId)
    setError(null)
    try {
      await onSelect(templateId)
      setPreview(null)
      onClose()
    } catch {
      setError('Couldn’t use this template. Please try again.')
    } finally {
      applying.current = false
      setPendingId(null)
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          if (!applying.current) onClose()
        }}
        title={title}
        maxWidth="xl"
      >
        <div className={styles.content}>
          <div className={styles.scrollArea}>
            <p className={styles.intro}>{intro}</p>
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            <div className={styles.filterBar}>
              <TemplateFilters value={filters} onChange={setFilters} compact />
              <p className={styles.resultCount} role="status" aria-live="polite">
                {filteredTemplates.length} of {availableTemplates.length} templates
              </p>
            </div>

            <div className={styles.grid} role="group" aria-label="Templates">
              {filteredTemplates.map((tpl) => {
                const isCurrent = tpl.id === currentTemplateId
                const isPending = tpl.id === pendingId
                return (
                  <article
                    key={tpl.id}
                    className={clsx(styles.option, (isCurrent || isPending) && styles.optionActive)}
                  >
                    <button
                      type="button"
                      className={styles.previewWrap}
                      aria-label={`Preview ${tpl.name} template`}
                      onClick={() => setPreview(tpl)}
                    >
                      <ResumePreview
                        layoutTree={getTemplatePreviewTree(tpl.id)}
                        widthPx={200}
                        className={styles.preview}
                      />
                    </button>

                    <span className={styles.optionFooter}>
                      <span className={styles.name}>{tpl.name}</span>
                      <button
                        type="button"
                        className={styles.selectAction}
                        disabled={pendingId !== null || isCurrent}
                        aria-busy={isPending}
                        aria-label={`${isCurrent ? 'Current' : 'Use'} ${tpl.name} template`}
                        onClick={() => void handleSelect(tpl.id)}
                      >
                        {isPending ? (
                          pendingLabel
                        ) : isCurrent ? (
                          <>
                            <Check size={13} aria-hidden="true" /> Current
                          </>
                        ) : (
                          <>
                            Use template <ArrowRight size={13} aria-hidden="true" />
                          </>
                        )}
                      </button>
                    </span>
                  </article>
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
        </div>
      </Modal>
      <AnimatePresence>
        {preview && (
          <TemplatePreviewDialog
            key={preview.id}
            template={preview}
            onClose={() => setPreview(null)}
            onSelect={() => void handleSelect(preview.id)}
            pending={pendingId !== null}
            current={preview.id === currentTemplateId}
            error={error}
          />
        )}
      </AnimatePresence>
    </>
  )
}
