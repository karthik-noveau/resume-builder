import type { ReactNode } from 'react'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { useTemplateStore } from '@/shared/stores/template.store'
import { TemplatePickerModal } from './TemplatePickerModal'

// These tests exercise picker state; full preview and modal layout are checked
// in the browser so forty resume canvases need not be mounted in every test.
vi.mock('@/shared/components/ui/Modal/Modal', () => ({
  Modal: ({
    isOpen,
    children,
    title,
    onClose,
  }: {
    isOpen: boolean
    children: ReactNode
    title: string
    onClose: () => void
  }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
        <button onClick={onClose}>Close dialog</button>
        {children}
      </div>
    ) : null,
}))
vi.mock('@/shared/components/ResumePreview/ResumePreview', () => ({ ResumePreview: () => null }))
vi.mock('@/shared/utils/templatePreview', () => ({ getTemplatePreviewTree: () => null }))

describe('template picker filters', () => {
  beforeEach(() => useTemplateStore.setState({ availableTemplates: ALL_TEMPLATES }))

  const setup = () => {
    const onClose = vi.fn()
    const onSelect = vi.fn()
    const props = { isOpen: true, onClose, onSelect, currentTemplateId: 'meridian' }
    return {
      ...render(<TemplatePickerModal {...props} />),
      props,
      onClose,
      onSelect,
      user: userEvent.setup(),
    }
  }

  it('shows all forty templates with the same gallery filter controls', () => {
    setup()
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(40)
    expect(screen.getByRole('status')).toHaveTextContent('40 of 40 templates')
    const layoutFilters = within(screen.getByRole('group', { name: 'Filter by column layout' }))
    for (const name of ['All Templates', 'One Column', 'Two Column']) {
      expect(layoutFilters.getByRole('button', { name })).toBeInTheDocument()
    }
    for (const name of ['Simple', 'Ultra Modern', 'Fresher', 'Experienced']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    expect(
      screen.queryByRole('group', { name: 'Filter by experience level' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All Templates' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(
      screen.queryByRole('button', { name: 'Use template' })
    ).not.toBeInTheDocument()
  })

  it('still finds design styles through search and combines them with other filters', async () => {
    const { user } = setup()
    const search = screen.getByRole('searchbox')
    await user.type(search, 'Simple')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(20)
    expect(screen.getByRole('status')).toHaveTextContent('20 of 40 templates')
    expect(screen.queryByRole('button', { name: 'Use Horizon template' })).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'Ultra Modern')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(20)
    expect(screen.getByRole('button', { name: 'Use Horizon template' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Two Column' }))
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(
      ALL_TEMPLATES.filter(
        (template) => template.designStyle === 'Ultra Modern' && template.layout === 'two-column'
      ).length
    )
    await user.clear(search)
    await user.type(search, 'Horizon')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'All Templates' }))
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(40)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'All Templates' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('filters only by column layout, across both experience categories', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Two Column' }))
    const expected = ALL_TEMPLATES.filter((template) => template.layout === 'two-column')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(expected.length)
    expect(screen.getByRole('button', { name: 'Two Column' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await user.click(screen.getByRole('button', { name: 'One Column' }))
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(ALL_TEMPLATES.filter((template) => template.layout === 'single-column').length)
  })

  it('searches names and tags without case or surrounding whitespace sensitivity', async () => {
    const { user } = setup()
    const search = screen.getByRole('searchbox', { name: 'Search templates' })
    await user.type(search, '  hOrIzOn  ')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Use Horizon template' })).toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'editorial')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(ALL_TEMPLATES.filter((template) => template.tags.includes('editorial')).length)
  })

  it('applies a template with one click and closes without another confirmation', async () => {
    const { user, onSelect, onClose } = setup()
    await user.click(screen.getByRole('button', { name: 'Use Horizon template' }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('horizon')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('marks the current template without reapplying it', async () => {
    const { user, onSelect } = setup()
    const current = screen.getByRole('button', { name: 'Current Meridian template' })
    expect(current).toBeDisabled()
    await user.click(current)
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('offers an empty-result reset that clears all filters', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'One Column' }))
    await user.type(screen.getByRole('searchbox'), 'no-matching-design')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).queryAllByRole('button')
    ).toHaveLength(0)
    expect(screen.getByText('No templates found')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(40)
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('resets filters each time the picker opens', async () => {
    const { user, props, rerender } = setup()
    await user.type(screen.getByRole('searchbox'), 'Horizon')
    rerender(<TemplatePickerModal {...props} isOpen={false} />)
    rerender(<TemplatePickerModal {...props} isOpen />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(
      within(screen.getByRole('group', { name: 'Templates' })).getAllByRole('button')
    ).toHaveLength(40)
  })

  it('does not change a template when browsing and closing', async () => {
    const { user, onSelect, onClose } = setup()
    await user.click(screen.getByRole('button', { name: 'Two Column' }))
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('blocks repeated choices while applying and waits before closing', async () => {
    const { user, onSelect, onClose } = setup()
    let finish!: () => void
    onSelect.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        finish = resolve
      })
    )
    const choice = screen.getByRole('button', { name: 'Use Horizon template' })
    await user.dblClick(choice)
    expect(choice).toBeDisabled()
    expect(choice).toHaveAttribute('aria-busy', 'true')
    expect(choice).toHaveTextContent('Applying…')
    await user.click(screen.getByRole('button', { name: 'Use Clarity template' }))
    await user.click(screen.getByRole('button', { name: 'Close dialog' }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('horizon')
    expect(onClose).not.toHaveBeenCalled()
    act(() => finish())
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the picker open and allows retry after an unsuccessful action', async () => {
    const { user, onSelect, onClose } = setup()
    onSelect.mockRejectedValueOnce(new Error('Storage unavailable'))
    const choice = screen.getByRole('button', { name: 'Use Horizon template' })
    await user.click(choice)
    expect(await screen.findByRole('alert')).toHaveTextContent('Please try again')
    expect(onClose).not.toHaveBeenCalled()
    expect(choice).toBeEnabled()
    await user.click(choice)
    await waitFor(() => expect(onClose).toHaveBeenCalledOnce())
    expect(onSelect).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
