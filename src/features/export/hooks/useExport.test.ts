import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useExport } from './useExport'
import { exportService } from '../services/export.service'
import type { Resume } from '@/shared/types/resume.types'

vi.mock('../services/export.service', () => ({
  exportService: {
    exportToPdf: vi.fn().mockResolvedValue(undefined),
    generatePdf: vi.fn().mockResolvedValue({
      bytes: new Uint8Array([1, 2, 3]),
      fileName: 'John.pdf',
    }),
    createPreviewUrl: vi.fn().mockReturnValue('blob:preview'),
    downloadPdf: vi.fn(),
  },
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

describe('useExport', () => {
  const mockResume = { id: '1', personalInfo: { fullName: 'John' } } as Resume

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    global.URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => vi.useRealTimers())

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
    vi.mocked(exportService.generatePdf).mockRejectedValueOnce(new Error('Export failed'))
    const { result } = renderHook(() => useExport())

    await act(async () => {
      void result.current.exportToPdf(mockResume)
      await vi.advanceTimersByTimeAsync(600)
    })

    expect(result.current.status).toBe('failed')
    expect(result.current.error).toBe('Export failed')
  })

  it('generates, downloads, and cleans up a PDF preview', async () => {
    const { result } = renderHook(() => useExport())

    await act(async () => {
      await result.current.previewPdf(mockResume)
    })

    expect(result.current.status).toBe('completed')
    expect(result.current.mode).toBe('preview')
    expect(result.current.previewUrl).toBe('blob:preview')

    act(() => result.current.downloadPreview())
    expect(exportService.downloadPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: 'John.pdf',
      })
    )

    act(() => result.current.closeExport())
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(result.current.status).toBe('idle')
    expect(result.current.previewUrl).toBeNull()
  })
})

describe('export cancellation and races', () => {
  const resume = { id: '1' } as Resume
  beforeEach(() => {
    vi.clearAllMocks()
    global.URL.revokeObjectURL = vi.fn()
  })
  it('ignores a preview that completes after its dialog closes', async () => {
    let resolve!: (pdf: { bytes: Uint8Array; fileName: string }) => void
    vi.mocked(exportService.generatePdf).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done
      })
    )
    const { result } = renderHook(() => useExport())
    let pending!: Promise<void>
    act(() => {
      pending = result.current.previewPdf(resume)
    })
    act(() => result.current.closeExport())
    await act(async () => {
      resolve({ bytes: new Uint8Array([1]), fileName: 'resume.pdf' })
      await pending
    })
    expect(result.current.status).toBe('idle')
    expect(exportService.createPreviewUrl).not.toHaveBeenCalled()
  })
  it('does not start two exports from rapid clicks or download after unmount', async () => {
    let resolve!: (pdf: { bytes: Uint8Array; fileName: string }) => void
    vi.mocked(exportService.generatePdf).mockReturnValueOnce(
      new Promise((done) => {
        resolve = done
      })
    )
    const { result, unmount } = renderHook(() => useExport())
    let pending!: Promise<void>
    act(() => {
      pending = result.current.exportToPdf(resume)
      void result.current.exportToPdf(resume)
    })
    expect(exportService.generatePdf).toHaveBeenCalledOnce()
    unmount()
    await act(async () => {
      resolve({ bytes: new Uint8Array([1]), fileName: 'resume.pdf' })
      await pending
    })
    expect(exportService.downloadPdf).not.toHaveBeenCalled()
  })
})
