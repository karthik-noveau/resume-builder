import { useId, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import styles from './HeroBackdrop.module.css'

const WAVE = 'M1030 -100 C650 160 1280 280 1050 500 S520 740 720 1040'

export function HeroBackdrop() {
  const [paused, setPaused] = useState(false)
  const gradientId = useId()

  return (
    <>
      <div className={styles.backdrop} data-paused={paused} aria-hidden="true">
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
              d={`${WAVE} H1600 V-100Z`}
            />
            <g className={styles.depth}>
              <path
                className={styles.frontWave}
                d={`${WAVE} H1600 V-100Z`}
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
        onClick={() => setPaused((value) => !value)}
        aria-label={paused ? 'Resume background animation' : 'Pause background animation'}
        title={paused ? 'Resume background animation' : 'Pause background animation'}
      >
        {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
      </button>
    </>
  )
}
