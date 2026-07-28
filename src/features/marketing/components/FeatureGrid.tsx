import { motion } from 'framer-motion'
import { clsx } from 'clsx'
import { LayoutTemplate, Palette, Download, Upload, Moon } from 'lucide-react'
import { Card } from '@/shared/components/ui/Card/Card'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { fadeUp, staggerContainer, viewportOnce, BRAND_GRADIENT } from './motion'
import styles from './FeatureGrid.module.css'

const SMALL_FEATURES = [
  {
    Icon: Palette,
    title: 'Make it yours',
    description: 'Pick a color theme, a custom accent color, or a font pairing — your resume, your look.',
  },
  {
    Icon: Download,
    title: 'One-click PDF export',
    description: 'Export a polished, print-ready PDF whenever you’re ready to apply.',
  },
  {
    Icon: Upload,
    title: 'Import an existing resume',
    description: 'Paste your current resume text and get a head start — review and refine from there.',
  },
  {
    Icon: Moon,
    title: 'Light & dark mode',
    description: 'Work comfortably day or night, with autosave and undo/redo built in.',
  },
]

export function FeatureGrid() {
  return (
    <section className={styles.section}>
      <motion.div
        className={styles.header}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
        transition={{ duration: 0.4 }}
      >
        <span className={styles.eyebrow}>Why Resume Studio</span>
        <h2 className={styles.heading}>
          Everything you need. Nothing you don&apos;t.
        </h2>
      </motion.div>

      <motion.div
        className={styles.grid}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.4 }} className={styles.bigCardGridItem}>
          <Card padding="none" className={clsx(styles.card, styles.bigCard)}>
            <div className={styles.bigIconWrap} style={{ background: BRAND_GRADIENT }}>
              <LayoutTemplate size={30} className={styles.iconWhite} aria-hidden="true" />
            </div>
            <h3 className={styles.bigTitle}>
              {ALL_TEMPLATES.length} professional templates
            </h3>
            <p className={styles.bigDescription}>
              Clean, ATS-friendly layouts for every stage of your career — switch anytime without losing your content.
            </p>
          </Card>
        </motion.div>

        {SMALL_FEATURES.map(({ Icon, title, description }) => (
          <motion.div key={title} variants={fadeUp} transition={{ duration: 0.4 }}>
            <Card padding="none" className={clsx(styles.card, styles.smallCard)}>
              <div className={styles.smallIconWrap}>
                <Icon size={22} className={styles.iconPrimary} aria-hidden="true" />
              </div>
              <h3 className={styles.smallTitle}>{title}</h3>
              <p className={styles.smallDescription}>{description}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
