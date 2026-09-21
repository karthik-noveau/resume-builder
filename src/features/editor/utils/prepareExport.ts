import { toast } from 'sonner'
import { useResumeStore } from '@/shared/stores/resume.store'

/** Blur-based forms finish validation asynchronously. Export the resulting draft. */
export async function prepareExport() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  const invalid = document.querySelector<HTMLElement>(
    'input[aria-invalid="true"], textarea[aria-invalid="true"]'
  )
  if (invalid) {
    invalid.focus()
    toast.error('Check the highlighted field before exporting.')
    return null
  }
  return useResumeStore.getState().activeResume
}
