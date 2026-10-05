import { resumeSchema } from '@/shared/schemas/resume.schema'
import type { Resume } from '@/shared/types/resume.types'

const draftKey = (id: string) => `resume-studio:pending-draft:${id}`

/** A synchronous, tab-scoped fallback when navigation can interrupt IndexedDB. */
export function checkpointResumeDraft(resume: Resume): void {
  try {
    sessionStorage.setItem(draftKey(resume.id), JSON.stringify(resume))
  } catch {
    // Storage may be full or unavailable. The normal unsaved-change warning
    // still lets the user stay on the page and retry the IndexedDB save.
  }
}

export function clearResumeDraft(id: string): void {
  try {
    sessionStorage.removeItem(draftKey(id))
  } catch {
    // Recovery storage is best-effort and must not break the main save path.
  }
}

export function recoverResumeDraft(saved: Resume): Resume | undefined {
  try {
    const raw = sessionStorage.getItem(draftKey(saved.id))
    if (!raw) return undefined
    const parsed = resumeSchema.safeParse(JSON.parse(raw))
    if (parsed.success && parsed.data.id === saved.id
      && Number.isFinite(Date.parse(parsed.data.updatedAt))
      && Date.parse(parsed.data.updatedAt) >= Date.parse(saved.updatedAt)) {
      return parsed.data
    }
  } catch {
    // Ignore malformed checkpoints and unavailable browser storage.
  }
  clearResumeDraft(saved.id)
  return undefined
}
