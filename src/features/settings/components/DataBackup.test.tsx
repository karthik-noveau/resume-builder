import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { DataBackup } from './DataBackup'
import { parseBackup, restoreBackup, type ResumeBackup } from '@/shared/services/backup.service'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { resumeSchema } from '@/shared/schemas/resume.schema'
vi.mock('@/shared/services/backup.service', () => ({
  MAX_BACKUP_BYTES: 20 * 1024 * 1024,
  createBackup: vi.fn(),
  downloadBackup: vi.fn(),
  parseBackup: vi.fn(),
  restoreBackup: vi.fn(),
}))
const backup: ResumeBackup = {
  format: 'resume-studio-backup',
  version: 1,
  exportedAt: new Date().toISOString(),
  images: [],
  resumes: [resumeSchema.parse(createSampleResume('meridian'))],
}
function upload() {
  const file = new File(['{}'], 'backup.json', { type: 'application/json' })
  Object.defineProperty(file, 'text', { value: () => Promise.resolve('{}') })
  fireEvent.change(screen.getByLabelText('Choose a Resume Studio backup'), {
    target: { files: [file] },
  })
}
beforeEach(() => vi.resetAllMocks())
it('previews a backup and only restores after the user confirms', async () => {
  vi.mocked(parseBackup).mockReturnValue(backup)
  vi.mocked(restoreBackup).mockResolvedValue(1)
  render(
    <MemoryRouter>
      <DataBackup />
    </MemoryRouter>
  )
  upload()
  expect(await screen.findByRole('dialog', { name: 'Restore your resumes' })).toBeInTheDocument()
  expect(restoreBackup).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Restore copies' }))
  expect(restoreBackup).toHaveBeenCalledWith(backup)
  expect(await screen.findByRole('status')).toHaveTextContent('1 resume restored')
})
it('surfaces invalid backup errors without writing anything', async () => {
  vi.mocked(parseBackup).mockImplementation(() => {
    throw new Error('Unsupported backup file')
  })
  render(
    <MemoryRouter>
      <DataBackup />
    </MemoryRouter>
  )
  upload()
  expect(await screen.findByRole('alert')).toHaveTextContent('Unsupported backup file')
  expect(restoreBackup).not.toHaveBeenCalled()
})
it('keeps the restore review open on storage failure for retry', async () => {
  vi.mocked(parseBackup).mockReturnValue(backup)
  vi.mocked(restoreBackup).mockRejectedValue(new Error('Quota exceeded'))
  render(
    <MemoryRouter>
      <DataBackup />
    </MemoryRouter>
  )
  upload()
  await screen.findByRole('dialog')
  await userEvent.click(screen.getByRole('button', { name: 'Restore copies' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('No partial copies were saved')
  expect(screen.getByRole('button', { name: 'Restore copies' })).toBeEnabled()
})
