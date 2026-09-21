import { ArrowUpRight, Check } from 'lucide-react'
import { PillCta } from './PillCta'
import styles from './FinalCta.module.css'

export function FinalCta() {
  return (
    <section className={styles.section} aria-labelledby="cta-heading">
      <div className={styles.panel}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>YOUR NEXT CHAPTER STARTS HERE</p>
          <h2 id="cta-heading">
            Ready for your
            <br />
            <span>next opportunity?</span>
          </h2>
          <p className={styles.subtext}>Put your best work on paper. Make your next move.</p>
        </div>
        <div className={styles.action}>
          <ArrowUpRight size={48} strokeWidth={1.3} className={styles.arrow} aria-hidden="true" />
          <PillCta to="/templates?create=true">Build my resume</PillCta>
          <p className={styles.note}>
            <Check size={13} aria-hidden="true" /> Free to build. Free to download.
          </p>
        </div>
      </div>
    </section>
  )
}
