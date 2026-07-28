import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { ImagePlus, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox/Checkbox'
import { ControlledInput } from './ControlledFields'
import { personalInfoSchema, type PersonalInfoInput } from '@/shared/schemas/personalInfo.schema'
import type { PersonalInfo } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { imageService } from '@/shared/services/image.service'
import { useResolvedImageUrl } from '../Canvas/useResolvedImageUrl'
import styles from './PersonalInfoForm.module.css'

interface PersonalInfoFormProps {
  resumeId: string
  personalInfo: PersonalInfo
}

export function PersonalInfoForm({ resumeId, personalInfo }: PersonalInfoFormProps) {
  const updatePersonalInfo = useResumeStore((s) => s.updatePersonalInfo)
  // Visibility lives on settings, not personalInfo, so it's read from the store
  // rather than props — that also keeps every mount of this form in sync.
  const updateSettings = useResumeStore((s) => s.updateSettings)
  const showProfileImage = useResumeStore((s) => s.activeResume?.settings.showProfileImage ?? false)
  const templateId = useResumeStore((s) => s.activeResume?.templateId)
  const templateSupportsPhoto =
    ALL_TEMPLATES.find((t) => t.id === templateId)?.exportRules.includeProfileImage ?? true
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoUrl = useResolvedImageUrl(personalInfo.profileImage)

  const { control, handleSubmit, reset, formState: { errors } } = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo,
  })

  useEffect(() => { reset(personalInfo) }, [personalInfo, reset])

  const save = handleSubmit((data) => { updatePersonalInfo(data) })
  const onSaved = () => { void save() }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploading(true)
    const previousId = personalInfo.profileImage
    try {
      const asset = await imageService.processProfileImage(file, resumeId)
      updatePersonalInfo({ profileImage: asset.id })
      // Drop the replaced blob — image rows are otherwise only cleaned up when
      // the whole resume is deleted, so each change leaked one indefinitely.
      if (previousId) await imageService.deleteImage(previousId)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo')
    } finally {
      setIsUploading(false)
    }
  }

  const removePhoto = () => {
    const previousId = personalInfo.profileImage
    updatePersonalInfo({ profileImage: undefined })
    if (previousId) void imageService.deleteImage(previousId)
  }

  return (
    <form className={styles.form} aria-label="Personal information" onSubmit={(e) => e.preventDefault()}>
      <div className={styles.photoRow}>
        <div className={styles.avatar}>
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className={styles.avatarImage} />
          ) : (
            <ImagePlus size={20} className={styles.avatarIcon} aria-hidden="true" />
          )}
        </div>
        <div className={styles.photoActions}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={styles.hiddenFileInput}
            onChange={(e) => { void handlePhotoChange(e) }}
          />
          <Button
            type="button"
            variant="secondary"
            loading={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {photoUrl ? 'Change photo' : 'Upload photo'}
          </Button>
          {photoUrl && (
            <button
              type="button"
              onClick={removePhoto}
              className={styles.removeButton}
            >
              <X size={12} />
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Some templates never draw a photo (exportRules.includeProfileImage).
          Offering the toggle there is a dead control — it changes state that
          the renderer will ignore. */}
      {templateSupportsPhoto ? (
        <div className={styles.photoToggle}>
          <Checkbox
            label="Show profile photo on resume"
            checked={showProfileImage}
            onChange={(e) => { updateSettings({ showProfileImage: e.target.checked }) }}
          />
        </div>
      ) : (
        <p className={styles.photoUnsupported}>
          This template doesn’t display a profile photo. Switch template to use one.
        </p>
      )}

      <ControlledInput control={control} name="fullName" label="Full name" error={errors.fullName?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="headline" label="Professional headline" error={errors.headline?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="email" label="Email" type="email" error={errors.email?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="location" label="Location" error={errors.location?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="website" label="Website" type="url" error={errors.website?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="linkedin" label="LinkedIn" type="url" error={errors.linkedin?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="github" label="GitHub" type="url" error={errors.github?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="portfolio" label="Portfolio" type="url" error={errors.portfolio?.message} onSaved={onSaved} />
    </form>
  )
}
