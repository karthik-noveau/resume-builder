import { AnimatePresence } from 'framer-motion'
import { useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, ArrowRight, Search } from 'lucide-react'
import { clsx } from 'clsx'
import { toast } from 'sonner'
import { useTemplateStore } from '@/shared/stores/template.store'
import { useResumeStore } from '@/shared/stores/resume.store'
import { Button } from '@/shared/components/ui/Button/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState/EmptyState'
import { PUBLIC_PAGES, publicPageSchema } from '@/shared/seo/publicPages'
import { Seo } from '@/shared/components/Seo/Seo'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { TemplateFilters } from '@/shared/components/TemplateFilters/TemplateFilters'
import { DEFAULT_TEMPLATE_FILTERS, filterTemplates } from '@/shared/utils/templateFilters'
import { TemplatePreviewDialog } from '@/shared/components/TemplatePickerModal/TemplatePreviewDialog'
import type { TemplateDefinition } from '@/shared/types/template.types'
import styles from './TemplateGallery.module.css'

export function TemplateGallery() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isCreateMode = searchParams.get('create') === 'true'

  const [preview, setPreview] = useState<TemplateDefinition | null>(null)
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
    <main className={styles.root}>
      <Seo {...PUBLIC_PAGES.templates} appendSiteName={false} structuredData={publicPageSchema('templates')} />
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
              {isCreateMode ? 'Choose a template' : 'Resume templates'}
            </h1>
            {!isCreateMode && <p className={styles.intro}>Find your fit. Make it yours. Every template is free to edit and download as a PDF. <Link to="/guides/resume-format">Find your resume format →</Link></p>}
            <p className={styles.subheading} role="status" aria-live="polite">
              {isCreateMode
                ? 'You can change it later.'
                : `${filteredTemplates.length} of ${availableTemplates.length} templates`}
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <TemplatePreviewDialog
            key={preview.id}
            template={preview}
            onClose={() => setPreview(null)}
            onSelect={() => void handleSelect(preview.id)}
            pending={openingId !== null}
          />
        )}
      </AnimatePresence>
      {/* Main Content */}
      <div className={styles.main}>
        <div className={styles.mainInner}>
          <TemplateFilters value={filters} onChange={setFilters} className={styles.categories} />

          {/* Grid */}
          <div className={styles.grid}>
            {filteredTemplates.map((tpl) => (
              <article
                key={tpl.id}
                className={clsx(styles.card, openingId === tpl.id && styles.cardSelected)}
              >
                {/* Preview */}
                <button
                  type="button"
                  className={styles.previewWrap}
                  aria-label={`Preview ${tpl.name} template`}
                  onClick={() => setPreview(tpl)}
                >
                  <ResumePreview
                    layoutTree={getTemplatePreviewTree(tpl.id)}
                    widthPx={200}
                    className={styles.previewThumb}
                  />
                </button>

                <div className={styles.cardInfo}>
                  <h2 className={styles.cardTitle}>{tpl.name}</h2>
                  <button
                    type="button"
                    className={styles.selectAction}
                    disabled={openingId !== null}
                    aria-busy={openingId === tpl.id}
                    aria-label={`Use ${tpl.name} template`}
                    onClick={() => void handleSelect(tpl.id)}
                  >
                    {openingId === tpl.id ? (
                      'Creating…'
                    ) : (
                      <>
                        Use template
                        <span className={styles.actionArrow} aria-hidden="true">
                          <ArrowRight size={15} />
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
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
    </main>
  )
}

export default TemplateGallery
