import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import {
  ArrowRight,
  Check,
  FileText,
  LayoutTemplate,
  LockKeyhole,
  Download,
  ChevronRight,
  CheckCheck,
} from 'lucide-react'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { PillCta } from './PillCta'
import { BrandMark } from '@/shared/components/BrandMark/BrandMark'
import { HeroBackdrop } from './HeroBackdrop'
import styles from './HeroSection.module.css'

const PREVIEWS = [
  {
    id: 'meridian',
    label: 'The professional',
    name: 'Meridian',
    detail: 'Timeless. Clear. Confident.',
    color: '#7a45d1',
  },
  {
    id: 'atlas',
    label: 'The modern',
    name: 'Atlas',
    detail: 'Sharp lines. Strong presence.',
    color: '#5362d8',
  },
  {
    id: 'atelier',
    label: 'The creative',
    name: 'Atelier',
    detail: 'A little more personality.',
    color: '#c23f35',
  },
]

export function HeroSection() {
  const [selected, setSelected] = useState(0)
  const [motionPaused, setMotionPaused] = useState(false)
  const [inView, setInView] = useState(true)
  const [pageVisible, setPageVisible] = useState(true)
  const heroRef = useRef<HTMLElement>(null)
  const template = PREVIEWS[selected]

  useEffect(() => {
    const updateVisibility = () => setPageVisible(!document.hidden)
    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => setInView(entry.isIntersecting))
    if (heroRef.current) observer?.observe(heroRef.current)
    return () => {
      document.removeEventListener('visibilitychange', updateVisibility)
      observer?.disconnect()
    }
  }, [])
  return (
    <section
      ref={heroRef}
      id="top"
      className={styles.section}
      aria-labelledby="hero-heading"
      data-motion-paused={motionPaused || !inView || !pageVisible}
    >
      <HeroBackdrop
        paused={motionPaused}
        onToggleMotion={() => setMotionPaused((value) => !value)}
      />
      <div className={styles.intro}>
        <p className={styles.eyebrow}>
          <span /> YOUR CAREER. YOUR NEXT CHAPTER.
        </p>
        <h1 id="hero-heading">
          A standout resume.
          <br />
          <span>A confident next move.</span>
        </h1>
        <p className={styles.description}>
          Turn your experience into a resume you’re proud to send. <br />
          Beautiful templates. Complete control. Free from start to finish.
        </p>
        <div className={styles.actions}>
          <PillCta to="/templates?create=true">Build my resume</PillCta>
          <a href="#templates" className={styles.secondaryCta}>
            Explore templates <ArrowRight size={17} aria-hidden="true" />
          </a>
        </div>
        <div className={styles.assurances}>
          <span>
            <Check size={14} aria-hidden="true" /> No sign-up
          </span>
          <span>
            <Check size={14} aria-hidden="true" /> Free PDF exports
          </span>
          <span>
            <Check size={14} aria-hidden="true" /> No watermarks
          </span>
        </div>
      </div>

      <div className={styles.workspace}>
        <div className={styles.windowBar}>
          <span className={styles.windowBrand}>
            <span className={styles.windowMark}>
              <BrandMark size="sm" />
            </span>{' '}
            Resume Studio <span>/</span> <span>Live preview</span>
          </span>
          <span className={styles.sampleLabel}>
            <span /> Sample resume
          </span>
        </div>
        <div className={styles.editor}>
          <aside className={styles.sidebar} aria-label="Preview templates">
            <div className={styles.sidebarHeading}>
              <LayoutTemplate size={17} aria-hidden="true" />
              <span>Make it your own</span>
            </div>
            <p>Start with a style.</p>
            <div className={styles.templateOptions} role="group" aria-label="Resume preview style">
              {PREVIEWS.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  <span
                    className={styles.optionIcon}
                    style={{ '--option-color': option.color } as CSSProperties}
                  >
                    <FileText size={22} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{option.label}</strong>
                    <span>{option.name}</span>
                  </span>
                  {selected === index ? (
                    <Check size={15} className={styles.selectedCheck} aria-hidden="true" />
                  ) : (
                    <ChevronRight size={15} aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
            <Link to="/templates" className={styles.allTemplates}>
              Browse all {ALL_TEMPLATES.length} templates{' '}
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <div className={styles.sidebarNote}>
              <LockKeyhole size={17} aria-hidden="true" />
              <div>
                <strong>Personal stays personal.</strong>
                <p>Your resumes stay on your device.</p>
              </div>
            </div>
          </aside>
          <div className={styles.canvas}>
            <div className={styles.canvasToolbar}>
              <span>
                <FileText size={14} aria-hidden="true" /> Alex Morgan{' '}
                <span className={styles.toolbarDivider}>/</span> <span>Resume</span>
              </span>
              <span className={styles.pageCount}>A4 · Page 1</span>
            </div>
            <div className={styles.paperStage}>
              <div className={styles.paperReveal}>
                <div className={styles.paper} key={template.id}>
                  <ResumePreview layoutTree={getTemplatePreviewTree(template.id)} widthPx={348} />
                </div>
              </div>
              <div className={styles.detailTag}>
                <CheckCheck size={19} aria-hidden="true" />
                <span>
                  <strong>Your experience, elevated.</strong>
                  <span>Every detail in the right place.</span>
                </span>
              </div>
            </div>
          </div>
          <div className={styles.previewSummary}>
            <span className={styles.summaryLabel}>THE FINISHED LOOK</span>
            <h2 aria-live="polite">
              {template.name}
              <span>.</span>
            </h2>
            <p>{template.detail}</p>
            <div className={styles.summaryDivider} />
            <span className={styles.summaryItem}>
              <Check size={14} aria-hidden="true" /> Customizable layout
            </span>
            <span className={styles.summaryItem}>
              <Check size={14} aria-hidden="true" /> Your fonts & colors
            </span>
            <span className={styles.summaryItem}>
              <Check size={14} aria-hidden="true" /> Print-ready PDF
            </span>
            <Link
              to={`/templates?create=true&template=${template.id}`}
              className={styles.useTemplate}
            >
              Use this template <ArrowRight size={15} aria-hidden="true" />
            </Link>
            <span className={styles.switchNote}>Switch designs anytime.</span>
          </div>
        </div>
      </div>
      <div className={styles.benefits}>
        <div>
          <LayoutTemplate size={19} aria-hidden="true" />
          <span>
            <strong>{ALL_TEMPLATES.length} professional templates</strong> A style for every career
          </span>
        </div>
        <div>
          <LockKeyhole size={19} aria-hidden="true" />
          <span>
            <strong>Private by design</strong> Your data stays with you
          </span>
        </div>
        <div>
          <Download size={19} aria-hidden="true" />
          <span>
            <strong>Unlimited PDF downloads</strong> Ready when you are
          </span>
        </div>
      </div>
    </section>
  )
}
