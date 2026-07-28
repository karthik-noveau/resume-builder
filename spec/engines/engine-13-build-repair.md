# Engine 13 — Build Configuration Repair

## Objective

Make `pnpm build` succeed, stop the TypeScript build emitting JavaScript into
the source tree, and clear the debt those artefacts created.

## Scope

Build configuration, `.gitignore`, and the small set of code-quality violations
recorded under Known Debt in `codebase-guide.md`. No feature work.

## Dependencies

Engine 01.

## Background

`pnpm build` runs `tsc -b && vite build` and fails immediately:

```
tsconfig.node.json(9,35): error TS5096: Option 'allowImportingTsExtensions' can
only be used when either 'noEmit' or 'emitDeclarationOnly' is set.
tsconfig.json(11,35): error TS5096: ...
```

`pnpm type-check` passes because `--noEmit` is supplied on the command line;
the config itself never sets it. Two consequences:

1. The production build is broken.
2. Because emit is not disabled, `tsc -b` **writes compiled output next to every
   source file** — roughly 180 `.js`/`.d.ts` files inside `src/`, plus
   `vite.config.d.ts`, `vitest.config.d.ts` and `playwright.config.js` at the
   root.

This is not cosmetic. Vite's default `resolve.extensions` places `.js` ahead of
`.tsx`, so those artefacts **shadow the real modules**. Observed directly: after
deleting them, the dev server reported

```
Failed to load url /src/shared/stores/resume.store.js ... in AppearancePanel.tsx
```

confirming the running app had been importing compiled output rather than
source. They also account for 25 of the 28 current ESLint errors, and
`playwright.config.js` is committed alongside `playwright.config.ts`, so
Playwright sees two configs.

## Files to Create

- None.

## Files to Modify

- `tsconfig.json` — add `"noEmit": true`
- `tsconfig.node.json` — add `"emitDeclarationOnly": true` (it is `composite`,
  so it must emit *something*; declarations only is the correct choice)
- `.gitignore` — ignore emitted artefacts
- `eslint.config.js` — declare browser globals for `.visual-audit.mjs` and
  `docs/mockups/mockups.js`, or exclude them
- `src/features/editor/components/Canvas/canvas.utils.ts` — remove the `any`
- `src/main.tsx`, `src/features/export/services/image.embedder.ts`,
  `font.embedder.ts` — route through `logger`
- `src/shared/types/template.types.ts` — remove the unread definition fields
- `src/features/export/services/pdf.generator.ts` — honour or remove the unread
  `exportRules` flags

## Files to Delete

- All `*.js` / `*.d.ts` under `src/` and `e2e/` (untracked build output)
- `vite.config.d.ts`, `vitest.config.d.ts`, `playwright.config.js` (tracked —
  remove from the index)

## Implementation Steps

1. Set `noEmit` in `tsconfig.json` and `emitDeclarationOnly` in
   `tsconfig.node.json`.
2. Delete every emitted artefact. Verify first that each has a `.ts`/`.tsx`
   sibling and that none is tracked, so nothing real is lost.
3. Add to `.gitignore`:
   ```
   src/**/*.js
   src/**/*.d.ts
   e2e/**/*.js
   *.config.d.ts
   playwright.config.js
   ```
4. `git rm --cached` the three committed artefacts.
5. Run `pnpm build`; confirm it succeeds and writes only to `dist/`.
6. Confirm `src/` is still clean afterwards — a passing build that re-pollutes
   the tree has not fixed the problem.
7. Fix the three genuine lint errors in `canvas.utils.ts` by typing `fontStyle`
   properly.
8. Replace `console.*` with `logger`.
9. Either implement `embedFonts` / `includeHyperlinks` / `includeProfileImage`
   in the export path, or delete them from `ExportRules`. Same decision for
   `typography`, `spacing`, `pageLayout` and `sections` on `TemplateDefinition`.
   Do not leave them declared and unread.

## Acceptance Criteria

- `pnpm build` exits 0 with no warnings.
- After a build, `find src e2e -name '*.js' -o -name '*.d.ts'` returns nothing.
- `pnpm lint` reports **0** errors.
- `pnpm type-check` passes.
- `pnpm test` passes.
- Only one Playwright config remains.
- Known Debt in `codebase-guide.md` is empty.

## Edge Cases

- `tsconfig.node.json` sets `composite: true`, which forbids plain `noEmit`.
  Use `emitDeclarationOnly`.
- Deleting shadowing artefacts invalidates Vite's resolution cache; clear
  `node_modules/.vite` and restart the dev server or imports will still fail.
- Do not blanket-ignore `*.js` — `postcss.config.js` and `eslint.config.js` are
  real source.
- Removing `TemplateDefinition` fields touches all four definition files.

## Validation Checklist

- [ ] Folder structure matches `codebase-guide.md`
- [ ] File naming follows the convention
- [ ] Imports ordered; no unused imports
- [ ] No cross-feature imports
- [ ] Component boundaries respected
- [ ] Styling via CSS Modules and tokens only
- [ ] Accessibility unaffected
- [ ] Error handling unaffected
- [ ] Documentation updated (`architecture.md` open defect, guide Known Debt)
- [ ] Tests written and passing

## Test Cases

1. `pnpm build` succeeds from a clean tree.
2. After building, no artefacts exist under `src/` or `e2e/`.
3. `pnpm lint` reports zero errors.
4. Dev server starts and resolves `.tsx` sources, not `.js`.
5. Existing suite still passes — this engine must not change behaviour.
6. PDF export still produces a valid document after the `exportRules` decision.

## Completion Checklist

- [ ] Implementation complete
- [ ] Acceptance criteria met
- [ ] Build passes
- [ ] TypeScript passes
- [ ] ESLint passes with zero errors
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] `engine-status.md` marked Complete
- [ ] User approval received
