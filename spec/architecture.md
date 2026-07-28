# Architecture

Implementation blueprint for **Resume Studio**. This document describes the
application as it is actually built. It is the current authority; where it
disagrees with `reference/doc-*.md`, this document wins and the difference is
recorded under [Known drift](#known-drift).

---

## 1. Project Overview

A local-first résumé builder. Users pick a template, fill in their details
through either a guided wizard or a full editor, watch a paginated preview
update live, and export a print-accurate PDF.

**Defining constraint: there is no backend.** No account, no server, no network
call at runtime. Every résumé, image and setting lives in the user's browser
(IndexedDB). This shapes everything below — persistence, export, and the fact
that the layout engine has to do typesetting the browser would normally do.

| | |
| --- | --- |
| Framework | React 19 + TypeScript (strict) |
| Build | Vite 6 |
| Routing | React Router 7, lazy-loaded routes |
| State | Zustand, one store per domain |
| Persistence | IndexedDB via Dexie |
| Styling | CSS Modules + design tokens; antd for a few primitives |
| PDF | pdf-lib + @pdf-lib/fontkit |
| Testing | Vitest + React Testing Library; Playwright for e2e |

---

## 2. Technical Architecture

Four layers. Dependencies point downward only — a layer never imports from the
layer above it.

```
┌──────────────────────────────────────────────────────────────┐
│  PAGES            marketing · resume · templates · editor    │
│                   · settings                                 │
├──────────────────────────────────────────────────────────────┤
│  STORES           resume · editor · template · theme         │
│                   · settings          (Zustand)              │
├──────────────────────────────────────────────────────────────┤
│  SERVICES         resume · storage · image · font.registry   │
│                   · logger                                   │
│  ENGINES          template renderer · layout builder         │
│                   · pdf generator                            │
├──────────────────────────────────────────────────────────────┤
│  PERSISTENCE      Dexie → IndexedDB (resumes, images,        │
│                   settings, templates)                       │
└──────────────────────────────────────────────────────────────┘
```

### Source layout

```
src/
├── app/           bootstrap: router, providers, shells, antd theme
├── assets/        fonts, thumbnails
├── features/      self-contained feature slices
│   ├── editor/    canvas, toolbar, sidebar, properties panel, hooks
│   ├── export/    PDF generator, font/image embedders, export modal
│   ├── marketing/ landing page sections
│   ├── resume/    dashboard, resume cards, factory, parser
│   ├── settings/  settings page
│   ├── storage/   storage feature glue
│   └── templates/ definitions, render engine, gallery
├── shared/        cross-feature code
│   ├── components/  ui primitives, layouts, error boundaries
│   ├── db/          Dexie schema + migrations
│   ├── hooks/       useMediaQuery, useAutoGrowTextarea
│   ├── schemas/     Zod validators, one per domain
│   ├── services/    resume, storage, image, fonts, logger
│   ├── stores/      Zustand stores
│   ├── types/       shared type definitions
│   └── utils/       helpers
├── styles/        global tokens and resets
└── tests/         test setup
```

> **Note on `features/` + `shared/`.** `codebase-guide.md` in this directory
> documents this layout. It differs from the generic `pages/ + common/ + store/`
> convention; the guide has been adapted to the shipped structure rather than
> the code being restructured to the guide. See the guide's preamble.

---

## 3. Module Responsibilities

| Module | Owns | Must not |
| --- | --- | --- |
| `app/` | Router, providers, app shell, antd theme bridge | Contain feature logic |
| `features/*/pages` | Composition of a route's UI | Hold business logic |
| `features/*/components` | Feature-local presentation | Be imported by another feature |
| `features/templates/engine` | Layout tree construction, pagination, text measurement | Touch the DOM or IndexedDB |
| `features/templates/definitions` | One template's metadata + renderer | Import another template |
| `features/export` | LayoutTree → PDF bytes, font/image embedding | Read stores directly |
| `shared/stores` | State + the only legal mutations of it | Perform I/O directly |
| `shared/services` | I/O, persistence, image processing | Hold UI state |
| `shared/schemas` | Zod validation at the persistence boundary | Contain business rules |
| `shared/db` | Dexie schema and migrations | Be used outside `storage.service` |

**Rule:** features never import from one another. Anything two features need
moves to `shared/`.

---

## 4. Application Lifecycle

```
main.tsx
   │  mount React root
   ▼
providers.tsx ──── theme store hydrate ──► apply CSS vars + data-theme
   │
   ▼
router.tsx ─────── lazy route match
   │
   ▼
AppShell ───────── nav + theme toggle
   │
   ▼
Page (lazy) ────── useActiveResume(id)
   │                     │
   │                     ▼
   │              resume.store.loadResume(id)
   │                     │
   │                     ▼
   │              resume.service → storage.service → Dexie
   │                     │
   │                     ▼
   │              zod validate ──► activeResume in store
   ▼
Render ─────────── useResumeLayoutTree → templateRenderer → LayoutTree
                          │
                          ▼
                   Canvas paints pages
```

---

## 5. Routing

Centralised in `src/app/router.tsx`. Every route is lazy.

| Path | Screen | Notes |
| --- | --- | --- |
| `/` | Home | Marketing landing |
| `/app` | My Resumes | Dashboard |
| `/templates` | Template library | `?create=true` switches to create mode |
| `/editor/:resumeId` | Full editor | Three-panel |
| `/editor/:resumeId/guided` | Guided editor | Five-step wizard |
| `/settings` | Settings | Defaults for new résumés |
| `*` | Not found | |

A missing `:resumeId` redirects to `/app` with an error toast rather than
rendering an empty editor.

---

## 6. Business Workflows

### 6.1 Create a résumé

```
Dashboard "New Resume"
   │
   ▼
/templates?create=true ── user picks template + colour
   │
   ▼
"Create Resume"
   │
   ▼
resume.service.createResume(templateId, themeOverride)
   │   reads defaults from settings (theme, font, page size)
   ▼
resume.factory.createEmptyResume()  ── seeds sample content
   │
   ▼
storage.service.saveResume ──► Dexie
   │
   ▼
navigate → /editor/:id/guided
```

### 6.2 Edit and autosave

```
User types in a field
   │
   ▼
Controlled field onSaved
   │
   ▼
resume.store.update*()  ── pushes undo snapshot, marks isDirty
   │
   ├──► LayoutTree recomputed ──► Canvas repaints (live preview)
   │
   ▼
useAutosave  ── 1000 ms debounce
   │
   ├── unmount / pagehide / tab hidden ──► flush immediately
   ▼
resume.store.saveActiveResume()
   │
   ▼
zod validate ──► storage.service ──► Dexie ──► isDirty = false
```

The flush path matters: without it, navigating away inside the debounce
window silently discarded the edit.

### 6.3 Render a template

```
Resume + TemplateDefinition + Theme + FontPreset
   │
   ▼
templateRenderer.render()
   │   registry lookup by template.id  ── unknown id → generic fallback
   ▼
<template>.renderer.ts
   │
   ├── LayoutBuilder    page/cursor management, pagination
   ├── section.renderers  shared entry builders
   ├── layout.utils     text measurement, style builders
   └── icons            glyph paths + per-section icon resolution
   │
   ▼
LayoutTree { pages[] → nodes[] }   ← plain data, no DOM
   │
   ├──► CanvasPage / CanvasLeaf   (screen)
   └──► pdf.generator             (export)
```

Both renderers consume the *same* tree, which is what keeps preview and PDF
identical.

**Two-column constraint.** `LayoutBuilder.currentPage` is always the last
page, and there is no API to move back. Whichever column renders second lands
entirely on the final page once the first paginates. Every sidebar template
therefore renders its sidebar **first** and stamps the panel onto every page
via `allPages`.

### 6.4 Export PDF

```
"Export PDF"
   │
   ▼
useExport → export.service.exportToPdf(resume)
   │
   ├── template lookup (throws if id unknown)
   ├── resolve theme + font preset
   ▼
templateRenderer.render → LayoutTree
   │
   ▼
pdf.generator.drawNodes(page, nodes)
   │
   ├── text/bullet/tag  → embedded font, manual line wrap
   ├── rect             → drawRectangle, or drawEllipse when clipShape=circle
   ├── icon             → drawSvgPath from ICON_PATHS
   ├── image            → embed + circular mask
   └── link             → link annotation
   │
   ▼
Uint8Array ──► Blob ──► download
```

### 6.5 Import

```
Paste / upload résumé text
   │
   ▼
resumeParser.parseResumeText → ParsedResumeData
   │
   ▼
resume.service.createResumeFromImport(templateId, parsed)
   │   applies the same settings defaults as createResume
   ▼
resume.factory.createResumeFromParsed → Dexie → editor
```

---

## 7. Dependency Graph

```
                       app/router
                            │
        ┌───────────────┬───┴────────┬──────────────┐
        ▼               ▼            ▼              ▼
   marketing        resume       templates       editor
        │               │            │              │
        └───────────────┴─────┬──────┴──────────────┘
                              ▼
                        shared/stores
                              │
                              ▼
                       shared/services ──► shared/db ──► IndexedDB
                              ▲
                              │
                    features/templates/engine
                              ▲
                              │
                       features/export
```

No cycles. `features/export` and `features/editor` both depend on the template
engine; neither depends on the other.

---

## 8. Data Model

`Resume` is the aggregate root. One IndexedDB record per résumé; images are a
separate store keyed by `resumeId` so deleting a résumé cascades.

```
Resume
├── id, schemaVersion, title, timestamps
├── templateId, themeId, fontPresetId, customPrimaryColor
├── personalInfo        ── profileImage → ImageAsset.id
├── summary
├── experience[]        entries carry stable ids (undo, canvas selection)
├── education[]
├── skills[]            grouped by category
├── projects[]
├── certifications[]
├── customSections[]    each with its own id
├── sectionOrder[]
├── sectionIcons{}      per-section icon overrides (SectionType | custom:<id>)
├── settings            page size, margins, showProfileImage
└── metadata
```

Every write passes through a Zod schema before reaching Dexie, so malformed
data cannot be persisted.

---

## 9. Feature Implementation Plan

Delivery is split into engines under `engines/`, one responsibility each. See
`engines/engine-status.md` for current state.

| # | Engine | Status |
| --- | --- | --- |
| 01 | Project setup and tooling | Complete |
| 02 | Data layer — types, schemas, Dexie | Complete |
| 03 | Shared UI components | Complete |
| 04 | Zustand stores | Complete |
| 05 | Template engine and layout builder | Complete |
| 06 | Resume templates | Complete (4 of 7 planned) |
| 07 | Full editor | Complete |
| 08 | Guided editor | Complete |
| 09 | PDF export | Complete |
| 10 | Dashboard, templates gallery, settings | Complete |
| 11 | Icon library and per-section icons | Complete |
| 12 | Responsive pass | Complete |
| 13 | Build configuration repair | Complete |
| 14 | Remaining templates (5–7) | Not started |
| 15 | DOCX and plain-text export | Not started |

---

## 10. Known Drift

Recorded deliberately rather than hidden.

| Area | Specified | Actual |
| --- | --- | --- |
| Templates | 7 | 4 (Foundation, Onyx, Clarity, Monogram) |
| Export formats | PDF, DOCX, plain text | PDF only |
| ATS score | Computed | Computed — template structure plus résumé content (`atsScore.ts`) |
| Source layout | `pages/ + common/ + store/` | `features/ + shared/` |
| Template definition fields | `typography`, `spacing`, `pageLayout`, `sections` drive rendering | Removed; renderers own their spacing. `layout` remains and is read by the ATS scorer |
| `exportRules` | All four flags honoured | Reduced to two, both read: `forceBlackText` and `includeProfileImage` |
| Guided editor | — | Covers 5 of 7 section types; projects, certifications and custom are reachable only in the full editor |
| Test runner | Jest | Vitest 3 (upgraded from 2 to align on a single Vite version) |

### Open defect

None outstanding. `pnpm build` previously failed and emitted `.js` beside every
source, which then shadowed those modules in Vite's resolver; Engine 13 fixed
the configuration and added ignores so it cannot recur.
