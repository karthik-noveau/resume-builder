import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/shared/components/ui/Button/Button'
import { ControlledInput } from './ControlledFields'
import { skillSectionSchema, type SkillSectionInput } from '@/shared/schemas/skills.schema'
import type { SkillSection } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useGuidedForm } from '../../hooks/useGuidedForm'
import { useResumeFormSync } from '../../hooks/useResumeFormSync'
import styles from './SkillsForm.module.css'

export function SkillsForm({ section }: { section: SkillSection }) {
  const updateSection = useResumeStore((s) => s.updateSection)
  const form = useForm<SkillSectionInput>({
    resolver: zodResolver(skillSectionSchema),
    defaultValues: section,
  })
  const { control, handleSubmit, formState: { errors } } = form
  const commit = useResumeFormSync<SkillSectionInput>(form, section, (data) => { updateSection('skills', section.id, data) })
  const guided = useGuidedForm(form, commit)

  const save = handleSubmit(commit)
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
        {section.skills.map((skill) => (
          <div key={skill.id} className={styles.skillRow}>
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
            <div className={styles.levelGroup} role="radiogroup" aria-label={`Proficiency for ${skill.name || 'skill'}`}>
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={(skill.level ?? 3) >= level}
                  aria-label={`Level ${level}`}
                  onClick={() => updateSkill(skill.id, { level })}
                  className={clsx(styles.levelDot, (skill.level ?? 3) >= level && styles.levelDotActive)}
                />
              ))}
            </div>
            <button
              type="button"
              aria-label="Remove skill"
              onClick={() => removeSkill(skill.id)}
              className={styles.removeButton}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        <Button variant="secondary" className={styles.addButton} onClick={addSkill}>
          <Plus size={14} className={styles.addIcon} />
          Add skill
        </Button>
      </div>
    </form>
  )
}
