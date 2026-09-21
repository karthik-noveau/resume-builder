import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReactNode } from 'react'
import { EditorLayout } from './EditorLayout'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

vi.mock('@/shared/hooks/useMediaQuery', () => ({ useMediaQuery: vi.fn() }))
vi.mock('@/shared/components/ui/Drawer/Drawer', () => ({
  Drawer: ({ isOpen, title, children }: { isOpen: boolean; title: string; children: ReactNode }) =>
    isOpen ? <div role="dialog" aria-label={title}>{children}</div> : null,
}))

beforeEach(() => vi.mocked(useMediaQuery).mockReturnValue(false))

describe('mobile editor panels', () => {
  const props = { toolbar: 'Toolbar', sidebar: 'Sections content', canvas: 'Resume', propertiesPanel: 'Editing form' }

  it('opens the form directly after a selection and closes the sections drawer', async () => {
    const { rerender } = render(<EditorLayout {...props} propertiesRequest="0" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Open sections panel' }))
    expect(screen.getByRole('dialog', { name: 'Sections' })).toBeVisible()
    rerender(<EditorLayout {...props} propertiesRequest="1" />)
    expect(screen.queryByRole('dialog', { name: 'Sections' })).not.toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Properties' })).toBeVisible()
  })

  it('does not open a drawer on desktop or while touring', () => {
    const { rerender } = render(<EditorLayout {...props} propertiesRequest="0" tourOpen />)
    rerender(<EditorLayout {...props} propertiesRequest="1" tourOpen />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    vi.mocked(useMediaQuery).mockReturnValue(true)
    rerender(<EditorLayout {...props} propertiesRequest="2" />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
