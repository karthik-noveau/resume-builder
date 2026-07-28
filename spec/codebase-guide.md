# CODEBASE ARCHITECTURE

This document defines the mandatory architecture, coding standards, folder
structure, implementation boundaries and quality rules for the entire project.
The implementation must strictly follow this guide.

> **Adaptation note.** Two sections of the standard guide describe conventions
> this project does not use, and were adapted to the shipped codebase rather
> than the codebase being rewritten to them:
>
> - **Source structure** — `features/` + `shared/` instead of
>   `pages/` + `common/` + `store/`. The boundaries are equivalent in spirit
>   (self-contained slices, shared code hoisted, one store per domain); only
>   the directory names differ.
> - **Test runner** — Vitest instead of Jest. The API is Jest-compatible and
>   React Testing Library is unchanged.
>
> Everything else is unchanged and binding. Existing violations are listed
> under [Known Debt](#known-debt) — they are debt to be paid, **not** licence
> to relax the rule.

---

# Technology Stack

Framework : React
Language : TypeScript
Build Tool : Vite
State Management : Zustand
Routing : React Router
Styling : CSS Modules
Testing : Vitest + React Testing Library
Persistence : Browser Storage (IndexedDB via Dexie)
Backend : None
Data Source
  - IndexedDB
  - Local JSON
  - Static Assets
  - Zustand

---

# Source Structure

src/
  app/
    router.tsx
    providers.tsx
    AppShell.tsx
  assets/
    fonts/
    thumbnails/
  shared/
    components/
    db/
    hooks/
    schemas/
    services/
    stores/
      <domain>.store.ts
    types/
    utils/
  features/
    <feature-name>/
      pages/
      components/
      hooks/
      utils/
      constants.ts
      types.ts
      styles.module.css
  styles/
    tokens.css
    global.css
  main.tsx

---

# Folder Responsibilities

spec/
Source of truth.
Contains
  - Architecture
  - Engines
  - UI Prototype
  - Development rules
Never place application code here.

---

assets/
Contains
  - Images
  - Logos
  - Icons
  - Fonts
  - Static media

---

shared/
Contains reusable modules shared across multiple features.
Must never contain feature-specific logic.

---

shared/services/
Responsibilities
  - IndexedDB access
  - Local JSON
  - Image processing
  - Mock API abstraction
Components must never access the database directly.

---

shared/components/
Reusable UI only.
Examples
  - Button
  - Modal
  - Table
  - Card
  - Badge
  - Avatar
  - Spinner
Never create feature-specific components here.

---

shared/hooks/
Reusable hooks only.
Examples
  - useMediaQuery
  - useAutoGrowTextarea

---

shared/schemas/
Zod validators, one per domain.
Every value crossing the persistence boundary is validated.

---

shared/utils/
Shared helper functions.

---

shared/stores/
One Zustand store per domain.
Examples
  resume.store.ts
  editor.store.ts
  template.store.ts
  theme.store.ts
  settings.store.ts
Never combine unrelated domains.

---

features/
Every feature is completely self-contained.
Allowed
  features/editor/components/
  features/editor/hooks/
  features/editor/utils/
Forbidden
  features/editor importing
  features/export/components/
Cross-feature imports are not allowed.
Anything two features need moves to shared/.

---

styles/
Contains only global theme.
Examples
  tokens.css
  global.css

---

app/
Responsibilities
  - Bootstrap
  - Providers
  - Routing
Nothing else.

---

# Import Rules

Order
  1 React
  2 Third-party libraries
  3 Shared modules
  4 Store
  5 Feature modules
  6 Relative imports
  7 CSS Modules
Use absolute imports whenever possible.
Remove unused imports.

---

# Naming Convention

Folders
  kebab-case
Features
  kebab-case
Components
  PascalCase.tsx
Hooks
  useCamelCase.ts
Utilities
  camelCase.ts
Stores
  <domain>.store.ts
Types
  types.ts
Constants
  constants.ts
JSON
  kebab-case.json
Icons
  kebab-case.svg
CSS Modules
  <Name>.module.css

---

# TypeScript Rules

Strict Mode
  Enabled
Never use
  any
Prefer
  type instead of interface.
Exported functions require explicit return types.
Use readonly whenever appropriate.
Use exhaustive switch statements.
Avoid implicit typing where clarity improves maintainability.

---

# React Rules

Functional components only.
Hooks only.
No classes, except error boundaries where React requires one.
No HOCs unless required.
No render props unless justified.
Page components perform composition only.
Business logic belongs inside
  - hooks
  - stores
Avoid unnecessary re-renders.
Memoize expensive calculations.
Use React.lazy() for routes.

---

# Component Rules

Maximum
  200 lines/component
Maximum
  60 lines/function
One component/file
One responsibility/component
No prop drilling beyond two levels.
Use Zustand instead.

---

# Routing

React Router only.
Centralised route configuration.
Every route lazy-loaded.
Required
  - 404
  - Redirect handling
  - Nested routes (if applicable)

---

# Data Flow

Component → Hook → Store → Service → Dexie → IndexedDB
Components never access the database directly.

---

# Data Fetching

Frontend only.
No backend.
No REST.
No GraphQL.
No Axios.
Use the shared/services abstraction.
Support
  - Loading
  - Success
  - Empty
  - Error
Validate loaded data with Zod.

---

# Zustand Rules

One domain per file.
Derived values
  Computed
  Never stored.
Mutations only through actions.
No direct mutation.
Every mutating action pushes an undo snapshot where undo applies.
Reset state on unmount where necessary.

---

# Styling Rules

CSS Modules only.
Forbidden
  - Tailwind
  - Styled Components
  - Emotion
  - Inline styles for static styling
Colours
  Only from
    styles/tokens.css
Never hardcode colours.
Class names
  camelCase

Inline `style` is permitted only for values computed at runtime that cannot be
expressed as a class — canvas node positioning, transform scale, progress-bar
widths.

---

# Accessibility

Semantic HTML
Keyboard support
ARIA
Visible focus
Colour contrast
Labels
Screen reader friendly
Accessible navigation

---

# Performance

Lazy loading
Memoization
Avoid unnecessary renders
Avoid unnecessary state
Split large components
Code splitting
Optimised assets

---

# Error Handling

Never fail silently.
Every feature supports
  - Loading
  - Empty
  - Error
  - Success
Display meaningful user messages.
Provide validation messages and recovery options where applicable.

---

# Testing

Framework
  Vitest
  React Testing Library
  Playwright (end-to-end)

---

Unit Tests
  Co-located
Example
  Button.tsx
  Button.test.tsx

---

Hook Tests
  useExport.ts
  useExport.test.ts

---

Store Tests
  resume.store.ts
  resume.store.test.ts

---

Integration / End-to-End
  e2e/

---

Testing Rules
Every feature includes
  - Component tests
  - Hook tests
  - Store tests
Rendering and layout rules that can regress silently — pagination, contact
completeness, icon resolution — require an assertion that fails when the rule
is broken.
Tests must pass before engine completion.

---

# Documentation

Prefer self-documenting code.
Comment only complex business logic, non-obvious constraints, and decisions a
reader would otherwise undo.
Avoid redundant comments.

---

# Build Requirements

The project must
Pass
  - Build
  - TypeScript
  - ESLint
  - Vitest
Contain
  - Zero warnings
  - Zero dead code
  - Zero unused files
  - Zero unused imports

---

# Code Quality

Follow
  - DRY
  - KISS
  - SOLID
  - Single Responsibility Principle
Prefer
  - Composition
  - Early returns
Avoid
  - Deep nesting
  - Duplicate logic

---

# Forbidden

any
console.log
debugger
TODO
FIXME
Hardcoded colours
Magic numbers
Magic strings
Dead code
Circular imports
Cross-feature imports
Duplicate logic
Unused imports
Unused variables
Barrel exports (unless explicitly requested)
Framework-specific styling libraries

---

# Known Debt

None. Every violation previously recorded here was cleared by Engine 13:
the build was repaired, the emitted artefacts removed and ignored, the `any`
in `canvas.utils.ts` typed properly, `console.*` routed through `logger`, and
the unread `TemplateDefinition` / `exportRules` fields either deleted or given
a real consumer.

Add rows here the moment a violation is knowingly introduced, with the engine
that will clear it — an empty table is a claim, and it should stay true.

---

# Completion Criteria

The codebase is considered compliant only when
  - Folder structure matches this guide.
  - All naming rules are followed.
  - All boundaries are respected.
  - All tests pass.
  - Build passes.
  - TypeScript passes.
  - ESLint passes.
  - No forbidden practices remain.
  - Known Debt is empty.
