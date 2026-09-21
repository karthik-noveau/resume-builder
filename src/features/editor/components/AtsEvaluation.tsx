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
  const issues = report?.checks.filter((check) => check.status === 'review').length ?? 0

  return (
    <section className={styles.root} aria-label="ATS evaluation">
      <div className={styles.scoreRow}>
        <h2 className={styles.label}>ATS score</h2>
        <span className={styles.score}>
          {report ? (
            <>
              {report.score}
              <span className={styles.maximum}> / 100</span>
            </>
          ) : (
            'Unavailable'
          )}
        </span>
      </div>
      {report ? (
        <>
          <div
            className={styles.track}
            role="progressbar"
            aria-label="ATS score"
            aria-valuenow={report.score}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles.fill} style={{ width: `${report.score}%` }} />
          </div>
          <p className={styles.caption}>
            {issues ? `${issues} checks to review` : 'All readiness checks passed'} · Estimated
          </p>
          <button
            type="button"
            className={styles.toggle}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            Review &amp; fix <ArrowRight size={14} aria-hidden="true" />
          </button>
          {open && (
            <Suspense
              fallback={
                <p className={styles.caption} role="status">
                  Opening ATS review…
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
        </>
      ) : (
        <p className={styles.caption}>Choose an available template to evaluate this resume.</p>
      )}
    </section>
  )
}
