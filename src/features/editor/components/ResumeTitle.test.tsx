import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, expect, it } from 'vitest'
import { ResumeTitle } from './ResumeTitle'
import { useResumeStore } from '@/shared/stores/resume.store'
import { createSampleResume } from '@/features/resume/utils/resume.factory'

beforeEach(() =>
  useResumeStore.setState({ activeResume: createSampleResume('meridian'), isDirty: false })
)
it('renames in the editor through the normal undoable autosave path', async () => {
  render(<ResumeTitle title="Untitled Resume" />)
  await userEvent.click(screen.getByRole('button', { name: 'Rename Untitled Resume' }))
  const input = screen.getByRole('textbox', { name: 'Resume title' })
  fireEvent.change(input, { target: { value: 'Product designer · Acme' } })
  fireEvent.blur(input)
  expect(useResumeStore.getState().activeResume?.title).toBe('Product designer · Acme')
  expect(useResumeStore.getState().isDirty).toBe(true)
})
it('cancels a title edit with Escape', async () => {
  render(<ResumeTitle title="Untitled Resume" />)
  await userEvent.click(screen.getByRole('button'))
  await userEvent.type(screen.getByRole('textbox'), 'Changed{Escape}')
  expect(useResumeStore.getState().isDirty).toBe(false)
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
})
