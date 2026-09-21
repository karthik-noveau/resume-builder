import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import type { LayoutNode } from '@/shared/types/layout.types'
import { CanvasNode } from '../Canvas/CanvasNode'
import { PropertiesPanel } from './PropertiesPanel'
import { EditorLayout } from '@/shared/components/layout/EditorLayout'

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: () => false }))

vi.mock('./SectionProperties', () => ({ SectionProperties: () => <div>Section fields</div> }))
vi.mock('../Sidebar/AppearancePanel', () => ({ AppearancePanel: () => null }))
vi.mock('./StyleInspector', () => ({
  GlobalTextStyles: () => null,
  ResetAllStyling: () => null,
  SelectedElementStyle: () => <div>Selected styles</div>,
}))

const name: LayoutNode = {
  id: 'name', type: 'text', xPt: 0, yPt: 0, widthPt: 100, heightPt: 20,
  styles: { fontFamily: 'Inter', fontSize: 12, fontWeight: 400, color: '#111827', lineHeight: 1.2, textAlign: 'left' },
  children: [], content: 'Alex Morgan', styleKey: 'personal:fullName',
  editRef: { kind: 'personal-info', field: 'fullName' },
}

function Editor({ mobile = false }: { mobile?: boolean }) {
  const selectedSectionType = useEditorStore(s => s.selectedSectionType)
  const request = useEditorStore(s => s.personalInfoOpenRequest)
  const resume = useResumeStore(s => s.activeResume)!
  const canvas = <CanvasNode node={name} selectedSectionId={null} selectedEntryId={null}
      onSectionClick={vi.fn()} onEntryClick={vi.fn()} />
  const properties = <PropertiesPanel resume={resume} layoutTree={null} selectedSectionType={selectedSectionType}
      onClearSelection={() => useEditorStore.getState().clearSelection()} />
  if (!mobile) return <>{canvas}{properties}</>
  return <EditorLayout toolbar={null} sidebar={null} canvas={canvas} propertiesPanel={properties}
    propertiesRequest={String(request)} onPropertiesOpened={() => {
      const editor = useEditorStore.getState()
      if (editor.personalInfoFocusTarget) editor.openPersonalInfo(editor.personalInfoFocusTarget)
    }} />
}

describe('profile inspector focus', () => {
  beforeEach(() => {
    useResumeStore.setState({ activeResume: createSampleResume('clarity'), isDirty: false })
    useEditorStore.setState({
      selectedSectionId: 'summary', selectedSectionType: 'summary', selectedEntryId: null,
      personalInfoOpenRequest: 0, personalInfoFocusTarget: null, editingKey: null, styleTarget: null,
    })
  })

  it('focuses the name input when clicking its canvas content from another section', () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit fullName' }))
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveFocus()
    expect(useResumeStore.getState().isDirty).toBe(false)
  })

  it('scrolls the inspector to a lower field and can focus the same field again', () => {
    const { container } = render(<Editor />)
    const panel = container.querySelector<HTMLElement>('[data-editor-tour-scroll="properties"]')!
    const scroll = vi.fn()
    panel.scrollTo = scroll
    Object.defineProperty(panel, 'clientHeight', { value: 400 })
    act(() => useEditorStore.getState().openPersonalInfo())
    const email = screen.getByRole('textbox', { name: 'Email' })
    vi.spyOn(email, 'getBoundingClientRect').mockReturnValue({ top: 600, height: 40 } as DOMRect)
    act(() => useEditorStore.getState().openPersonalInfo('email'))

    expect(email).toHaveFocus()
    expect(scroll).toHaveBeenLastCalledWith({ top: 420, behavior: 'instant' })
    act(() => screen.getByRole('textbox', { name: 'Full name' }).focus())
    act(() => useEditorStore.getState().openPersonalInfo('email'))
    expect(email).toHaveFocus()
  })

  it('focuses profile image controls for a photo request', () => {
    render(<Editor />)
    act(() => useEditorStore.getState().openPersonalInfo('profileImage'))
    expect(screen.getByRole('radio', { name: 'Avatar image Sample or upload' })).toHaveFocus()
  })

  it('keeps focus in the canvas during double-click inline editing', async () => {
    render(<Editor />)
    await userEvent.dblClick(screen.getByRole('button', { name: 'Edit fullName' }))
    expect(screen.getByLabelText('Edit fullName')).toHaveAttribute('contenteditable', 'true')
    expect(screen.getByLabelText('Edit fullName')).toHaveFocus()
    expect(useEditorStore.getState().personalInfoFocusTarget).toBeNull()
  })

  it('preserves the Design tab and focuses the requested field when Content is opened', () => {
    render(<Editor />)
    fireEvent.click(screen.getByRole('tab', { name: 'Design' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit fullName' }))
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Content' }))
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveFocus()
  })

  it('retains field focus after the mobile properties drawer finishes opening', async () => {
    render(<Editor mobile />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit fullName' }))
    await waitFor(() => expect(useEditorStore.getState().personalInfoOpenRequest).toBe(2))
    expect(screen.getByRole('textbox', { name: 'Full name' })).toHaveFocus()
  })
})
