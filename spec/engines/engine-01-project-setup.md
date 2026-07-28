# Engine 01 — Project Setup

## Objective
Stand up the Vite + React + TypeScript project with strict compiler settings,
linting, testing and the global style layer.

## Scope
Tooling and bootstrap only. No product features.

## Dependencies
None.

## Files to Create
- `package.json`, `vite.config.ts`, `vitest.config.ts`
- `tsconfig.json`, `tsconfig.node.json`
- `eslint.config.js`, `.prettierrc`, `postcss.config.js`
- `index.html`, `src/main.tsx`
- `src/styles/tokens.css`, `src/styles/global.css`
- `src/tests/setup/test.setup.ts`

## Files to Modify
None.

## Implementation Steps
1. Scaffold Vite React-TS project; pin React 19.
2. Enable `strict`, `noUnusedLocals`, `noUnusedParameters`,
   `noFallthroughCasesInSwitch`; add the `@/*` path alias.
3. Configure ESLint with `typescript-eslint` type-aware rules.
4. Configure Vitest with jsdom and `@testing-library/jest-dom`.
5. Define design tokens as CSS custom properties; add the global reset.

## Acceptance Criteria
- `pnpm dev` serves the app.
- `pnpm type-check` passes.
- `pnpm test` runs.
- Tokens resolve in both light and dark.

## Edge Cases
- Alias must resolve identically in Vite, Vitest and `tsc`.
- Dark mode is driven by `data-theme` plus inline vars set at runtime; tokens
  must not assume a media query.


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
- Smoke render of the root element.
- Token resolution assertion in `theme.store.test.ts`.

## Completion Checklist
- [x] Implementation complete
- [x] Acceptance criteria met
- [x] TypeScript passes
- [ ] Build passes — **blocked**, see Engine 13
- [x] Tests pass
- [x] Status updated
