import { useMemo, useState, type ComponentType } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { clsx } from 'clsx'
import {
  AlignLeft, ArrowLeft, Briefcase, Check, GraduationCap, LayoutDashboard, LayoutGrid, Save, ShieldCheck, User, Zap,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { Spinner } from '@/shared/components/ui/Spinner/Spinner'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { PersonalInfoForm } from '../components/PropertiesPanel/PersonalInfoForm'
import { SummaryForm } from '../components/PropertiesPanel/SummaryForm'
import { SectionProperties } from '../components/PropertiesPanel/SectionProperties'
import { useActiveResume } from '../hooks/useActiveResume'
import { useResumeLayoutTree } from '../hooks/useResumeLayoutTree'
import { useAutosave } from '../hooks/useAutosave'
import { useUndoRedo } from '../hooks/useUndoRedo'
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { calculateCompleteness } from '@/features/resume/utils/resumeCompleteness'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useTemplateStore } from '@/shared/stores/template.store'
import { TemplatePickerModal } from '@/shared/components/TemplatePickerModal/TemplatePickerModal'
import { AutosaveIndicator } from '../components/AutosaveIndicator'
import { Divider } from '@/shared/components/ui/Divider/Divider'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import styles from './GuidedEditorPage.module.css'

type WizardStep = 'personal' | 'summary' | 'experience' | 'education' | 'skills'
type StepIcon = ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean }>

const STEPS: { id: WizardStep; label: string; hint: string; Icon: StepIcon }[] = [
  { id: 'personal', label: 'Personal details', hint: 'Contact & links', Icon: User },
  { id: 'summary', label: 'Summary', hint: 'Your elevator pitch', Icon: AlignLeft },
  { id: 'experience', label: 'Work experience', hint: 'Roles & achievements', Icon: Briefcase },
  { id: 'education', label: 'Education', hint: 'Degrees & schools', Icon: GraduationCap },
  { id: 'skills', label: 'Skills', hint: 'Tools & strengths', Icon: Zap },
]

export function GuidedEditorPage() {
  const { resumeId } = useParams<{ resumeId: string }>()
  const navigate = useNavigate()
  const { activeResume, isLoading } = useActiveResume(resumeId)
  const layoutTree = useResumeLayoutTree(activeResume)
  const [stepIndex, setStepIndex] = useState(0)
  const isDesktop = useMediaQuery('(min-width: 768px)')
  // 1280 = the 700px of side rails plus the ~580px the form column needs to
  // stay comfortable; below this the preview is dropped rather than squeezed.
  const isWide = useMediaQuery('(min-width: 1280px)')
  const isSaving = useResumeStore((s) => s.isSaving)
  const isDirty = useResumeStore((s) => s.isDirty)
  const saveError = useResumeStore((s) => s.error)
  const updateResume = useResumeStore((s) => s.updateResume)
  const [isPickerOpen, setIsPickerOpen] = useState(false)

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
    onSave: () => { void saveActiveResume() },
    onEscape: () => { (document.activeElement as HTMLElement | null)?.blur() },
  })

  const completeness = useMemo(
    () => (activeResume ? calculateCompleteness(activeResume) : 0),
    [activeResume]
  )

  if (isLoading || !activeResume) {
    return (
      <div className={styles.loading}>
        <Spinner size={32} label="Loading resume…" />
      </div>
    )
  }

  const currentStep = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  const goNext = () => {
    if (isLastStep) {
      void navigate(`/editor/${activeResume.id}`)
    } else {
      setStepIndex((i) => Math.min(STEPS.length - 1, i + 1))
    }
  }

  const goBack = () => setStepIndex((i) => Math.max(0, i - 1))

  return (
    <div className={styles.root}>
      {/* Top bar */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to="/" aria-label="Resume Studio home" className={styles.brandLink}>
            <BrandMark size="sm" />
          </Link>
          <Divider orientation="vertical" className={clsx(styles.dividerDesktop, styles.dividerTall)} />
          <Link
            to="/app"
            aria-label="Back to dashboard"
            className={styles.backLink}
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <h1 className={styles.title} title={activeResume.title}>
            {activeResume.title || 'Untitled Resume'}
          </h1>
          <div className={styles.autosaveWrap}>
            <AutosaveIndicator isSaving={isSaving} isDirty={isDirty} error={saveError} />
          </div>
        </div>

        <Link
          to={`/editor/${activeResume.id}`}
          className={styles.fullEditorLink}
        >
          <LayoutDashboard size={15} aria-hidden="true" />
          Full Editor
        </Link>
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
          <nav
            className={styles.mobileStepper}
            aria-label="Guided setup steps"
          >
            <ol className={styles.mobileStepperList}>
              {STEPS.map((step, i) => {
                const isActive = i === stepIndex
                const isDone = i < stepIndex
                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      onClick={() => setStepIndex(i)}
                      aria-current={isActive ? 'step' : undefined}
                      className={clsx(styles.mobileStepButton, isActive && styles.mobileStepButtonActive)}
                    >
                      <span
                        className={clsx(
                          styles.mobileStepNumber,
                          isActive ? styles.mobileStepNumberActive : isDone && styles.mobileStepNumberDone
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
                const isDone = i < stepIndex
                const isLast = i === STEPS.length - 1
                return (
                  <li key={step.id} className={clsx(styles.desktopStepItem, !isLast && styles.desktopStepItemSpaced)}>
                    {!isLast && (
                      <span
                        className={clsx(styles.desktopStepConnector, isDone && styles.desktopStepConnectorDone)}
                        aria-hidden="true"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => setStepIndex(i)}
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
                        {isDone ? <Check size={16} strokeWidth={3} aria-hidden="true" /> : <step.Icon size={16} aria-hidden={true} />}
                      </span>
                      <span className={styles.desktopStepLabelWrap}>
                        <span className={clsx(styles.desktopStepLabel, isActive && styles.desktopStepLabelActive)}>
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
              <p>Every change saves automatically — come back anytime to pick up where you left off.</p>
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
                  <p className={styles.stepCardCounter}>Step {stepIndex + 1} of {STEPS.length}</p>
                </div>
              </div>

              {/* Only the fields scroll — the card frame and its header stay put. */}
              <div className={styles.stepCardBody}>
                {currentStep.id === 'personal' && (
                  <PersonalInfoForm resumeId={activeResume.id} personalInfo={activeResume.personalInfo} />
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

          {/* Step nav — pinned to the bottom-right of the form column. The card
              above stops short of it, so the two never overlap. */}
          <div className={styles.stepActions}>
            {/* Sits opposite the step nav rather than in the top bar: it is an
                aside to the wizard, not a step in it, and down here it stays
                visible at every width. */}
            <button
              type="button"
              onClick={() => setIsPickerOpen(true)}
              className={styles.templateButton}
            >
              <LayoutGrid size={15} aria-hidden="true" />
              Change template
            </button>

            <div className={styles.stepActionsBar}>
              <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0}>
                Back
              </Button>
              <Button variant="primary" onClick={goNext}>
                {isLastStep ? 'Finish' : 'Next'}
              </Button>
            </div>
          </div>
        </main>

        {/* Live preview — a "spotlight" card on the same light wash, not a separate dark utility panel */}
        {isWide && (
          <aside className={styles.previewAside}>
            <div className={styles.previewProgress}>
              <div className={styles.previewProgressRow}>
                <span className={styles.previewProgressLabel}>Profile strength</span>
                <span className={styles.previewProgressValue}>{completeness}%</span>
              </div>
              <div className={styles.previewProgressTrack}>
                <div
                  className={styles.previewProgressFill}
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <div className={styles.previewWrap}>
              <div
                className={styles.previewGlow}
                aria-hidden="true"
              />
              <ResumePreview
                layoutTree={layoutTree}
                widthPx={300}
                className={styles.previewCard}
              />
            </div>

            <div className={styles.previewNote}>
              <ShieldCheck size={14} className={styles.previewNoteIcon} aria-hidden="true" />
              <p>Private by default — this preview and everything you type stay on your device.</p>
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
  )
}

export default GuidedEditorPage
