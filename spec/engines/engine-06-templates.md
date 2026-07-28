# Engine 06 — Résumé Templates

## Objective
Ship the selectable résumé designs.

## Scope
Four templates: Foundation, Onyx, Clarity, Monogram. Three of the seven
originally specified remain — see Engine 14.

## Dependencies
Engine 05.

## Files to Create
`src/features/templates/definitions/<id>/<id>.definition.ts` and
`<id>.renderer.ts` for each template; `registry/template.registry.ts`.

## Files to Modify
None.

## Implementation Steps
1. Definition carries metadata and defaults; renderer builds the layout.
2. Templates keep their own palette but take the accent from the active theme
   so theme switching is visible.
3. Sidebar templates render the sidebar column first and stamp the panel onto
   every page.
4. Every template renders every section type, so switching never drops content.

## Acceptance Criteria
- All four render every section type.
- Every template shows email, phone and location.
- Links print without a scheme prefix.
- Multi-page résumés keep the sidebar readable.

## Edge Cases
- A long name or section title in a narrow column wraps; heights must be
  measured, not assumed to be one line, or text collides.
- Accent colours from the theme are mid-tone and vanish on dark panels; lighten
  before drawing on them.


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
- `contact.coverage.test.ts` — contact completeness and scheme-free links.
- `sidebar.pagination.test.ts` — multi-page sidebar integrity.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
