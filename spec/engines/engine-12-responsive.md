# Engine 12 — Responsive Pass

## Objective
Make every screen usable on mobile, tablet and desktop.

## Scope
Layout only; no new features.

## Dependencies
Engines 07, 08, 10.

## Files to Create
`src/features/editor/components/Toolbar/ExportButton.module.css`.

## Files to Modify
`Dashboard.module.css`, `Toolbar.module.css`, `Toolbar.tsx`,
`ExportButton.tsx`, `Canvas.tsx`.

## Implementation Steps
1. Stack the dashboard header below 640px.
2. Let the toolbar title shrink with an ellipsis instead of pushing Export off
   the edge; shorten the export label on phones; delay the "Guided Setup" label
   to 1024px.
3. Add a shrink-to-fit factor to the canvas, capped at 1, so an A4 page fits a
   390px viewport.

## Acceptance Criteria
- No horizontal overflow at 390 / 820 / 1440.
- Every primary action reachable at every width.
- Desktop rendering unchanged.

## Edge Cases
- `overflow-x: auto` on the toolbar hid the problem: the button scrolled off
  rather than spilling, so an overflow check alone missed it.
- Tablet is the tightest case — brand, autosave, zoom and nav are all visible
  at once, and a shrinkable title collapses to zero without a floor.


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
Playwright sweep across 390 / 820 / 1440 asserting no horizontal overflow, plus
toolbar measurements at 390 / 640 / 820 / 1024 / 1440.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
