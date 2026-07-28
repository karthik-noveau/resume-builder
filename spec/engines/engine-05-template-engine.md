# Engine 05 — Template Engine

## Objective
Turn a résumé into a paginated `LayoutTree` that both the screen canvas and the
PDF generator can render identically.

## Scope
Layout builder, shared section renderers, text measurement, icon glyphs,
renderer registry.

## Dependencies
Engine 02.

## Files to Create
- `src/features/templates/engine/layout.builder.ts`
- `src/features/templates/engine/section.renderers.ts`
- `src/features/templates/engine/layout.utils.ts`
- `src/features/templates/engine/icons.ts`
- `src/features/templates/engine/template.renderer.ts`

## Files to Modify
None.

## Implementation Steps
1. `LayoutBuilder` owns pages, the Y cursor, and page breaks.
2. `placeEntryBlock` lays out a section and paginates it, re-emitting a
   "(continued)" header when it spills.
3. Estimate text height from character width; err wide, because underestimating
   overlaps text while overestimating only adds whitespace.
4. Register renderers by template id; fall back to a generic single-column
   renderer for an unknown id.

## Acceptance Criteria
- The same tree drives canvas and PDF.
- Sections paginate without clipping.
- An unregistered template still renders.

## Edge Cases
- **`currentPage` is always the last page** and cannot be rewound. A two-column
  template must render its shorter column first, or that column lands entirely
  on the final page.
- Full-bleed panels must be stamped onto every page via `allPages`, not just
  the first.


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
- `template.renderer.test.ts` — tree shape, fallback path.
- `sidebar.pagination.test.ts` — panel on every page, no stranded light text.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
