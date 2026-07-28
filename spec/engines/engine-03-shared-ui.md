# Engine 03 — Shared UI Components

## Objective
Build the reusable component library every feature composes from.

## Scope
Presentational primitives only.

## Dependencies
Engine 01.

## Files to Create
`src/shared/components/ui/` — Button, Input, Textarea, Select, Checkbox, Card,
Badge, Modal, Drawer, ConfirmDialog, Divider, EmptyState, Skeleton, Spinner,
StringListField, Tooltip; plus layout shells and error boundaries.

## Files to Modify
None.

## Implementation Steps
1. One component per file, typed props in a sibling `.types.ts`.
2. Style with CSS Modules against tokens; no hardcoded colour.
3. Wrap antd primitives where they earn their weight (Select, Checkbox);
   normalise the API so callers never see antd.
4. Give every interactive element a label, focus ring and keyboard path.

## Acceptance Criteria
- Every component renders in light and dark.
- Every component is keyboard reachable.
- No component imports feature code.

## Edge Cases
- antd-backed components must go through `Controller` when used with
  react-hook-form; `register()` does not bind them.


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
Co-located tests for Button, Input, Textarea, Select, Checkbox, Card, Modal,
Drawer, ConfirmDialog.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
