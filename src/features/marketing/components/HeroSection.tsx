import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  FileText,
  LayoutTemplate,
  MoveUpRight,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { ResumePreview } from '@/shared/components/ResumePreview/ResumePreview'
import { getTemplatePreviewTree } from '@/shared/utils/templatePreview'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { PillCta } from './PillCta'
import styles from './HeroSection.module.css'

const PREVIEWS = [
  { id: 'atelier', name: 'Atelier', label: 'The creative', detail: 'A little more personality.' },
  { id: 'atlas', name: 'Atlas', label: 'The modern', detail: 'Sharp lines. Strong presence.' },
  {
    id: 'meridian',
    name: 'Meridian',
    label: 'The professional',
    detail: 'Timeless. Clear. Confident.',
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
        : new IntersectionObserver((entries) => {
            // A scroll or resize can batch an exit and a re-entry together.
            const latest = entries[entries.length - 1]
            if (latest) setInView(latest.isIntersecting)
          })
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
      <div className={styles.main}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            <span /> A LITTLE AMBITION. A LOT OF POSSIBILITY.
          </p>
          <h1 id="hero-heading">
            Your next
            <br />
            <span>big move.</span>
            <MoveUpRight aria-hidden="true" />
          </h1>
          <p className={styles.description}>
            You bring the story.
            <br /> We’ll help you make it stand out.
          </p>
          <p className={styles.supporting}>
            <span className={styles.supportingFull}>
              Create a resume that feels like you. Beautifully designed, effortlessly yours, and
              always free.
            </span>
            <span className={styles.supportingCompact}>Beautifully designed. Always free.</span>
          </p>
          <div className={styles.actions}>
            <PillCta to="/templates?create=true">Build my resume</PillCta>
          </div>
          <div className={styles.assurances}>
            <span>
              <Check size={13} aria-hidden="true" /> No sign-up
            </span>
            <span>
              <Check size={13} aria-hidden="true" /> No watermarks
            </span>
            <span>
              <Check size={13} aria-hidden="true" /> Yours to keep
            </span>
          </div>
        </div>
        <div className={styles.showcase}>
          <div className={styles.art}>
            <div className={styles.artShape} aria-hidden="true" />
            <svg
              className={styles.orbit}
              viewBox="0 0 600 660"
              fill="none"
              aria-hidden="true"
              focusable="false"
            >
              <ellipse cx="307" cy="318" rx="289" ry="130" transform="rotate(-40 307 318)" />
              <path d="M80 491C-34 249 350-75 539 84" />
            </svg>
            <span className={styles.edition}>MADE FOR YOUR NEXT CHAPTER</span>
            <div className={styles.backPaper} aria-hidden="true" inert>
              <ResumePreview layoutTree={getTemplatePreviewTree('meridian')} widthPx={322} />
            </div>
            <div className={styles.paper} key={template.id}>
              <ResumePreview layoutTree={getTemplatePreviewTree(template.id)} widthPx={348} />
            </div>
            <div className={styles.personality}>
              <Sparkles size={18} aria-hidden="true" />
              <span>
                A little more <strong>you.</strong>
              </span>
            </div>
            <div className={styles.downloadNote}>
              <span>
                <Check size={16} aria-hidden="true" />
              </span>
              <div>
                Ready for what’s next.<small>Your resume. Your PDF. Your move.</small>
              </div>
            </div>
            <button
              type="button"
              className={styles.motionToggle}
              onClick={() => setMotionPaused((value) => !value)}
              aria-label={motionPaused ? 'Resume animations' : 'Pause animations'}
            >
              {motionPaused ? (
                <Play size={15} aria-hidden="true" />
              ) : (
                <Pause size={15} aria-hidden="true" />
              )}
            </button>
          </div>
          <div className={styles.styleDock}>
            <span className={styles.dockLabel}>TRY A LOOK</span>
            <div className={styles.templateOptions} role="group" aria-label="Resume preview style">
              {PREVIEWS.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  aria-label={`${option.label} ${option.name}`}
                  aria-pressed={selected === index}
                  onClick={() => setSelected(index)}
                >
                  <FileText size={15} aria-hidden="true" />
                  {option.name}
                </button>
              ))}
            </div>
            <Link
              to={`/templates?create=true&template=${template.id}`}
              className={styles.useTemplate}
              aria-label={`Use ${template.name} template`}
              title={`Use ${template.name} template`}
            >
              <ArrowUpRight size={23} aria-hidden="true" />
            </Link>
          </div>
          <p className={styles.previewCaption} aria-live="polite">
            <strong>{template.name}.</strong> {template.detail} <span>Sample resume</span>
          </p>
        </div>
      </div>
      <ul className={styles.benefits} aria-label="Resume Studio benefits">
        <li>
          <span className={styles.benefitIcon}><LayoutTemplate size={21} aria-hidden="true" /></span>
          <div className={styles.benefitCopy}>
            <strong>{ALL_TEMPLATES.length} templates</strong>
            <span>Find your own style</span>
          </div>
        </li>
        <li>
          <span className={styles.benefitIcon}><BadgeCheck size={21} aria-hidden="true" /></span>
          <div className={styles.benefitCopy}>
            <strong>100% free</strong>
            <span>No fees or watermarks</span>
          </div>
        </li>
        <li>
          <span className={styles.benefitIcon}><ShieldCheck size={21} aria-hidden="true" /></span>
          <div className={styles.benefitCopy}>
            <strong>Private by design</strong>
            <span>Saved on your device</span>
          </div>
        </li>
      </ul>
    </section>
  )
}
