import { act, fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Settings } from './Settings'
import { storageService } from '@/shared/services/storage.service'
import { useThemeStore } from '@/shared/stores/theme.store'
import type { AppSettings } from '@/shared/types/resume.types'

vi.mock('@/shared/services/storage.service', () => ({
  storageService: { getSettings: vi.fn(), saveSettings: vi.fn() },
}))
vi.mock('@/shared/components/ResumePreview/ResumePreview', () => ({
  ResumePreview: () => <div>Sample resume</div>,
}))
const defaults: AppSettings = {
  id: 'global',
  themeId: 'light',
  fontPresetId: 'professional',
  pageSize: 'A4',
  language: 'en',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(storageService.getSettings).mockResolvedValue(defaults)
  vi.mocked(storageService.saveSettings).mockResolvedValue()
  useThemeStore.setState({ activeThemeId: 'light' })
})
afterEach(cleanup)

describe('Settings choices', () => {
  it('keeps rapid choices together and waits for the latest save', async () => {
    let finishFirst!: () => void
    vi.mocked(storageService.saveSettings).mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishFirst = resolve
        })
    )
    render(<Settings />)
    fireEvent.click(await screen.findByRole('radio', { name: 'Violet' }))
    await waitFor(() => expect(storageService.saveSettings).toHaveBeenCalledTimes(1))
    fireEvent.click(screen.getByRole('radio', { name: 'Minimal' }))
    fireEvent.click(screen.getByRole('radio', { name: 'US Letter' }))
    expect(screen.getByText('Saving changes…')).toBeInTheDocument()
    act(() => {
      finishFirst()
    })
    await screen.findByText('Saved on this device')
    expect(storageService.saveSettings).toHaveBeenLastCalledWith(
      expect.objectContaining({
        themeId: 'custom',
        customPrimaryColor: '#7a45d1',
        fontPresetId: 'minimal',
        pageSize: 'LETTER',
      })
    )
  })

  it('restores the previous choice and shows an error when saving fails', async () => {
    vi.mocked(storageService.saveSettings).mockRejectedValueOnce(new Error('Unavailable storage'))
    render(<Settings />)
    fireEvent.click(await screen.findByRole('radio', { name: 'Executive' }))
    await screen.findByText('Change wasn’t saved. Try again.')
    expect(screen.getByRole('radio', { name: 'Professional' })).toBeChecked()
  })

  it('changes workspace appearance independently from resume defaults', async () => {
    render(<Settings />)
    fireEvent.click(await screen.findByRole('radio', { name: 'Dark' }))
    expect(useThemeStore.getState().activeThemeId).toBe('dark')
    expect(storageService.saveSettings).not.toHaveBeenCalled()
    expect(screen.getByRole('radio', { name: 'Template colors' })).toBeChecked()
  })
})
