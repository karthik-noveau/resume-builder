# Document 5

# Template Engine Specification (TES)

This document defines exactly how resume templates work.

Without TES, AI will generate random templates.

TES ensures:

- Consistent template architecture
- Safe template switching
- ATS compatibility
- Predictable PDF rendering
- Standardized layouts

---

# 1. Purpose

The Template Engine controls presentation only.

Templates must never contain resume data.

Templates must never mutate resume data.

Templates must only define:

```text
Layout

Typography

Colors

Spacing

Section Rendering

Page Rules
```

---

# 2. Template Architecture

Rendering Formula

```text
Resume Data
+
Template Definition
+
Theme
+
Font Preset
=
Rendered Resume
```

---

Templates are stateless.

Templates never save user content.

---

# 3. Template Definition Contract

Every template must implement:

```typescript
TemplateDefinition;
```

```typescript
{
  id: string

  name: string

  category: string

  version: number

  thumbnail: string

  atsScore: number

  pageLayout: PageLayout

  typography: TypographyConfig

  spacing: SpacingConfig

  sections: SectionConfig[]

  exportRules: ExportRules
}
```

---

# 3a. TemplateDefinition Sub-Type Definitions

These types complete the `TemplateDefinition` contract. All are required.

## PageLayout

```typescript
type PageLayoutType = 'single-column' | 'two-column'

interface PageLayout {
  type: PageLayoutType
  columns?: {
    leftPercent: number
    rightPercent: number
  }
  leftSections?: SectionType[]
  rightSections?: SectionType[]
}
```

`columns` and `leftSections`/`rightSections` are required when `type === 'two-column'`.

For `single-column` layouts, all sections flow in `Resume.settings` order.

## SectionConfig

```typescript
interface SectionConfig {
  type: SectionType
  defaultOrder: number
  visible: boolean
  collapsible: boolean
  renderMode: 'standard' | 'compact' | 'detailed'
}
```

`defaultOrder` sets the rendering sequence when no user-defined order exists.

`renderMode` controls information density:

```text
standard  → title, subtitle, date, description, bullets
compact   → title, subtitle, date only
detailed  → standard + extra metadata fields
```

## TypographyConfig

```typescript
interface TypographyConfig {
  nameWeight: FontWeight
  sectionTitleWeight: FontWeight
  entryTitleWeight: FontWeight
  bodyWeight: FontWeight
  uppercaseSectionTitles: boolean
  showSectionDividers: boolean
}
```

Font sizes come from the active `FontPreset`. `TypographyConfig` controls weight and stylistic choices specific to the template.

## SpacingConfig

```typescript
interface SpacingConfig {
  sectionGapPt: number
  entryGapPt: number
  itemGapPt: number
  sectionTitleBottomPt: number
  headerBottomPt: number
}
```

All values in points (pt).

Recommended ranges:

```text
sectionGapPt:         10 – 20
entryGapPt:           6 – 14
itemGapPt:            2 – 6
sectionTitleBottomPt: 4 – 8
headerBottomPt:       12 – 20
```

## ExportRules

```typescript
interface ExportRules {
  embedFonts: boolean
  includeHyperlinks: boolean
  includeProfileImage: boolean
  forceBlackText: boolean
}
```

`forceBlackText`: when `true`, all text renders as `#000000` regardless of theme (used for maximum ATS safety on ATS-01).

Required values per template:

```text
ATS-01:       embedFonts: true, includeHyperlinks: true, includeProfileImage: false, forceBlackText: true
ATS-02:       embedFonts: true, includeHyperlinks: true, includeProfileImage: false, forceBlackText: true
Modern-01:    embedFonts: true, includeHyperlinks: true, includeProfileImage: true,  forceBlackText: false
Modern-02:    embedFonts: true, includeHyperlinks: true, includeProfileImage: true,  forceBlackText: false
Executive-01: embedFonts: true, includeHyperlinks: true, includeProfileImage: false, forceBlackText: false
Developer-01: embedFonts: true, includeHyperlinks: true, includeProfileImage: false, forceBlackText: false
Student-01:   embedFonts: true, includeHyperlinks: true, includeProfileImage: false, forceBlackText: false
```

---

# 4. Template Categories

Mandatory V1 Categories

```text
ATS

Modern

Executive

Developer

Student
```

---

Minimum V1 Templates

```text
ATS-01

ATS-02

Modern-01

Modern-02

Executive-01

Developer-01

Student-01
```

Target:

```text
7 Templates
```

Not 30 templates.

Quality over quantity.

---

# 5. Template Switching Rules

Template switching must:

```text
Never lose data

Never modify data

Never change section order

Never remove sections
```

---

Allowed:

```text
Change layout

Change spacing

Change typography

Change colors
```

---

# 6. Page Layout Types

Supported Layouts

## Single Column

```text
Header

Summary

Experience

Projects

Education

Skills
```

Used by:

```text
ATS

Student
```

---

## Two Column

```text
Left

Skills
Education
Languages

Right

Experience
Projects
Summary
```

Used by:

```text
Modern

Developer

Executive
```

---

# 7. ATS Template Rules

Template ID

```text
ATS-01
```

---

Layout

```text
Single Column
```

---

Allowed

```text
Text

Simple Dividers

Bullet Lists
```

---

Forbidden

```text
Icons

Progress Bars

Graphics

Tables

Columns
```

---

Font

```text
Inter
```

---

Margins

```text
15mm
```

---

Primary Goal

```text
Maximum ATS Compatibility
```

---

# 8. ATS-02 Rules

Layout

```text
Single Column
```

---

Differences

```text
Larger Header

Stronger Section Dividers

Professional Spacing
```

---

Still ATS-safe.

---

# 9. Modern-01

Layout

```text
Two Column
```

---

Left Width

```text
30%
```

---

Right Width

```text
70%
```

---

Left Sections

```text
Skills

Languages

Certifications
```

---

Right Sections

```text
Summary

Experience

Projects

Education
```

---

Icons

```text
Allowed
```

---

# 10. Modern-02

Layout

```text
Two Column
```

---

Header

```text
Full Width
```

---

Below Header

```text
Two Columns
```

---

Accent Color

```text
Visible
```

---

# 11. Executive-01

Target Audience

```text
Managers

Leads

Directors

Executives
```

---

Layout

```text
Single Column
```

---

Typography

```text
Serif
```

---

Spacing

```text
Generous
```

---

Visual Style

```text
Premium

Elegant

Minimal
```

---

# 12. Developer-01

Target Audience

```text
Software Engineers

Architects

DevOps

Backend Developers
```

---

Layout

```text
Two Column
```

---

Priority Order

```text
Experience

Projects

Skills

Education
```

---

Technology Tags

```text
Enabled
```

---

GitHub Links

```text
Prominent
```

---

# 13. Student-01

Target Audience

```text
Freshers

Students

Graduates
```

---

Priority Order

```text
Education

Projects

Skills

Certifications
```

---

Experience

```text
Optional
```

---

# 14. Section Rendering Rules

Every section must define:

```typescript
{
  visible: boolean;

  collapsible: boolean;

  order: number;

  renderMode: string;
}
```

---

# 15. Empty Section Rules

Default

```text
Do Not Render
```

---

Example

If no certifications:

```text
Hide Certification Section
```

---

# 16. Page Break Rules

Never break:

```text
Job Title + Company

Degree + Institution

Project Title + Description
```

---

Allow break:

```text
Between Experience Entries

Between Projects

Between Certifications
```

---

# 17. Overflow Rules

If content exceeds page:

```text
Create New Page
```

---

Never:

```text
Shrink Font

Compress Spacing

Scale Content
```

---

# 18. Profile Image Rules

ATS Templates

```text
Disabled
```

---

Modern Templates

```text
Optional
```

---

Executive

```text
Optional
```

---

# 19. Icon Rules

ATS

```text
Disabled
```

---

Modern

```text
Enabled
```

---

Developer

```text
Enabled
```

---

# 20. Theme Integration

Templates must use:

```text
Semantic Color Tokens
```

Never:

```text
Hardcoded Colors
```

---

Example

```text
text-primary

text-secondary

surface

accent
```

---

# 21. Font Integration

Templates never specify actual font files.

Templates reference:

```text
Professional

Modern

Executive

Minimal
```

---

Font presets remain separate.

---

# 22. Thumbnail Specification

Each template requires:

```text
Preview Image

Light Mode Preview

Dark Mode Preview
```

---

Size

```text
400 x 565 px
```

---

# 23. Template Metadata

Every template must include:

```typescript
{
  id;

  name;

  category;

  version;

  description;

  atsCompatible;

  thumbnail;

  tags;
}
```

---

# 24. Template Performance Rules

Switching template must:

```text
Complete in <300ms
```

---

No page reload.

No re-fetching.

No storage writes.

---

# 25. Export Rules

PDF export must render:

```text
Identical to Preview
```

---

Allowed Difference

```text
Less than 1%
```

---

# 26. Future Template Rules

Future templates must:

```text
Implement TemplateDefinition

Pass ATS Validation

Pass Export Validation

Pass Rendering Validation
```

---

# 26a. Thumbnail Generation Strategy

Thumbnails are static SVG files bundled with the app.

```text
Location:
src/assets/thumbnails/

Files:
ats-01-light.svg
ats-01-dark.svg
ats-02-light.svg
ats-02-dark.svg
modern-01-light.svg
modern-01-dark.svg
modern-02-light.svg
modern-02-dark.svg
executive-01-light.svg
executive-01-dark.svg
developer-01-light.svg
developer-01-dark.svg
student-01-light.svg
student-01-dark.svg
```

Each SVG represents a simplified miniature layout of the template at 400×565px.

SVGs must convey:

```text
Column layout structure
Section header style
Header/name area
Color accent placement
```

SVGs must not contain:

```text
Real user data
Placeholder text like "Lorem ipsum"
```

Use abstract shapes and lines to represent text blocks.

The `TemplateDefinition.thumbnail` field holds the import path string.

Example:

```typescript
thumbnail: '/src/assets/thumbnails/ats-01-light.svg'
```

Thumbnails are displayed in:

```text
Template Gallery page
Template Switcher panel
Dashboard resume card (as background preview)
```

---

# 27. Template Acceptance Criteria

PASS

```text
Switch without data loss

Render all sections

Export correctly

Support themes

Support font presets
```

FAIL

```text
Data mutation

Missing sections

Broken page breaks

Export mismatch

Hardcoded colors
```
