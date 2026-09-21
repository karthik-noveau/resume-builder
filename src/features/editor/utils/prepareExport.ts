import { useResumeStore } from '@/shared/stores/resume.store'

/** Let blur-based edits commit, then export the draft without content checks. */
export async function prepareExport() {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
  await new Promise<void>((resolve) => setTimeout(resolve, 0))
  return useResumeStore.getState().activeResume
}
