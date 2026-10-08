import { AnimatePresence } from 'framer-motion'
import { lazy, Suspense, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { Resume } from '@/shared/types/resume.types'
import type { LayoutTree } from '@/shared/types/layout.types'
import { useTemplateStore } from '@/shared/stores/template.store'
import { getTemplateById } from '@/features/templates/registry/template.registry'
import { evaluateAts } from '@/features/resume/utils/ats/evaluate'
import styles from './AtsEvaluation.module.css'

const AtsReview = lazy(() => import('./AtsReview/AtsReview'))

export function AtsEvaluation({
  resume,
  layoutTree,
}: {
  resume: Resume
  layoutTree?: LayoutTree | null
}) {
  const templates = useTemplateStore((state) => state.availableTemplates)
  const template =
    templates.find((item) => item.id === resume.templateId) ?? getTemplateById(resume.templateId)
  const report = useMemo(
    () => (template ? evaluateAts(template, resume, layoutTree) : null),
    [template, resume, layoutTree]
  )
  const [open, setOpen] = useState(false)
  const hasCareerContent =
    (resume.summary.visible && resume.summary.content.trim().length >= 30) ||
    resume.experience.some(
      (entry) =>
        entry.visible && !!entry.role.trim() && entry.description.join(' ').trim().length >= 30
    ) ||
    resume.projects.some(
      (entry) => entry.visible && !!entry.title.trim() && entry.description.trim().length >= 30
    ) ||
    (resume.education.some((entry) => entry.visible && entry.institution.trim()) &&
      resume.skills.some(
        (entry) => entry.visible && entry.skills.some((skill) => skill.name.trim())
      ))
  const ready = hasCareerContent
  const issues = report?.checks.filter((check) => check.status === 'review').length ?? 0

  return (
    <section className={styles.root} aria-label="Resume readiness">
      <div className={styles.scoreRow}>
        <div className={styles.summary}>
          <h2 className={styles.label}>Resume readiness</h2>
          {report && ready ? <>
            <p className={styles.estimate}>Estimated score</p>
            <p className={styles.checks}>
              {issues ? `${issues} ${issues === 1 ? 'check' : 'checks'} to review` : 'All checks passed'}
            </p>
          </> : (
            <p className={styles.state}>{ready ? 'Unavailable' : 'Getting started'}</p>
          )}
        </div>
        {report && ready && (
          <div
            className={styles.meter}
            role="progressbar"
            aria-label="Resume readiness score"
            aria-valuenow={report.score}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle className={styles.track} cx="32" cy="32" r="28" />
              <circle className={styles.fill} cx="32" cy="32" r="28" pathLength="100"
                strokeDasharray="100" strokeDashoffset={100 - report.score} />
            </svg>
            <span className={styles.score} aria-hidden="true">
              {report.score}<span className={styles.maximum}>/ 100</span>
            </span>
          </div>
        )}
      </div>
      {report && ready ? (
        <>
          <button
            type="button"
            className={styles.toggle}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            Review &amp; fix <ArrowRight size={14} aria-hidden="true" />
          </button>
          <AnimatePresence>
            {open && (
              <Suspense
                fallback={
                  <p className={styles.caption} role="status">
                    Opening resume review…
                  </p>
                }
              >
                <AtsReview
                  key={resume.id}
                  resume={resume}
                  report={report}
                  templates={templates}
                  onClose={() => setOpen(false)}
                />
              </Suspense>
            )}
          </AnimatePresence>
        </>
      ) : (
        <div className={styles.caption}>
          {report ? (
            <p>Add contact details and career content to start your review.</p>
          ) : (
            <p>Choose an available template to evaluate this resume.</p>
          )}
        </div>
      )}
    </section>
  )
}
