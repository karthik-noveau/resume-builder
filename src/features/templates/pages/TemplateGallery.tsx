import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, Check, Search, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useTemplateStore } from '@/shared/stores/template.store'
import { useResumeStore } from '@/shared/stores/resume.store'
import { Button } from '@/shared/components/ui/Button/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState/EmptyState'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import { Seo } from '@/shared/components/Seo/Seo'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { TemplateFilters } from '@/shared/components/TemplateFilters/TemplateFilters'
import { DEFAULT_TEMPLATE_FILTERS, filterTemplates } from '@/shared/utils/templateFilters'
import styles from './TemplateGallery.module.css'

export function TemplateGallery() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isCreateMode = searchParams.get('create') === 'true'

  const [filters, setFilters] = useState(DEFAULT_TEMPLATE_FILTERS)
  const [isOpening, setIsOpening] = useState(false)
  const createResume = useResumeStore((s) => s.createResume)
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)

  // A home-page template card is an explicit choice; carry it into this draft.
  // Direct gallery visits still start without a selection. Nothing is created
  // until the user confirms with Create Resume.
  const [draftTemplateId, setDraftTemplateId] = useState<string | null>(() => {
    const requestedId = searchParams.get('template')
    return availableTemplates.some((template) => template.id === requestedId) ? requestedId : null
  })

  const activeTemplateId = draftTemplateId

  const filteredTemplates = filterTemplates(availableTemplates, filters)
  const clearFilters = () => setFilters(DEFAULT_TEMPLATE_FILTERS)

  const activeTemplate = availableTemplates.find((t) => t.id === activeTemplateId)

  const handleSelect = (templateId: string) => {
    setDraftTemplateId(templateId)
    if (!isCreateMode) useTemplateStore.getState().setActiveTemplateId(templateId)
  }

  const createFromDraft = async () => {
    if (!draftTemplateId || isOpening) return
    setIsOpening(true)
    try {
      const id = await createResume(draftTemplateId)
      void navigate(`/editor/${id}/guided`)
    } catch {
      toast.error('Failed to create resume')
    } finally {
      setIsOpening(false)
    }
  }

  return (
    <div className={styles.root}>
      <Seo
        title="Resume Templates"
        description="Browse 40 resume templates in one- and two-column layouts. Preview any template and start editing straight away — free and without an account."
        path="/templates"
      />
      {/* Header — title and result count only. The commit action lives in the
          action bar at the bottom, next to the grid it acts on. Create mode
          additionally gets the back link and the wizard's framing. */}
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            {isCreateMode && (
              <button
                type="button"
                className={styles.backLink}
                onClick={() => { void navigate('/app') }}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                Back to My Resumes
              </button>
            )}
            <h1 className={styles.heading}>
              {isCreateMode && <BrandMark size="md" />}
              {isCreateMode ? 'Choose Your Template' : 'Templates'}
            </h1>
            <p className={styles.subheading} role="status" aria-live="polite">
              {isCreateMode
                ? `Choose from ${availableTemplates.length} polished, professional layouts. You can switch anytime without losing your content.`
                : `${filteredTemplates.length} of ${availableTemplates.length} templates`}
            </p>
            <p className={styles.collectionSummary}>
              {availableTemplates.filter(template => template.designStyle === 'Simple').length} Simple
              {' · '}
              {availableTemplates.filter(template => template.designStyle === 'Ultra Modern').length} Ultra Modern
              {' — find your signature style.'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        <div className={styles.mainInner}>
          <TemplateFilters value={filters} onChange={setFilters} className={styles.categories} />

          {/* Grid */}
          <div className={styles.grid}>
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((tpl) => (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  whileHover={{ y: -3 }}
                  transition={{ y: { duration: 0.25 } }}
                  className={clsx(
                    styles.card,
                    activeTemplateId === tpl.id && styles.cardSelected
                  )}
                >
                  {/* Preview */}
                  <button
                    type="button"
                    onClick={() => handleSelect(tpl.id)}
                    aria-pressed={activeTemplateId === tpl.id}
                    aria-label={`${activeTemplateId === tpl.id ? 'Selected' : 'Select'} ${tpl.name} template`}
                    aria-describedby={`template-${tpl.id}-description`}
                    className={styles.previewButton}
                  >
                    <ResumePreview
                      layoutTree={getTemplatePreviewTree(tpl.id)}
                      widthPx={224}
                      className={styles.previewThumb}
                    />

                    {/* Overlay */}
                    <div className={styles.overlay}>
                      <span
                        className={clsx(
                          styles.overlayBadge,
                          activeTemplateId === tpl.id && styles.overlayBadgeActive
                        )}
                      >
                        {activeTemplateId === tpl.id ? 'Selected' : 'Use Template'}
                      </span>
                    </div>

                    {activeTemplateId === tpl.id && (
                      <div className={styles.selectedCheck}>
                        <Check size={16} strokeWidth={3} />
                      </div>
                    )}

                  </button>

                  <div className={styles.cardInfo}>
                    <h3 className={styles.cardTitle}>{tpl.name}</h3>
                    <p id={`template-${tpl.id}-description`} className={styles.cardDescription}>
                      {tpl.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredTemplates.length === 0 && (
            <EmptyState
              icon={<Search size={24} />}
              title="No templates found"
              description="Try adjusting your search or layout filter."
              action={
                <Button variant="ghost" onClick={clearFilters}>
                  Clear all filters
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Commit action — a flex sibling of the scrolling grid rather than a
          fixed overlay, so it is always in view without ever covering a card.
          Restates the pick because the selected card may be scrolled away. */}
      <div className={styles.actionBar}>
        <div className={styles.actionBarInner}>
          {/* Keep the selected template visible while browsing the grid. */}
          <div className={styles.actionBarText} role="status" aria-live="polite">
            <p className={clsx(styles.actionBarStatus, !activeTemplate && styles.actionBarStatusEmpty)}>
              <span className={activeTemplate ? styles.actionBarName : undefined}>
                {activeTemplate?.name ?? 'No template selected'}
              </span>
              {activeTemplate && (
                <span className={styles.actionBarLayout}>
                  {activeTemplate.layout === 'single-column' ? 'One column' : 'Two column'}
                </span>
              )}
            </p>
            {!activeTemplate && (
              <p className={styles.actionBarEffect}>Pick one above to get started</p>
            )}
          </div>

          <div className={styles.actionBarRight}>
            <Button
              variant="primary"
              className={styles.createButton}
              disabled={!activeTemplate || isOpening}
              onClick={() => { void createFromDraft() }}
            >
              <Sparkles size={16} aria-hidden="true" />
              Create Resume
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateGallery
