# Engine 10 — Dashboard, Template Gallery, Settings

## Objective
The screens surrounding the editor.

## Scope
`/`, `/app`, `/templates`, `/settings`, 404.

## Dependencies
Engines 03, 04, 06.

## Files to Create
`src/features/marketing/*`, `src/features/resume/pages/Dashboard.tsx`,
`src/features/resume/components/*`, `src/features/templates/pages/TemplateGallery.tsx`,
`src/features/settings/pages/Settings.tsx`, `src/shared/pages/NotFound.tsx`.

## Files to Modify
`src/app/router.tsx`.

## Implementation Steps
1. Dashboard: cards with live previews, search, sort, empty state, import.
2. Gallery: category filters, search, previews, ATS badges, colour swatches;
   `?create=true` switches to create mode with its own header and CTA.
3. Settings: defaults applied to newly created *and* imported résumés.

## Acceptance Criteria
- Every route reachable from the nav.
- Dashboard handles empty, populated and error states.
- Settings defaults apply on create and import alike.

## Edge Cases
- Template previews render real layout trees, so the gallery depends on the
  render engine being correct for every template.
- The gallery is the only screen with two modes; the create-mode header carries
  the sole route back to the dashboard.


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
- `Dashboard.test.tsx`, `ResumeCard.test.tsx`, `resumeParser.test.ts`
- `e2e/flows/management.spec.ts`, `customization.spec.ts`

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
