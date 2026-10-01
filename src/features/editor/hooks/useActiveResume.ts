import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useResumeStore } from '@/shared/stores/resume.store'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'

const SAVE_ERROR_NOTICE = 'resume-save-error'

/** Loads the resume for a route param, redirecting to the dashboard on a missing id or a not-found error. */
export function useActiveResume(resumeId: string | undefined) {
  const navigate = useNavigate()
  const isGuided = useLocation().pathname.endsWith('/guided')
  const hasInlineSaveStatus = useMediaQuery(isGuided ? '(min-width: 640px)' : '(min-width: 1024px)')
  const activeResume = useResumeStore((s) => s.activeResume)
  const isLoading = useResumeStore((s) => s.isLoading)
  const error = useResumeStore((s) => s.error)
  const loadResume = useResumeStore((s) => s.loadResume)
  const isCurrentResume = activeResume?.id === resumeId

  useEffect(() => {
    if (!resumeId) {
      void navigate('/app')
      return
    }
    void loadResume(resumeId)
  }, [resumeId, loadResume, navigate])

  useEffect(() => {
    // Load failures and visible save indicators already report errors inline.
    // Small-screen toolbars hide save status, so retain a failure notice there.
    // A missing resume redirects away, so retain a notice explaining that move.
    if (!error || hasInlineSaveStatus || !isCurrentResume) toast.dismiss(SAVE_ERROR_NOTICE)
    if (error?.includes('not found')) {
      toast.error(error, { id: 'resume-not-found' })
      void navigate('/app')
    } else if (error && isCurrentResume && !hasInlineSaveStatus) {
      toast.error(error, { id: SAVE_ERROR_NOTICE })
    }
  }, [error, navigate, hasInlineSaveStatus, isCurrentResume])

  return {
    activeResume,
    isLoading,
    loadError: error,
    retry: () => resumeId && void loadResume(resumeId),
  }
}
