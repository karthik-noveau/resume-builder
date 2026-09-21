import { act, renderHook } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'
import { useResumeFormSync } from './useResumeFormSync'

describe('useResumeFormSync', () => {
  it('keeps newer typing when the previous field saves, but still accepts mock data and undo', () => {
    const initial = { institution: '', degree: '' }
    const { result, rerender } = renderHook(({ source }) => {
      const form = useForm({ defaultValues: source })
      const commit = useResumeFormSync(form, source, vi.fn())
      return { form, commit }
    }, { initialProps: { source: initial } })

    act(() => result.current.form.setValue('institution', 'My University', { shouldDirty: true }))
    const saved = result.current.form.getValues()
    act(() => { void result.current.commit(saved) })
    act(() => result.current.form.setValue('degree', 'BSc Computing', { shouldDirty: true }))
    rerender({ source: saved })
    expect(result.current.form.getValues()).toEqual({ institution: 'My University', degree: 'BSc Computing' })

    const mock = { institution: 'Example University', degree: 'MBA' }
    rerender({ source: mock })
    expect(result.current.form.getValues()).toEqual(mock)
    rerender({ source: initial })
    expect(result.current.form.getValues()).toEqual(initial)
  })
})
