import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AutosaveIndicator } from './AutosaveIndicator'

describe('AutosaveIndicator', () => {
  it('shows a save-failed pill when error is set, even while dirty', () => {
    render(<AutosaveIndicator isSaving={false} isDirty={true} error="Failed to save resume" />)
    expect(screen.getByText('Save failed')).toBeInTheDocument()
  })

  it('prioritizes the error state over saving', () => {
    render(<AutosaveIndicator isSaving={true} isDirty={true} error="Failed to save resume" />)
    expect(screen.getByText('Save failed')).toBeInTheDocument()
    expect(screen.queryByText('Saving…')).not.toBeInTheDocument()
  })

  it('shows Saving… while a save is in flight', () => {
    render(<AutosaveIndicator isSaving={true} isDirty={true} error={null} />)
    expect(screen.getByText('Saving…')).toBeInTheDocument()
  })

  it('shows Saved once clean and not saving', () => {
    render(<AutosaveIndicator isSaving={false} isDirty={false} error={null} />)
    expect(screen.getByText('Saved')).toBeInTheDocument()
  })

  it('shows pending changes before autosave starts', () => {
    render(<AutosaveIndicator isSaving={false} isDirty={true} error={null} />)
    expect(screen.getByRole('status')).toHaveTextContent('Unsaved changes')
  })
})
