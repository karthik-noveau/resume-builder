import { useId } from 'react'
import { Pause, Play } from 'lucide-react'
import styles from './HeroBackdrop.module.css'

const WAVE = 'M-160 800 C180 800 210 470 550 500 S1060 140 1600 160'

interface HeroBackdropProps {
  paused: boolean
  onToggleMotion: () => void
}

export function HeroBackdrop({ paused, onToggleMotion }: HeroBackdropProps) {
  const gradientId = useId()

  return (
    <>
      <div className={styles.backdrop} aria-hidden="true">
        <div className={styles.arrival}>
          <svg
            className={styles.waves}
            viewBox="0 0 1440 900"
            preserveAspectRatio="none"
            focusable="false"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
                <stop className={styles.violetStop} />
                <stop className={styles.blueStop} offset="1" />
              </linearGradient>
            </defs>
            <path
              className={styles.backWave}
              fill={`url(#${gradientId})`}
              d={`${WAVE} V1040 H-160Z`}
            />
            <g className={styles.depth}>
              <path
                className={styles.frontWave}
                d={`${WAVE} V1040 H-160Z`}
                transform="translate(120 -40)"
              />
            </g>
            <path className={styles.edge} d={WAVE} />
            <path className={styles.trace} d={WAVE} pathLength="1" />
          </svg>
        </div>
        <span className={styles.grid} />
      </div>
      <button
        type="button"
        className={styles.motionToggle}
        onClick={onToggleMotion}
        aria-label={paused ? 'Resume animations' : 'Pause animations'}
        title={paused ? 'Resume animations' : 'Pause animations'}
      >
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      </button>
    </>
  )
}
