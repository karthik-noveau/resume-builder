import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { fadeUp, viewportOnce } from './motion'
import styles from './TemplateShowcase.module.css'

export function TemplateShowcase() {
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
        <span className={styles.eyebrow}>Templates</span>
        <h2 className={styles.heading}>
          A template for every stage of your career
        </h2>
        <p className={styles.subtext}>
          Swap anytime — your content carries over, only the layout changes.
        </p>
      </motion.div>

      <div className={styles.scrollRow}>
        {ALL_TEMPLATES.map((template) => (
          <Link
            key={template.id}
            to="/templates"
            className={styles.card}
          >
            <ResumePreview
              layoutTree={getTemplatePreviewTree(template.id)}
              widthPx={200}
              className={styles.preview}
            />
            <div className={styles.cardFooter}>
              <div>
                <p className={styles.cardName}>{template.name}</p>
                <p className={styles.cardCategory}>{template.category}</p>
              </div>
              <ArrowRight size={16} className={styles.cardArrow} aria-hidden="true" />
            </div>
          </Link>
        ))}

        <Link
          to="/templates"
          className={styles.exploreCard}
        >
          <span className={styles.exploreIcon}>
            <ArrowRight size={18} aria-hidden="true" />
          </span>
          <span className={styles.exploreLabel}>Explore all templates</span>
        </Link>
      </div>
    </section>
  )
}
