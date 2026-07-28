# Document 2

# Technical Architecture Specification (TAS)

## 1. Purpose

This document defines the complete technical architecture of the Resume Studio application.

The architecture defined here is mandatory.

Implementation agents must not substitute alternative frameworks, libraries, patterns, or technologies unless explicitly approved.

---

# 2. Technology Stack

## Frontend

```text
Framework:
React 19

Language:
TypeScript 5.x

Build Tool:
Vite

Package Manager:
pnpm

Runtime:
Browser Only
```

---

## UI

```text
Styling:
TailwindCSS

Class Management:
clsx

Icons:
Lucide React

Animations:
Framer Motion
```

---

## Routing

```text
React Router v7
```

Client-side routing only.

No SSR.

No server-side rendering.

---

## Toast Notifications

```text
Sonner
```

Replaces any custom toast implementation.

No react-hot-toast.

No custom toast state in Zustand.

---

## State Management

```text
Global State:
Zustand

Server State:
None

Local Component State:
React Hooks
```

No Redux.

No MobX.

No Context API for global state.

---

## Forms

```text
React Hook Form

Validation:
Zod
```

---

## Storage

```text
Database:
IndexedDB

Wrapper:
Dexie
```

No LocalStorage for resume data.

LocalStorage allowed only for:

```text
Theme
UI Preferences
Last Opened Resume
```

---

## Drag and Drop

```text
dnd-kit
```

No react-beautiful-dnd.

---

## PDF Export

```text
pdf-lib
```

Must work fully offline.

---

## Testing

```text
Unit:
Vitest

Component:
React Testing Library

E2E:
Playwright
```

---

# 3. Application Architecture

Architecture Style:

```text
Feature Based Architecture
```

Must not use:

```text
MVC
Clean Architecture
Hexagonal Architecture
Micro Frontends
```

For V1 they create unnecessary complexity.

---

# 4. Folder Structure

```text
src/

app/

assets/

components/

features/

editor/

resume/

templates/

export/

storage/

settings/

shared/

hooks/

services/

stores/

types/

utils/

styles/

tests/
```

---

## Feature Structure

Example:

```text
features/

resume/

components/

hooks/

services/

types/

utils/

store/
```

Every feature follows same structure.

---

# 5. Routing Structure

```text
/

Dashboard

/editor/:resumeId

Template Editor

/templates

Template Gallery

/settings

Application Settings

/not-found
```

---

## 5a. React Router v7 — API Choice

Use `createBrowserRouter` (data router API).

```typescript
// src/app/router.tsx
import { createBrowserRouter, RouterProvider } from 'react-router'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RootErrorBoundary />,
    children: [
      { index: true, lazy: () => import('../features/resume/pages/Dashboard') },
      { path: 'editor/:resumeId', lazy: () => import('../features/editor/pages/EditorPage') },
      { path: 'templates', lazy: () => import('../features/templates/pages/TemplateGallery') },
      { path: 'settings', lazy: () => import('../features/settings/pages/Settings') },
      { path: '*', lazy: () => import('../shared/pages/NotFound') },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
```

Rules:

```text
All routes use lazy() for code splitting

No useNavigate() outside of event handlers

Redirect to / when resumeId does not exist in IndexedDB

errorElement on root route catches unhandled errors
```

---

## 5b. Error Boundary Strategy

Three boundaries, three levels:

```text
Level 1 — Root (catches everything)
  Component: RootErrorBoundary
  Location: src/shared/components/errors/RootErrorBoundary.tsx
  Renders: full-page error screen with "Reload App" button
  Mounted: as errorElement on the root route

Level 2 — Editor (catches canvas/render crashes)
  Component: EditorErrorBoundary
  Location: src/features/editor/components/EditorErrorBoundary.tsx
  Renders: error panel with "Return to Dashboard" button
  Keeps: resume data — never clears store on error
  Mounted: wrapping <Canvas> inside EditorPage

Level 3 — Section (catches per-section render failures)
  Component: SectionErrorBoundary
  Location: src/features/editor/components/SectionErrorBoundary.tsx
  Renders: grey placeholder for the broken section
  Allows: rest of resume to remain visible
  Mounted: wrapping each section node in CanvasRenderer
```

---

## 5c. Vite Configuration

Required settings in `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router'],
          editor: ['@dnd-kit/core', '@dnd-kit/sortable', 'framer-motion'],
          pdfLib: ['pdf-lib'],
          storage: ['dexie'],
        },
      },
    },
  },
})
```

Required settings in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

All imports across the codebase must use `@/` prefix — never relative `../../` paths beyond one level.

---

## 5d. Vitest Configuration

Required `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup/test.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
      exclude: [
        'src/tests/**',
        'src/**/*.types.ts',
        'src/**/*.d.ts',
        'e2e/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

---

# 6. State Management Architecture

## Global Store Structure

```typescript
RootStore;

resumeStore;

editorStore;

templateStore;

themeStore;

settingsStore;
```

---

## resumeStore

```typescript
activeResume;

resumeList;

createResume();

updateResume();

deleteResume();

duplicateResume();
```

---

## editorStore

```typescript
selectedSection;

selectedElement;

zoomLevel;

activePage;

undoStack;

redoStack;
```

---

## templateStore

```typescript
activeTemplate;

availableTemplates;

switchTemplate();
```

---

## themeStore

```typescript
activeTheme;

fontPreset;

switchTheme();

switchFont();
```

---

# 7. Data Flow

Single Direction Only

```text
UI

↓

Store

↓

Services

↓

IndexedDB

↓

Store

↓

UI
```

No circular data flow.

---

# 8. Service Layer

Every business operation goes through services.

Example:

```text
ResumeService

TemplateService

ExportService

StorageService
```

UI must never directly access IndexedDB.

---

# 9. Storage Architecture

## IndexedDB Tables

```text
resumes

templates

settings

images
```

---

## Resume Storage

```text
Primary Key

resumeId
```

Every resume stored independently.

---

# 10. Autosave Architecture

Save Trigger:

```text
Every State Change
```

Debounce:

```text
1000ms
```

Flow:

```text
Edit

↓

Store Update

↓

Debounce

↓

IndexedDB Save
```

---

# 11. Undo / Redo Architecture

Storage:

```text
Memory Only
```

Not persisted.

---

## Maximum Stack

```text
100 actions
```

---

# 12. Template Engine Architecture

Templates are:

```text
Presentation Layer Only
```

Templates never store resume data.

Templates never mutate resume data.

---

Flow:

```text
Resume Data

+

Template

=

Rendered Resume
```

---

# 13. Component Architecture

Every component must be:

```text
Pure

Reusable

Typed

Testable
```

---

Required Structure:

```typescript
Component;

Props;

Events;

Styles;

Tests;
```

---

# 14. Error Handling

All errors categorized as:

```text
Validation Error

Storage Error

Export Error

Application Error
```

---

Error UI Required:

```text
Toast

Inline Error

Recovery Action
```

---

# 15. Logging

Development:

```text
console allowed
```

Production:

```text
No console.log
```

---

Use:

```text
Logger Service
```

Logger Service interface:

```typescript
interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, error?: unknown, context?: Record<string, unknown>): void
}
```

Implementation rules:

```text
In development: delegates to console

In production: silently no-ops (no external logging service in V1)

Never import console directly outside of the Logger implementation file

Location: src/shared/services/logger.ts
```

---

# 16. Performance Targets

Initial Load

```text
< 2 seconds
```

Template Switch

```text
< 300ms
```

Autosave

```text
< 1 second
```

PDF Export

```text
< 3 seconds
```

Canvas Interaction

```text
60 FPS
```

---

# 17. Accessibility Architecture

Must support:

```text
Keyboard Navigation

Screen Readers

Focus Management

ARIA Labels

WCAG AA
```

---

# 18. Security Architecture

Rules:

```text
No remote storage

No analytics

No tracking

No user accounts

No external data transmission
```

Everything remains local.

---

# 19. Build Requirements

Build must pass:

```text
TypeScript

ESLint

Prettier

Vitest

Playwright
```

before release.

---

# 20. Dependency Rules

Allowed:

```text
React
React Router v7
Zustand
Dexie
Tailwind
pdf-lib
dnd-kit
Zod
React Hook Form
Framer Motion
Sonner
```

Any new dependency requires approval.

---

# 21. Coding Standards

```text
Strict TypeScript

No any

No ts-ignore

No dead code

No duplicate code

No TODO comments

No placeholder implementations

No mock production code
```

---

# 22. AI Implementation Constraints

AI agents must:

```text
Generate complete implementations.

Generate tests.

Generate typings.

Generate accessibility support.

Generate error handling.

Generate loading states.

Generate empty states.
```

AI agents must not:

```text
Leave incomplete features.

Create fake APIs.

Use temporary solutions.

Skip tests.

Skip validation.
```
