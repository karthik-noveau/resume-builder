import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import type { EditRef, LayoutNode } from '@/shared/types/layout.types'
import { CanvasNode } from '../Canvas/CanvasNode'
import { PropertiesPanel } from './PropertiesPanel'

vi.mock('../Sidebar/AppearancePanel', () => ({ AppearancePanel: () => null }))
vi.mock('./StyleInspector', () => ({
  GlobalTextStyles: () => null, ResetAllStyling: () => null, SelectedElementStyle: () => null,
}))

function Editor({ target }: { target: EditRef }) {
  const selectedSectionType = useEditorStore(s => s.selectedSectionType)
  const resume = useResumeStore(s => s.activeResume)!
  const node: LayoutNode = {
    id: 'field', type: 'text', xPt: 0, yPt: 0, widthPt: 100, heightPt: 20,
    styles: { fontFamily: 'Inter', fontSize: 12, fontWeight: 400, color: '#111827', lineHeight: 1.2, textAlign: 'left' },
    children: [], content: 'Selected content', styleKey: 'field', editRef: target,
  }
  return <>
    <CanvasNode node={node} selectedSectionId={null} selectedEntryId={null}
      onSectionClick={vi.fn()} onEntryClick={vi.fn()} />
    <PropertiesPanel resume={resume} layoutTree={null} selectedSectionType={selectedSectionType}
      onClearSelection={() => useEditorStore.getState().clearSelection()} />
  </>
}

describe('canvas to inspector editing', () => {
  beforeEach(() => {
    useResumeStore.setState({ activeResume: createSampleResume('clarity'), isDirty: false })
    useEditorStore.getState().clearSelection()
    useEditorStore.setState({ inspectorMode: 'content', contentFocusRequest: 0 })
  })

  it('opens the exact field in the second entry and supports selecting it again', () => {
    const resume = useResumeStore.getState().activeResume!
    render(<Editor target={{ kind: 'entry-field', sectionType: 'experience', entryId: resume.experience[1].id, field: 'company' }} />)
    const original = useResumeStore.getState().activeResume
    fireEvent.click(screen.getByRole('button', { name: 'Edit company' }))
    const companies = screen.getAllByRole('textbox', { name: 'Company' })
    expect(companies[1]).toHaveFocus()
    expect(companies[1]).toHaveValue(resume.experience[1].company)
    act(() => companies[0].focus())
    fireEvent.click(screen.getByRole('button', { name: 'Edit company' }))
    expect(companies[1]).toHaveFocus()
    expect(useResumeStore.getState().activeResume).toBe(original)
    expect(document.querySelector('[contenteditable="true"]')).toBeNull()
  })

  it('focuses the clicked achievement rather than the first input in its job', () => {
    const entry = useResumeStore.getState().activeResume!.experience[0]
    render(<Editor target={{ kind: 'entry-list-item', sectionType: 'experience', entryId: entry.id, field: 'description', index: 1 }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit description item' }))
    const card = document.querySelector<HTMLElement>(`[data-entry-id="${entry.id}"]`)!
    const bullet = within(card).getByRole('textbox', { name: 'Achievements / bullet points item 2' })
    expect(bullet).toHaveFocus()
    expect(bullet).toHaveValue(entry.description[1])
    fireEvent.change(bullet, { target: { value: 'A revised achievement' } })
    expect(useResumeStore.getState().activeResume!.experience[0].description[1]).toBe('A revised achievement')
    expect(useResumeStore.getState().activeResume!.experience[0].description[0]).toBe(entry.description[0])
  })

  it('keeps Design selected and focuses the pending field when Content is opened', () => {
    const entry = useResumeStore.getState().activeResume!.education[0]
    useEditorStore.setState({ inspectorMode: 'design' })
    render(<Editor target={{ kind: 'entry-field', sectionType: 'education', entryId: entry.id, field: 'institution' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit institution' }))
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Content' }))
    expect(screen.getByRole('textbox', { name: 'Institution' })).toHaveFocus()
  })
})
