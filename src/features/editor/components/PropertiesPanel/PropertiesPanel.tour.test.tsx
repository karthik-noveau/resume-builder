import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSampleResume } from '@/features/resume/utils/resume.factory'
import { PropertiesPanel } from './PropertiesPanel'

vi.mock('./PersonalInfoForm', () => ({ PersonalInfoForm: () => <div>Personal fields</div> }))
vi.mock('./SectionProperties', () => ({ SectionProperties: () => <div>Section fields</div> }))
vi.mock('../Sidebar/AppearancePanel', () => ({ AppearancePanel: () => <div>Global appearance</div> }))
vi.mock('./StyleInspector', () => ({
  GlobalTextStyles: () => <div>Global typography</div>,
  ResetAllStyling: () => null,
  SelectedElementStyle: () => <div>Selected styles</div>,
}))

describe('properties tour previews', () => {
  it('reveals Content, Global design, and Selected design, then restores the chosen tab', async () => {
    const resume = createSampleResume('aster')
    const before = JSON.stringify(resume)
    const props = { resume, layoutTree: null, selectedSectionType: null, onClearSelection: vi.fn() }
    const { rerender } = render(<PropertiesPanel {...props} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Design' }))
    await userEvent.click(screen.getByRole('button', { name: /Global design/ }))
    rerender(<PropertiesPanel {...props} tourStep="content" />)
    expect(screen.getByRole('tab', { name: 'Content' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Personal fields')).toBeVisible()
    rerender(<PropertiesPanel {...props} tourStep="global-design" />)
    expect(screen.getByText('Global typography')).toBeVisible()
    expect(screen.queryByText('Selected styles')).not.toBeInTheDocument()
    rerender(<PropertiesPanel {...props} tourStep="selected-design" />)
    expect(screen.queryByText('Global typography')).not.toBeInTheDocument()
    expect(screen.getByText('Selected styles')).toBeVisible()
    rerender(<PropertiesPanel {...props} />)
    expect(screen.getByRole('tab', { name: 'Design' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Global typography')).toBeVisible()
    expect(screen.getByText('Selected styles')).toBeVisible()
    expect(JSON.stringify(resume)).toBe(before)
  })
})
