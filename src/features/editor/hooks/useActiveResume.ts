import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'
import { useResumeStore } from '@/shared/stores/resume.store'

/** Loads the resume for a route param, redirecting to the dashboard on a missing id or a not-found error. */
export function useActiveResume(resumeId: string | undefined) {
  const navigate = useNavigate()
  const activeResume = useResumeStore((s) => s.activeResume)
  const isLoading = useResumeStore((s) => s.isLoading)
  const error = useResumeStore((s) => s.error)
  const loadResume = useResumeStore((s) => s.loadResume)

  useEffect(() => {
    if (!resumeId) { void navigate('/app'); return }
    void loadResume(resumeId)
  }, [resumeId, loadResume, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      if (error.includes('not found')) void navigate('/app')
    }
  }, [error, navigate])

  return { activeResume, isLoading }
}
