import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { ALL_TEMPLATES, getTemplateById } from '@/features/templates/registry/template.registry'
import styles from './TemplateShowcase.module.css'

const COLLECTIONS = {
  'All styles': ['meridian', 'atelier', 'atlas', 'mosaic'],
  Simple: ['meridian', 'sterling', 'folio', 'northstar'],
  'Ultra Modern': ['atelier', 'aster', 'maison', 'mosaic'],
} as const

export function TemplateShowcase() {
  const [collection, setCollection] = useState<keyof typeof COLLECTIONS>('All styles')

  return (
    <section id="templates" className={styles.section} aria-labelledby="templates-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>FIND YOUR STARTING POINT</p>
          <h2 id="templates-heading" className={styles.heading}>
            Good design. <em>Great first impressions.</em>
          </h2>
          <p className={styles.subtext}>
            Professional layouts for every kind of experience. Pick one and make it yours.
          </p>
        </div>
        <Link to="/templates" className={styles.allLink}>
          Explore all {ALL_TEMPLATES.length} templates <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
      <div className={styles.collectionBar}>
        <div className={styles.filters} role="group" aria-label="Template collection">
          {(Object.keys(COLLECTIONS) as Array<keyof typeof COLLECTIONS>).map((name) => (
            <button
              type="button"
              key={name}
              onClick={() => setCollection(name)}
              aria-pressed={collection === name}
            >
              {name}
            </button>
          ))}
        </div>
        <span className={styles.collectionNote}>Every template. Every feature. Free.</span>
      </div>
      <div className={styles.grid} aria-live="polite">
        {COLLECTIONS[collection].map((id, index) => {
          const template = getTemplateById(id)!
          return (
            <Link
              to={`/templates?create=true&template=${id}`}
              className={styles.card}
              key={id}
              aria-label={`Use ${template.name} template`}
            >
              <div className={styles.previewStage} data-tone={index}>
                <span className={styles.index}>0{index + 1}</span>
                <span className={styles.freeTag}>FREE</span>
                <div className={styles.paper}>
                  <ResumePreview layoutTree={getTemplatePreviewTree(id)} widthPx={240} />
                </div>
                <span className={styles.useTemplate}>
                  Make it yours <ArrowRight size={14} aria-hidden="true" />
                </span>
              </div>
              <div className={styles.cardFooter}>
                <div>
                  <h3>{template.name}</h3>
                  <p>
                    {template.designStyle === 'Simple' ? 'Simple' : 'Ultra Modern'} <span>·</span>{' '}
                    {template.layout === 'single-column' ? 'One column' : 'Two columns'}
                  </p>
                </div>
                <ArrowUpRight size={19} strokeWidth={1.5} aria-hidden="true" />
              </div>
            </Link>
          )
        })}
      </div>
      <p className={styles.caption}>Your content comes with you. Change your template anytime.</p>
    </section>
  )
}
