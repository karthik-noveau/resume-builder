# Engine 11 — Icon Library and Per-Section Icons

## Objective
A shared icon library, and let users change any section icon a template draws.

## Scope
Glyph data, picker UI, per-section overrides, persistence.

## Dependencies
Engines 05, 06, 07.

## Files to Create
- `src/shared/components/IconPicker/IconPicker.tsx` + module CSS
- `src/features/templates/engine/icons.test.ts`

## Files to Modify
- `src/features/templates/engine/icons.ts` — 13 → 35 glyphs, groups, resolver
- `src/shared/types/layout.types.ts` — `IconName`
- `src/shared/types/resume.types.ts` — `Resume.sectionIcons`
- `src/shared/schemas/resume.schema.ts`
- `src/shared/stores/resume.store.ts` — `setSectionIcon`
- `src/shared/types/template.types.ts` — `TemplateDefinition.sectionIcons`
- Clarity and Onyx definitions + renderers
- `SectionProperties.tsx`

## Implementation Steps
1. Author every glyph as a single stroked path in a 24×24 viewBox so canvas and
   PDF can draw it from one source.
2. Group icons for the picker; exclude contact glyphs, which are bound to their
   field.
3. Store overrides keyed by section type, or `custom:<id>` so each custom
   section can differ.
4. Move each template's default icon map into its definition, so renderer and
   picker share one source of truth.
5. Show the picker only when the active template declares `sectionIcons`.

## Acceptance Criteria
- Choosing an icon updates the canvas immediately and persists.
- Reset returns to the template default.
- An unknown stored name never reaches a renderer.
- Templates without section icons show no picker.

## Edge Cases
- Overrides must be validated on read; a name from an older build must fall
  back rather than throw.
- Custom sections must not share one override.


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
`icons.test.ts` — 13 assertions covering path completeness, contact glyphs
never appearing in the picker, group uniqueness, override precedence, invalid
override fallback, per-custom-section scoping, and template defaults resolving.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] Tests pass
- [x] Status updated
