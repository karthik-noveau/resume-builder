# Engine 09 — PDF Export

## Objective
Turn a `LayoutTree` into a print-accurate PDF entirely in the browser.

## Scope
PDF generation, font and image embedding, link annotations, export UI.

## Dependencies
Engines 05, 06.

## Files to Create
`src/features/export/services/{pdf.generator,font.embedder,image.embedder,link.handler,export.service}.ts`,
`components/ExportModal/*`, `hooks/useExport.ts`.

## Files to Modify
`src/features/editor/components/Toolbar/ExportButton.tsx`.

## Implementation Steps
1. Walk the tree; switch on node type.
2. Embed subsetted fonts with fontkit; wrap text manually to match the
   estimator used at layout time.
3. Draw rects, ellipses (circular badges), icon paths and images; fake the
   circular photo crop with a masking path.
4. Stream the result to a download.

## Acceptance Criteria
- Exported PDF matches the on-screen canvas.
- Fonts embed; text is selectable.
- Works offline.

## Edge Cases
- Any node type drawn on canvas must have a matching case here, or its content
  silently disappears from the export.
- `drawEllipse` takes a centre point; `drawRectangle` takes a corner.


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
- `pdf.generator.test.ts`, `export.service.test.ts`, `useExport.test.ts`
- `e2e/flows/resume-lifecycle.spec.ts` — "Flow 3: Export PDF"

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
