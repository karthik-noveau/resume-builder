import { useState, type CSSProperties } from 'react'
import { Check, FileDown, Layers3, MousePointer2, SlidersHorizontal } from 'lucide-react'
import styles from './FeatureGrid.module.css'

const COLORS = [
  { name: 'Violet', value: '#7a45d1' },
  { name: 'Emerald', value: '#087c58' },
  { name: 'Cobalt', value: '#2457df' },
  { name: 'Coral', value: '#c23f35' },
]
const FEATURES = [
  {
    Icon: MousePointer2,
    title: 'See every change, live.',
    description: 'A live preview that keeps up with every change. No guesswork between edits.',
  },
  {
    Icon: Layers3,
    title: 'Make the design yours.',
    description:
      'Fine-tune the colors, fonts, and layout. Your experience deserves your own style.',
  },
  {
    Icon: FileDown,
    title: 'Download and get going.',
    description:
      'Preview your final PDF before downloading. Selectable text, embedded fonts, and no watermark.',
  },
]

export function FeatureGrid() {
  const [color, setColor] = useState(COLORS[0])
  const [font, setFont] = useState<'Serif' | 'Sans'>('Sans')

  return (
    <section className={styles.section} aria-labelledby="features-heading">
      <div className={styles.panel}>
        <div className={styles.top}>
          <div className={styles.copy}>
            <p className={styles.eyebrow}>MORE CONTROL. LESS COMPROMISE.</p>
            <h2 id="features-heading">
              Small details.
              <br />
              <em>A big difference.</em>
            </h2>
            <p className={styles.description}>
              Get the look right without fighting the formatting. Adjust your colors, choose your
              type, and see every change as you make it.
            </p>
            <span className={styles.tryHint}>
              Try the controls. Find your style. <span aria-hidden="true">↗</span>
            </span>
          </div>
          <div className={styles.designDemo}>
            <div className={styles.demoHeader}>
              <SlidersHorizontal size={13} aria-hidden="true" />
              <span>Your personal style</span>
              <span className={styles.liveLabel}>LIVE</span>
            </div>
            <div
              className={styles.sample}
              style={
                {
                  '--sample-color': color.value,
                  fontFamily:
                    font === 'Serif' ? "'SourceSerifPro', Georgia, serif" : "'Manrope', sans-serif",
                } as CSSProperties
              }
            >
              <span className={styles.sampleLabel}>HELLO, I’M</span>
              <span className={styles.sampleName}>
                Alex Morgan<span>.</span>
              </span>
              <span className={styles.sampleRole}>
                Product designer & thoughtful problem solver
              </span>
              <div className={styles.sampleRule} />
              <span className={styles.sampleSummary}>
                Good ideas deserve a little attention to detail.
              </span>
            </div>
            <div className={styles.demoControls}>
              <div className={styles.swatches} role="group" aria-label="Sample accent color">
                {COLORS.map((option) => (
                  <button
                    key={option.name}
                    type="button"
                    style={{ background: option.value }}
                    aria-label={option.name}
                    aria-pressed={color.name === option.name}
                    onClick={() => setColor(option)}
                  >
                    {color.name === option.name && <Check size={12} aria-hidden="true" />}
                  </button>
                ))}
              </div>
              <div className={styles.fonts} role="group" aria-label="Sample typography">
                {(['Serif', 'Sans'] as const).map((option) => (
                  <button
                    type="button"
                    key={option}
                    aria-pressed={font === option}
                    onClick={() => setFont(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
            <span className={styles.demoNote} aria-live="polite">
              A little preview of what’s possible · {color.name} / {font}
            </span>
          </div>
        </div>
        <div className={styles.features}>
          {FEATURES.map(({ Icon, title, description }) => (
            <div key={title} className={styles.feature}>
              <Icon size={21} strokeWidth={1.5} aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
