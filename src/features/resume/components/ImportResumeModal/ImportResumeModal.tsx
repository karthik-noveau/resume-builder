import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { Button } from '@/shared/components/ui/Button/Button'
import { Textarea } from '@/shared/components/ui/Textarea/Textarea'
import {
  parseResumeText,
  type ParsedResumeData,
  type ParsedExperience,
  type ParsedEducation,
} from '../../utils/resumeParser'
import { readResumeFile, MAX_IMPORT_TEXT } from '../../utils/resumeFile'
import styles from './ImportResumeModal.module.css'

interface ImportResumeModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (parsed: ParsedResumeData) => void | Promise<void>
  isLoading?: boolean
}

export function ImportResumeModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: ImportResumeModalProps) {
  const [rawText, setRawText] = useState('')
  const [parsed, setParsed] = useState<ParsedResumeData | null>(null)
  const [reading, setReading] = useState(false)
  const [error, setError] = useState('')
  const [fileName, setFileName] = useState('')
  const request = useRef(0)
  const cancelRead = useCallback(() => {
    request.current++
  }, [])
  useEffect(() => {
    if (!isOpen) {
      request.current++
      setRawText('')
      setParsed(null)
      setError('')
      setFileName('')
      setReading(false)
    }
    return cancelRead
  }, [isOpen, cancelRead])
  const busy = reading || isLoading
  const readFile = async (file: File) => {
    const sequence = ++request.current
    setReading(true)
    setError('')
    try {
      const text = await readResumeFile(file)
      if (sequence !== request.current) return
      setRawText(text)
      setFileName(file.name)
      setParsed(null)
    } catch (cause) {
      if (sequence === request.current)
        setError(cause instanceof Error ? cause.message : 'Could not read this file.')
    } finally {
      if (sequence === request.current) setReading(false)
    }
  }
  const update = (patch: Partial<ParsedResumeData>) =>
    setParsed((current) => current && { ...current, ...patch })
  const updateExperience = (index: number, patch: Partial<ParsedExperience>) =>
    update({
      experience: parsed?.experience?.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry
      ),
    })
  const updateEducation = (index: number, patch: Partial<ParsedEducation>) =>
    update({
      education: parsed?.education?.map((entry, i) =>
        i === index ? { ...entry, ...patch } : entry
      ),
    })
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose()
      }}
      title={parsed ? 'Review import' : 'Import resume'}
      maxWidth="lg"
    >
      <div className={styles.root}>
        <div className={styles.scrollArea}>
          {error && (
            <p role="alert" className={styles.error}>
              {error}
            </p>
          )}
          {!parsed ? (
            <>
              <p className={styles.description}>
                Choose a PDF, Word document or text file, or paste your resume below. Files are read
                on your device. You’ll review the extracted details before saving.
              </p>
              <label className={styles.fileInput}>
                Resume file <span>PDF, DOCX or TXT · up to 10 MB</span>
                <input
                  type="file"
                  accept=".pdf,.docx,.txt"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    event.target.value = ''
                    if (file) void readFile(file)
                  }}
                />
              </label>
              <p role="status">
                {reading
                  ? 'Reading your file…'
                  : fileName
                    ? `Loaded ${fileName}. Check the text below.`
                    : ''}
              </p>
              <Textarea
                label="Resume text"
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste your resume text here…"
                rows={12}
                maxLength={MAX_IMPORT_TEXT}
                disabled={busy}
              />
            </>
          ) : (
            <>
              <p className={styles.description}>
                Check names, dates and entry boundaries. You can edit, remove or add entries here.
                Nothing is saved until you choose Create resume.
              </p>
              <fieldset className={styles.reviewSection}>
                <legend>Contact</legend>
                {(['fullName', 'email', 'phone', 'website', 'linkedin', 'github'] as const).map(
                  (key) => (
                    <ReviewField
                      key={key}
                      label={
                        {
                          fullName: 'Full name',
                          email: 'Email',
                          phone: 'Phone',
                          website: 'Website',
                          linkedin: 'LinkedIn',
                          github: 'GitHub',
                        }[key]
                      }
                      value={parsed[key] ?? ''}
                      onChange={(value) => update({ [key]: value })}
                    />
                  )
                )}
              </fieldset>
              <ReviewField
                label="Summary"
                multiline
                value={parsed.summary ?? ''}
                onChange={(summary) => update({ summary })}
              />
              <h3>Work experience · {parsed.experience?.length ?? 0}</h3>
              {parsed.experience?.map((entry, i) => (
                <fieldset key={i} className={styles.reviewSection}>
                  <legend>Job {i + 1}</legend>
                  <ReviewField
                    label="Role"
                    value={entry.role}
                    onChange={(role) => updateExperience(i, { role })}
                  />
                  <ReviewField
                    label="Company"
                    value={entry.company ?? ''}
                    onChange={(company) => updateExperience(i, { company })}
                  />
                  <ReviewField
                    label="Start date"
                    value={entry.startDate ?? ''}
                    onChange={(startDate) => updateExperience(i, { startDate })}
                  />
                  <ReviewField
                    label="End date"
                    value={entry.current ? 'Present' : (entry.endDate ?? '')}
                    onChange={(endDate) =>
                      updateExperience(i, {
                        current: /^present$/i.test(endDate),
                        endDate: /^present$/i.test(endDate) ? '' : endDate,
                      })
                    }
                  />
                  <ReviewField
                    label="Achievements (one per line)"
                    multiline
                    value={entry.description.join('\n')}
                    onChange={(value) => updateExperience(i, { description: value.split('\n') })}
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      update({ experience: parsed.experience?.filter((_, index) => index !== i) })
                    }
                  >
                    Remove job {i + 1}
                  </Button>
                </fieldset>
              ))}
              <Button
                variant="secondary"
                onClick={() =>
                  update({
                    experience: [...(parsed.experience ?? []), { role: '', description: [] }],
                  })
                }
              >
                Add job
              </Button>
              <h3>Education · {parsed.education?.length ?? 0}</h3>
              {parsed.education?.map((entry, i) => (
                <fieldset key={i} className={styles.reviewSection}>
                  <legend>Education {i + 1}</legend>
                  <ReviewField
                    label="Institution"
                    value={entry.institution}
                    onChange={(institution) => updateEducation(i, { institution })}
                  />
                  <ReviewField
                    label="Degree"
                    value={entry.degree ?? ''}
                    onChange={(degree) => updateEducation(i, { degree })}
                  />
                  <ReviewField
                    label="Start date"
                    value={entry.startDate ?? ''}
                    onChange={(startDate) => updateEducation(i, { startDate })}
                  />
                  <ReviewField
                    label="End date"
                    value={entry.endDate ?? ''}
                    onChange={(endDate) => updateEducation(i, { endDate })}
                  />
                  <ReviewField
                    label="Education details"
                    multiline
                    value={entry.description.join('\n')}
                    onChange={(value) => updateEducation(i, { description: value.split('\n') })}
                  />
                  <Button
                    variant="ghost"
                    onClick={() =>
                      update({ education: parsed.education?.filter((_, index) => index !== i) })
                    }
                  >
                    Remove education {i + 1}
                  </Button>
                </fieldset>
              ))}
              <Button
                variant="secondary"
                onClick={() =>
                  update({
                    education: [...(parsed.education ?? []), { institution: '', description: [] }],
                  })
                }
              >
                Add education
              </Button>
              <ReviewField
                label="Skills (one per line)"
                multiline
                value={parsed.skills?.join('\n') ?? ''}
                onChange={(value) => update({ skills: value.split('\n').filter(Boolean) })}
              />
              {(['projects', 'certifications'] as const).map((section) =>
                parsed[section]?.map((entry, i) => (
                  <fieldset key={`${section}-${i}`} className={styles.reviewSection}>
                    <legend>
                      {section === 'projects' ? 'Project' : 'Certification'} {i + 1}
                    </legend>
                    <ReviewField
                      label="Title"
                      value={entry.title}
                      onChange={(title) =>
                        update({
                          [section]: parsed[section]?.map((value, index) =>
                            index === i ? { ...value, title } : value
                          ),
                        })
                      }
                    />
                    <ReviewField
                      label="Details"
                      multiline
                      value={
                        Array.isArray(entry.description)
                          ? entry.description.join('\n')
                          : entry.description
                      }
                      onChange={(description) =>
                        update({
                          [section]: parsed[section]?.map((value, index) =>
                            index === i
                              ? {
                                  ...value,
                                  description:
                                    section === 'projects' ? description : description.split('\n'),
                                }
                              : value
                          ),
                        })
                      }
                    />
                    <Button
                      variant="ghost"
                      onClick={() =>
                        update({ [section]: parsed[section]?.filter((_, index) => index !== i) })
                      }
                    >
                      Remove {section === 'projects' ? 'project' : 'certification'} {i + 1}
                    </Button>
                  </fieldset>
                ))
              )}
            </>
          )}
        </div>
        <div className={styles.footer}>
          <Button
            variant="ghost"
            onClick={parsed ? () => setParsed(null) : onClose}
            disabled={busy}
          >
            {parsed ? 'Back to source text' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={() =>
              parsed ? void onConfirm(parsed) : setParsed(parseResumeText(rawText.trim()))
            }
            loading={isLoading}
            disabled={busy || !rawText.trim()}
          >
            {parsed ? 'Create resume' : 'Review details'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function ReviewField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  multiline?: boolean
}) {
  return (
    <label className={styles.reviewField}>
      {label}
      {multiline ? (
        <textarea rows={4} value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  )
}
