import { afterEach, expect, it } from 'vitest'
import { prepareExport } from './prepareExport'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
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
it('allows preview and export when a field has a validation message', async () => {
  const resume = createSampleResume('meridian')
  useResumeStore.setState({ activeResume: resume })
  const input = document.createElement('input')
  input.setAttribute('aria-invalid', 'true')
  document.body.append(input)
  expect(await prepareExport()).toBe(resume)
  expect(document.activeElement).not.toBe(input)
})
