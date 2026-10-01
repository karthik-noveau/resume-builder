import { useContext, useState } from 'react'
import { FileText } from 'lucide-react'
import { getGuidedMockPatch, GUIDED_STEP_LABELS, hasGuidedStepContent, type GuidedStep } from '../utils/guidedSetup'
import { GuidedFormContext } from '../hooks/useGuidedForm'
import { useResumeStore } from '@/shared/stores/resume.store'
import { Button } from '@/shared/components/ui/Button/Button'
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog/ConfirmDialog'
import styles from './MockDataButton.module.css'

/** Mock data is scoped to the current guided step, never the entire resume. */
export function MockDataButton({ step, onApplied }: { step: GuidedStep; onApplied?: () => void }) {
  const [confirming, setConfirming] = useState(false)
  const guided = useContext(GuidedFormContext)
  const activeResume = useResumeStore((s) => s.activeResume)
  const updateResume = useResumeStore((s) => s.updateResume)

  const applyMockData = () => {
    const resume = useResumeStore.getState().activeResume
    if (!resume) return
    // The normal update path gives this a single undo snapshot and autosave.
    updateResume(getGuidedMockPatch(resume, step))
    setConfirming(false)
    onApplied?.()
  }

  const handleClick = async () => {
    const formsValid = guided ? await guided.saveForms() : true
    const resume = useResumeStore.getState().activeResume
    if (!resume) return
    if (formsValid === false || hasGuidedStepContent(resume, step)) setConfirming(true)
    else applyMockData()
  }

  return (
    <>
      <Button variant="ghost" className={styles.trigger} onClick={() => { void handleClick() }} disabled={!activeResume}
        title={`Fill only ${GUIDED_STEP_LABELS[step].toLowerCase()} with an example`}>
        <FileText size={16} strokeWidth={1.75} aria-hidden="true" />
        Fill with example
      </Button>
      <ConfirmDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={applyMockData}
        title={`Replace ${GUIDED_STEP_LABELS[step].toLowerCase()} with an example?`}
        description="Only this section will be replaced. Your other sections and design stay unchanged, and you can undo this change."
        confirmLabel="Replace with example"
      />
    </>
  )
}
