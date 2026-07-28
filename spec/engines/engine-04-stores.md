# Engine 04 — Zustand Stores

## Objective
Own application state, with mutation as the only path to change.

## Scope
`resume`, `editor`, `template`, `theme`, `settings` stores.

## Dependencies
Engines 02, 03.

## Files to Create
`src/shared/stores/*.store.ts`

## Files to Modify
None.

## Implementation Steps
1. One store per domain; no shared state between them.
2. Every mutating action pushes an undo snapshot before changing state.
3. Keep derived values computed, never stored.
4. Persist theme and settings; keep editor state ephemeral.

## Acceptance Criteria
- Undo and redo restore exactly the prior state.
- No action mutates state in place.
- Derived values are never persisted.

## Edge Cases
- Undo must capture the snapshot *before* the mutation.
- Redo must receive the current snapshot so the stacks stay symmetric.


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
- `resume.store.test.ts`, `editor.store.test.ts`, `template.store.test.ts`,
  `theme.store.test.ts`.
- Undo/redo round-trip.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
