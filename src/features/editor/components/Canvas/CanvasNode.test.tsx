import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useEditorStore } from '@/shared/stores/editor.store'
import type { LayoutNode } from '@/shared/types/layout.types'
import { CanvasNode } from './CanvasNode'

const styles = {
  fontFamily: 'Inter',
  fontSize: 12,
  fontWeight: 400,
  color: '#111827',
  lineHeight: 1.2,
  textAlign: 'left' as const,
}

function node(over: Partial<LayoutNode> & Pick<LayoutNode, 'id' | 'type'>): LayoutNode {
  return {
    xPt: 0, yPt: 0, widthPt: 200, heightPt: 800,
    styles, children: [], ...over,
  } as LayoutNode
}

/** The dark full-height panel a two-column template paints behind its sidebar. */
const panel = node({
  id: 'panel',
  type: 'rect',
  styleKey: 'page:1/rect#1',
  styleLabel: 'Panel',
})

const heading = node({
  id: 'heading',
  type: 'text',
  heightPt: 20,
  content: 'Alex Morgan',
  styleKey: 'personal:fullName',
  editRef: { kind: 'personal-info', field: 'fullName' },
})

function renderNode(n: LayoutNode) {
  const { container } = render(
    <CanvasNode
      node={n}
      selectedSectionId={null}
      selectedEntryId={null}
      onSectionClick={() => {}}
      onEntryClick={() => {}}
    />,
  )
  return container.firstElementChild as HTMLElement
}

describe('CanvasNode stacking', () => {
  beforeEach(() => {
    useResumeStore.setState({ activeResume: createSampleResume('meridian'), isDirty: false })
    useEditorStore.setState({ inspectorMode: 'content', designOpenRequest: 0, styleTarget: null, editingKey: null, selectedSectionId: null, selectedSectionType: null, selectedEntryId: null, personalInfoOpenRequest: 0 })
  })

  it('paints decoration below content', () => {
    expect(renderNode(panel).style.zIndex).toBe('0')
    expect(renderNode(heading).style.zIndex).toBe('1')
  })

  it('opens line styling directly from Content mode without changing the resume', () => {
    const original = useResumeStore.getState().activeResume
    renderNode(node({ id: 'line', type: 'divider', heightPt: 0.5, styleKey: 'line', styleLabel: 'Divider line' }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit divider line' }))
    expect(useEditorStore.getState().inspectorMode).toBe('design')
    expect(useEditorStore.getState().styleTarget?.key).toBe('line')
    expect(useEditorStore.getState().designOpenRequest).toBe(1)
    expect(useResumeStore.getState().activeResume).toBe(original)
  })

  it('lets keyboard users select a decorative panel without raising it above text', () => {
    const rendered = renderNode(panel)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Edit panel' }), { key: 'Enter' })
    expect(useEditorStore.getState().inspectorMode).toBe('design')
    expect(useEditorStore.getState().styleTarget?.key).toBe(panel.styleKey)
    expect(rendered.style.zIndex).toBe('0')
  })

  it('does not mark a node with no style key as selected when nothing is selected', () => {
    expect(renderNode(node({ id: 'plain', type: 'text' })).style.outline).toBe('')
  })

  it('keeps clean previews free of selection outlines and editing controls', () => {
    useEditorStore.setState({ styleTarget: { key: 'personal:fullName', role: null, label: 'Name' } })
    const { container } = render(<CanvasNode node={heading} selectedSectionId={null} selectedEntryId={null}
      onSectionClick={() => {}} onEntryClick={() => {}} interactive={false} />)
    expect(container.querySelector('[data-canvas-selected]')).toBeNull()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Alex Morgan')).toBeInTheDocument()
  })

  it('shows one selection outline when a selected entry contains the selected field', () => {
    useEditorStore.setState({ styleTarget: { key: 'personal:fullName', role: null, label: 'Name' } })
    const entry = node({ id: 'entry', type: 'entry', editRef: { kind: 'entry', sectionType: 'experience', entryId: 'job' }, children: [heading] })
    const { container } = render(<CanvasNode node={entry} selectedSectionId={null} selectedEntryId="job"
      onSectionClick={() => {}} onEntryClick={() => {}} />)
    expect(container.querySelectorAll('[data-canvas-selected]')).toHaveLength(1)
    expect(container.firstElementChild).not.toHaveAttribute('data-canvas-selected')
  })

  it('keeps a selected decorative panel below the content sitting on it', () => {
    // Regression: selecting the sidebar panel promoted it to z-index 2, above
    // every word inside it. An opaque full-height rect then painted over the
    // whole sidebar, which read as the content having been deleted.
    useEditorStore.setState({ styleTarget: { key: 'page:1/rect#1', role: null, label: 'Panel' } })

    expect(renderNode(panel).style.zIndex).toBe('0')
  })

  it('clears the previous section outline when a divider elsewhere is selected', () => {
    useEditorStore.setState({ styleTarget: { key: 'header-line', role: null, label: 'Divider line' } })
    const section = node({ id: 'experience', type: 'section', sectionType: 'experience', children: [heading] })
    const { container } = render(<CanvasNode node={section} selectedSectionId="experience" selectedEntryId={null}
      onSectionClick={() => {}} onEntryClick={() => {}} />)
    expect(container.querySelector('[data-canvas-selected]')).toBeNull()
  })

  it('keeps generated dates connected to their entry form', () => {
    const onEntryClick = vi.fn()
    const entry = node({ id: 'job', type: 'entry', editRef: { kind: 'entry', sectionType: 'experience', entryId: 'job' }, children: [
      node({ id: 'date', type: 'text', content: '2022 – Present', styleKey: 'job/date', styleLabel: 'Text' }),
      node({ id: 'rule', type: 'divider', heightPt: 0.5, styleKey: 'job/rule', styleLabel: 'Divider line' }),
    ] })
    render(<CanvasNode node={entry} selectedSectionId={null} selectedEntryId={null}
      onSectionClick={() => {}} onEntryClick={onEntryClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit text' }))
    expect(onEntryClick).toHaveBeenCalledWith('job', 'experience')
    expect(useEditorStore.getState().inspectorMode).toBe('content')
    fireEvent.click(screen.getByRole('button', { name: 'Edit divider line' }))
    expect(useEditorStore.getState().inspectorMode).toBe('design')
    expect(onEntryClick).toHaveBeenCalledTimes(1)
  })

  it('keeps section icons connected to their section controls', () => {
    const onSectionClick = vi.fn()
    const section = node({ id: 'experience', type: 'section', sectionType: 'experience', children: [
      node({ id: 'icon', type: 'icon', iconName: 'briefcase', iconEditable: true, styleKey: 'section/icon' }),
    ] })
    const { container } = render(<CanvasNode node={section} selectedSectionId={null} selectedEntryId={null}
      onSectionClick={onSectionClick} onEntryClick={() => {}} />)
    fireEvent.click(container.querySelector('svg')!)
    expect(onSectionClick).toHaveBeenCalledWith('experience', 'experience')
    expect(useEditorStore.getState().styleTarget?.key).toBe('section/icon')
  })

  it('still marks the selected panel so the selection stays visible', () => {
    useEditorStore.setState({ styleTarget: { key: 'page:1/rect#1', role: null, label: 'Panel' } })

    // The ring is drawn outside the box, so it reads from below the content.
    expect(renderNode(panel).style.outline).not.toBe('')
  })

  it('lifts selected content above its neighbours', () => {
    useEditorStore.setState({ styleTarget: { key: 'personal:fullName', role: null, label: 'Name' } })

    expect(renderNode(heading).style.zIndex).toBe('2')
  })

  it.each(['fullName', 'headline', 'email', 'phone', 'location', 'website', 'linkedin', 'github', 'portfolio'] as const)(
    'opens Personal Info on a single click on %s without editing the resume',
    (field) => {
      useEditorStore.getState().selectSection('experience', 'experience')
      const before = useResumeStore.getState().activeResume
      renderNode(node({
        ...heading,
        styleKey: `personal:${field}`,
        editRef: { kind: 'personal-info', field },
      }))

      fireEvent.click(screen.getByRole('button', { name: `Edit ${field}` }))

      const editor = useEditorStore.getState()
      expect(editor.selectedSectionType).toBeNull()
      expect(editor.personalInfoOpenRequest).toBe(1)
      expect(editor.personalInfoFocusTarget).toBe(field)
      expect(editor.styleTarget?.key).toBe(`personal:${field}`)
      expect(document.querySelector('[contenteditable="true"]')).toBeNull()
      expect(useResumeStore.getState().activeResume).toBe(before)
    }
  )

  it('opens Personal Info from the contact heading', () => {
    useEditorStore.getState().selectSection('skills', 'skills')
    renderNode(node({
      ...heading,
      content: 'Contact',
      editRef: { kind: 'section-title', sectionType: 'contact', defaultValue: 'Contact' },
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Edit contact section title' }))
    expect(useEditorStore.getState().selectedSectionType).toBeNull()
    expect(useEditorStore.getState().personalInfoOpenRequest).toBe(1)
    expect(useEditorStore.getState().personalInfoFocusTarget).toBe('contactTitle')
  })

  it('opens Personal Info with Space while preserving Enter for inline editing', () => {
    renderNode(heading)
    const name = screen.getByRole('button', { name: 'Edit fullName' })
    fireEvent.keyDown(name, { key: ' ' })
    expect(useEditorStore.getState().personalInfoOpenRequest).toBe(1)
    expect(document.querySelector('[contenteditable="true"]')).toBeNull()

    fireEvent.keyDown(name, { key: 'Enter' })
    expect(screen.getByLabelText('Edit fullName')).toHaveAttribute('contenteditable', 'true')
  })
})
