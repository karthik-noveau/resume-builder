import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import type { Resume } from '@/shared/types/resume.types'
import type { TemplateDefinition } from '@/shared/types/template.types'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useTemplateStore } from '@/shared/stores/template.store'
import { type AtsCheck, type AtsReport } from '@/features/resume/utils/ats/evaluate'
import { planAtsFix } from '@/features/resume/utils/ats/fixes'
import { evaluateJobMatch, extractJobKeywords } from '@/features/resume/utils/ats/jobMatch'
import { PersonalInfoForm } from '../PropertiesPanel/PersonalInfoForm'
import { SummaryForm } from '../PropertiesPanel/SummaryForm'
import { SectionProperties } from '../PropertiesPanel/SectionProperties'
import { GlobalTextStyles } from '../PropertiesPanel/StyleInspector'
import { LayoutSettingsForm } from '../Sidebar/LayoutSettingsForm'
import { GuidedFormContext } from '../../hooks/useGuidedForm'
import { useUndoRedo } from '../../hooks/useUndoRedo'
import styles from './AtsReview.module.css'

type Props = {
  resume: Resume
  report: AtsReport
  templates: TemplateDefinition[]
  onClose: () => void
}
const priorityOrder = { high: 0, medium: 1, low: 2 }
const jobStorageKey = (id: string) => `resume-studio:ats-job:${id}`
function readJob(id: string): { description: string; keywords: string } {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(jobStorageKey(id)) ?? '{}')
    if (
      data &&
      typeof data === 'object' &&
      'description' in data &&
      'keywords' in data &&
      typeof data.description === 'string' &&
      typeof data.keywords === 'string'
    )
      return {
        description: data.description.slice(0, 20000),
        keywords: data.keywords.slice(0, 2000),
      }
  } catch {
    /* Matching also works without browser storage. */
  }
  return { description: '', keywords: '' }
}

export default function AtsReview({ resume, report, templates, onClose }: Props) {
  const [tab, setTab] = useState<'checks' | 'job'>('checks')
  const [showPassed, setShowPassed] = useState(false)
  const [selected, setSelected] = useState<{ check: AtsCheck; mode: 'edit' | 'fix' } | null>(null)
  const [job, setJob] = useState(() => readJob(resume.id))
  const { canUndo, handleUndo } = useUndoRedo()
  const formRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const keywords = useMemo(
    () =>
      job.keywords
        .split(/[,\n]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [job.keywords]
  )
  const matching = useMemo(() => evaluateJobMatch(resume, keywords), [resume, keywords])
  const findings = report.checks.filter((check) => check.status === 'review')
  const checks = [...report.checks]
    .filter((check) => showPassed || check.status === 'review')
    .sort(
      (a, b) =>
        Number(a.status === 'passed') - Number(b.status === 'passed') ||
        priorityOrder[a.priority] - priorityOrder[b.priority] ||
        b.max - b.points - (a.max - a.points)
    )
  const plan =
    selected?.mode === 'fix' && selected.check.fix
      ? planAtsFix(selected.check.fix, resume, templates)
      : null

  useEffect(() => {
    try {
      sessionStorage.setItem(jobStorageKey(resume.id), JSON.stringify(job))
    } catch {
      /* Optional storage. */
    }
  }, [job, resume.id])
  useEffect(() => {
    if (selected?.mode !== 'edit') return
    const field = (
      {
        name: 'fullName',
        email: 'email',
        phone: 'phone',
        location: 'location',
        summary: 'content',
      } as Record<string, string>
    )[selected.check.id]
    const target = field
      ? formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)
      : formRef.current?.querySelector<HTMLElement>('input, textarea, button')
    target?.focus()
  }, [selected])

  const applyFix = () => {
    const current = useResumeStore.getState().activeResume
    if (!current || current.id !== resume.id || !selected?.check.fix) return
    const currentPlan = planAtsFix(
      selected.check.fix,
      current,
      useTemplateStore.getState().availableTemplates
    )
    if (!currentPlan) return
    useResumeStore.getState().updateResume(currentPlan.patch)
    if (currentPlan.patch.templateId)
      useTemplateStore.getState().switchTemplate(currentPlan.patch.templateId)
    setSelected(null)
    toast.success('Fix applied. You can undo it anytime.')
  }
  const editKeywords = (term: string) =>
    setSelected({
      mode: 'edit',
      check: {
        id: 'job-keyword',
        label: `Review “${term}”`,
        category: 'Skills',
        points: 0,
        max: 0,
        status: 'review',
        priority: 'medium',
        evidence: [`“${term}” was not found in your visible resume content.`],
        advice:
          'Add this skill only if it accurately describes your experience. You can also describe it in a relevant role or project.',
        destination: 'skills',
      },
    })

  return (
    <Modal isOpen onClose={onClose} title="ATS review & fixes" maxWidth="xl">
      <div
        className={styles.root}
        onKeyDown={(event) => {
          // Keep modal editing from deleting a selected canvas entry or replacing
          // native text undo with the document-wide undo stack behind this dialog.
          const editable =
            event.target instanceof HTMLElement &&
            Boolean(event.target.closest('input, textarea, [contenteditable="true"]'))
          if (
            event.key === 'Delete' ||
            (editable && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z')
          )
            event.stopPropagation()
        }}
      >
        <div className={styles.overview}>
          <div className={styles.overall}>
            <strong>
              {report.score}
              <span>/100</span>
            </strong>
            <div>
              <h2>Resume readiness</h2>
              <p>
                {findings.length} checks to review · {report.wordCount} words
                {report.pageCount !== null &&
                  ` · ${report.pageCount} ${report.pageCount === 1 ? 'page' : 'pages'}`}
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={handleUndo} disabled={!canUndo}>
            <RotateCcw size={14} aria-hidden="true" /> Undo
          </Button>
        </div>

        {selected ? (
          <div className={styles.scrollArea}>
            <button className={styles.back} onClick={() => setSelected(null)}>
              <ArrowLeft size={15} aria-hidden="true" /> Back to evaluation
            </button>
            <h3 className={styles.editTitle}>{plan?.title ?? selected.check.label}</h3>
            <p className={styles.advice}>{selected.check.advice}</p>
            {selected.mode === 'fix' ? (
              <>
                {plan ? (
                  <>
                    <div className={styles.changes}>
                      {plan.changes.map((change, index) => (
                        <div className={styles.change} key={`${change.label}-${index}`}>
                          <h4>{change.label}</h4>
                          <div className={styles.comparison}>
                            <div>
                              <span>Before</span>
                              <p>{change.before || '(empty)'}</p>
                            </div>
                            <div>
                              <span>After</span>
                              <p>{change.after || '(empty)'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.applyRow}>
                      <p>This change is saved to your resume and can be undone.</p>
                      <Button variant="primary" onClick={applyFix}>
                        Apply fix <Check size={15} aria-hidden="true" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <p className={styles.advice}>This change is no longer needed or available.</p>
                )}
              </>
            ) : (
              <div ref={formRef} className={styles.editor}>
                <p className={styles.editNote}>
                  Edit your own details below. Changes save as you finish each field.
                </p>
                <GuidedFormContext.Provider value={null}>
                  {selected.check.destination === 'personal' ? (
                    <PersonalInfoForm resumeId={resume.id} personalInfo={resume.personalInfo} />
                  ) : selected.check.destination === 'summary' ? (
                    <SummaryForm section={resume.summary} />
                  ) : selected.check.destination === 'design' ? (
                    <>
                      <h4>Text styles</h4>
                      <GlobalTextStyles resume={resume} />
                      <h4>Page setup</h4>
                      <LayoutSettingsForm settings={resume.settings} />
                    </>
                  ) : (
                    <SectionProperties resume={resume} sectionType={selected.check.destination} />
                  )}
                </GuidedFormContext.Provider>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className={styles.tabs} role="group" aria-label="Evaluation view">
              <button aria-pressed={tab === 'checks'} onClick={() => setTab('checks')}>
                Resume checks
              </button>
              <button aria-pressed={tab === 'job'} onClick={() => setTab('job')}>
                Job match
              </button>
            </div>
            <div className={styles.scrollArea}>
              {tab === 'checks' ? (
                <div className={styles.report}>
                  <aside className={styles.categories} aria-label="Score breakdown">
                    {report.categories.map((category) => (
                      <div className={styles.category} key={category.label}>
                        <div>
                          <span>{category.label}</span>
                          <strong>
                            {category.score}/{category.max}
                          </strong>
                        </div>
                        <div className={styles.track}>
                          <span style={{ width: `${(category.score * 100) / category.max}%` }} />
                        </div>
                      </div>
                    ))}
                    <p>Live checks use your visible content and rendered layout.</p>
                  </aside>
                  <div className={styles.findings}>
                    <div className={styles.findingsHeader}>
                      <h3>{showPassed ? 'All checks' : 'Recommended improvements'}</h3>
                      <label>
                        <input
                          type="checkbox"
                          checked={showPassed}
                          onChange={(e) => setShowPassed(e.target.checked)}
                        />{' '}
                        Show passed
                      </label>
                    </div>
                    {!checks.length && (
                      <div className={styles.empty}>
                        <Check size={24} aria-hidden="true" />
                        <h3>All checks passed</h3>
                        <p>Review job relevance and the final preview before applying.</p>
                      </div>
                    )}
                    {checks.map((check) => (
                      <article className={styles.check} key={check.id}>
                        <div className={styles.checkHeader}>
                          <h4>{check.label}</h4>
                          <span
                            className={clsx(
                              styles.priority,
                              check.status === 'passed'
                                ? styles.passed
                                : check.priority === 'high' && styles.high
                            )}
                          >
                            {check.status === 'passed' ? 'Passed' : `${check.priority} priority`}
                          </span>
                        </div>
                        <ul className={styles.evidence}>
                          {check.evidence.map((text, index) => (
                            <li key={index}>{text}</li>
                          ))}
                        </ul>
                        {check.status === 'review' && (
                          <>
                            <p className={styles.advice}>{check.advice}</p>
                            <div className={styles.checkActions}>
                              {check.fix && planAtsFix(check.fix, resume, templates) && (
                                <Button
                                  variant="secondary"
                                  onClick={() => setSelected({ check, mode: 'fix' })}
                                >
                                  Review fix <ArrowRight size={13} aria-hidden="true" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                onClick={() => setSelected({ check, mode: 'edit' })}
                              >
                                Edit{' '}
                                {check.destination === 'personal' ? 'details' : check.destination}
                              </Button>
                              <span>
                                {check.max ? `${check.points}/${check.max} points` : 'Advisory'}
                              </span>
                            </div>
                          </>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              ) : (
                <div className={styles.job}>
                  <div className={styles.jobInput}>
                    <h3>Compare with a job description</h3>
                    <p>
                      Check keyword coverage against the role you want. Everything stays in this
                      browser tab.
                    </p>
                    <label htmlFor={`${id}-description`}>Job description</label>
                    <textarea
                      id={`${id}-description`}
                      rows={7}
                      maxLength={20000}
                      value={job.description}
                      placeholder="Paste the role’s responsibilities and requirements…"
                      onChange={(e) =>
                        setJob((current) => ({ ...current, description: e.target.value }))
                      }
                    />
                    <Button
                      variant="secondary"
                      disabled={!job.description.trim()}
                      onClick={() =>
                        setJob((current) => ({
                          ...current,
                          keywords: extractJobKeywords(current.description, resume).join(', '),
                        }))
                      }
                    >
                      Extract keywords
                    </Button>
                    <label htmlFor={`${id}-keywords`}>Keywords to compare</label>
                    <textarea
                      id={`${id}-keywords`}
                      rows={3}
                      maxLength={2000}
                      value={job.keywords}
                      placeholder="For example: Python, SQL, stakeholder management"
                      onChange={(e) =>
                        setJob((current) => ({ ...current, keywords: e.target.value }))
                      }
                    />
                    <p>
                      Review the extracted terms. Add missing role-specific terms or remove
                      irrelevant ones, separated by commas. Up to 60 terms.
                    </p>
                    <button
                      className={styles.clearJob}
                      onClick={() => setJob({ description: '', keywords: '' })}
                    >
                      Clear job description and keywords
                    </button>
                  </div>
                  <div className={styles.jobResults}>
                    <h3>Keyword coverage</h3>
                    <div className={styles.matchScore}>
                      {matching.score === null ? '—' : `${matching.score}%`}
                    </div>
                    <p>
                      {matching.terms.length
                        ? `${matching.matchedCount} of ${matching.terms.length} selected terms found in visible content.`
                        : 'Extract or enter keywords to compare.'}
                    </p>
                    <p className={styles.matchNote}>
                      This measures term coverage, not your qualification for the role. It does not
                      assess years of experience, seniority, or eligibility.
                    </p>
                    {matching.terms.filter((t) => !t.matched).length > 0 && (
                      <>
                        <h4>Not found</h4>
                        <div className={styles.keywords}>
                          {matching.terms
                            .filter((t) => !t.matched)
                            .map((t) => (
                              <button
                                key={t.term}
                                onClick={() => editKeywords(t.term)}
                                title="Review and add only if accurate"
                              >
                                {t.term} <span>+</span>
                              </button>
                            ))}
                        </div>
                        <p>Add a missing term only when it is truthful and relevant.</p>
                      </>
                    )}
                    {matching.terms.some((t) => t.matched) && (
                      <>
                        <h4>Found in your resume</h4>
                        <ul className={styles.matches}>
                          {matching.terms
                            .filter((t) => t.matched)
                            .map((t) => (
                              <li key={t.term}>
                                <strong>{t.term}</strong>
                                <span>{t.locations.join(' · ')}</span>
                              </li>
                            ))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              )}
              <details className={styles.method}>
                <summary>How this evaluation works</summary>
                <p>
                  The 100-point readiness score combines parsing conventions with writing
                  guidelines. Weights and thresholds are Resume Studio heuristics, not an employer’s
                  ATS score. Zero-point advisories do not change the score. English action-verb and
                  keyword checks have a limited vocabulary.
                </p>
                <p>
                  This review does not run an employer’s parser, test an exported PDF, verify your
                  claims, or predict hiring decisions.
                </p>
                <p>
                  Guidance:{' '}
                  <a
                    href="https://support.greenhouse.io/hc/en-us/articles/200989175-Unsuccessful-resume-parse"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Greenhouse parsing documentation
                  </a>{' '}
                  and{' '}
                  <a
                    href="https://careerservices.fas.harvard.edu/resources/hes-create-impactful-resumes-and-cover-letters/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Harvard resume guidance
                  </a>
                  .
                </p>
              </details>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
