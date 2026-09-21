import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import type { LayoutNode } from '@/shared/types/layout.types'
import { CanvasLeaf } from './CanvasLeaf'
import { TEMPLATE_PORTRAIT_ID } from '@/shared/utils/templatePortrait'

const textNode: LayoutNode = {
  id: 'name',
  type: 'text',
  xPt: 0,
  yPt: 0,
  widthPt: 100,
  heightPt: 20,
  styles: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: 400,
    color: '#111827',
    lineHeight: 1.2,
    textAlign: 'left',
  },
  children: [],
  content: 'DISPLAY NAME',
  editRef: { kind: 'personal-info', field: 'fullName' },
}

describe('CanvasLeaf inline editing', () => {
  beforeEach(() => {
    const resume = createSampleResume('meridian')
    resume.personalInfo.fullName = 'Alex Morgan'
    useResumeStore.setState({ activeResume: resume, isDirty: false })
    useEditorStore.setState({
      selectedSectionId: 'experience',
      selectedSectionType: 'experience',
      selectedEntryId: null,
      personalInfoOpenRequest: 0,
    })
  })

  it('leaves a single click to selection and dragging, without opening the editor', () => {
    render(<CanvasLeaf node={textNode} />)

    fireEvent.click(screen.getByRole('button', { name: 'Edit fullName' }))

    // Still the display affordance, not a caret: a single click selects the
    // element and starts a drag, so opening an editor would break both.
    expect(screen.getByRole('button', { name: 'Edit fullName' })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(document.querySelector('[contenteditable="true"]')).toBeNull()
  })

  it('opens the editor on double click and seeds it from the resume value', () => {
    render(<CanvasLeaf node={textNode} />)

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit fullName' }))

    const editor = screen.getByLabelText('Edit fullName')
    expect(editor).toHaveAttribute('contenteditable', 'true')
    expect(editor).toHaveTextContent('Alex Morgan')
    expect(useEditorStore.getState().selectedSectionType).toBeNull()
    expect(useEditorStore.getState().personalInfoOpenRequest).toBe(1)
  })

  it('opens the matching entry in the right panel while starting inline editing', () => {
    render(<CanvasLeaf node={{
      ...textNode,
      content: 'Senior Product Manager',
      editRef: {
        kind: 'entry-field',
        sectionType: 'experience',
        entryId: 'experience-1',
        field: 'role',
      },
    }} />)

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit role' }))

    const editor = useEditorStore.getState()
    expect(editor.selectedSectionType).toBe('experience')
    expect(editor.selectedEntryId).toBe('experience-1')
  })

  it('opens the matching section in the right panel when its heading is edited', () => {
    render(<CanvasLeaf node={{
      ...textNode,
      content: 'PROFILE',
      editRef: { kind: 'section-title', sectionType: 'summary', defaultValue: 'Profile' },
    }} />)

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit summary section title' }))

    expect(useEditorStore.getState().selectedSectionType).toBe('summary')
  })

  it('commits the edited value on blur', () => {
    render(<CanvasLeaf node={textNode} />)
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit fullName' }))

    const editor = screen.getByLabelText('Edit fullName')
    editor.textContent = 'Jordan Rivera'
    fireEvent.blur(editor)

    expect(useResumeStore.getState().activeResume?.personalInfo.fullName).toBe('Jordan Rivera')
    expect(useResumeStore.getState().isDirty).toBe(true)
  })

  it('persists an edited section heading as a resume-level override', () => {
    render(<CanvasLeaf node={{
      ...textNode,
      content: 'PROFILE',
      editRef: { kind: 'section-title', sectionType: 'summary', defaultValue: 'Profile' },
    }} />)

    fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit summary section title' }))
    const editor = screen.getByLabelText('Edit summary section title')
    expect(editor).toHaveTextContent('Profile')

    editor.textContent = 'About Me'
    fireEvent.blur(editor)

    expect(useResumeStore.getState().activeResume?.sectionTitles?.summary).toBe('About Me')
    expect(useResumeStore.getState().isDirty).toBe(true)
  })

  it('does not create a save or undo event when the value is unchanged', () => {
    render(<CanvasLeaf node={textNode} />)
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit fullName' }))

    fireEvent.blur(screen.getByLabelText('Edit fullName'))

    expect(useResumeStore.getState().isDirty).toBe(false)
  })

  it('cancels without saving when Escape is pressed', () => {
    render(<CanvasLeaf node={textNode} />)
    fireEvent.doubleClick(screen.getByRole('button', { name: 'Edit fullName' }))

    const editor = screen.getByLabelText('Edit fullName')
    editor.textContent = 'Do not save'
    fireEvent.keyDown(editor, { key: 'Escape' })

    expect(useResumeStore.getState().activeResume?.personalInfo.fullName).toBe('Alex Morgan')
    expect(screen.getByRole('button', { name: 'Edit fullName' })).toBeInTheDocument()
  })

  it('opens Personal Info instead of inline editing for a panel-linked value', () => {
    render(<CanvasLeaf node={{ ...textNode, editRef: undefined, panelTarget: 'personal-info', content: 'alex@example.com' }} />)

    fireEvent.click(screen.getByRole('button', { name: 'Open alex@example.com in Personal Info' }))

    const editor = useEditorStore.getState()
    expect(editor.selectedSectionType).toBeNull()
    expect(editor.personalInfoOpenRequest).toBe(1)
    expect(screen.queryByLabelText('Edit email')).not.toBeInTheDocument()
  })

  it('keeps a preview photo non-interactive inside a template selection button', async () => {
    render(<button type="button" aria-label="Select template"><CanvasLeaf node={{
      ...textNode, type: 'image', imageId: TEMPLATE_PORTRAIT_ID,
    }} interactive={false} /></button>)

    const photo = await screen.findByRole('img', { name: 'Profile' })
    expect(screen.getAllByRole('button')).toHaveLength(1)
    fireEvent.click(photo)
    expect(useEditorStore.getState().personalInfoOpenRequest).toBe(0)
  })

  it('still opens Personal Info when the editor photo is clicked', async () => {
    render(<CanvasLeaf node={{
      ...textNode, type: 'image', imageId: TEMPLATE_PORTRAIT_ID,
    }} />)

    fireEvent.click(await screen.findByRole('button', { name: 'Open profile photo in Personal Info' }))
    expect(useEditorStore.getState().personalInfoOpenRequest).toBe(1)
  })
})
