import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { createEmptyCustomSection } from '@/features/resume/utils/section.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import { ProjectsForm } from './ProjectsForm'
import { CertificationsForm } from './CertificationsForm'
import { CustomSectionForm } from './CustomSectionForm'
import { LayoutSettingsForm } from '../Sidebar/LayoutSettingsForm'

function Form({ kind }: { kind: 'projects' | 'certifications' | 'custom' | 'layout' }) {
  const resume = useResumeStore(s => s.activeResume)
  if (!resume) return null
  if (kind === 'projects') return <ProjectsForm section={resume.projects[0]} />
  if (kind === 'certifications') return <CertificationsForm section={resume.certifications[0]} />
  if (kind === 'custom') return <CustomSectionForm section={resume.customSections[0]} />
  return <LayoutSettingsForm settings={resume.settings} />
}

beforeEach(() => {
  const resume = createSampleResume('meridian')
  resume.customSections = [createEmptyCustomSection()]
  useResumeStore.setState({ activeResume: resume, isDirty: false })
  useEditorStore.getState().clearHistory()
})

afterEach(() => act(() => {
  useResumeStore.setState({ activeResume: null, isDirty: false })
  useEditorStore.getState().clearHistory()
}))

it.each([
  ['projects', 'Live URL', 'url'],
  ['certifications', 'Credential URL', 'credentialUrl'],
] as const)('commits an unfinished %s URL synchronously for reload recovery', async (kind, label, field) => {
  render(<Form kind={kind} />)
  const input = screen.getByRole('textbox', { name: label })
  fireEvent.change(input, { target: { value: 'unfinished-link' } })
  fireEvent.blur(input)
  expect(useResumeStore.getState().activeResume?.[kind][0]).toHaveProperty(field, 'unfinished-link')
  expect(useResumeStore.getState().isDirty).toBe(true)
  await act(async () => {})
})

it('keeps a cleared custom title as a draft', async () => {
  render(<Form kind="custom" />)
  const input = screen.getByRole('textbox', { name: 'Section title' })
  fireEvent.change(input, { target: { value: '' } })
  fireEvent.blur(input)
  expect(useResumeStore.getState().activeResume?.customSections[0].title).toBe('')
  await act(async () => {})
})

it('keeps the selected spacing preset when a margin changes and rejects invalid margins', async () => {
  render(<Form kind="layout" />)
  fireEvent.click(screen.getByRole('button', { name: 'Spacious' }))
  const top = screen.getByRole('spinbutton', { name: 'Top' })
  fireEvent.change(top, { target: { value: '25' } })
  fireEvent.blur(top)
  expect(useResumeStore.getState().activeResume?.settings).toMatchObject({ spacingDensity: 'spacious', margins: { top: 25 } })
  fireEvent.change(top, { target: { value: '0' } })
  fireEvent.blur(top)
  expect(useResumeStore.getState().activeResume?.settings.margins.top).toBe(25)
  await act(async () => {})
})
