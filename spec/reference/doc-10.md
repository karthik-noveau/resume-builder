# Document 10

# Execution Plan Specification (XPS)

This document defines the exact order of implementation for the Resume Studio application.

Each phase has:

```text
Goal

Entry Criteria

Files To Create

Acceptance Criteria (Phase Complete When...)
```

An AI agent must complete every item in a phase before starting the next phase.

A phase is NOT complete if any file is a stub, placeholder, or contains TODO comments.

---

# Overview

```text
Phase 1 → Project Setup & Infrastructure

Phase 2 → Data Layer (Types, Schema, Storage)

Phase 3 → Shared UI Components

Phase 4 → Zustand Stores

Phase 5 → Resume Editor (Canvas + Sidebar + Toolbar)

Phase 6 → Template Engine + All 7 Templates

Phase 7 → PDF Export Engine

Phase 8 → Testing

Phase 9 → Release Hardening
```

---

# Phase 1 — Project Setup & Infrastructure

## Goal

Scaffold the application shell. Every subsequent phase builds on this.

## Entry Criteria

```text
pnpm available

Node 20+ available

Git initialized
```

## Files To Create

```text
package.json
vite.config.ts
tsconfig.json
tsconfig.node.json
tailwind.config.ts
postcss.config.js
.eslintrc.cjs
.prettierrc
index.html

src/main.tsx
src/App.tsx

src/app/router.tsx
src/app/providers.tsx

src/styles/globals.css
src/styles/tokens.css

src/shared/services/logger.ts

public/fonts/
  Inter-Regular.ttf
  Inter-Medium.ttf
  Inter-SemiBold.ttf
  Inter-Bold.ttf
  SourceSerifPro-Regular.ttf
  SourceSerifPro-SemiBold.ttf
  SourceSerifPro-Bold.ttf
  Manrope-Regular.ttf
  Manrope-SemiBold.ttf
  Manrope-Bold.ttf
  IBMPlexSans-Regular.ttf
  IBMPlexSans-Medium.ttf
  IBMPlexSans-SemiBold.ttf
```

## Key Implementation Rules

```text
TypeScript strict: true in tsconfig.json

TailwindCSS configured with design token colors from DSS

CSS variables defined in tokens.css for:
  --color-primary
  --color-primary-hover
  --color-background
  --color-surface
  --color-surface-elevated
  --color-text-primary
  --color-text-secondary
  --color-text-muted
  --color-success
  --color-warning
  --color-error

React Router v7 configured in router.tsx with routes:
  /               → Dashboard (lazy)
  /editor/:resumeId → Editor (lazy)
  /templates      → TemplateGallery (lazy)
  /settings       → Settings (lazy)
  *               → NotFound

Sonner <Toaster /> mounted in providers.tsx

Logger service implemented (console in dev, no-op in prod)

FontRegistry service stubbed (initialized in Phase 7)
```

## Phase Complete When

```text
pnpm dev starts without errors

Routes render placeholder pages without crashing

TypeScript check passes: pnpm tsc --noEmit

ESLint passes: pnpm lint

No any types in any file

Design tokens are accessible as Tailwind classes
```

---

# Phase 2 — Data Layer

## Goal

Implement all TypeScript types, Zod schemas, IndexedDB database, and services. This is the single source of truth. All other phases depend on it.

## Entry Criteria

```text
Phase 1 complete
```

## Files To Create

```text
src/shared/types/
  resume.types.ts
  template.types.ts
  theme.types.ts
  editor.types.ts
  storage.types.ts
  layout.types.ts
  export.types.ts
  font.types.ts

src/shared/schemas/
  resume.schema.ts
  personalInfo.schema.ts
  experience.schema.ts
  education.schema.ts
  skills.schema.ts
  projects.schema.ts
  certifications.schema.ts
  settings.schema.ts

src/shared/db/
  database.ts
  migrations/
    v1.migration.ts

src/shared/services/
  storage.service.ts
  resume.service.ts
  image.service.ts
  font.registry.ts

src/features/resume/utils/
  resume.factory.ts
  section.factory.ts
```

## Key Implementation Rules

### Types (resume.types.ts)

Must include every type from RDSS doc-3:

```text
Resume
PersonalInfo
SummarySection
ExperienceSection
EducationSection
SkillSection
Skill
ProjectSection
CertificationSection
GenericListItem
CustomSection
ResumeSettings
MarginSettings
ResumeMetadata
SectionType (discriminated union)
BaseSectionContract
```

### Zod Schemas

Every schema must validate all required fields.

Email field: use z.string().email()

URL fields: use z.string().url().optional()

Date string fields: use z.string().regex for ISO 8601

Schemas must be exported and reused — never duplicated.

### Database (database.ts)

Use Dexie.

Four tables:

```typescript
resumes: '++id, updatedAt, title'
templates: '++id'
settings: '++id'
images: '++id, resumeId'
```

Export a singleton `db` instance.

### StorageService

Must implement:

```typescript
saveResume(resume: Resume): Promise<void>
getResume(id: string): Promise<Resume | undefined>
getAllResumes(): Promise<Resume[]>
deleteResume(id: string): Promise<void>
saveImage(asset: ImageAsset): Promise<void>
getImage(id: string): Promise<ImageAsset | undefined>
deleteImage(id: string): Promise<void>
```

Validate schema on every read using Zod before returning data.

On validation failure: log warning, attempt recovery, or throw StorageError.

### ResumeService

Must implement:

```typescript
createResume(templateId: string): Promise<Resume>
duplicateResume(id: string): Promise<Resume>
updateResume(id: string, patch: Partial<Resume>): Promise<Resume>
deleteResume(id: string): Promise<void>
```

### resume.factory.ts

Must export:

```typescript
createEmptyResume(templateId: string): Resume
createEmptyExperience(): ExperienceSection
createEmptyEducation(): EducationSection
createEmptySkillSection(): SkillSection
createEmptyProject(): ProjectSection
createEmptyCertification(): CertificationSection
createEmptyCustomSection(): CustomSection
```

All factory functions generate valid IDs (use `crypto.randomUUID()`).

All factory functions set correct `type`, `order`, `visible`, `createdAt`, `updatedAt`.

## Phase Complete When

```text
All types export without TypeScript errors

All Zod schemas validate sample data correctly

Dexie database opens without errors

StorageService can save and retrieve a Resume

ResumeService can create, duplicate, update, delete resumes

Image upload stores Uint8Array and retrieves it

Migration v1 runs on fresh database

No any types

No placeholder implementations
```

---

# Phase 3 — Shared UI Components

## Goal

Build the complete design system component library. These components are used by every feature. Build them once, correctly, with full accessibility.

## Entry Criteria

```text
Phase 1 complete

Design tokens available as Tailwind classes
```

## Files To Create

```text
src/shared/components/
  ui/
    Button/
      Button.tsx
      Button.types.ts
      Button.test.tsx

    Input/
      Input.tsx
      Input.types.ts
      Input.test.tsx

    Textarea/
      Textarea.tsx
      Textarea.types.ts
      Textarea.test.tsx

    Select/
      Select.tsx
      Select.types.ts
      Select.test.tsx

    Checkbox/
      Checkbox.tsx
      Checkbox.types.ts
      Checkbox.test.tsx

    Modal/
      Modal.tsx
      Modal.types.ts
      Modal.test.tsx

    Drawer/
      Drawer.tsx
      Drawer.types.ts
      Drawer.test.tsx

    Card/
      Card.tsx
      Card.types.ts
      Card.test.tsx

    Badge/
      Badge.tsx
      Badge.types.ts

    Skeleton/
      Skeleton.tsx
      Skeleton.types.ts

    Spinner/
      Spinner.tsx

    Divider/
      Divider.tsx

    EmptyState/
      EmptyState.tsx
      EmptyState.types.ts

    Tooltip/
      Tooltip.tsx
      Tooltip.types.ts

    ConfirmDialog/
      ConfirmDialog.tsx
      ConfirmDialog.types.ts
      ConfirmDialog.test.tsx

  layout/
    PageLayout.tsx
    EditorLayout.tsx
```

## Key Implementation Rules

### Button

Variants: `primary | secondary | ghost | danger`

Sizes: `sm | md | lg`

Required props: `variant`, `size`, `disabled?`, `loading?`, `onClick?`, `type?`

When `loading`: show spinner, disable click, keep width stable

All buttons require `aria-label` when icon-only

### Input / Textarea

Required props: `label`, `error?`, `helperText?`, `characterCount?`

Label must be visually connected via `htmlFor`/`id`

Error state: red border + error message with `role="alert"`

### Modal

Trap focus inside when open

Close on ESC key

Close on backdrop click

Animate with Framer Motion (fade + scale)

Max width 640px

### Drawer

Left and right positions

Close on ESC

Animate with Framer Motion (slide)

### All Components

No hardcoded colors — only Tailwind design token classes

All interactive elements: `aria-label`, `role`, keyboard support

All components: default, hover, focus, disabled, loading, error states

## Phase Complete When

```text
Every component renders without errors

Every component test passes

All components accessible: no axe-core violations

Dark mode works for all components

No hardcoded color values anywhere
```

---

# Phase 4 — Zustand Stores

## Goal

Implement all global state stores. These are the single source of truth for UI state during a session.

## Entry Criteria

```text
Phase 2 complete (types available)

Phase 3 complete (UI components available for testing)
```

## Files To Create

```text
src/shared/stores/
  resume.store.ts
  editor.store.ts
  template.store.ts
  theme.store.ts
  settings.store.ts

src/shared/stores/
  resume.store.test.ts
  editor.store.test.ts
  template.store.test.ts
  theme.store.test.ts
```

## Key Implementation Rules

### resumeStore

```typescript
state: {
  activeResume: Resume | null
  resumeList: ResumeListItem[]
  isLoading: boolean
  isSaving: boolean
  error: string | null
}

actions: {
  loadResumeList(): Promise<void>
  loadResume(id: string): Promise<void>
  createResume(templateId: string): Promise<string>
  updateResume(patch: DeepPartial<Resume>): void
  updateSection<T extends BaseSectionContract>(sectionType: SectionType, id: string, patch: Partial<T>): void
  addSection(sectionType: SectionType): void
  deleteSection(sectionType: SectionType, id: string): void
  reorderSections(sectionType: SectionType, fromIndex: number, toIndex: number): void
  duplicateResume(id: string): Promise<string>
  deleteResume(id: string): Promise<void>
  saveActiveResume(): Promise<void>
}
```

`updateResume` triggers autosave (debounced 1000ms).

### editorStore

```typescript
state: {
  selectedSectionId: string | null
  selectedSectionType: SectionType | null
  selectedElementId: string | null
  editMode: boolean
  zoomLevel: number
  activePage: number
  undoStack: ResumeSnapshot[]
  redoStack: ResumeSnapshot[]
  isDirty: boolean
}

actions: {
  selectSection(id: string, type: SectionType): void
  selectElement(id: string): void
  clearSelection(): void
  enterEditMode(): void
  exitEditMode(): void
  setZoom(level: number): void
  setActivePage(page: number): void
  pushUndoSnapshot(snapshot: ResumeSnapshot): void
  undo(): void
  redo(): void
}
```

`ResumeSnapshot` is a deep clone of `Resume` at a point in time.

Undo stack max: 100. When exceeded, drop oldest.

### templateStore

```typescript
state: {
  activeTemplateId: string
  availableTemplates: TemplateDefinition[]
}

actions: {
  switchTemplate(templateId: string): void
  loadTemplates(): void
}
```

`switchTemplate` updates `resumeStore.activeResume.templateId` and triggers autosave.

### themeStore

```typescript
state: {
  activeThemeId: string
  activeFontPresetId: string
  availableThemes: Theme[]
  availableFontPresets: FontPreset[]
}

actions: {
  switchTheme(themeId: string): void
  switchFontPreset(presetId: string): void
}
```

Persists `activeThemeId` and `activeFontPresetId` to localStorage (not IndexedDB).

### settingsStore

```typescript
state: {
  pageSize: 'A4' | 'LETTER'
  language: string
}

actions: {
  setPageSize(size: 'A4' | 'LETTER'): void
}
```

## Phase Complete When

```text
All stores initialize without errors

resumeStore: create, update, delete, reorder tested

editorStore: undo/redo cycle tested with 100-item limit

templateStore: switch template updates resume correctly

themeStore: persists to localStorage across reload

No any types in any store
```

---

# Phase 5 — Resume Editor

## Goal

Build the full editor UI: dashboard, editor layout, canvas, sidebar, properties panel, toolbar, inline editing, drag-and-drop, undo/redo, autosave.

## Entry Criteria

```text
Phases 1–4 complete
```

## Files To Create

```text
src/features/resume/
  pages/
    Dashboard.tsx
    Dashboard.test.tsx

  components/
    ResumeCard/
      ResumeCard.tsx
      ResumeCard.test.tsx
    CreateResumeModal/
      CreateResumeModal.tsx
      CreateResumeModal.test.tsx
    DeleteResumeDialog/
      DeleteResumeDialog.tsx

src/features/editor/
  pages/
    EditorPage.tsx

  components/
    Toolbar/
      Toolbar.tsx
      Toolbar.test.tsx
      UndoRedoButtons.tsx
      ZoomControls.tsx
      ExportButton.tsx

    Canvas/
      Canvas.tsx
      Canvas.test.tsx
      CanvasPage.tsx
      CanvasZoom.tsx

    Sidebar/
      Sidebar.tsx
      SectionList.tsx
      SectionListItem.tsx
      AddSectionMenu.tsx

    PropertiesPanel/
      PropertiesPanel.tsx
      SectionProperties.tsx
      PersonalInfoForm.tsx
      SummaryForm.tsx
      ExperienceForm.tsx
      EducationForm.tsx
      SkillsForm.tsx
      ProjectsForm.tsx
      CertificationsForm.tsx
      CustomSectionForm.tsx

    InlineEdit/
      InlineEditText.tsx
      InlineEditTextarea.tsx

  hooks/
    useAutosave.ts
    useUndoRedo.ts
    useKeyboardShortcuts.ts
    useZoom.ts
    useCanvasSelection.ts
```

## Key Implementation Rules

### Dashboard

Show resume list as cards with:

```text
Resume thumbnail (template preview)
Resume title
Last updated date
Actions: Open, Duplicate, Rename, Delete
```

Empty state when no resumes:

```text
Illustration + "Create your first resume" + Create button
```

### EditorPage Layout

```text
Top: Toolbar (64px)
Left: Sidebar (280px, collapsible)
Center: Canvas (flexible, scrollable)
Right: PropertiesPanel (320px, collapsible)
```

### Canvas

Renders `LayoutTree` produced by active template renderer.

Background: neutral gray.

Resume page: white, subtle border, level-1 shadow.

Zoom: CSS `transform: scale()` on the canvas container.

Multi-page: pages stacked vertically with gap.

### Section Drag and Drop

Use `dnd-kit` `<DndContext>` wrapping the section list in the sidebar.

Drag handle on each section list item.

On drop: call `resumeStore.reorderSections()`.

### InlineEditText

```text
Renders a <span contentEditable="true">

On focus: show subtle ring

On blur: call store update with trimmed text content

On Escape: revert to original value

Never mutate store on every keystroke — only on blur
```

### Autosave Hook (useAutosave)

```text
Watch resumeStore.isDirty

When isDirty becomes true: start 1000ms debounce timer

On timer fire: call resumeStore.saveActiveResume()

On save success: clear isDirty, update isSaving state

Show autosave status in toolbar: "Saving..." / "Saved"
```

### Keyboard Shortcuts (useKeyboardShortcuts)

```text
Ctrl/Cmd + Z → undo
Ctrl/Cmd + Shift + Z → redo
Ctrl/Cmd + S → force save (bypass debounce)
Escape → clear selection / exit edit mode
Delete → delete selected section (with confirmation)
```

## Phase Complete When

```text
Dashboard loads resume list from IndexedDB

Create resume modal works end-to-end

Editor loads a resume and renders it on the canvas

Clicking a section selects it and opens properties panel

Double-clicking text enables ContentEditable editing

Blurring saves the edit to the store

Section drag-and-drop reorders and autosaves

Undo/redo works across 5 consecutive actions

Zoom in/out changes visual scale without affecting layout

Autosave fires 1 second after last change

Refresh page: resume is restored from IndexedDB

No any types

No placeholder forms
```

---

# Phase 6 — Template Engine + All 7 Templates

## Goal

Implement the template rendering engine and all 7 V1 templates. Templates must produce a `LayoutTree` consumed by both the canvas and the PDF exporter.

## Entry Criteria

```text
Phases 1–5 complete

LayoutTree types defined in Phase 2
```

## Files To Create

```text
src/features/templates/
  engine/
    template.renderer.ts
    layout.builder.ts
    layout.utils.ts

  definitions/
    ats-01/
      ats-01.definition.ts
      ats-01.renderer.ts
    ats-02/
      ats-02.definition.ts
      ats-02.renderer.ts
    modern-01/
      modern-01.definition.ts
      modern-01.renderer.ts
    modern-02/
      modern-02.definition.ts
      modern-02.renderer.ts
    executive-01/
      executive-01.definition.ts
      executive-01.renderer.ts
    developer-01/
      developer-01.definition.ts
      developer-01.renderer.ts
    student-01/
      student-01.definition.ts
      student-01.renderer.ts

  registry/
    template.registry.ts

  components/
    TemplateGallery/
      TemplateGallery.tsx
      TemplateCard.tsx
    TemplateSwitcher/
      TemplateSwitcher.tsx

  themes/
    theme.registry.ts
    light.theme.ts
    dark.theme.ts

  fonts/
    font.presets.ts
```

## Key Implementation Rules

### template.renderer.ts

```typescript
class TemplateRenderer {
  render(
    resume: Resume,
    template: TemplateDefinition,
    theme: Theme,
    fontPreset: FontPreset
  ): LayoutTree
}
```

This is the only entry point for layout generation.

Canvas calls `TemplateRenderer.render()` and applies the resulting `LayoutTree` as DOM nodes.

PDF exporter calls the same `TemplateRenderer.render()` and converts `LayoutTree` to pdf-lib draw calls.

### Template Switching

```text
User selects new template in TemplateSwitcher

templateStore.switchTemplate(templateId) called

resumeStore updates activeResume.templateId

Canvas re-renders using new template's renderer

Resume data is never modified during template switch

Must complete in < 300ms
```

### All 7 Templates

Each template file must:

```text
Export a TemplateDefinition object with all required fields

Export a renderer function that produces a valid LayoutTree

Set atsScore per the values in doc-7

Handle all section types including hidden sections (skip them)

Handle empty sections (skip them)

Handle multi-page overflow (add new LayoutPage when needed)

Support all 4 font presets

Support light and dark themes via semantic color tokens
```

### Page Break Logic

Within layout builder:

```text
Track current Y position on each page

When adding a node would overflow the page height minus margins:
  Create new LayoutPage
  Reset Y to top margin
  Continue adding nodes

Never break between: entry-header and entry-body nodes

Use a minimum keep-together height check before each entry
```

### Theme Registry

```text
All themes defined as plain objects with semantic color keys

Keys must match the CSS custom property names from Phase 1

light.theme.ts and dark.theme.ts are the required themes
```

## Phase Complete When

```text
All 7 templates render without errors on the canvas

Template switching changes layout without data loss, verified by comparing resume JSON before and after

ATS-01 and ATS-02 render no icons or graphics

Modern-01 and Modern-02 render two-column layout

Executive-01 renders serif font

Developer-01 shows technology tags on experience entries

Student-01 prioritizes education section first

All templates handle empty resume (no sections filled)

All templates handle large resume (3+ pages)

All themes apply correctly to all templates

All font presets apply correctly to all templates
```

---

# Phase 7 — PDF Export Engine

## Goal

Implement the PDF export engine using `pdf-lib`. The engine must consume the `LayoutTree` from Phase 6, embed fonts, and produce a pixel-accurate PDF.

## Entry Criteria

```text
Phases 1–6 complete

FontRegistry service from Phase 1 must be fully implemented

LayoutTree type and TemplateRenderer from Phase 6 ready
```

## Files To Create

```text
src/features/export/
  services/
    export.service.ts
    pdf.generator.ts
    font.embedder.ts
    image.embedder.ts
    link.handler.ts

  hooks/
    useExport.ts

  components/
    ExportModal/
      ExportModal.tsx
      ExportProgress.tsx
      ExportError.tsx

src/shared/services/
  font.registry.ts   (complete implementation, was stub in Phase 1)
```

## Key Implementation Rules

### FontRegistry (full implementation)

```typescript
class FontRegistry {
  private fonts: Map<string, ArrayBuffer> = new Map()

  async initialize(): Promise<void> {
    // Fetch all .ttf files from /fonts/ directory
    // Store as ArrayBuffer keyed by 'Family-Weight'
  }

  getFont(family: FontFamily, weight: FontWeight): ArrayBuffer {
    // Return from map or throw FontNotLoadedError
  }

  isReady(): boolean
}
```

Initialize FontRegistry in `src/main.tsx` before rendering the React app.

Show a loading screen while fonts load.

### ExportService

```typescript
class ExportService {
  async exportToPdf(resume: Resume): Promise<void> {
    // 1. Validate resume (required fields)
    // 2. Get active template, theme, fontPreset from stores
    // 3. Call TemplateRenderer.render() to get LayoutTree
    // 4. Call PdfGenerator.generate(layoutTree)
    // 5. Trigger browser download
  }
}
```

### PdfGenerator

```typescript
class PdfGenerator {
  async generate(layoutTree: LayoutTree): Promise<Uint8Array> {
    // 1. Create PDFDocument via pdf-lib
    // 2. For each LayoutPage in layoutTree.pages:
    //    a. Add page with correct dimensions (pt)
    //    b. Walk LayoutNode tree
    //    c. For each node type, call the appropriate draw method
    // 3. Embed all required fonts using FontEmbedder
    // 4. Save and return bytes
  }
}
```

Node type draw methods:

```text
'text'    → page.drawText()
'image'   → page.drawImage()
'divider' → page.drawLine()
'link'    → create link annotation with href
'tag'     → drawRoundedRect() + drawText()
```

### File Naming

```typescript
function buildFileName(resume: Resume): string {
  const name = resume.personalInfo.fullName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
  return `${name}_Resume.pdf`
}
```

### ExportModal States

```text
Idle → show export options (page size)
Preparing → "Preparing your resume..."
Rendering → "Rendering layout..."
Generating → "Generating PDF..."
Downloading → "Downloading..."
Completed → "Export complete!" (auto-dismiss after 2s)
Failed → error message + Retry button
```

### Export Validation (before export)

Block export if:

```text
personalInfo.fullName is empty

personalInfo.email is empty or invalid
```

Show warning (do not block) if:

```text
No experience AND no education entries

Summary is empty
```

## Phase Complete When

```text
FontRegistry loads all 12 font files on app startup

Fonts are embedded in exported PDFs (verify with PDF reader)

Export produces a downloadable .pdf file

PDF text is selectable and searchable

All hyperlinks in PDF are clickable

Multi-page resumes export all pages correctly

Page sizes A4 and Letter both work

Export works without internet connection

Export time for 1-page resume < 2 seconds

Preview and PDF match within 1% visually

Export modal shows all progress states correctly

Failed export shows retry button that works
```

---

# Phase 8 — Testing

## Goal

Achieve coverage targets and validate all user flows end-to-end.

## Entry Criteria

```text
Phases 1–7 complete

All features implemented
```

## Files To Create

```text
src/tests/
  fixtures/
    empty-resume.fixture.ts
    small-resume.fixture.ts
    medium-resume.fixture.ts
    large-resume.fixture.ts
    multipage-resume.fixture.ts

  setup/
    test.setup.ts
    db.setup.ts

e2e/
  flows/
    create-resume.spec.ts
    edit-resume.spec.ts
    template-switch.spec.ts
    export-pdf.spec.ts
    autosave-recovery.spec.ts
    undo-redo.spec.ts
  accessibility/
    dashboard.a11y.spec.ts
    editor.a11y.spec.ts
```

## Coverage Targets

```text
Lines: 90%
Functions: 90%
Branches: 85%
Statements: 90%
```

Critical modules (95%+ required):

```text
resume.store.ts
storage.service.ts
template.renderer.ts
pdf.generator.ts
v1.migration.ts
```

## Mandatory E2E Flows

```text
Flow 1: Create Resume
  Open app → Click Create → Choose template → Fill personal info
  → Add experience → Autosave triggers → Refresh → Data persists

Flow 2: Template Switch
  Open resume → Switch template → Verify all data present
  → Switch back → Verify data still present

Flow 3: Export
  Open resume → Click Export → Wait for download
  → Verify PDF downloaded → Verify filename pattern

Flow 4: Undo/Redo
  Edit field → Undo → Verify reverted → Redo → Verify restored

Flow 5: Recovery
  Open resume → Edit → Simulate refresh mid-edit
  → Reopen → Verify last autosaved state restored
```

## Phase Complete When

```text
pnpm test passes with 0 failures

Coverage targets met for all modules

All E2E flows pass in Chrome and Firefox

axe-core: 0 violations on Dashboard and Editor pages

No expect(true).toBe(true) style tests exist
```

---

# Phase 9 — Release Hardening

## Goal

Final checks before shipping. No new features. Bugs and polish only.

## Checklist

```text
pnpm tsc --noEmit → 0 errors

pnpm lint → 0 errors

pnpm test → all pass

pnpm build → success, no warnings

Bundle size analyzed: confirm no unexpected large dependencies

Performance verified:
  Initial load < 2s on throttled 4G
  Template switch < 300ms
  Autosave < 1s
  PDF export < 3s for 1-page resume

Accessibility audit:
  axe-core clean on all pages
  Tab navigation covers all interactive elements
  All form fields have labels

Browser testing:
  Chrome (latest)
  Edge (latest)
  Firefox (latest)
  Safari (latest)

Offline verified:
  Disconnect network
  Edit resume
  Export PDF
  All work without internet
```

## Release Complete When

```text
All checklist items pass

No TODOs in codebase

No placeholder implementations

No console.log statements outside Logger

Build output in dist/ is production-ready
```

---

# Constraints For AI Agents

When implementing any phase:

```text
Do not move to the next phase until current phase acceptance criteria are met

Do not create stub files with placeholder implementations

Do not skip tests

Do not use any

Do not use ts-ignore

Do not add features from future phases into an earlier phase

Do not import from a feature folder into another feature folder
  — use shared/ for cross-feature code

If a type is needed in two phases, define it in Phase 2 (Data Layer)

Every file created must be complete and working
```
