import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { Tour, type TourProps } from 'antd'
import { ArrowRight, X } from 'lucide-react'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Button } from '@/shared/components/ui/Button/Button'
import styles from './EditorTour.module.css'
import { EDITOR_TOUR_STEPS } from './editorTour.steps'
import { TourPreview } from './TourPreview'

// Hidden/off-screen targets fall back to a centered card, never a broken spotlight.
function visibleTarget(selector: string) {
  const target = document.querySelector<HTMLElement>(selector)
  if (!target) return null
  const rect = target.getBoundingClientRect()
  return rect.width > 0 && rect.height > 0 && rect.top >= 0 && rect.left >= 0
    && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth ? target : null
}

export function EditorTour({ current, onChange, onClose }: {
  current: number
  onChange: (index: number) => void
  onClose: () => void
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const desktop = useMediaQuery('(min-width: 1024px)')
  const tallScreen = useMediaQuery('(min-height: 600px)')
  const cardRef = useRef<HTMLDivElement>(null)
  const headingId = useId()
  const descriptionId = useId()
  const step = EDITOR_TOUR_STEPS[current]

  useLayoutEffect(() => {
    const scrollPositions = Array.from(document.querySelectorAll<HTMLElement>('[data-editor-tour-scroll]'))
      .map((element) => ({ element, top: element.scrollTop }))
    return () => {
      requestAnimationFrame(() => scrollPositions.forEach(({ element, top }) => {
        if (element.isConnected) element.scrollTop = top
      }))
    }
  }, [])

  useLayoutEffect(() => {
    // Panel previews are committed before measuring their newly revealed controls.
    const selector = `[data-editor-tour="${desktop ? step.id : `${step.panel}-toggle`}"]`
    const element = document.querySelector<HTMLElement>(selector)
    if (desktop) element?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
    setTarget(visibleTarget(selector))
  }, [desktop, step])

  useEffect(() => {
    const returnTarget = document.querySelector<HTMLElement>('[data-editor-tour="replay"]')
    return () => {
      // React removes `inert` from the editor before restoring toolbar focus.
      requestAnimationFrame(() => returnTarget?.isConnected && returnTarget.focus({ preventScroll: true }))
    }
  }, [])

  useEffect(() => {
    // The Tour portal mounts after its target has been measured.
    const frame = requestAnimationFrame(() => cardRef.current?.focus({ preventScroll: true }))
    return () => cancelAnimationFrame(frame)
  }, [current])

  const last = current === EDITOR_TOUR_STEPS.length - 1

  const card = (
    <div
      ref={cardRef}
      className={styles.card}
      role="dialog"
      aria-modal="true"
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
      tabIndex={-1}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (event.key === 'Escape') {
          event.preventDefault()
          onClose()
        }
        if (event.key === 'Tab') {
          const buttons = Array.from(cardRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement)
          if (event.shiftKey && index <= 0) {
            event.preventDefault()
            buttons[buttons.length - 1]?.focus()
          } else if (!event.shiftKey && (index === -1 || index === buttons.length - 1)) {
            event.preventDefault()
            buttons[0]?.focus()
          }
        }
      }}
    >
      <div className={styles.topRow}>
        <span className={styles.eyebrow}>Editing tour <span>· {current + 1} / {EDITOR_TOUR_STEPS.length}</span></span>
        <button type="button" className={styles.close} aria-label="Close quick tour" onClick={onClose}>
          <X size={17} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.body}>
        <h2 id={headingId} className={styles.title}>{step.title}</h2>
        <p id={descriptionId} className={styles.copy}>{step.description}</p>
        <TourPreview step={step.id} />
        <p className={styles.location}>
          {!desktop && 'Open '}
          {!desktop && step.id.endsWith('-design') && 'Properties · '}
          {step.location}
        </p>
      </div>
      <div className={styles.footer}>
        <button type="button" className={styles.skip} onClick={onClose}>Skip tour</button>
        {current > 0 && <Button variant="ghost" onClick={() => onChange(current - 1)}>Back</Button>}
        <Button onClick={() => last ? onClose() : onChange(current + 1)}>
          {last ? 'Start editing' : 'Next'}
          {!last && <ArrowRight size={14} aria-hidden="true" />}
        </Button>
      </div>
    </div>
  )

  const tourSteps: TourProps['steps'] = EDITOR_TOUR_STEPS.map((item, index) => ({
    title: null,
    description: card,
    target: index === current ? target : null,
    placement: desktop ? (item.panel === 'sections' ? 'rightTop' : 'leftTop') : 'bottom',
    scrollIntoViewOptions: false,
    style: { width: 'min(320px, calc(100vw - 32px))' },
  }))

  return <Tour
    open
    current={current}
    steps={tourSteps}
    closable={false}
    keyboard={false}
    disabledInteraction
    arrow={desktop && tallScreen}
    rootClassName={styles.tour}
    mask={{ color: 'rgba(15, 23, 42, 0.38)' }}
    gap={{ offset: 6, radius: 10 }}
    classNames={{ section: styles.section, description: styles.description }}
    styles={{ footer: { display: 'none' } }}
  />
}
