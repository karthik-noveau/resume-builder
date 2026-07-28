# Document 7

# Export Specification (EPS)

This document defines how resume export works.

The export system is one of the most critical parts of the application because the final deliverable is the exported resume.

This specification guarantees:

- Accurate PDF generation
- Consistent rendering
- ATS-safe output
- Offline export
- Pixel-accurate preview matching

---

# 1. Purpose

The Export Engine converts the rendered resume into downloadable files.

V1 supports:

```text
PDF
```

Only.

Future versions may support:

```text
DOCX
PNG
JPEG
```

These are excluded from V1.

---

# 2. Export Principles

The export system must follow:

```text
Canvas Preview = PDF Output
```

The user must receive exactly what they see.

Allowed visual difference:

```text
< 1%
```

---

# 3. Supported Formats

## V1

```text
PDF
```

---

## V2

```text
DOCX

PNG

JPEG
```

---

# 4. Export Architecture

Export Source

```text
Resume Data
+
Template
+
Theme
+
Font Preset
```

↓

```text
Render Engine
```

↓

```text
PDF Generator
```

↓

```text
Download
```

---

# 5. PDF Library

Mandatory

```text
pdf-lib
```

Alternative libraries are not permitted without approval.

---

# 6. Offline Requirement

Export must function:

```text
Without Internet
```

---

Must not require:

```text
Backend

Cloud Services

External APIs

Third Party Servers
```

---

# 7. Page Sizes

Supported

```text
A4

Letter
```

---

A4

```text
210mm × 297mm
```

---

Letter

```text
8.5in × 11in
```

---

# 8. Orientation

Supported

```text
Portrait
```

Only.

---

Not Supported

```text
Landscape
```

---

# 9. Multi Page Support

Required

```text
1 Page

2 Pages

3+ Pages
```

---

Pages generated automatically.

---

# 10. Page Break Rules

Never split:

```text
Job Title + Company

Degree + Institution

Project Title + Description

Certification Title + Issuer
```

---

Allowed breaks:

```text
Between Experience Entries

Between Projects

Between Sections
```

---

# 11. Margin Rules

Default

```text
15mm
```

All sides.

---

Allowed Range

```text
10mm - 25mm
```

---

Margins stored in:

```text
ResumeSettings
```

---

# 12. Font Embedding

All exported PDFs must embed fonts.

---

Must support:

```text
Inter

Source Serif Pro

Manrope

IBM Plex Sans
```

---

No dependency on system fonts.

---

# 12a. Font Loading Strategy

Fonts are bundled with the application, not fetched at runtime.

```text
Location:
src/assets/fonts/

Files required:
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

Font loading flow:

```text
App startup

↓

FontRegistry.initialize()

↓

Fetch each .ttf via import or fetch('/fonts/...')

↓

Store as ArrayBuffer in FontRegistry (singleton)

↓

Canvas renderer uses FontRegistry for CSS @font-face

↓

PDF exporter uses FontRegistry ArrayBuffer for pdf-lib font embedding
```

`FontRegistry` interface:

```typescript
{
  initialize(): Promise<void>

  getFont(family: FontFamily, weight: FontWeight): ArrayBuffer

  isReady(): boolean
}
```

`FontFamily` type:

```typescript
type FontFamily =
  | 'Inter'
  | 'SourceSerifPro'
  | 'Manrope'
  | 'IBMPlexSans'
```

`FontWeight` type:

```typescript
type FontWeight = 400 | 500 | 600 | 700
```

FontRegistry must be initialized before the editor renders.

If font loading fails: show error state and block export.

---

# 13. Font Rendering Rules

Exported text must remain:

```text
Selectable

Searchable

Copyable
```

---

Forbidden

```text
Rasterized Text

Text As Image
```

---

# 14. ATS Compatibility

ATS templates must export:

```text
Plain Text

Embedded Fonts

No Decorative Graphics
```

---

Avoid:

```text
SVG Icons

Complex Shapes

Decorative Elements
```

for ATS templates.

---

# 15. Image Support

Supported

```text
Profile Images

Company Logos (Future)
```

---

Image Formats

```text
PNG

JPEG

WEBP
```

---

# 16. Image Processing Rules

Before export:

```text
Resize

Compress

Optimize
```

---

Maximum image size

```text
2MB
```

---

# 17. Color Rules

Export must preserve:

```text
Theme Colors

Text Colors

Background Colors
```

exactly.

---

Color conversion:

```text
RGB
```

---

# 18. Hyperlink Support

Supported

```text
Email

LinkedIn

GitHub

Portfolio

Project URLs
```

---

Exported PDF links must remain clickable.

---

# 19. Metadata Support

Exported PDF should contain:

```text
Title

Author

Creation Date
```

---

Example

```text
Title:
John_Doe_Resume

Author:
Resume Studio
```

---

# 20. File Naming Rules

Default Pattern

```text
{FullName}_Resume.pdf
```

---

Examples

```text
John_Doe_Resume.pdf

Karthik_B_Resume.pdf
```

---

Sanitize:

```text
Special Characters

Illegal Filename Characters
```

---

# 21. Export Validation

Before export:

Validate

```text
Full Name

Email

Resume Exists
```

---

Warnings only:

```text
Missing Summary

Missing Projects

Missing Skills
```

---

Block export only when:

```text
Resume Corrupted

Required Fields Missing
```

---

# 22. Export Progress States

States

```text
Idle

Preparing

Rendering

Generating PDF

Downloading

Completed

Failed
```

---

Progress indicator required.

---

# 23. Error Handling

Supported Errors

```text
Font Loading Error

Image Processing Error

Rendering Error

PDF Generation Error
```

---

User must receive:

```text
Readable Message

Retry Button
```

---

# 24. Performance Targets

Single Page Resume

```text
< 2 Seconds
```

---

Two Page Resume

```text
< 3 Seconds
```

---

Maximum Export Time

```text
5 Seconds
```

---

# 25. Memory Constraints

Export should support:

```text
Up To 10 Pages
```

without browser crashes.

---

Target Memory Usage

```text
< 250 MB
```

during export.

---

# 26. Export Consistency

The following must match:

```text
Canvas Preview

Print Preview

Exported PDF
```

---

Allowed difference

```text
Less Than 1%
```

---

# 27. Quality Assurance

Must verify:

```text
Page Count

Font Embedding

Image Rendering

Page Break Accuracy

Link Functionality

Theme Accuracy
```

before release.

---

# 28. Accessibility

PDF must support:

```text
Selectable Text

Readable Structure

Keyboard Accessible Links
```

---

# 29. Future Export Extensions

Reserved

```text
DOCX Export

PNG Export

JPEG Export

Batch Export
```

---

Not included in V1.

---

# 30. Acceptance Criteria

PASS

```text
PDF downloads successfully

Fonts embedded

Links clickable

Multi-page works

Preview matches PDF

Works offline
```

---

FAIL

```text
Missing fonts

Broken page breaks

Rasterized text

Export requires internet

Preview differs from PDF

Corrupted PDF
```

---

### Critical Addition for AI Implementation

```text
Export Engine Strategy

The PDF generator must NOT independently calculate layouts.

The PDF generator must consume the exact layout tree already produced by the canvas renderer.

Single Source Of Truth:

Resume Data
→ Template Renderer
→ Layout Tree

Canvas uses Layout Tree.

PDF Export uses Layout Tree.

This prevents preview/PDF mismatch.
```

---

# 31. LayoutTree Specification

This is the shared data structure between the canvas renderer and the PDF exporter.

## LayoutTree

```typescript
interface LayoutTree {
  resumeId: string
  templateId: string
  themeId: string
  fontPresetId: string
  pageSize: 'A4' | 'LETTER'
  pages: LayoutPage[]
}
```

## LayoutPage

```typescript
interface LayoutPage {
  pageNumber: number
  widthPt: number
  heightPt: number
  marginsPt: {
    top: number
    right: number
    bottom: number
    left: number
  }
  nodes: LayoutNode[]
}
```

## LayoutNode

```typescript
interface LayoutNode {
  id: string
  type: LayoutNodeType
  xPt: number
  yPt: number
  widthPt: number
  heightPt: number
  styles: LayoutStyles
  children: LayoutNode[]
  content?: string
  href?: string
  imageId?: string
}
```

## LayoutNodeType

```typescript
type LayoutNodeType =
  | 'page'
  | 'section'
  | 'section-header'
  | 'entry'
  | 'entry-header'
  | 'entry-body'
  | 'text'
  | 'bullet'
  | 'tag'
  | 'divider'
  | 'image'
  | 'link'
```

## LayoutStyles

```typescript
interface LayoutStyles {
  fontFamily: FontFamily
  fontSize: number
  fontWeight: FontWeight
  color: string
  backgroundColor?: string
  lineHeight: number
  letterSpacing?: number
  textAlign: 'left' | 'center' | 'right'
  textDecoration?: 'none' | 'underline'
  paddingTopPt?: number
  paddingRightPt?: number
  paddingBottomPt?: number
  paddingLeftPt?: number
}
```

## Units

All positional and size values use points (pt), not pixels.

Conversion:

```text
1 mm = 2.8346 pt
1 inch = 72 pt
A4 = 595.28 × 841.89 pt
Letter = 612 × 792 pt
```

## Generation

LayoutTree is generated by `TemplateRenderer.render(resume, template, theme, fontPreset)`.

The canvas renders from the LayoutTree.

The PDF exporter reads the same LayoutTree — never the resume data directly.

---

# 32. atsScore Definition

`atsScore` in `TemplateDefinition` is a number from 0 to 100.

```text
100 = fully ATS-safe (plain text, single column, no graphics)

80–99 = mostly ATS-safe (minimal icons, standard layout)

50–79 = moderate ATS compatibility

Below 50 = design-first, low ATS compatibility
```

Required values per template:

```text
ATS-01       → 100
ATS-02       → 95
Modern-01    → 70
Modern-02    → 65
Executive-01 → 80
Developer-01 → 75
Student-01   → 90
```
