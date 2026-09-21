import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox/Checkbox'
import type { ResetResumeOptions } from '@/shared/stores/resume.store'
import styles from './ResetButton.module.css'

interface ResetButtonProps {
  onReset: (options: ResetResumeOptions) => void
}

/** Design only. Content is the expensive half to lose, so it is never pre-ticked. */
const DEFAULT_SELECTION: ResetResumeOptions = { content: false, appearance: true }

/**
 * Reset, in the toolbar beside the other document controls.
 *
 * Nothing is destroyed by the button itself — it opens a dialog that asks what
 * to clear, arrives with the safe half ticked, and is undoable afterwards. That
 * is what makes it safe to sit in the open rather than behind a menu.
 */
export function ResetButton({ onReset }: ResetButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [selection, setSelection] = useState<ResetResumeOptions>(DEFAULT_SELECTION)

  const close = () => {
    setConfirming(false)
    // Back to the safe default, so a dialog reopened later never arrives with
    // "content" already ticked from a previous visit.
    setSelection(DEFAULT_SELECTION)
  }

  const nothingSelected = !selection.content && !selection.appearance

  return (
    <>
      <button
        type="button"
        aria-label="Reset resume"
        title="Reset resume"
        className={styles.trigger}
        onClick={() => setConfirming(true)}
      >
        <RotateCcw size={16} aria-hidden="true" />
      </button>

      <Modal isOpen={confirming} onClose={close} title="Reset resume" maxWidth="sm">
        <div className={styles.confirm}>
          <p className={styles.confirmIntro}>Choose what to clear.</p>

          <fieldset className={styles.choices}>
            <legend className={styles.srOnly}>What to reset</legend>

            {/* A div, not a label: the Checkbox renders its own <label>, and
                nesting one inside another is invalid and toggles twice in some
                browsers. The hint is tied to the box with aria-describedby
                instead, which is what actually reads it out. */}
            <div className={styles.choice}>
              <Checkbox
                id="reset-content"
                label="Content"
                aria-describedby="reset-content-hint"
                checked={selection.content}
                onChange={(e) =>
                  setSelection((s) => ({ ...s, content: e.target.checked }))
                }
              />
              <span id="reset-content-hint" className={styles.choiceHint}>
                Clears your details, summary and entries so you can start blank.
              </span>
            </div>

            <div className={styles.choice}>
              <Checkbox
                id="reset-design"
                label="Design"
                aria-describedby="reset-design-hint"
                checked={selection.appearance}
                onChange={(e) =>
                  setSelection((s) => ({ ...s, appearance: e.target.checked }))
                }
              />
              <span id="reset-design-hint" className={styles.choiceHint}>
                Colours, fonts, text styles, spacing, page setup and section order.
              </span>
            </div>
          </fieldset>

          {/* The template survives either way: the product has no default one,
              so a reset would have to pick an arbitrary replacement. */}
          <p className={styles.confirmNote}>
            Your template stays as it is, and you can undo this.
          </p>

          <div className={styles.confirmActions}>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={nothingSelected}
              onClick={() => {
                onReset(selection)
                close()
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
