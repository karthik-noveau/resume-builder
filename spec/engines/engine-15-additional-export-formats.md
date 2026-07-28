# Engine 15 — DOCX and Plain-Text Export

## Objective

Add the two export formats specified in `reference/doc-7.md` but never built.

## Scope

DOCX and plain-text export, plus the format-selection UI. PDF is unchanged.

## Dependencies

Engines 05, 06, 09.

## Background

`reference/doc-7.md` describes three export formats. `ExportService` exposes
only `exportToPdf`. Plain text matters most for ATS: the gallery advertises an
"ATS Score" per template, yet the only output is a laid-out PDF, which is the
format ATS parsers handle worst.

## Files to Create

- `src/features/export/services/docx.generator.ts`
- `src/features/export/services/text.generator.ts`
- `src/features/export/components/ExportModal/FormatSelect.tsx`

## Files to Modify

- `src/features/export/services/export.service.ts`
- `src/features/export/hooks/useExport.ts`
- `src/features/export/components/ExportModal/ExportModal.tsx`
- `src/shared/types/export.types.ts`

## Implementation Steps

1. Add an `ExportFormat` union and take it as a parameter rather than adding
   parallel methods.
2. **Plain text** — generate from the `Resume`, not the `LayoutTree`. The tree
   is positioned output; a parser wants reading order. Emit section headings,
   one entry per block, bullets as `- `, no columns, no decoration.
3. **DOCX** — also from the `Resume`, using real Word paragraph and run styles
   so the document stays reflowable and parseable. Do not attempt to reproduce
   the visual template; a DOCX that mimics a two-column layout defeats the
   point.
4. Extend the export modal with a format choice, keeping PDF the default.
5. Preserve section order and visibility flags in every format.

## Acceptance Criteria

- All three formats export and open in their native applications.
- Plain text contains every visible section in reading order.
- DOCX opens in Word and Google Docs with styles intact.
- Hidden sections are excluded from all formats.
- Export still works fully offline.

## Edge Cases

- Two-column templates have no meaningful reading order in a linear format;
  define one explicitly (main column, then sidebar) rather than relying on node
  order.
- Custom section titles are user text and may contain characters needing
  escaping in DOCX XML.
- An empty résumé must still produce a valid file, not a zero-byte download.
- Filenames come from user-supplied titles; sanitise for the filesystem.

## Validation Checklist

- [ ] Folder structure matches `codebase-guide.md`
- [ ] File naming follows the convention
- [ ] Imports ordered; no unused imports
- [ ] No cross-feature imports
- [ ] Component boundaries respected
- [ ] Styling via CSS Modules and tokens only
- [ ] Accessibility: format control labelled and keyboard reachable
- [ ] Error handling: failure per format surfaces a message and stays recoverable
- [ ] Documentation updated (`architecture.md` drift table)
- [ ] Tests written and passing

## Test Cases

1. Each format produces a non-empty file with the right MIME type.
2. Plain text contains every visible section heading and entry.
3. Hidden sections appear in no format.
4. DOCX is valid OOXML and opens without repair.
5. Two-column templates linearise in the defined order.
6. Titles containing `/`, `:` and quotes produce safe filenames.
7. An empty résumé exports without throwing.

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
