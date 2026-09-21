import { useId, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ColorPicker } from 'antd'
import { toast } from 'sonner'
import { Check, Palette, Upload, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/Button/Button'
import { Checkbox } from '@/shared/components/ui/Checkbox/Checkbox'
import { ControlledInput } from './ControlledFields'
import { personalInfoSchema, type PersonalInfoInput } from '@/shared/schemas/personalInfo.schema'
import type { PersonalInfo } from '@/shared/types/resume.types'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useGuidedForm } from '../../hooks/useGuidedForm'
import { useResumeFormSync } from '../../hooks/useResumeFormSync'
import { getTemplateById } from '@/features/templates/registry/template.registry'
import { imageService } from '@/shared/services/image.service'
import { useResolvedImageUrl } from '../Canvas/useResolvedImageUrl'
import { SectionTitleField, type SectionTitleEditRef } from './SectionTitleField'
import { AVATAR_BACKGROUNDS, PROFILE_AVATARS, getProfileAvatar, getAvatarBackground, getAvatarTextColor, getProfileInitials } from '@/shared/utils/profileAvatar'
import styles from './PersonalInfoForm.module.css'

interface PersonalInfoFormProps {
  resumeId: string
  personalInfo: PersonalInfo
  contactTitleEditRef?: SectionTitleEditRef
}

export function PersonalInfoForm({ resumeId, personalInfo, contactTitleEditRef }: PersonalInfoFormProps) {
  const updatePersonalInfo = useResumeStore((s) => s.updatePersonalInfo)
  const updateResume = useResumeStore((s) => s.updateResume)
  // Visibility lives on settings, not personalInfo, so it's read from the store
  // rather than props — that also keeps every mount of this form in sync.
  const updateSettings = useResumeStore((s) => s.updateSettings)
  const showProfileImage = useResumeStore((s) => s.activeResume?.settings.showProfileImage ?? false)
  const templateId = useResumeStore((s) => s.activeResume?.templateId)
  const activeResume = useResumeStore((s) => s.activeResume)
  const templateSupportsPhoto =
    getTemplateById(templateId ?? '')?.exportRules.includeProfileImage ?? true
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoUrl = useResolvedImageUrl(personalInfo.profileImage)
  const profileStyle = activeResume?.settings.profileImageStyle ?? 'avatar'
  const avatarBackground = getAvatarBackground(activeResume?.settings.profileImageBackground).toLowerCase()
  const isCustomColor = !AVATAR_BACKGROUNDS.some(color => color.value === avatarBackground)
  const selectedAvatar = getProfileAvatar(activeResume?.settings.profileAvatarVariant, avatarBackground)
  const photoStyleId = useId()

  const form = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo,
  })
  const { control, handleSubmit, formState: { errors } } = form
  const fullName = useWatch({ control, name: 'fullName' })
  const initials = getProfileInitials(fullName || '')
  const commit = useResumeFormSync(form, personalInfo, (data) => { updatePersonalInfo(data) })
  const guided = useGuidedForm(form, commit)

  const save = handleSubmit(commit)
  const onSaved = () => { void save() }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploading(true)
    try {
      const asset = await imageService.processProfileImage(file, resumeId)
      const resume = useResumeStore.getState().activeResume
      if (!resume || resume.id !== resumeId) {
        await imageService.deleteImage(asset.id)
        return
      }
      const previousId = resume.personalInfo.profileImage
      updateResume({
        personalInfo: { ...resume.personalInfo, profileImage: asset.id },
        settings: { ...resume.settings, profileImageStyle: 'avatar', showProfileImage: true },
      })
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
      <fieldset className={styles.photoFieldset}>
        <legend className={styles.photoLegend}>Profile image</legend>
        <div className={styles.photoOptions}>
          <label className={styles.photoOption}>
            <input type="radio" name={`${photoStyleId}-style`} value="avatar"
              checked={profileStyle === 'avatar'} disabled={isUploading}
              onChange={() => updateSettings({ profileImageStyle: 'avatar', showProfileImage: true })} />
            <span className={styles.avatar} style={{ backgroundColor: avatarBackground }}>
              <img src={photoUrl || selectedAvatar.url} alt="" className={styles.avatarImage} />
            </span>
            <span className={styles.optionLabel}>Avatar image</span>
            <span className={styles.optionHint}>Sample or upload</span>
            <Check size={14} className={styles.optionCheck} aria-hidden="true" />
          </label>
          <label className={styles.photoOption}>
            <input type="radio" name={`${photoStyleId}-style`} value="initials"
              checked={profileStyle === 'initials'} disabled={isUploading}
              onChange={() => updateSettings({ profileImageStyle: 'initials', showProfileImage: true })} />
            <span className={styles.avatar} style={{ backgroundColor: avatarBackground, color: getAvatarTextColor(avatarBackground) }} aria-hidden="true">
              {initials}
            </span>
            <span className={styles.optionLabel}>Color &amp; initials</span>
            <span className={styles.optionHint}>Text from your name</span>
            <Check size={14} className={styles.optionCheck} aria-hidden="true" />
          </label>
        </div>
        <fieldset className={styles.colorFieldset}>
          <legend className={styles.colorLegend}>Profile color</legend>
          <div className={styles.colorOptions}>
            {AVATAR_BACKGROUNDS.map(color => <label key={color.value} className={styles.colorOption} style={{ backgroundColor: color.value, color: getAvatarTextColor(color.value) }}>
              <input type="radio" name={`${photoStyleId}-color`} aria-label={color.name}
                checked={avatarBackground === color.value}
                onChange={() => updateSettings({ profileImageBackground: color.value })} />
              <Check size={14} aria-hidden="true" />
            </label>)}
            <ColorPicker
              value={avatarBackground}
              disabledAlpha
              onChangeComplete={(color) => updateSettings({ profileImageBackground: color.toHexString().toLowerCase() })}
            >
              <button
                type="button"
                className={`${styles.colorOption} ${styles.customColorOption}`}
                aria-label="Custom profile color"
                aria-pressed={isCustomColor}
                title={isCustomColor ? `Custom color (${avatarBackground})` : 'Custom color'}
                style={isCustomColor ? { backgroundColor: avatarBackground, color: getAvatarTextColor(avatarBackground) } : undefined}
              >
                {isCustomColor ? <Check size={14} aria-hidden="true" /> : <Palette size={14} aria-hidden="true" />}
              </button>
            </ColorPicker>
          </div>
          <p className={styles.photoHelp}>
            Choose a preset or custom background for your avatar and initials.
            {personalInfo.profileImage && ' Uploaded photos stay unchanged.'}
          </p>
        </fieldset>
        {profileStyle === 'avatar' ? <>
          {!personalInfo.profileImage && <fieldset className={styles.avatarVariantFieldset}>
            <legend className={styles.colorLegend}>Avatar character</legend>
            <div className={styles.avatarVariantOptions}>
              {PROFILE_AVATARS.map(avatar => <label key={avatar.value} className={styles.avatarVariantOption}>
                <input type="radio" name={`${photoStyleId}-avatar`} value={avatar.value}
                  checked={selectedAvatar.value === avatar.value} disabled={isUploading}
                  onChange={() => updateSettings({ profileAvatarVariant: avatar.value, showProfileImage: true })} />
                <img src={getProfileAvatar(avatar.value, avatarBackground).url} alt="" className={styles.avatarVariantImage} style={{ backgroundColor: avatarBackground }} />
                <span>{avatar.label}</span>
                <Check size={14} className={styles.variantCheck} aria-hidden="true" />
              </label>)}
            </div>
          </fieldset>}
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
            <Upload size={14} aria-hidden="true" />
          </Button>
          {photoUrl && (
            <button
              type="button"
              onClick={removePhoto}
              disabled={isUploading}
              className={styles.removeButton}
            >
              <X size={12} />
              Remove
            </button>
          )}
          <p className={styles.photoHelp}>
            {photoUrl ? 'Remove your photo to use a cartoon avatar. Switching styles keeps your photo.' : 'Choose a cartoon avatar or upload your own photo.'}
          </p>
        </div></> :
          <p className={styles.photoHelp}>Initials update automatically from your full name.</p>
        }
      </fieldset>

      {/* Some templates never draw a photo (exportRules.includeProfileImage).
          Offering the toggle there is a dead control — it changes state that
          the renderer will ignore. */}
      {templateSupportsPhoto ? (
        <div className={styles.photoToggle}>
          <Checkbox
            label="Show profile image on resume"
            checked={showProfileImage}
            onChange={(e) => { updateSettings({ showProfileImage: e.target.checked }) }}
          />
        </div>
      ) : (
        <p className={styles.photoUnsupported}>
          This template doesn’t display a profile photo. Switch template to use one.
        </p>
      )}

      {activeResume && contactTitleEditRef && (
        <SectionTitleField resume={activeResume} editRef={contactTitleEditRef} />
      )}

      <ControlledInput control={control} name="fullName" label="Full name" required={!!guided} error={errors.fullName?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="headline" label="Professional headline" error={errors.headline?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="email" label="Email" type="email" required={!!guided} error={errors.email?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="phone" label="Phone" type="tel" error={errors.phone?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="location" label="Location" error={errors.location?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="website" label="Website" type="url" error={errors.website?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="linkedin" label="LinkedIn" type="url" error={errors.linkedin?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="github" label="GitHub" type="url" error={errors.github?.message} onSaved={onSaved} />
      <ControlledInput control={control} name="portfolio" label="Portfolio" type="url" error={errors.portfolio?.message} onSaved={onSaved} />
    </form>
  )
}
