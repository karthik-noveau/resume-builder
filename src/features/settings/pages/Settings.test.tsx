import { fireEvent, render, screen, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { Settings } from './Settings'
import { useThemeStore } from '@/shared/stores/theme.store'

beforeEach(() => useThemeStore.getState().switchTheme('light'))
afterEach(() => {
  cleanup()
  useThemeStore.getState().switchTheme('light')
})

describe('Settings choices', () => {
  it('switches the interface theme and keeps backup actions available', () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked()
    fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(useThemeStore.getState().activeThemeId).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Download backup' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Restore backup' })).toBeEnabled()
    fireEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(useThemeStore.getState().activeThemeId).toBe('light')
  })
})
