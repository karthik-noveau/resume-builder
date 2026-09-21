import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { Sidebar } from './Sidebar'

vi.mock('./SectionList', () => ({ SectionList: () => <div>Resume sections</div> }))
vi.mock('./TemplateCard', () => ({ TemplateCard: () => <button>Change template</button> }))
vi.mock('./LayoutSettingsForm', () => ({ LayoutSettingsForm: () => <div>Page settings</div> }))

function renderSidebar() {
  return render(<Sidebar
    resume={createSampleResume('aster')}
    selectedSectionType={null}
    onSelectSection={vi.fn()}
    onReorderBlocks={vi.fn()}
    onToggleVisibility={vi.fn()}
  />)
}

describe('sidebar accordions', () => {
  it('expands Template by default while keeping Page setup collapsed', () => {
    renderSidebar()
    expect(screen.getByRole('progressbar', { name: 'ATS score' })).toBeVisible()
    expect(screen.queryByText('Profile strength')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Template$/ })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Change template' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Page setup' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Page settings')).not.toBeInTheDocument()
  })

  it('still lets the user collapse and reopen Template independently', async () => {
    renderSidebar()
    const toggle = screen.getByRole('button', { name: /^Template$/ })
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Change template' })).not.toBeInTheDocument()
    await userEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Change template' })).toBeVisible()
    expect(screen.getByRole('button', { name: 'Page setup' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('previews template/page setup without changing the user’s accordion choices', async () => {
    const props = {
      resume: createSampleResume('aster'), selectedSectionType: null,
      onSelectSection: vi.fn(), onReorderBlocks: vi.fn(), onToggleVisibility: vi.fn(),
    }
    const { rerender } = render(<Sidebar {...props} />)
    await userEvent.click(screen.getByRole('button', { name: /^Template$/ }))
    rerender(<Sidebar {...props} tourStep="template" />)
    expect(screen.getByRole('button', { name: /^Template$/ })).toHaveAttribute('aria-expanded', 'true')
    rerender(<Sidebar {...props} tourStep="page-setup" />)
    expect(screen.getByRole('button', { name: 'Page setup' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: /^Template$/ })).toHaveAttribute('aria-expanded', 'false')
    rerender(<Sidebar {...props} />)
    expect(screen.getByRole('button', { name: /^Template$/ })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('button', { name: 'Page setup' })).toHaveAttribute('aria-expanded', 'false')
  })
})
