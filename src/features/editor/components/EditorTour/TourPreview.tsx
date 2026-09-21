import { ArrowRight, Check, MousePointer2 } from 'lucide-react'
import type { EditorTourStepId } from './editorTour.steps'
import styles from './TourPreview.module.css'

function MiniPage({ variant = 'plain' }: { variant?: string }) {
  return <div className={styles.page} data-variant={variant}>
    <div className={styles.pageInner}>
      <span className={styles.name} />
      <span className={styles.subtitle} />
      <div className={styles.block}><i /><i /><i /></div>
      <div className={styles.block}><i /><i /><i /></div>
    </div>
    {variant === 'selected' && <MousePointer2 className={styles.pointer} size={15} />}
  </div>
}

/** Decorative examples only: no live resume data, form controls, or mutations. */
export function TourPreview({ step }: { step: EditorTourStepId }) {
  return <div className={styles.preview} data-preview={step} aria-hidden="true">
    {step === 'template' ? (
      <div className={styles.templates}>
        <MiniPage variant="sidebar" />
        <div className={styles.chosen}>
          <MiniPage variant="banner" />
          <span className={styles.check}><Check size={10} strokeWidth={3} /></span>
        </div>
        <MiniPage />
      </div>
    ) : (
      <>
        <MiniPage variant={step === 'page-setup' ? 'margins' : step === 'global-design' ? 'global' : step === 'selected-design' ? 'selected' : 'content'} />
        <ArrowRight size={15} className={styles.arrow} />
        <div className={styles.controls}>
          {step === 'page-setup' ? <>
            <div className={styles.sizes}><span>A4</span><span>Letter</span></div>
            <span className={styles.label}>Margins & spacing</span>
            <div className={styles.slider}><i /></div>
          </> : step === 'content' ? <>
            <span className={styles.label}>Full name</span>
            <div className={styles.field}>Your name<span className={styles.caret} /></div>
            <div className={styles.field}><span className={styles.fieldLine} /></div>
          </> : <>
            <div className={styles.typeRow}><span>Aa</span><span>B</span><em>I</em></div>
            <div className={styles.swatches}><i /><i /><i /><Check size={10} /></div>
            <span className={styles.label}>{step === 'global-design' ? 'Whole resume' : 'Selected item only'}</span>
          </>}
        </div>
      </>
    )}
  </div>
}
