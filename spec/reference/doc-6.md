# Document 6

# Canvas Engine Specification (CES)

This document defines the behavior of the visual resume editor.

Without CES, AI will generate inconsistent editor interactions.

The Canvas Engine controls:

* Resume rendering
* Selection
* Editing
* Drag & Drop
* Zoom
* Pan
* Page rendering
* Section ordering
* User interactions

For V1, this is a **structured document editor**, not a fully freeform Canva clone.

---

# 1. Purpose

The canvas provides a visual WYSIWYG editing experience.

Users edit the actual resume directly.

The canvas must always represent the exported PDF.

---

# 2. Core Principle

```text
Canvas Preview = PDF Output
```

The rendered canvas is the source of truth.

Allowed visual difference:

```text
< 1%
```

---

# 3. Canvas Layout

Canvas Area

```text
Application
│
├── Toolbar
│
├── Left Sidebar
│
├── Canvas
│
└── Right Properties Panel
```

---

Canvas Region

```text
Canvas Container
│
└── Resume Page
```

---

# 4. Supported Page Sizes

V1

```text
A4

Letter
```

---

Orientation

```text
Portrait Only
```

Landscape excluded.

---

# 5. Canvas Background

Background

```text
Neutral Gray
```

Purpose:

```text
Improve page visibility
```

---

Resume Page

```text
White

Subtle Border

Level 1 Shadow
```

---

# 6. Canvas Rendering Rules

Render Source

```text
Resume Data
+
Template
+
Theme
+
Font Preset
```

---

Render Flow

```text
Resume Data

↓

Template Renderer

↓

Page Layout

↓

Canvas View
```

---

Canvas never directly renders raw data.

---

# 7. Selection System

V1 Supports

```text
Single Selection Only
```

---

Not Supported

```text
Multi Selection

Group Selection

Lasso Selection
```

---

Selected State

Visual indication:

```text
Blue Outline

2px Border
```

---

# 8. Selection Behavior

Click

```text
Select Element
```

---

Click Outside

```text
Clear Selection
```

---

Double Click

```text
Enter Edit Mode
```

---

Escape

```text
Exit Edit Mode
```

---

# 9. Editable Elements

Editable

```text
Personal Info

Summary

Experience

Education

Skills

Projects

Certifications

Custom Sections
```

---

Non Editable

```text
Margins

Page Container

Template Structure
```

---

# 10. Edit Mode

When editing:

```text
Content Editable Enabled
```

---

Selection Outline

```text
Hidden
```

---

Text Cursor

```text
Visible
```

---

# 10a. Editing Architecture — ContentEditable vs React Hook Form

These two patterns serve different purposes. Both are used. The boundary is strict.

## ContentEditable — In-Canvas Inline Editing

Used for:

```text
Text fields directly on the resume canvas

Short text: job title, company name, degree, skill name

Rich text: summary paragraph, experience bullet points
```

How it works:

```text
User double-clicks element on canvas

Element becomes contentEditable="true"

User types directly on the canvas

On blur: extract text content → dispatch store update → autosave
```

ContentEditable elements must:

```text
Sync value to store on blur

Never store intermediate edit state in the store

Show a subtle edit-mode ring (not the selection ring)

Support Escape to cancel and revert
```

## React Hook Form — Sidebar Panel Forms

Used for:

```text
Structured multi-field forms in the right properties panel

Fields with complex validation: email, URL, phone, date range

Settings and preferences
```

How it works:

```text
User clicks section on canvas

Right properties panel opens the section's RHF form

User edits fields in the panel

On submit / field blur: update store → autosave
```

## Rule

```text
Simple short text directly visible on the canvas → ContentEditable

Validated, multi-field, or structured data → React Hook Form in panel
```

Never use ContentEditable for email, URL, or date fields.

Never use React Hook Form for in-canvas text overlays.

---

# 11. Drag and Drop System

Library

```text
dnd-kit
```

---

Supported

```text
Section Reordering
```

---

Example

```text
Experience

↓

Projects

↓

Skills
```

User drags:

```text
Projects

↑

Above Experience
```

---

Result

```text
Projects

Experience

Skills
```

---

# 12. Drag Rules

Allowed

```text
Move Sections
```

---

Not Allowed

```text
Move Text

Move Individual Bullets

Move Individual Fields
```

---

V1 stays simple.

---

# 13. Reordering Rules

Every section contains:

```typescript
order: number
```

---

After reorder:

```text
Update order values

Trigger autosave
```

---

# 14. Hover States

Hover Section

```text
Subtle Border
```

---

Hover Editable Field

```text
Highlight Background
```

---

No excessive animations.

---

# 15. Properties Panel

Selection updates panel.

Example

Select:

```text
Experience Section
```

Panel shows:

```text
Visibility

Spacing

Section Title

Formatting
```

---

# 16. Toolbar Controls

Required

```text
Undo

Redo

Zoom In

Zoom Out

Reset Zoom

Template Switch

Theme Switch

Export PDF
```

---

# 17. Zoom System

Minimum

```text
50%
```

---

Default

```text
100%
```

---

Maximum

```text
200%
```

---

Increment

```text
10%
```

---

# 18. Zoom Behavior

Zoom affects:

```text
Visual Scale Only
```

---

Zoom must not affect:

```text
Layout

Spacing

Export Output
```

---

# 19. Pan System

Enabled only when:

```text
Canvas exceeds viewport
```

---

Methods

```text
Mouse Wheel

Trackpad

Touch
```

---

# 20. Multi Page Support

Canvas supports:

```text
1 Page

2 Pages

3+ Pages
```

---

Render

```text
Page 1

Page 2

Page 3
```

Stacked vertically.

---

# 21. Page Break Engine

Page breaks generated automatically.

---

Never split:

```text
Job Title + Company

Degree + Institution

Project Title + Content
```

---

Allowed

```text
Between Entries
```

---

# 22. Empty Section Behavior

If section contains no data:

```text
Do Not Render
```

---

Example

```text
No Certifications

↓

Hide Certification Section
```

---

# 23. Visibility Toggle

Every section supports:

```text
Show

Hide
```

---

Hide

```text
visible = false
```

---

Hidden sections remain stored.

---

# 24. Duplicate Section

Supported

```text
Custom Sections
```

---

Not Supported

```text
Personal Information

Summary
```

---

# 25. Autosave Triggers

Trigger on:

```text
Text Edit

Section Reorder

Section Visibility Change

Theme Change

Template Change
```

---

Debounce

```text
1000ms
```

---

# 26. Undo Redo Triggers

Record Actions

```text
Edit

Delete

Add

Reorder

Hide

Duplicate
```

---

Maximum History

```text
100 Actions
```

---

Memory Only.

---

# 27. Keyboard Shortcuts

Required

```text
Ctrl + S

Ctrl + Z

Ctrl + Shift + Z

Delete

Escape

Tab
```

---

Optional

```text
Arrow Navigation
```

---

# 28. Error Recovery

If render fails:

```text
Show Error State

Keep Existing Data

Allow Recovery
```

---

Never:

```text
Delete Resume Data
```

---

# 29. Performance Targets

Selection

```text
<16ms
```

---

Typing Latency

```text
<50ms
```

---

Drag Response

```text
<16ms
```

---

Zoom Response

```text
<50ms
```

---

Target

```text
60 FPS
```

---

# 30. Accessibility

Must support:

```text
Keyboard Selection

Focus Management

Screen Readers

ARIA Labels
```

---

Every selectable element must have:

```text
Accessible Name

Role

Description
```

---

# 31. Canvas State Model

```typescript
CanvasState
```

```typescript
{
  zoomLevel

  selectedElement

  selectedSection

  editMode

  activePage

  dragState
}
```

---

# 32. Acceptance Criteria

PASS

```text
Click selects

Double click edits

Drag reorders

Autosave works

Undo works

PDF matches preview

Multi-page works
```

---

FAIL

```text
Selection lost

Data lost

Broken page breaks

Export mismatch

Render crashes
```

---

### Important Architectural Note

For a resume builder, do **not** build a true Canva engine with free-positioned elements, layers, arbitrary coordinates, resizing handles, and grouping.

Use:

```text
Structured Document Canvas
```

not

```text
Freeform Design Canvas
```

---

# 33. Canvas Rendering Mechanism

## Chosen Approach: LayoutTree → DOM

The canvas is a **generic renderer** that walks a `LayoutTree` and produces DOM elements.

Templates are **pure TypeScript functions** that produce a `LayoutTree` — they contain zero React code.

This satisfies the single-source-of-truth requirement: the same `LayoutTree` drives both the canvas DOM and the PDF output.

## Coordinate System

All positions in `LayoutTree` are in **points (pt)**.

The canvas converts pt to px using a constant scale factor:

```typescript
const PT_TO_PX = 96 / 72 // = 1.3333...
```

A4 canvas container dimensions:

```typescript
const A4_WIDTH_PX = 595.28 * PT_TO_PX   // ≈ 794px
const A4_HEIGHT_PX = 841.89 * PT_TO_PX  // ≈ 1123px

const LETTER_WIDTH_PX = 612 * PT_TO_PX  // ≈ 816px
const LETTER_HEIGHT_PX = 792 * PT_TO_PX // ≈ 1056px
```

Zoom is applied via CSS `transform: scale(zoomLevel)` on the outer canvas container — it never changes pt values inside the LayoutTree.

## Canvas Component Tree

```text
<Canvas>                          ← zoom container, scrollable
  <CanvasPage page={layoutPage}>  ← fixed pixel dimensions, position: relative
    <CanvasNode node={rootNode}>  ← position: absolute, recurses into children
      <CanvasNode ...>
        <CanvasLeaf ...>          ← renders actual content (text, image, line)
```

## CanvasPage

```typescript
interface CanvasPageProps {
  page: LayoutPage
  pageIndex: number
}
```

Renders a `<div>` with:

```typescript
style={{
  position: 'relative',
  width: `${page.widthPt * PT_TO_PX}px`,
  height: `${page.heightPt * PT_TO_PX}px`,
  backgroundColor: '#ffffff',
  overflow: 'hidden',
}}
```

## CanvasNode

```typescript
interface CanvasNodeProps {
  node: LayoutNode
  onSelect: (id: string, type: SectionType | null) => void
}
```

Renders a `<div>` with:

```typescript
style={{
  position: 'absolute',
  left: `${node.xPt * PT_TO_PX}px`,
  top: `${node.yPt * PT_TO_PX}px`,
  width: `${node.widthPt * PT_TO_PX}px`,
  height: `${node.heightPt * PT_TO_PX}px`,
}}
```

Recurses into `node.children` via `<CanvasNode>`.

Leaf node rendering by `node.type`:

```text
'text'    → <span> with font styles mapped from LayoutStyles
'bullet'  → <div> with bullet character + <span> for text
'divider' → <hr> with border color from LayoutStyles
'tag'     → <span> with border-radius pill style
'image'   → <img> with src from ImageAsset data URL
'link'    → <a> with href, opens in new tab
```

## LayoutStyles → CSS Mapping

```typescript
function layoutStylesToCSS(styles: LayoutStyles): React.CSSProperties {
  return {
    fontFamily: fontFamilyToCSS(styles.fontFamily),
    fontSize: `${styles.fontSize * PT_TO_PX}px`,
    fontWeight: styles.fontWeight,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing ? `${styles.letterSpacing}em` : undefined,
    textAlign: styles.textAlign,
    textDecoration: styles.textDecoration,
    paddingTop: styles.paddingTopPt ? `${styles.paddingTopPt * PT_TO_PX}px` : undefined,
    paddingRight: styles.paddingRightPt ? `${styles.paddingRightPt * PT_TO_PX}px` : undefined,
    paddingBottom: styles.paddingBottomPt ? `${styles.paddingBottomPt * PT_TO_PX}px` : undefined,
    paddingLeft: styles.paddingLeftPt ? `${styles.paddingLeftPt * PT_TO_PX}px` : undefined,
  }
}
```

## Selection Integration

`CanvasNode` nodes whose `type` is `'section'` are selectable.

On click:

```typescript
onClick={() => onSelect(node.id, deriveSectionType(node))}
```

Selected section gets a `2px solid blue` outline via a className toggle — not via inline style.

Selected section is wrapped by `SectionErrorBoundary`.

## Re-render Trigger

The canvas re-renders whenever:

```text
resumeStore.activeResume changes (any field)
templateStore.activeTemplateId changes
themeStore.activeThemeId changes
themeStore.activeFontPresetId changes
```

The re-render calls `TemplateRenderer.render()` and produces a new `LayoutTree`. React's reconciliation then diffs the resulting `<CanvasNode>` tree.

Do not memoize `LayoutTree` generation — it must always reflect current state.

## File Locations

```text
src/features/editor/components/Canvas/
  Canvas.tsx
  CanvasPage.tsx
  CanvasNode.tsx
  CanvasLeaf.tsx
  canvas.utils.ts      ← PT_TO_PX, layoutStylesToCSS, fontFamilyToCSS
  canvas.constants.ts  ← A4_WIDTH_PX, LETTER_WIDTH_PX, etc.
```