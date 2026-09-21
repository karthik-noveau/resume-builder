import { useState, useCallback, useEffect, useRef } from 'react'
import { exportService, type GeneratedPdf } from '../services/export.service'
import type { ExportStatus } from '@/shared/types/export.types'
import type { Resume } from '@/shared/types/resume.types'
import { toast } from 'sonner'

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [mode, setMode] = useState<'download' | 'preview'>('download')
  const generatedPdfRef = useRef<GeneratedPdf | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const operation = useRef(0)
  const busy = useRef(false)

  const clearResetTimer = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = null
  }, [])

  const clearPreview = useCallback(() => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = null
    generatedPdfRef.current = null
    setPreviewUrl(null)
  }, [])

  useEffect(
    () => () => {
      operation.current++
      busy.current = false
      clearResetTimer()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    },
    [clearResetTimer]
  )

  const generate = useCallback(
    async (resume: Resume, nextMode: 'download' | 'preview') => {
      // A ref also guards two clicks in the same render, before state commits.
      if (busy.current) return
      busy.current = true
      const id = ++operation.current
      clearResetTimer()
      clearPreview()
      setMode(nextMode)
      setStatus('generating')
      setError(null)
      try {
        const pdf = await exportService.generatePdf(resume)
        if (id !== operation.current) return
        if (nextMode === 'preview') {
          const url = exportService.createPreviewUrl(pdf)
          generatedPdfRef.current = pdf
          previewUrlRef.current = url
          setPreviewUrl(url)
        } else {
          exportService.downloadPdf(pdf)
          toast.success('PDF downloaded')
          resetTimerRef.current = setTimeout(() => {
            if (id === operation.current) setStatus('idle')
            resetTimerRef.current = null
          }, 2000)
        }
        setStatus('completed')
      } catch (err) {
        if (id !== operation.current) return
        const message =
          err instanceof Error ? err.message : 'Could not prepare your PDF. Try again.'
        setError(message)
        setStatus('failed')
        toast.error(message)
      } finally {
        if (id === operation.current) busy.current = false
      }
    },
    [clearPreview, clearResetTimer]
  )

  const exportToPdf = useCallback((resume: Resume) => generate(resume, 'download'), [generate])
  const previewPdf = useCallback((resume: Resume) => generate(resume, 'preview'), [generate])
  const downloadPreview = useCallback(() => {
    if (!generatedPdfRef.current) return
    exportService.downloadPdf(generatedPdfRef.current)
    toast.success('PDF downloaded')
  }, [])
  const closeExport = useCallback(() => {
    operation.current++
    busy.current = false
    clearResetTimer()
    clearPreview()
    setError(null)
    setStatus('idle')
  }, [clearPreview, clearResetTimer])

  return {
    status,
    error,
    mode,
    previewUrl,
    exportToPdf,
    previewPdf,
    downloadPreview,
    closeExport,
    isExporting: status !== 'idle' && status !== 'completed' && status !== 'failed',
  }
}
