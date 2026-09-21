import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { RouteError } from './RouteError'
vi.mock('react-router', () => ({ useRouteError: () => new Error('Internal secret stack') }))
vi.mock('@/shared/services/logger', () => ({ logger: { error: vi.fn() } }))
it('renders a useful recovery view without exposing internal error details', () => {
  render(<RouteError />)
  expect(screen.getByRole('heading')).toHaveTextContent('get you back to work')
  expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Go to My Resumes' })).toHaveAttribute('href', '/app')
  expect(screen.queryByText('Internal secret stack')).not.toBeInTheDocument()
})
