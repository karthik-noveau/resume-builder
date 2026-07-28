import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useExport } from './useExport'
import { exportService } from '../services/export.service'
import type { Resume } from '@/shared/types/resume.types'

vi.mock('../services/export.service', () => ({
  exportService: {
    exportToPdf: vi.fn().mockResolvedValue(undefined)
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

describe('useExport', () => {
  const mockResume = { id: '1', personalInfo: { fullName: 'John' } } as Resume

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('initializes with idle status', () => {
    const { result } = renderHook(() => useExport())
    expect(result.current.status).toBe('idle')
    expect(result.current.isExporting).toBe(false)
  })

  it('handles successful export', async () => {
    const { result } = renderHook(() => useExport())

    await act(async () => {
      void result.current.exportToPdf(mockResume)
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(result.current.status).toBe('completed')
    
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })

    expect(result.current.status).toBe('idle')
  })

  it('handles failed export', async () => {
    vi.mocked(exportService.exportToPdf).mockRejectedValueOnce(new Error('Export failed'))
    const { result } = renderHook(() => useExport())

    await act(async () => {
      void result.current.exportToPdf(mockResume)
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Export failed')
  })
})
