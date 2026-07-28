import { useState, useCallback } from 'react'
import { exportService } from '../services/export.service'
import type { ExportStatus } from '@/shared/types/export.types'
import type { Resume } from '@/shared/types/resume.types'
import { toast } from 'sonner'

export function useExport() {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const exportToPdf = useCallback(async (resume: Resume) => {
    if (status !== 'idle' && status !== 'completed' && status !== 'failed') return

    setStatus('preparing')
    setError(null)

    try {
      // Small delay to show "Preparing" state
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setStatus('generating')
      await exportService.exportToPdf(resume)
      
      setStatus('completed')
      toast.success('Resume exported successfully!')
      
      // Reset to idle after 2 seconds
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown export error'
      setError(message)
      setStatus('failed')
      toast.error(`Export failed: ${message}`)
    }
  }, [status])

  return {
    status,
    error,
    exportToPdf,
    isExporting: status !== 'idle' && status !== 'completed' && status !== 'failed',
  }
}
