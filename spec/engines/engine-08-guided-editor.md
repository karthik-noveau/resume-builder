# Engine 08 — Guided Editor

## Objective
A five-step wizard for users who do not want the full editor.

## Scope
`/editor/:resumeId/guided`.

## Dependencies
Engines 04, 06, 07.

## Files to Create
`src/features/editor/pages/GuidedEditorPage.tsx` + module CSS.

## Files to Modify
`src/app/router.tsx`.

## Implementation Steps
1. Steps: personal details, summary, experience, education, skills.
2. Stepper rail on desktop, horizontally scrolling stepper on mobile.
3. Card is a fixed-height frame: header pinned, fields scroll inside it.
4. Pin Back/Next to the bottom-right of the form column.
5. Live preview and profile strength in the right rail.

## Acceptance Criteria
- Every step edits the same store the full editor uses.
- "Finish" hands off to the full editor.
- Usable at 390px.

## Edge Cases
- Guided covers 5 of 7 section types. Projects, certifications and custom
  sections are seeded with sample content but are **not** reachable here — a
  user who never opens the full editor can export placeholder content they
  never wrote. Tracked in Engine 14.
- Keyboard shortcuts are not wired on this route even though the store records
  undo snapshots, so Ctrl+Z does nothing here.


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
Covered by `e2e/flows/create-resume.spec.ts` and `full-journey.spec.ts`.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
