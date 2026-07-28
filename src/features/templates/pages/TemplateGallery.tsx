import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ArrowLeft, Check, Columns2, Info, RectangleVertical, Search, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useTemplateStore } from '@/shared/stores/template.store'
import { useResumeStore } from '@/shared/stores/resume.store'
import { calculateAtsScore, TEMPLATE_MAX } from '@/features/resume/utils/atsScore'
import { Button } from '@/shared/components/ui/Button/Button'
import { EmptyState } from '@/shared/components/ui/EmptyState/EmptyState'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import { ThemeSwatchPicker } from '@/shared/components/ThemeSwatchPicker/ThemeSwatchPicker'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import type { TemplateDefinition } from '@/shared/types/template.types'
import styles from './TemplateGallery.module.css'

type LayoutFilter = TemplateDefinition['layout'] | 'All'

/** No "All" chip — "All Templates" is the reset for every facet at once. */
const LAYOUTS: { id: Exclude<LayoutFilter, 'All'>; label: string }[] = [
  { id: 'single-column', label: 'One Column' },
  { id: 'two-column', label: 'Two Column' },
]

export function TemplateGallery() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isCreateMode = searchParams.get('create') === 'true'

  const [selectedLayout, setSelectedLayout] = useState<LayoutFilter>('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [isOpening, setIsOpening] = useState(false)
  const [showInProgressWarning, setShowInProgressWarning] = useState(false)

  const resumeList = useResumeStore((s) => s.resumeList)
  const loadResumeList = useResumeStore((s) => s.loadResumeList)
  const createResume = useResumeStore((s) => s.createResume)
  const availableTemplates = useTemplateStore((s) => s.availableTemplates)

  // Only to detect work already in progress — this page never touches an
  // existing résumé, it just warns before starting a second one.
  useEffect(() => {
    if (!isCreateMode) void loadResumeList()
  }, [isCreateMode, loadResumeList])

  const resumeInProgress = isCreateMode
    ? null
    : ([...resumeList].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null)

  // The pick is a draft until the action commits it: this page only ever
  // creates, so there is nothing to write until then. Starts null rather than
  // pre-selected — a card wearing a checkmark on arrival claims a choice the
  // user has not made, and the résumé this creates has no template until they do.
  const [draftTemplateId, setDraftTemplateId] = useState<string | null>(null)
  const [draftTheme, setDraftTheme] = useState<{ themeId: string; customPrimaryColor?: string } | null>(null)

  const activeTemplateId = draftTemplateId

  // No résumé exists yet at this point, so only the template half is knowable.
  const atsFor = (tpl: TemplateDefinition) => calculateAtsScore(tpl, null)

  const atsTitle = (tpl: TemplateDefinition) => {
    const r = atsFor(tpl)
    const lines = r.factors.map((f) => `${f.label}: ${f.points}/${f.max}${f.hint ? ` — ${f.hint}` : ''}`)
    return `${lines.join('\n')}\n\nYour content is scored once the resume has some.`
  }

  const filteredTemplates = availableTemplates.filter((tpl) => {
    const matchesLayout = selectedLayout === 'All' || tpl.layout === selectedLayout
    const matchesSearch = tpl.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tpl.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesLayout && matchesSearch
  })

  const isUnfiltered = selectedLayout === 'All' && searchQuery === ''
  const clearFilters = () => { setSelectedLayout('All'); setSearchQuery('') }

  const activeTemplate = availableTemplates.find((t) => t.id === activeTemplateId)

  const handleSelect = (templateId: string, theme?: { themeId: string; customPrimaryColor?: string }) => {
    setDraftTemplateId(templateId)
    if (theme) setDraftTheme(theme)
    if (!isCreateMode) useTemplateStore.getState().setActiveTemplateId(templateId)
  }

  const createFromDraft = async () => {
    if (!draftTemplateId) return
    setIsOpening(true)
    try {
      const id = await createResume(draftTemplateId, draftTheme ?? { themeId: 'light' })
      void navigate(`/editor/${id}/guided`)
    } catch {
      toast.error('Failed to create resume')
    } finally {
      setIsOpening(false)
      setShowInProgressWarning(false)
    }
  }

  const handlePrimaryAction = () => {
    if (!draftTemplateId) return
    // Arriving via "New Resume" is already an explicit request for a second
    // résumé, so only the standalone library tab needs to ask.
    if (resumeInProgress) {
      setShowInProgressWarning(true)
      return
    }
    void createFromDraft()
  }

  return (
    <div className={styles.root}>
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
                ? 'Pick a professional layout to build your resume — you can switch anytime without losing your data.'
                : `${filteredTemplates.length} template${filteredTemplates.length === 1 ? '' : 's'}`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.main}>
        <div className={styles.mainInner}>
          {/* "All Templates" resets every filter at once. */}
          <div className={styles.categories}>
            <button
              onClick={clearFilters}
              aria-pressed={isUnfiltered}
              className={clsx(styles.categoryButton, isUnfiltered && styles.categoryButtonActive)}
            >
              All Templates
            </button>

            <div className={styles.filterGroup} role="group" aria-label="Filter by column layout">
              {LAYOUTS.map((layout) => (
                <button
                  key={layout.id}
                  onClick={() => setSelectedLayout(layout.id)}
                  aria-pressed={selectedLayout === layout.id}
                  className={clsx(
                    styles.categoryButton,
                    selectedLayout === layout.id && styles.categoryButtonActive
                  )}
                >
                  {layout.id === 'single-column'
                    ? <RectangleVertical size={13} aria-hidden="true" />
                    : <Columns2 size={13} aria-hidden="true" />}
                  {layout.label}
                </button>
              ))}
            </div>

            {/* One colour for the resume being started, rather than a copy on
                every card: the choice was never per-template, and repeating it
                fourteen times made it read as part of the card's content. */}
            <div className={styles.colorPicker}>
              <span className={styles.colorLabel}>Colour</span>
              <ThemeSwatchPicker
                themeId={draftTheme?.themeId ?? 'light'}
                customPrimaryColor={draftTheme?.customPrimaryColor}
                onChange={setDraftTheme}
                size={20}
              />
            </div>

            <div className={styles.searchWrap}>
              <Search className={styles.searchIcon} size={16} aria-hidden="true" />
              <input
                type="text"
                aria-label="Search templates"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Grid */}
          <div className={styles.grid}>
            <AnimatePresence mode="popLayout">
              {filteredTemplates.map((tpl) => (
                <motion.div
                  key={tpl.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4 }}
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
                    className={styles.previewButton}
                  >
                    <ResumePreview
                      layoutTree={getTemplatePreviewTree(tpl.id)}
                      widthPx={200}
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

                  {/* Info */}
                  <div className={styles.cardInfo}>
                    <div className={styles.cardInfoTop}>
                      <h3 className={styles.cardTitle}>{tpl.name}</h3>
                      <span className={styles.categoryTag}>
                        {tpl.category}
                      </span>
                    </div>
                    <p className={styles.cardDescription}>
                      {tpl.description}
                    </p>

                    <div className={styles.cardFooter}>
                      <div className={styles.atsInfo} title={atsTitle(tpl)}>
                        <Info size={12} className={styles.atsIcon} />
                        {/* Only the template half can be assessed here — the
                            résumé this starts does not exist yet — and the
                            label says so rather than implying otherwise. */}
                        <span>{`Template ATS: ${atsFor(tpl).templateScore}/${TEMPLATE_MAX}`}</span>
                      </div>
                      <div className={styles.tagDots}>
                        {tpl.tags.slice(0, 2).map(tag => (
                          <div key={tag} className={styles.tagDot} title={tag} />
                        ))}
                      </div>
                    </div>
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
          {/* Name on top, consequence underneath — the second line is the only
              place that says what pressing the button will actually do. */}
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
            <p className={styles.actionBarEffect}>
              {!activeTemplate
                ? 'Pick one above to get started'
                : resumeInProgress
                  ? <>Starts a new resume — <strong>{resumeInProgress.title}</strong> is untouched</>
                  : 'Starts a new resume'}
            </p>
          </div>

          <div className={styles.actionBarRight}>
            <Button
              variant="primary"
              disabled={!activeTemplate}
              loading={isOpening}
              onClick={handlePrimaryAction}
            >
              <Sparkles size={16} aria-hidden="true" />
              Create Resume
            </Button>
          </div>
        </div>
      </div>

      {/* This page cannot restyle an existing résumé — that lives in the
          editor now — so a pick made while one is open can only mean a new
          one. Said out loud rather than assumed. */}
      <Modal
        isOpen={showInProgressWarning}
        onClose={() => setShowInProgressWarning(false)}
        title="Resume already in progress"
      >
        <p className={styles.warningBody}>
          <strong>{resumeInProgress?.title}</strong> is still being edited. Starting
          {' '}{activeTemplate?.name} here creates a <strong>separate</strong> resume and
          leaves that one exactly as it is.
        </p>
        <p className={styles.warningHint}>
          To restyle the resume you are already working on, open it and use
          {' '}<strong>Change template</strong> in the editor.
        </p>
        <div className={styles.warningActions}>
          <Button variant="secondary" onClick={() => setShowInProgressWarning(false)}>
            Cancel
          </Button>
          <Button variant="primary" loading={isOpening} onClick={() => { void createFromDraft() }}>
            Create new resume
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default TemplateGallery
