import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { imageService } from '@/shared/services/image.service'
import { PersonalInfoForm } from './PersonalInfoForm'

vi.mock('../Canvas/useResolvedImageUrl', () => ({
  useResolvedImageUrl: (id?: string) => id ? '/uploaded-test-photo.png' : null,
}))
vi.mock('@/shared/services/image.service', () => ({ imageService: {
  processProfileImage: vi.fn().mockResolvedValue({ id: 'new-upload' }),
  deleteImage: vi.fn().mockResolvedValue(undefined),
} }))

function Form() {
  const resume = useResumeStore(state => state.activeResume)!
  return <PersonalInfoForm resumeId={resume.id} personalInfo={resume.personalInfo} />
}

describe('profile image options', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useResumeStore.setState({ activeResume: createSampleResume('aster'), isDirty: false })
    useEditorStore.setState({ undoStack: [], redoStack: [] })
  })

  it('shows a built-in avatar without filling blank photo data', () => {
    const { container } = render(<Form />)
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/profile-avatar-male-transparent-v1.png')
    expect(screen.getByRole('radio', { name: /Avatar image/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Show profile image on resume' })).toBeChecked()
    expect(useResumeStore.getState().activeResume?.personalInfo.profileImage).toBeUndefined()
  })

  it('switches styles and colors without losing an uploaded photo or other settings', async () => {
    useResumeStore.getState().updatePersonalInfo({ profileImage: 'existing-upload' })
    const original = useResumeStore.getState().activeResume!
    render(<Form />)
    await userEvent.click(screen.getByRole('radio', { name: /Color & initials/ }))
    await userEvent.click(screen.getByRole('radio', { name: 'Slate' }))
    expect(useResumeStore.getState().activeResume?.settings).toEqual({
      ...original.settings, showProfileImage: true, profileImageStyle: 'initials', profileImageBackground: '#334155',
    })
    await userEvent.click(screen.getByRole('radio', { name: /Avatar image/ }))
    expect(useResumeStore.getState().activeResume?.personalInfo).toEqual(original.personalInfo)
    expect(imageService.deleteImage).not.toHaveBeenCalled()
    expect(useResumeStore.getState().isDirty).toBe(true)
  })

  it('shows one shared background selector for avatars and initials and colors both thumbnails', async () => {
    useResumeStore.getState().updateSettings({ showProfileImage: false })
    const { container } = render(<Form />)
    const colors = screen.getByRole('group', { name: 'Profile color' })
    expect(colors).toBeVisible()
    await userEvent.click(screen.getByRole('radio', { name: 'Mint' }))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/profile-avatar-male-mint-v1.png')
    expect(container.querySelector('img')?.parentElement).toHaveStyle({ backgroundColor: '#d1fae5' })
    expect(screen.getByRole('radio', { name: 'Male' }).parentElement?.querySelector('img')).toHaveStyle({ backgroundColor: '#d1fae5' })
    expect(useResumeStore.getState().activeResume?.settings.showProfileImage).toBe(false)
    await userEvent.click(screen.getByRole('radio', { name: 'Female' }))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/profile-avatar-female-mint-v1.png')
    expect(screen.getByRole('radio', { name: 'Mint' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: /Color & initials/ }))
    expect(screen.getAllByRole('group', { name: 'Profile color' })).toHaveLength(1)
    expect(screen.getByRole('radio', { name: 'Mint' })).toBeChecked()
    expect(screen.getByText('AM', { exact: true })).toHaveStyle({ backgroundColor: '#d1fae5' })
    await userEvent.click(screen.getByRole('radio', { name: 'Peach' }))
    await userEvent.click(screen.getByRole('radio', { name: /Avatar image/ }))
    expect(screen.getByRole('radio', { name: 'Peach' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked()
    expect(container.querySelector('img')?.parentElement).toHaveStyle({ backgroundColor: '#ffedd5' })
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/profile-avatar-female-peach-v1.png')
    expect(useResumeStore.getState().activeResume?.settings.profileImageBackground).toBe('#ffedd5')
  })

  it('chooses Male or Female without changing personal details and remembers the choice across styles', async () => {
    const original = useResumeStore.getState().activeResume!
    const { container } = render(<Form />)
    expect(screen.getByRole('radio', { name: 'Male' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Female' }))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/profile-avatar-female-transparent-v1.png')
    expect(useResumeStore.getState().activeResume?.settings).toEqual({
      ...original.settings, profileAvatarVariant: 'female', showProfileImage: true,
    })
    expect(useResumeStore.getState().activeResume?.personalInfo).toEqual(original.personalInfo)
    expect(useEditorStore.getState().undoStack[0]).toEqual(original)
    await userEvent.click(screen.getByRole('radio', { name: /Color & initials/ }))
    expect(screen.queryByRole('radio', { name: 'Female' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('radio', { name: /Avatar image/ }))
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Male' }))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/profile-avatar-male-transparent-v1.png')
    expect(imageService.deleteImage).not.toHaveBeenCalled()
  })

  it('keeps an uploaded photo active until removal, then restores the preferred cartoon avatar', async () => {
    useResumeStore.getState().updateSettings({ profileAvatarVariant: 'female' })
    useResumeStore.getState().updatePersonalInfo({ profileImage: 'existing-upload' })
    const { container } = render(<Form />)
    expect(screen.queryByRole('radio', { name: 'Female' })).not.toBeInTheDocument()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/uploaded-test-photo.png')
    await userEvent.click(screen.getByRole('radio', { name: 'Sky' }))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/uploaded-test-photo.png')
    expect(useResumeStore.getState().activeResume?.personalInfo.profileImage).toBe('existing-upload')
    await userEvent.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.getByRole('radio', { name: 'Female' })).toBeChecked()
    expect(container.querySelector('img')?.getAttribute('src')).toBe('/profile-avatar-female-sky-v1.png')
  })

  it('hides and restores the profile block without deleting the photo or appearance preferences', async () => {
    useResumeStore.getState().updatePersonalInfo({ profileImage: 'existing-upload' })
    useResumeStore.getState().updateSettings({ showProfileImage: true, profileImageStyle: 'initials', profileAvatarVariant: 'female', profileImageBackground: '#334155' })
    const original = useResumeStore.getState().activeResume!
    render(<Form />)
    const toggle = screen.getByRole('checkbox', { name: 'Show profile image on resume' })
    expect(toggle).toBeChecked()
    await userEvent.click(toggle)
    expect(toggle).not.toBeChecked()
    expect(useResumeStore.getState().activeResume?.settings).toEqual({ ...original.settings, showProfileImage: false })
    expect(useResumeStore.getState().activeResume?.personalInfo).toEqual(original.personalInfo)
    expect(useResumeStore.getState().isDirty).toBe(true)
    await userEvent.click(toggle)
    expect(toggle).toBeChecked()
    expect(useResumeStore.getState().activeResume?.settings).toEqual(original.settings)
    expect(imageService.deleteImage).not.toHaveBeenCalled()
  })

  it('keeps personal details and page settings intact when uploading a replacement', async () => {
    useResumeStore.getState().updatePersonalInfo({ profileImage: 'existing-upload' })
    const original = useResumeStore.getState().activeResume!
    const { container } = render(<Form />)
    await userEvent.upload(container.querySelector('input[type="file"]')!, new File(['image'], 'profile.png', { type: 'image/png' }))
    await waitFor(() => expect(useResumeStore.getState().activeResume?.personalInfo.profileImage).toBe('new-upload'))
    expect(useResumeStore.getState().activeResume?.personalInfo).toEqual({ ...original.personalInfo, profileImage: 'new-upload' })
    expect(useResumeStore.getState().activeResume?.settings).toEqual({ ...original.settings, showProfileImage: true, profileImageStyle: 'avatar' })
    expect(useResumeStore.getState().activeResume?.experience).toEqual(original.experience)
    expect(imageService.deleteImage).toHaveBeenCalledWith('existing-upload')
    expect(useEditorStore.getState().undoStack[0]).toEqual(original)
  })
})
