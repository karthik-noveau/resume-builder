# Engine 07 — Full Editor

## Objective
The three-panel editing surface: section list, paginated canvas, properties
inspector.

## Scope
`/editor/:resumeId`.

## Dependencies
Engines 04, 05, 06.

## Files to Create
`src/features/editor/` — `pages/EditorPage.tsx`, `components/Canvas/*`,
`components/Sidebar/*`, `components/Toolbar/*`, `components/PropertiesPanel/*`,
`hooks/*`; `src/shared/components/layout/EditorLayout.tsx`.

## Files to Modify
`src/app/router.tsx`.

## Implementation Steps
1. Compose toolbar + sidebar + canvas + inspector in `EditorLayout`.
2. Below 1024px move both side panels into slide-over drawers.
3. Paint the layout tree; support section and entry selection, and
   double-click-to-edit on text nodes.
4. Wire undo/redo, zoom, autosave and keyboard shortcuts.

## Acceptance Criteria
- Editing any field repaints the canvas.
- Selection maps back to the correct résumé entry.
- Panels are reachable at every breakpoint.

## Edge Cases
- Click-to-edit must seed from the live résumé value, never the rendered text —
  templates uppercase names and substitute placeholders.
- `transform: scale()` does not change the layout box; the wrapper must carry
  the scaled size or the canvas scrolls when it should not.


## Validation Checklist

- [x] Folder structure matches `codebase-guide.md`
- [x] File naming follows the convention
- [x] Imports ordered; no unused imports
- [x] No cross-feature imports
- [x] Component boundaries respected
- [x] Styling via CSS Modules and tokens only
- [x] Accessibility: semantic markup, labels, keyboard, focus
- [x] Error handling: loading / empty / error / success
- [x] Documentation updated
- [x] Tests written and passing

## Test Cases
- `editRefResolver.test.ts`
- `AutosaveIndicator.test.tsx`

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
