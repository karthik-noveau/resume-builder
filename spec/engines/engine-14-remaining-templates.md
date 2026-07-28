# Engine 14 — Remaining Templates and Guided Coverage

## Objective

Bring the template count to the specified seven, and close the gap where the
guided editor seeds content it cannot edit.

## Scope

Three new templates, plus guided-editor coverage for the section types it
currently omits.

## Dependencies

Engines 05, 06, 08, 11.

## Background

`reference/doc-10.md` phase 6 specifies seven templates; four exist. Separately,
`createEmptyResume` seeds **seven** sections with realistic sample content —
including *"Certified Scrum Product Owner — Scrum Alliance"* and
*"Languages: English (Native), Spanish"* — while the guided editor exposes only
five. A user who completes the wizard and exports without opening the full
editor ships a résumé containing credentials they never entered, and profile
strength reads 100% because completeness scores only the five guided steps.

## Files to Create

- `src/features/templates/definitions/<id>/<id>.definition.ts` ×3
- `src/features/templates/definitions/<id>/<id>.renderer.ts` ×3

## Files to Modify

- `src/features/templates/registry/template.registry.ts`
- `src/features/editor/pages/GuidedEditorPage.tsx`
- `src/features/resume/utils/resumeCompleteness.ts`
- `spec/ui-prototypes/pages/templates.html`

## Implementation Steps

1. Choose three designs that differ structurally from the existing four, not
   just chromatically — the library currently has three sidebar layouts and one
   single-column.
2. For each: definition first (metadata, `sectionIcons`, `exportRules`), then
   renderer.
3. Every renderer must handle **all seven** section types, so switching
   templates never drops content.
4. Sidebar templates: render the sidebar column first; stamp panels onto every
   page via `allPages`. Both rules are enforced by `sidebar.pagination.test.ts`.
5. Add guided steps for projects, certifications and custom sections — or, if
   the wizard is meant to stay at five steps, stop seeding those sections with
   sample content so nothing unreachable is ever exported.
6. Update `resumeCompleteness` to match whichever scope is chosen.
7. Update the prototype's template gallery to show seven.

## Acceptance Criteria

- Seven templates in the gallery, each with a working preview.
- Every template renders all seven section types.
- Every template passes `contact.coverage.test.ts` and
  `sidebar.pagination.test.ts` without modifying those tests.
- No section is seeded with sample content that the guided editor cannot reach.
- Profile strength reflects the sections a guided user can actually complete.

## Edge Cases

- Section-header titles wrap in narrow columns; measure heights rather than
  assuming one line, or text collides with the entry below.
- Theme accent colours are mid-tone and disappear on dark panels — lighten
  before drawing on them.
- A new template id is persisted on every résumé that uses it and cannot later
  be renamed without breaking those résumés; export throws on an unknown id.
- Adding guided steps changes the wizard's length; the stepper must stay usable
  at 390px.

## Validation Checklist

- [ ] Folder structure matches `codebase-guide.md`
- [ ] File naming follows the convention
- [ ] Imports ordered; no unused imports
- [ ] No cross-template imports
- [ ] Component boundaries respected
- [ ] Styling via CSS Modules and tokens only
- [ ] Accessibility: preview buttons labelled, keyboard reachable
- [ ] Error handling: unknown template id falls back
- [ ] Documentation updated (`architecture.md` drift table)
- [ ] Tests written and passing

## Test Cases

1. Each new template renders all seven section types.
2. Each passes contact coverage and sidebar pagination.
3. Switching between all seven preserves every section's content.
4. Gallery shows seven with working previews and correct category filters.
5. A guided-only résumé contains no section the wizard cannot edit.
6. Profile strength reaches 100% only when every reachable section is filled.

## Completion Checklist

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Build passes
- [ ] TypeScript passes
- [ ] ESLint passes
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] `engine-status.md` marked Complete
- [ ] User approval received
