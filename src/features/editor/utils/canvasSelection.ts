import type { EditRef } from '@/shared/types/layout.types'
import { useEditorStore } from '@/shared/stores/editor.store'

/** Select the matching content without changing the user's Content/Design tab.
 * Inline editing uses the same destination but keeps focus on the page. */
export function selectCanvasContent(ref: EditRef, focusField = true) {
  const editor = useEditorStore.getState()
  switch (ref.kind) {
    case 'personal-info':
      editor.openPersonalInfo(focusField ? ref.field : undefined)
      return
    case 'section-title':
      if (ref.sectionType === 'contact') {
        editor.openPersonalInfo(focusField ? 'contactTitle' : undefined)
        return
      }
      editor.selectSection(ref.sectionType, ref.sectionType)
      break
    case 'summary':
      editor.selectSection('summary', 'summary')
      break
    case 'custom-section-title':
      editor.selectEntry(ref.sectionId, 'custom')
      break
    case 'entry':
    case 'entry-field':
    case 'entry-list-item':
      editor.selectEntry(ref.entryId, ref.sectionType)
      break
  }
  if (focusField) editor.requestContentFocus(ref)
}
