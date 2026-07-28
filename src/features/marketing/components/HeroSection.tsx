import { motion } from 'framer-motion'
import { Link } from 'react-router'
import { clsx } from 'clsx'
import { LayoutTemplate, ShieldCheck, Gift, Sparkles } from 'lucide-react'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { PillCta } from './PillCta'
import styles from './HeroSection.module.css'

const HERO_STATS = [
  { Icon: LayoutTemplate, label: `${ALL_TEMPLATES.length} templates` },
  { Icon: ShieldCheck, label: '100% private' },
  { Icon: Gift, label: 'Free forever' },
]

export function HeroSection() {
  const frontTree = getTemplatePreviewTree('meridian')
  const backLeftTree = getTemplatePreviewTree('atlas')
  const backRightTree = getTemplatePreviewTree('cadence')

  return (
    <section className={styles.section}>
      <div className={styles.blobLeft} aria-hidden="true" />
      <div className={styles.blobRight} aria-hidden="true" />

      <div className={styles.inner}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className={styles.badge}>
            <Sparkles size={13} aria-hidden="true" />
            Free forever &middot; No sign-up &middot; 100% offline
          </span>
          <h1 className={styles.heading}>
            Build a resume that{' '}
            <span className={clsx(styles.gradientText, 'bg-gradient-brand')}>
              lands the interview.
            </span>
          </h1>
          <p className={styles.subtext}>
            Four ATS-friendly templates, full color and font control, and instant PDF export — no account, no cloud, no catch.
          </p>
          <div className={styles.ctaRow}>
            <PillCta to="/app">Start Building</PillCta>
            <Link to="/templates" className={styles.browseLink}>
              Browse Templates
            </Link>
          </div>

          <dl className={styles.statsList}>
            {HERO_STATS.map(({ Icon, label }) => (
              <div key={label} className={styles.statItem}>
                <Icon size={16} aria-hidden="true" />
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          className={styles.previewWrap}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
        >
          <div className={clsx(styles.previewGlow, 'bg-gradient-brand')} aria-hidden="true" />
          <div className={styles.previewStack}>
            {/* ResumePreview sets position:relative via inline style, which beats any
                position class passed through className — so positioning/rotation is
                applied on a wrapper div instead. */}
            <div className={styles.previewBackLeft}>
              <ResumePreview
                layoutTree={backLeftTree}
                widthPx={190}
                className={styles.previewCard}
              />
            </div>
            <div className={styles.previewBackRight}>
              <ResumePreview
                layoutTree={backRightTree}
                widthPx={190}
                className={styles.previewCard}
              />
            </div>
            <div className={styles.previewFront}>
              <ResumePreview
                layoutTree={frontTree}
                widthPx={240}
                className={styles.previewCard}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
