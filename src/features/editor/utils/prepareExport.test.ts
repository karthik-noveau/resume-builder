import { afterEach, expect, it, vi } from 'vitest'
import { prepareExport } from './prepareExport'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))
afterEach(() => document.body.replaceChildren())
it('waits for a blur commit before reading the resume to export', async () => {
  useResumeStore.setState({ activeResume: createSampleResume('meridian') })
  const input = document.createElement('input')
  document.body.append(input)
  input.focus()
  input.addEventListener('blur', () => {
    void Promise.resolve().then(() =>
      useResumeStore.getState().updateSummary('Latest typed summary')
    )
  })
  expect((await prepareExport())?.summary.content).toBe('Latest typed summary')
})
it('focuses invalid fields instead of exporting stale content', async () => {
  const input = document.createElement('input')
  input.setAttribute('aria-invalid', 'true')
  document.body.append(input)
  expect(await prepareExport()).toBeNull()
  expect(document.activeElement).toBe(input)
})
