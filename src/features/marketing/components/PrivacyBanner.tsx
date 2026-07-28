import { motion } from 'framer-motion'
import { ShieldCheck, CheckCircle2 } from 'lucide-react'
import { fadeUp, staggerContainer, viewportOnce, BRAND_GRADIENT } from './motion'
import styles from './PrivacyBanner.module.css'

const CHECKLIST = ['No sign-up required', 'No servers, no uploads', 'Works fully offline']

export function PrivacyBanner() {
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
          <div className={styles.iconWrap}>
            <ShieldCheck size={30} className={styles.iconWhite} aria-hidden="true" />
          </div>
          <span className={styles.eyebrow}>
            Local-first
          </span>
          <h2 className={styles.heading}>
            Your data never leaves your device.
          </h2>
          <p className={styles.subtext}>
            No accounts, no servers, no tracking. Your content, templates, and exports live in your browser&apos;s
            local storage until you decide to download them.
          </p>

          <motion.ul
            className={styles.checklist}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            {CHECKLIST.map((item) => (
              <motion.li
                key={item}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className={styles.checkItem}
              >
                <CheckCircle2 size={16} aria-hidden="true" />
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  )
}
