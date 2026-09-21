import { fireEvent, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

function handlers() {
  return { onUndo: vi.fn(), onRedo: vi.fn(), onSave: vi.fn(), onEscape: vi.fn(), onDelete: vi.fn() }
}
const modifier = /mac/i.test(navigator.platform) ? { metaKey: true } : { ctrlKey: true }

describe('editor shortcuts', () => {
  it('preserves native input undo and never deletes a selected resume entry while typing', () => {
    const actions = handlers()
    renderHook(() => useKeyboardShortcuts(actions))
    const input = document.createElement('input')
    document.body.append(input)
    input.focus()
    fireEvent.keyDown(input, { key: 'z', ...modifier })
    fireEvent.keyDown(input, { key: 'Delete' })
    expect(actions.onUndo).not.toHaveBeenCalled()
    expect(actions.onDelete).not.toHaveBeenCalled()
    fireEvent.keyDown(input, { key: 's', ...modifier })
    expect(actions.onSave).toHaveBeenCalledOnce()
    input.remove()
  })

  it('supports shifted uppercase redo and canvas undo', () => {
    const actions = handlers()
    renderHook(() => useKeyboardShortcuts(actions))
    fireEvent.keyDown(document, { key: 'Z', shiftKey: true, ...modifier })
    fireEvent.keyDown(document, { key: 'z', ...modifier })
    expect(actions.onRedo).toHaveBeenCalledOnce()
    expect(actions.onUndo).toHaveBeenCalledOnce()
  })

  it('does not run canvas shortcuts from modal controls or IME input', () => {
    const actions = handlers()
    renderHook(() => useKeyboardShortcuts(actions))
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    document.body.append(dialog)
    fireEvent.keyDown(dialog, { key: 'Delete' })
    fireEvent.keyDown(document, { key: 'z', isComposing: true, ...modifier })
    expect(actions.onDelete).not.toHaveBeenCalled()
    expect(actions.onUndo).not.toHaveBeenCalled()
    dialog.remove()
  })
})
