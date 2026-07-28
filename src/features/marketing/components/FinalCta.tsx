import { motion } from 'framer-motion'
import { PillCta } from './PillCta'
import { fadeUp, viewportOnce, BRAND_GRADIENT } from './motion'
import styles from './FinalCta.module.css'

export function FinalCta() {
  return (
    <section className={styles.section}>
      <motion.div
        className={styles.panel}
        style={{ background: BRAND_GRADIENT }}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={fadeUp}
        transition={{ duration: 0.4 }}
      >
        <div className={styles.blurCircle} aria-hidden="true" />
        <div className={styles.content}>
          <h2 className={styles.heading}>
            Ready to build your resume?
          </h2>
          <p className={styles.subtext}>It&apos;s free, it takes minutes, and it never leaves your device.</p>
          <div className={styles.ctaWrap}>
            <PillCta to="/app" variant="inverted">Start Building</PillCta>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
