import { motion } from 'framer-motion'
import { LayoutTemplate, PenLine, Download } from 'lucide-react'
import { fadeUp, staggerContainer, viewportOnce } from './motion'
import styles from './HowItWorks.module.css'

const STEPS = [
  {
    number: '01',
    Icon: LayoutTemplate,
    title: 'Pick a template',
    description: 'Choose from templates built for different roles and experience levels.',
  },
  {
    number: '02',
    Icon: PenLine,
    title: 'Fill in your details',
    description: 'Add your experience, education, and skills — guided step-by-step, or free-form on the canvas.',
  },
  {
    number: '03',
    Icon: Download,
    title: 'Export your PDF',
    description: 'Download a ready-to-send PDF in seconds.',
  },
]

export function HowItWorks() {
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
        <span className={styles.eyebrow}>How it works</span>
        <h2 className={styles.heading}>
          Three steps to a finished resume
        </h2>
      </motion.div>

      <motion.div
        className={styles.stepsGrid}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        <div className={styles.connector} aria-hidden="true" />

        {STEPS.map(({ number, Icon, title, description }) => (
          <motion.div key={number} variants={fadeUp} transition={{ duration: 0.4 }} className={styles.step}>
            <div className={styles.stepIconWrap}>
              <Icon size={22} className={styles.iconPrimary} aria-hidden="true" />
            </div>
            <span className={styles.stepNumber}>{number}</span>
            <h3 className={styles.stepTitle}>{title}</h3>
            <p className={styles.stepDescription}>{description}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
