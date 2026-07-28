# Engine 02 — Data Layer

## Objective
Define the résumé domain model, its Zod validators, and the IndexedDB schema.

## Scope
Types, schemas, Dexie, factories. No UI.

## Dependencies
Engine 01.

## Files to Create
- `src/shared/types/*.types.ts`
- `src/shared/schemas/*.schema.ts`
- `src/shared/db/database.ts`, `src/shared/db/migrations/v1.migration.ts`
- `src/shared/services/storage.service.ts`
- `src/features/resume/utils/resume.factory.ts`, `section.factory.ts`

## Files to Modify
None.

## Implementation Steps
1. Model `Resume` as the aggregate root with stable ids on every entry.
2. Write one Zod schema per domain; compose into `resumeSchema`.
3. Define Dexie stores: `resumes`, `images` (indexed by `resumeId`),
   `settings`, `templates`.
4. Wrap all Dexie access in `storage.service`; validate on read and write.
5. Seed a realistic sample résumé in the factory.

## Acceptance Criteria
- A résumé round-trips through IndexedDB unchanged.
- Invalid data is rejected before it can be written.
- Deleting a résumé cascades to its images.

## Edge Cases
- Entry ids must survive duplication so undo and canvas selection keep working.
- Images are owned by `resumeId`; anything copying a résumé must copy the asset
  too, or the copy breaks when the original is deleted.


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
- `resume.service.test.ts` — create, update, duplicate, delete.
- Schema rejects malformed résumés.
- Delete cascades images.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
