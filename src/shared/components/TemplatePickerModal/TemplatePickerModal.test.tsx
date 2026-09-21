import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { useTemplateStore } from '@/shared/stores/template.store'
import { TemplatePickerModal } from './TemplatePickerModal'

// These tests exercise picker state; full preview and modal layout are checked
// in the browser so forty resume canvases need not be mounted in every test.
vi.mock('@/shared/components/ui/Modal/Modal', () => ({
  Modal: ({ isOpen, children, title }: { isOpen: boolean; children: ReactNode; title: string }) =>
    isOpen ? (
      <div role="dialog" aria-label={title}>
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
    expect(screen.getAllByRole('option')).toHaveLength(40)
    expect(screen.getByRole('status')).toHaveTextContent('40 of 40 templates')
    const layoutFilters = within(screen.getByRole('group', { name: 'Filter by column layout' }))
    for (const name of [
      'All Templates',
      'One Column',
      'Two Column',
    ]) {
      expect(layoutFilters.getByRole('button', { name })).toBeInTheDocument()
    }
    for (const name of ['Simple', 'Ultra Modern', 'Fresher', 'Experienced']) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument()
    }
    expect(screen.queryByRole('group', { name: 'Filter by experience level' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All Templates' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Use template' })).toBeDisabled()
  })

  it('still finds design styles through search and combines them with other filters', async () => {
    const { user } = setup()
    const search = screen.getByRole('searchbox')
    await user.type(search, 'Simple')
    expect(screen.getAllByRole('option')).toHaveLength(20)
    expect(screen.getByRole('status')).toHaveTextContent('20 of 40 templates')
    expect(screen.queryByRole('option', { name: /Horizon,/ })).not.toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'Ultra Modern')
    expect(screen.getAllByRole('option')).toHaveLength(20)
    expect(screen.getByRole('option', { name: /Horizon,/ })).toHaveAccessibleName(/Ultra Modern/)
    await user.click(screen.getByRole('button', { name: 'Two Column' }))
    expect(screen.getAllByRole('option')).toHaveLength(
      ALL_TEMPLATES.filter(
        (template) =>
          template.designStyle === 'Ultra Modern' &&
          template.layout === 'two-column'
      ).length
    )
    await user.clear(search)
    await user.type(search, 'Horizon')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'All Templates' }))
    expect(screen.getAllByRole('option')).toHaveLength(40)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'All Templates' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('filters only by column layout, across both experience categories', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Two Column' }))
    const expected = ALL_TEMPLATES.filter(
      (template) => template.layout === 'two-column'
    )
    expect(screen.getAllByRole('option')).toHaveLength(expected.length)
    expect(screen.getByRole('button', { name: 'Two Column' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await user.click(screen.getByRole('button', { name: 'One Column' }))
    expect(screen.getAllByRole('option')).toHaveLength(
      ALL_TEMPLATES.filter((template) => template.layout === 'single-column').length
    )
  })

  it('searches names and tags without case or surrounding whitespace sensitivity', async () => {
    const { user } = setup()
    const search = screen.getByRole('searchbox', { name: 'Search templates' })
    await user.type(search, '  hOrIzOn  ')
    expect(screen.getAllByRole('option')).toHaveLength(1)
    expect(screen.getByRole('option', { name: /Horizon,/ })).toBeInTheDocument()
    await user.clear(search)
    await user.type(search, 'editorial')
    expect(screen.getAllByRole('option')).toHaveLength(
      ALL_TEMPLATES.filter((template) => template.tags.includes('editorial')).length
    )
  })

  it('keeps the draft selection while filtering and only applies on confirmation', async () => {
    const { user, onSelect, onClose } = setup()
    await user.click(screen.getByRole('option', { name: /Horizon,/ }))
    await user.click(screen.getByRole('button', { name: 'One Column' }))
    expect(screen.queryByRole('option', { name: /Horizon,/ })).not.toBeInTheDocument()
    expect(screen.getByText('Horizon')).toBeInTheDocument()
    expect(onSelect).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Use template' }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('horizon')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('offers an empty-result reset that clears all facets without clearing the selection', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('option', { name: /Horizon,/ }))
    await user.click(screen.getByRole('button', { name: 'One Column' }))
    await user.type(screen.getByRole('searchbox'), 'no-matching-design')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByText('No templates found')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(screen.getAllByRole('option')).toHaveLength(40)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getByRole('option', { name: /Horizon,/ })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  })

  it('resets filters and selection each time the picker opens', async () => {
    const { user, props, rerender } = setup()
    await user.click(screen.getByRole('option', { name: /Horizon,/ }))
    await user.type(screen.getByRole('searchbox'), 'Horizon')
    rerender(<TemplatePickerModal {...props} isOpen={false} />)
    rerender(<TemplatePickerModal {...props} isOpen />)
    expect(screen.getByRole('searchbox')).toHaveValue('')
    expect(screen.getAllByRole('option')).toHaveLength(40)
    expect(screen.getByRole('button', { name: 'Use template' })).toBeDisabled()
  })

  it('does not apply a filtered choice when cancelled', async () => {
    const { user, onSelect, onClose } = setup()
    await user.click(screen.getByRole('button', { name: 'Two Column' }))
    await user.click(screen.getByRole('option', { name: /Horizon,/ }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onSelect).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledOnce()
  })
})
