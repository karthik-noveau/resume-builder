import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { DataBackup } from './DataBackup'
import {
  createBackup,
  downloadBackup,
  parseBackup,
  restoreBackup,
  type ResumeBackup,
} from '@/shared/services/backup.service'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { resumeSchema } from '@/shared/schemas/resume.schema'
import type * as DexieModule from 'dexie'
// jsdom has no IndexedDB, so Dexie's liveQuery intentionally never starts.
// Exercise the size query while keeping its subscribe/unsubscribe contract.
vi.mock('dexie', async (importOriginal) => ({
  ...(await importOriginal<typeof DexieModule>()),
  liveQuery: (query: () => Promise<number | null>) => ({
    subscribe: ({ next }: { next: (value: number | null) => void }) => {
      let active = true
      void query().then((value) => {
        if (active) next(value)
      })
      return {
        unsubscribe: () => {
          active = false
        },
      }
    },
  }),
}))
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
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(createBackup).mockResolvedValue(JSON.stringify(backup))
  useResumeStore.setState({ activeResume: null, isDirty: false, error: null })
})
it('shows UTF-8 file bytes before download and updates to the exact downloaded snapshot', async () => {
  const first = JSON.stringify({ name: 'é'.repeat(1024) })
  const latest = JSON.stringify({ name: 'é'.repeat(2048) })
  vi.mocked(createBackup).mockResolvedValueOnce(first).mockResolvedValue(latest)
  render(
    <MemoryRouter>
      <DataBackup />
    </MemoryRouter>
  )
  expect(await screen.findByText('2 KB')).toHaveAttribute('title', '2,059 bytes')
  expect(downloadBackup).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Download backup' }))
  await waitFor(() => expect(downloadBackup).toHaveBeenCalledWith(latest))
  expect(screen.getByText('4 KB')).toHaveAttribute('title', '4,107 bytes')
})

it('does not show a misleading size when a backup cannot be prepared', async () => {
  vi.mocked(createBackup).mockRejectedValue(
    new Error('Create a resume before downloading a backup.')
  )
  render(
    <MemoryRouter>
      <DataBackup />
    </MemoryRouter>
  )
  await waitFor(() => expect(createBackup).toHaveBeenCalled())
  const button = screen.getByRole('button', { name: 'Download backup' })
  expect(button).not.toHaveAttribute('aria-describedby')
  await userEvent.click(button)
  expect(await screen.findByRole('alert')).toHaveTextContent('Create a resume before downloading')
  expect(downloadBackup).not.toHaveBeenCalled()
})
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
