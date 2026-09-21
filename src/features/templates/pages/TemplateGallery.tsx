import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
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
  const [openingId, setOpeningId] = useState<string | null>(null)
  const opening = useRef(false)
  const createResume = useResumeStore((s) => s.createResume)
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)

  // Put the design chosen on the home page first without creating a resume on load.
  const requestedId = searchParams.get('template')
  const filteredTemplates = filterTemplates(availableTemplates, filters).sort(
    (a, b) => Number(b.id === requestedId) - Number(a.id === requestedId)
  )
  const clearFilters = () => setFilters(DEFAULT_TEMPLATE_FILTERS)

  const handleSelect = async (templateId: string) => {
    if (opening.current) return
    opening.current = true
    setOpeningId(templateId)
    try {
      const id = await createResume(templateId)
      await navigate(`/editor/${id}/guided`)
    } catch {
      toast.error('Failed to create resume')
    } finally {
      opening.current = false
      setOpeningId(null)
    }
  }

  return (
    <div className={styles.root}>
      <Seo
        title="Resume Templates"
        description="Browse 40 resume templates in one- and two-column layouts. Preview any template and start editing straight away — free and without an account."
        path="/templates"
      />
      <div className={styles.header}>
        <div className={styles.headerInner}>
          <div>
            {isCreateMode && (
              <button
                type="button"
                className={styles.backLink}
                onClick={() => {
                  void navigate('/app')
                }}
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
              {availableTemplates.filter((template) => template.designStyle === 'Simple').length}{' '}
              Simple
              {' · '}
              {
                availableTemplates.filter((template) => template.designStyle === 'Ultra Modern')
                  .length
              }{' '}
              Ultra Modern
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
                <motion.button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    void handleSelect(tpl.id)
                  }}
                  disabled={openingId !== null}
                  aria-busy={openingId === tpl.id}
                  aria-label={`Use ${tpl.name} template`}
                  aria-describedby={`template-${tpl.id}-description`}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ y: { duration: 0.25 } }}
                  className={clsx(styles.card, openingId === tpl.id && styles.cardSelected)}
                >
                  {/* Preview */}
                  <span className={styles.previewWrap}>
                    <ResumePreview
                      layoutTree={getTemplatePreviewTree(tpl.id)}
                      widthPx={224}
                      className={styles.previewThumb}
                    />
                  </span>

                  <span className={styles.cardInfo}>
                    <span className={styles.cardTitle}>{tpl.name}</span>
                    <span id={`template-${tpl.id}-description`} className={styles.cardDescription}>
                      {tpl.description}
                    </span>
                    <span className={styles.selectAction}>
                      {openingId === tpl.id ? (
                        'Creating…'
                      ) : (
                        <>
                          Use template <ArrowRight size={15} aria-hidden="true" />
                        </>
                      )}
                    </span>
                  </span>
                </motion.button>
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
    </div>
  )
}

export default TemplateGallery
