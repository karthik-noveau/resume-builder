import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
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
    useEditorStore.setState({ styleTarget: null, editingKey: null, selectedSectionId: null, selectedEntryId: null })
  })

  it('paints decoration below content', () => {
    expect(renderNode(panel).style.zIndex).toBe('0')
    expect(renderNode(heading).style.zIndex).toBe('1')
  })

  it('keeps a selected decorative panel below the content sitting on it', () => {
    // Regression: selecting the sidebar panel promoted it to z-index 2, above
    // every word inside it. An opaque full-height rect then painted over the
    // whole sidebar, which read as the content having been deleted.
    useEditorStore.setState({ styleTarget: { key: 'page:1/rect#1', role: null, label: 'Panel' } })

    expect(renderNode(panel).style.zIndex).toBe('0')
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
})
