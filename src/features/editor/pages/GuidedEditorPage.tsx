import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { clsx } from 'clsx'
import {
  AlignLeft,
  ArrowLeft,
  Briefcase,
  Check,
  GraduationCap,
  LayoutDashboard,
  LayoutGrid,
  Save,
  ShieldCheck,
  User,
  Zap,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { PersonalInfoForm } from '../components/PropertiesPanel/PersonalInfoForm'
import { SummaryForm } from '../components/PropertiesPanel/SummaryForm'
import { SectionProperties } from '../components/PropertiesPanel/SectionProperties'
import { MockDataButton } from '../components/MockDataButton'
import { GuidedFormContext, type GuidedFormSave } from '../hooks/useGuidedForm'
import { getGuidedStepErrors, type GuidedStep } from '../utils/guidedSetup'
import { useActiveResume } from '../hooks/useActiveResume'
import { ResumeLoadError } from '../components/ResumeLoadError'
import { useResumeLayoutTree } from '../hooks/useResumeLayoutTree'
import { useAutosave } from '../hooks/useAutosave'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { AtsEvaluation } from '../components/AtsEvaluation'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useTemplateStore } from '@/shared/stores/template.store'
import { TemplatePickerModal } from '@/shared/components/TemplatePickerModal/TemplatePickerModal'
import { AutosaveIndicator } from '../components/AutosaveIndicator'
import { Divider } from '@/shared/components/ui/Divider/Divider'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import { Seo } from '@/shared/components/Seo/Seo'
import styles from './GuidedEditorPage.module.css'
import mobile from '@/shared/styles/mobileEditor.module.css'

type StepIcon = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>

const STEPS: { id: GuidedStep; label: string; hint: string; Icon: StepIcon }[] = [
  { id: 'personal', label: 'Personal details', hint: 'Contact & links', Icon: User },
  { id: 'summary', label: 'Summary', hint: 'Your elevator pitch', Icon: AlignLeft },
  { id: 'experience', label: 'Work experience', hint: 'Roles & achievements', Icon: Briefcase },
  { id: 'education', label: 'Education', hint: 'Degrees & schools', Icon: GraduationCap },
  { id: 'skills', label: 'Skills', hint: 'Tools & strengths', Icon: Zap },
]

export function GuidedEditorPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const navigate = useNavigate()
  const { activeResume, isLoading, loadError, retry } = useActiveResume(resumeId)
  const layoutTree = useResumeLayoutTree(activeResume)
  const [stepIndex, setStepIndex] = useState(0)
  const [showValidation, setShowValidation] = useState(false)
  const [hasFormErrors, setHasFormErrors] = useState(false)
  const [finishError, setFinishError] = useState<string | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const navigationLock = useRef(false)
  const stepBodyRef = useRef<HTMLDivElement>(null)
  const stepperRef = useRef<HTMLElement>(null)
  const formSavers = useRef(new Set<GuidedFormSave>())
  const registerSave = useCallback((save: GuidedFormSave) => {
    formSavers.current.add(save)
    return () => {
      formSavers.current.delete(save)
    }
  }, [])
  const saveForms = useCallback(async () => {
    const results = await Promise.all([...formSavers.current].map((save) => save()))
    return results.every(Boolean)
  }, [])
  const isDesktop = useMediaQuery('(min-width: 1024px) and (min-height: 600px)')
  // 1280 = the 700px of side rails plus the ~580px the form column needs to
  // stay comfortable; below this the preview is dropped rather than squeezed.
  const isWide = useMediaQuery('(min-width: 1280px) and (min-height: 600px)')
  const isSaving = useResumeStore((s) => s.isSaving)
  const isDirty = useResumeStore((s) => s.isDirty)
  const saveError = useResumeStore((s) => s.error)
  const updateResume = useResumeStore((s) => s.updateResume)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  useEffect(() => {
    stepperRef.current
      ?.querySelector<HTMLElement>('[aria-current="step"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [stepIndex, isDesktop, isLoading])

  const handleTemplateSwitch = (templateId: string) => {
    useTemplateStore.getState().switchTemplate(templateId)
    updateResume({ templateId })
  }

  useAutosave()

  // The wizard mutates the same store as the full editor and records an undo
  // snapshot on every change, so those snapshots were being collected here but
  // left unreachable. Zoom and Delete are deliberately omitted: there is no
  // canvas to zoom and no selected entry to delete on this route.
  const { handleUndo, handleRedo } = useUndoRedo()
  const saveActiveResume = useResumeStore((s) => s.saveActiveResume)

  useKeyboardShortcuts({
    onUndo: handleUndo,
    onRedo: handleRedo,
    onSave: () => {
      void saveActiveResume()
    },
    onEscape: () => {
      ;(document.activeElement as HTMLElement | null)?.blur()
    },
  })

  if (!isLoading && loadError && (!activeResume || activeResume.id !== resumeId)) {
    return <ResumeLoadError onRetry={retry} />
  }
  if (isLoading || !activeResume || activeResume.id !== resumeId) {
    return (
      <div className={styles.loading}>
        <Spinner size={32} label="Loading resume…" />
      </div>
    )
  }

  const currentStep = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1
  const stepErrors = getGuidedStepErrors(activeResume, currentStep.id)

  const clearValidation = () => {
    setShowValidation(false)
    setHasFormErrors(false)
    setFinishError(null)
  }

  const focusInvalidField = () => {
    requestAnimationFrame(() => {
      const invalid = stepBodyRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      if (invalid) {
        invalid.focus()
        invalid.scrollIntoView({ block: 'nearest' })
      } else stepBodyRef.current?.scrollTo({ top: 0 })
    })
  }

  const goToStep = async (targetIndex: number) => {
    if (navigationLock.current || targetIndex === stepIndex) return
    navigationLock.current = true
    setIsNavigating(true)
    try {
      // Await validation and the final field's save, rather than racing its blur.
      const formsValid = await saveForms()
      if (targetIndex < stepIndex) {
        clearValidation()
        setStepIndex(targetIndex)
        return
      }
      setShowValidation(true)
      setHasFormErrors(!formsValid)
      if (!formsValid) {
        focusInvalidField()
        return
      }
      const resume = useResumeStore.getState().activeResume
      if (!resume) return
      // Stepper clicks and Finish enforce the same requirements as Next.
      const firstIncomplete = STEPS.slice(0, targetIndex).findIndex(
        (step) => getGuidedStepErrors(resume, step.id).length > 0
      )
      if (firstIncomplete !== -1) {
        setStepIndex(firstIncomplete)
        focusInvalidField()
        return
      }
      clearValidation()
      if (targetIndex === STEPS.length) {
        await saveActiveResume()
        if (useResumeStore.getState().error) {
          setFinishError('Could not save your latest changes. Please try Finish again.')
          return
        }
        void navigate(`/editor/${resume.id}`)
      } else {
        setStepIndex(targetIndex)
        stepBodyRef.current?.scrollTo({ top: 0 })
      }
    } finally {
      navigationLock.current = false
      setIsNavigating(false)
    }
  }

  const goNext = () => {
    void goToStep(stepIndex + 1)
  }
  const goBack = () => {
    void goToStep(Math.max(0, stepIndex - 1))
  }

  return (
    <GuidedFormContext.Provider value={{ showErrors: showValidation, registerSave, saveForms }}>
      <div className={clsx(styles.root, mobile.controls)}>
        <Seo
          title={`Guided setup — ${activeResume.title}`}
          description="Step-by-step resume setup."
          noindex
        />
        {/* Top bar */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Link to="/" aria-label="Resume Studio home" className={styles.brandLink}>
              <BrandMark size="sm" />
            </Link>
            <Divider
              orientation="vertical"
              className={clsx(styles.dividerDesktop, styles.dividerTall)}
            />
            <Link to="/app" aria-label="Back to dashboard" className={styles.backLink}>
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
            <h1 className={styles.title} title={activeResume.title}>
              {activeResume.title || 'Untitled Resume'}
            </h1>
            <div className={styles.autosaveWrap}>
              <AutosaveIndicator isSaving={isSaving} isDirty={isDirty} error={saveError} />
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void goToStep(STEPS.length)
            }}
            disabled={isNavigating}
            className={styles.fullEditorLink}
          >
            <LayoutDashboard size={15} aria-hidden="true" />
            Full Editor
          </button>
        </header>

        {/* Overall progress — always visible, independent of breakpoint */}
        <div className={styles.progressTrack} aria-hidden="true">
          <div
            className={styles.progressFill}
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        <div className={styles.main}>
          {/* Stepper (mobile/tablet) */}
          {!isDesktop && (
            <nav ref={stepperRef} className={styles.mobileStepper} aria-label="Guided setup steps">
              <ol className={styles.mobileStepperList}>
                {STEPS.map((step, i) => {
                  const isActive = i === stepIndex
                  const isDone = getGuidedStepErrors(activeResume, step.id).length === 0
                  return (
                    <li key={step.id}>
                      <button
                        type="button"
                        onClick={() => {
                          void goToStep(i)
                        }}
                        aria-current={isActive ? 'step' : undefined}
                        className={clsx(
                          styles.mobileStepButton,
                          isActive && styles.mobileStepButtonActive
                        )}
                      >
                        <span
                          className={clsx(
                            styles.mobileStepNumber,
                            isActive
                              ? styles.mobileStepNumberActive
                              : isDone && styles.mobileStepNumberDone
                          )}
                        >
                          {isDone ? <Check size={10} strokeWidth={3} aria-hidden="true" /> : i + 1}
                        </span>
                        {step.label}
                      </button>
                    </li>
                  )
                })}
              </ol>
            </nav>
          )}

          {/* Stepper (desktop) — connected rail with icon markers instead of a plain list */}
          {isDesktop && (
            <aside className={styles.desktopStepper} aria-label="Guided setup steps">
              <ol>
                {STEPS.map((step, i) => {
                  const isActive = i === stepIndex
                  const isDone = getGuidedStepErrors(activeResume, step.id).length === 0
                  const isLast = i === STEPS.length - 1
                  return (
                    <li
                      key={step.id}
                      className={clsx(
                        styles.desktopStepItem,
                        !isLast && styles.desktopStepItemSpaced
                      )}
                    >
                      {!isLast && (
                        <span
                          className={clsx(
                            styles.desktopStepConnector,
                            isDone && styles.desktopStepConnectorDone
                          )}
                          aria-hidden="true"
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          void goToStep(i)
                        }}
                        aria-current={isActive ? 'step' : undefined}
                        className={styles.desktopStepButton}
                      >
                        <span
                          className={clsx(
                            styles.desktopStepIcon,
                            isActive
                              ? styles.desktopStepIconActive
                              : isDone
                                ? styles.desktopStepIconDone
                                : styles.desktopStepIconDefault
                          )}
                        >
                          {isDone ? (
                            <Check size={16} strokeWidth={3} aria-hidden="true" />
                          ) : (
                            <step.Icon size={16} aria-hidden={true} />
                          )}
                        </span>
                        <span className={styles.desktopStepLabelWrap}>
                          <span
                            className={clsx(
                              styles.desktopStepLabel,
                              isActive && styles.desktopStepLabelActive
                            )}
                          >
                            {step.label}
                          </span>
                          <span className={styles.desktopStepHint}>{step.hint}</span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ol>

              <div className={styles.autosaveNote}>
                <Save size={14} className={styles.autosaveNoteIcon} aria-hidden="true" />
                <p>
                  Every change saves automatically — come back anytime to pick up where you left
                  off.
                </p>
              </div>
            </aside>
          )}

          {/* Current step form */}
          <main className={styles.stepMain}>
            {/* Decorative wash — ties the wizard to the marketing site's palette
              instead of a flat gray canvas. Scoped to the centre column, since
              the side rails are opaque chrome and would otherwise hide it. */}
            <div className={styles.wash} aria-hidden="true">
              <div className={styles.washBlobPrimary} />
              <div className={styles.washBlobAccent} />
            </div>

            <div className={styles.stepContent}>
              <div className={styles.stepCard}>
                <div className={styles.stepCardHeader}>
                  <span className={styles.stepCardIcon}>
                    <currentStep.Icon size={18} aria-hidden={true} />
                  </span>
                  <div>
                    <h2 className={styles.stepCardTitle}>{currentStep.label}</h2>
                    <p className={styles.stepCardCounter}>
                      Step {stepIndex + 1} of {STEPS.length}
                    </p>
                    <p className={styles.requiredHint}>
                      <span aria-hidden="true">*</span> Required fields
                    </p>
                  </div>
                </div>

                {/* Only the fields scroll — the card frame and its header stay put. */}
                <div className={styles.stepCardBody} ref={stepBodyRef}>
                  {finishError && (
                    <div className={styles.validationNotice} role="alert">
                      {finishError}
                    </div>
                  )}
                  {showValidation && (stepErrors.length > 0 || hasFormErrors) && (
                    <div className={styles.validationNotice} role="alert">
                      {stepErrors[0] ?? 'Check the highlighted fields before continuing.'}
                    </div>
                  )}
                  {currentStep.id === 'personal' && (
                    <PersonalInfoForm
                      resumeId={activeResume.id}
                      personalInfo={activeResume.personalInfo}
                    />
                  )}
                  {currentStep.id === 'summary' && <SummaryForm section={activeResume.summary} />}
                  {currentStep.id === 'experience' && (
                    <SectionProperties resume={activeResume} sectionType="experience" />
                  )}
                  {currentStep.id === 'education' && (
                    <SectionProperties resume={activeResume} sectionType="education" />
                  )}
                  {currentStep.id === 'skills' && (
                    <SectionProperties resume={activeResume} sectionType="skills" />
                  )}
                </div>
              </div>
            </div>

            {/* Footer stays below the scrolling form, including when compact
              screens need a separate row for the template picker. */}
            <div className={styles.stepActions}>
              {/* Keep the picker reachable when the preview rail is hidden. */}
              {!isWide && (
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  className={styles.templateButton}
                >
                  <LayoutGrid size={15} aria-hidden="true" />
                  Change template
                </button>
              )}

              <div className={styles.stepActionsBar} role="group" aria-label="Guided setup actions">
                <Button
                  className={styles.backButton}
                  variant="ghost"
                  onClick={goBack}
                  disabled={stepIndex === 0}
                >
                  Back
                </Button>
                <MockDataButton
                  key={currentStep.id}
                  step={currentStep.id}
                  onApplied={clearValidation}
                />
                <Button variant="primary" onClick={goNext} disabled={isNavigating}>
                  {isLastStep ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </main>

          {/* Live preview — a "spotlight" card on the same light wash, not a separate dark utility panel */}
          {isWide && (
            <aside className={styles.previewAside} aria-label="Resume preview">
              <div className={styles.previewProgress}>
                <AtsEvaluation resume={activeResume} layoutTree={layoutTree} />
              </div>

              <div className={styles.previewWrap}>
                <div className={styles.previewGlow} aria-hidden="true" />
                <ResumePreview
                  layoutTree={layoutTree}
                  widthPx={300}
                  className={styles.previewCard}
                />
              </div>

              <button
                type="button"
                onClick={() => setIsPickerOpen(true)}
                className={clsx(styles.templateButton, styles.previewTemplateButton)}
              >
                <LayoutGrid size={15} aria-hidden="true" />
                Change template
              </button>

              <div className={styles.previewNote}>
                <ShieldCheck size={14} className={styles.previewNoteIcon} aria-hidden="true" />
                <p>
                  Private by default — this preview and everything you type stay on your device.
                </p>
              </div>
            </aside>
          )}
        </div>

        <TemplatePickerModal
          isOpen={isPickerOpen}
          onClose={() => setIsPickerOpen(false)}
          currentTemplateId={activeResume.templateId}
          onSelect={handleTemplateSwitch}
        />
      </div>
    </GuidedFormContext.Provider>
  )
}

export default GuidedEditorPage
