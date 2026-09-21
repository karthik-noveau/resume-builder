import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TourProps } from 'antd'
import type * as Antd from 'antd'
import { EditorTour } from './EditorTour'
import { EDITOR_TOUR_STEPS } from './editorTour.steps'

// Keep the real tour card, navigation, and accessibility logic; omit portal geometry.
vi.mock('antd', async (importOriginal) => ({
  ...await importOriginal<typeof Antd>(),
  Tour: ({ steps, current = 0 }: TourProps) => steps?.[current]?.description,
}))

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  })
})

describe('EditorTour', () => {
  function TourHarness({ onClose }: { onClose: () => void }) {
    const [current, onChange] = useState(0)
    return <EditorTour current={current} onChange={onChange} onClose={onClose} />
  }

  it('covers all five editing tools with concise copy and a miniature preview', async () => {
    const close = vi.fn()
    const { container } = render(<TourHarness onClose={close} />)
    expect(screen.getByRole('dialog', { name: 'Change template' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: 'Page setup' })).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    for (const [index, step] of EDITOR_TOUR_STEPS.entries()) {
      expect(screen.getByRole('dialog', { name: step.title })).toBeVisible()
      expect(screen.getByText(step.description)).toBeVisible()
      expect(step.description.split(' ').length).toBeLessThanOrEqual(12)
      expect(container.querySelector(`[data-preview="${step.id}"]`)).toHaveAttribute('aria-hidden', 'true')
      if (index < EDITOR_TOUR_STEPS.length - 1) await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    }
    await userEvent.click(screen.getByRole('button', { name: 'Start editing' }))
    expect(close).toHaveBeenCalledOnce()
  })

  it('allows skipping and closing with Escape', async () => {
    const close = vi.fn()
    render(<TourHarness onClose={close} />)
    await userEvent.click(screen.getByRole('button', { name: 'Skip tour' }))
    expect(close).toHaveBeenCalledOnce()
    screen.getByRole('dialog').focus()
    await userEvent.keyboard('{Escape}')
    expect(close).toHaveBeenCalledTimes(2)
  })

  it('keeps keyboard focus inside the card', async () => {
    render(<TourHarness onClose={vi.fn()} />)
    const next = screen.getByRole('button', { name: 'Next' })
    const close = screen.getByRole('button', { name: 'Close quick tour' })
    next.focus()
    await userEvent.tab()
    expect(close).toHaveFocus()
    await userEvent.tab({ shift: true })
    expect(next).toHaveFocus()
  })

  it('explains the mobile panel controls', async () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList)
    render(<TourHarness onClose={vi.fn()} />)
    expect(screen.getByText('Open Sections · Template')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Open Sections · Page setup')).toBeVisible()
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Open Properties · Content')).toBeVisible()
  })
})
