import { useId } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Star, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { ControlledInput } from './ControlledFields'
import { skillSectionSchema, type SkillSectionInput } from '@/shared/schemas/skills.schema'
import type { SkillSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useGuidedForm } from '../../hooks/useGuidedForm'
import { useResumeFormSync } from '../../hooks/useResumeFormSync'
import styles from './SkillsForm.module.css'

export function SkillsForm({ section }: { section: SkillSection }) {
  const ratingId = useId()
  const updateSection = useResumeStore((s) => s.updateSection)
  const form = useForm<SkillSectionInput>({
    resolver: zodResolver(skillSectionSchema),
    defaultValues: section,
  })
  const { control, formState: { errors } } = form
  const commit = useResumeFormSync<SkillSectionInput>(form, section, (data) => { updateSection('skills', section.id, data) })
  const guided = useGuidedForm(form, commit)

  // Store the draft before async validation so Saved never describes the previous field value.
  const save = () => {
    void commit(form.getValues())
    void form.trigger()
  }
  const onSaved = () => { void save() }

  const addSkill = () => {
    updateSection('skills', section.id, {
      skills: [...section.skills, { id: crypto.randomUUID(), name: '', level: 3 }],
    })
  }

  const updateSkill = (skillId: string, patch: Partial<{ name: string; level: number }>) => {
    updateSection('skills', section.id, {
      skills: section.skills.map((s) => (s.id === skillId ? { ...s, ...patch } : s)),
    })
  }

  const removeSkill = (skillId: string) => {
    updateSection('skills', section.id, {
      skills: section.skills.filter((s) => s.id !== skillId),
    })
  }

  return (
    <form className={styles.form} onSubmit={(e) => e.preventDefault()}>
      <ControlledInput
        control={control}
        name="category"
        label="Category name"
        required={!!guided}
        error={errors.category?.message}
        helperText='e.g. "Programming Languages", "Tools"'
        onSaved={onSaved}
      />

      <div className={styles.skillsSection}>
        <p className={styles.skillsLabel}>Skills{guided && <span className={styles.required} aria-hidden="true"> *</span>}</p>
        {guided?.showErrors && (section.skills.length === 0 || section.skills.some((skill) => !skill.name.trim())) && (
          <p id={`skills-${section.id}-error`} className={styles.error} role="alert">Add at least one skill and give each skill a name.</p>
        )}
        <div className={styles.skillList}>
          {section.skills.map((skill, index) => (
            <div key={skill.id} className={styles.skillRow}>
              <div className={styles.skillHeader}>
                <input
                  type="text"
                  aria-label="Skill name"
                  required={!!guided}
                  aria-invalid={!!guided?.showErrors && !skill.name.trim()}
                  aria-describedby={guided?.showErrors && !skill.name.trim() ? `skills-${section.id}-error` : undefined}
                  value={skill.name}
                  placeholder="Skill name"
                  onChange={(e) => updateSkill(skill.id, { name: e.target.value })}
                  className={styles.skillInput}
                />
                <span className={styles.compactLevelValue} aria-hidden="true">{skill.level ?? 3}/5</span>
                <button
                  type="button"
                  aria-label={`Remove ${skill.name || `skill ${index + 1}`}`}
                  onClick={() => removeSkill(skill.id)}
                  className={styles.removeButton}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              </div>
              <div className={styles.ratingRow}>
                <div
                  className={styles.levelControl}
                  role="radiogroup"
                  aria-label={`Proficiency for ${skill.name || `skill ${index + 1}`}`}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <label
                      key={level}
                      className={styles.levelOption}
                      data-filled={level <= (skill.level ?? 3)}
                    >
                      <input
                        type="radio"
                        name={`${ratingId}-${skill.id}-level`}
                        value={level}
                        checked={level === (skill.level ?? 3)}
                        onChange={() => updateSkill(skill.id, { level })}
                        aria-label={`${level} out of 5`}
                        className={styles.levelInput}
                      />
                      <Star size={17} strokeWidth={1.5} className={styles.starIcon} aria-hidden="true" />
                    </label>
                  ))}
                </div>
                <span className={styles.levelValue} aria-hidden="true">{skill.level ?? 3}/5</span>
              </div>
            </div>
          ))}
        </div>

        <Button variant="ghost" className={styles.addButton} onClick={addSkill}>
          <Plus size={15} aria-hidden="true" />
          Add skill
        </Button>
      </div>
    </form>
  )
}
