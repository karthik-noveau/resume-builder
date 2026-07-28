# Document 4

# Design System Specification (DSS)

This document eliminates UI ambiguity.

Without DSS, AI will generate different spacing, typography, colors, component behaviors, and layouts every time.

The Design System becomes the single source of truth for:

* UI Components
* Layouts
* Typography
* Colors
* Spacing
* Dark Mode
* Accessibility
* Responsive Design

---

# 1. Design Principles

The Resume Studio UI must be:

```text
Professional

Minimal

Fast

Accessible

Predictable

Content Focused
```

The resume itself is the hero.

The application UI must never distract from the resume content.

---

# 2. Design Language

Visual style:

```text
Modern SaaS

Minimal

Professional

Clean

Canva-inspired editor

Not playful

Not gamified
```

---

# 3. Grid System

Desktop:

```text
12 Columns
```

Canvas Layout:

```text
Left Sidebar
280px

Center Canvas
Flexible

Right Properties Panel
320px

Top Toolbar
64px
```

---

Mobile:

```text
Single Column

Panels become drawers
```

---

# 4. Spacing Scale

Only these spacing values are allowed:

```text
4
8
12
16
20
24
32
40
48
64
80
96
```

All spacing uses tokens.

Never use arbitrary spacing.

---

# 5. Border Radius

```text
Small     6px
Medium    10px
Large     14px
XL        20px
```

Default:

```text
10px
```

---

# 6. Elevation System

Level 0

```text
No Shadow
```

Level 1

```text
Cards
```

Level 2

```text
Dropdowns
```

Level 3

```text
Modals
```

Maximum:

```text
Level 3
```

No heavy shadows.

---

# 7. Typography System

Font Stack:

```text
Inter

Fallback:
system-ui
```

---

## Type Scale

```text
Display XL   48

Display L    40

Heading XL   32

Heading L    28

Heading M    24

Heading S    20

Body L       18

Body M       16

Body S       14

Caption      12
```

---

## Font Weights

```text
Regular   400

Medium    500

Semibold  600

Bold      700
```

No extra-bold.

---

# 8. Resume Font Presets

## Professional

```text
Inter
```

---

## Executive

```text
Source Serif Pro
```

---

## Modern

```text
Manrope
```

---

## Minimal

```text
IBM Plex Sans
```

---

# 9. Color System

Colors must use semantic tokens.

Never use hardcoded colors.

---

## Primary

```text
primary

primary-hover

primary-active
```

---

## Surface

```text
background

surface

surface-elevated
```

---

## Text

```text
text-primary

text-secondary

text-muted
```

---

## Status

```text
success

warning

error

info
```

---

# 10. Theme System

Required Themes:

```text
Light

Dark
```

---

Custom Theme:

```text
Primary Color

Accent Color
```

Only.

No full theme editor.

---

# 11. Responsive Breakpoints

```text
sm
640

md
768

lg
1024

xl
1280

2xl
1536
```

---

# 12. Layout Rules

Desktop:

```text
Sidebar Visible

Properties Visible

Canvas Centered
```

---

Tablet:

```text
Sidebar Collapsible

Properties Collapsible
```

---

Mobile:

```text
Panels become drawers
```

---

# 13. Component Standards

Every component must define:

```text
Default State

Hover State

Focus State

Active State

Disabled State

Loading State

Error State
```

---

# 14. Button Specification

Variants:

```text
Primary

Secondary

Ghost

Danger
```

---

Sizes:

```text
Small

Medium

Large
```

---

Required States:

```text
Default

Hover

Focus

Disabled

Loading
```

---

# 15. Input Specification

Supported:

```text
Text

Number

Email

URL

Search

Textarea
```

---

Features:

```text
Label

Helper Text

Error Text

Character Count
```

---

# 16. Card Specification

Used for:

```text
Resume Cards

Templates

Settings
```

---

Structure:

```text
Header

Body

Footer
```

---

# 17. Modal Specification

Maximum Width:

```text
640px
```

---

Must support:

```text
ESC Close

Focus Trap

Keyboard Navigation
```

---

# 18. Drawer Specification

Positions:

```text
Left

Right
```

---

Used for:

```text
Mobile Navigation

Properties Panel
```

---

# 19. Dropdown Specification

Supports:

```text
Keyboard Navigation

Search

Grouping
```

---

Must support:

```text
Arrow Keys

Enter

Escape
```

---

# 20. Toast Specification

Types:

```text
Success

Error

Warning

Info
```

---

Position:

```text
Top Right
```

---

Duration:

```text
4 seconds
```

---

# 21. Empty States

Every feature requires:

```text
Illustration

Title

Description

Primary Action
```

Example:

```text
No Resumes Found

Create Resume
```

---

# 22. Loading States

Use:

```text
Skeleton Loaders
```

Not spinners.

Spinners only for:

```text
Export
```

---

# 23. Icon System

Library:

```text
Lucide
```

Only.

---

Sizes:

```text
16

20

24

32
```

---

# 24. Accessibility Standards

Minimum:

```text
WCAG AA
```

---

Must support:

```text
Keyboard Navigation

Screen Readers

Focus Indicators

ARIA Labels
```

---

Contrast:

```text
4.5:1 Minimum
```

---

# 25. Animation Rules

Duration:

```text
Fast
150ms

Normal
250ms

Slow
350ms
```

---

Allowed:

```text
Fade

Scale

Slide
```

---

Not Allowed:

```text
Bounce

Elastic

Excessive Motion
```

---

# 26. Resume Canvas Styling

Canvas Background:

```text
Neutral Gray
```

---

Page Shadow:

```text
Level 1
```

---

Page Border:

```text
Subtle
```

---

Canvas must visually mimic:

```text
A4 Paper
```

---

# 27. Resume Preview Rules

Preview must be:

```text
Pixel Accurate
```

PDF output must match preview.

Allowed difference:

```text
< 1%
```

---

# 28a. Theme Type Definition

```typescript
interface Theme {
  id: string
  name: string
  colors: ThemeColors
}

interface ThemeColors {
  primary: string
  primaryHover: string
  primaryActive: string
  background: string
  surface: string
  surfaceElevated: string
  textPrimary: string
  textSecondary: string
  textMuted: string
  success: string
  warning: string
  error: string
  info: string
  accent: string
  divider: string
}
```

All color values are hex strings (e.g. `'#1a73e8'`).

Required theme IDs:

```text
'light'
'dark'
```

Themes live in:

```text
src/features/templates/themes/light.theme.ts
src/features/templates/themes/dark.theme.ts
```

Applying a theme means writing each `ThemeColors` key as a CSS custom property on `:root`.

Example mapping:

```text
colors.primary         → --color-primary
colors.background      → --color-background
colors.surface         → --color-surface
colors.surfaceElevated → --color-surface-elevated
colors.textPrimary     → --color-text-primary
colors.textSecondary   → --color-text-secondary
colors.textMuted       → --color-text-muted
colors.accent          → --color-accent
colors.divider         → --color-divider
```

---

# 28b. FontPreset Type Definition

```typescript
interface FontPreset {
  id: string
  name: string
  headingFamily: FontFamily
  bodyFamily: FontFamily
  scale: FontScale
  lineHeight: FontLineHeight
  letterSpacing: FontLetterSpacing
}

interface FontScale {
  name: number
  headline: number
  sectionTitle: number
  entryTitle: number
  body: number
  small: number
  caption: number
}

interface FontLineHeight {
  heading: number
  body: number
}

interface FontLetterSpacing {
  heading: number
  body: number
}
```

Required preset IDs and their values:

```text
id: 'professional'
name: 'Professional'
headingFamily: 'Inter'
bodyFamily: 'Inter'
scale.name: 24
scale.headline: 13
scale.sectionTitle: 11
scale.entryTitle: 11
scale.body: 10
scale.small: 9
scale.caption: 8

---

id: 'executive'
name: 'Executive'
headingFamily: 'SourceSerifPro'
bodyFamily: 'SourceSerifPro'
scale.name: 26
scale.headline: 13
scale.sectionTitle: 12
scale.entryTitle: 11
scale.body: 11
scale.small: 10
scale.caption: 9

---

id: 'modern'
name: 'Modern'
headingFamily: 'Manrope'
bodyFamily: 'Manrope'
scale.name: 28
scale.headline: 13
scale.sectionTitle: 11
scale.entryTitle: 11
scale.body: 10
scale.small: 9
scale.caption: 8

---

id: 'minimal'
name: 'Minimal'
headingFamily: 'IBMPlexSans'
bodyFamily: 'IBMPlexSans'
scale.name: 22
scale.headline: 12
scale.sectionTitle: 10
scale.entryTitle: 10
scale.body: 10
scale.small: 9
scale.caption: 8
```

All `scale` values are in points (pt). They are used directly by TemplateRenderer to set font sizes in the LayoutTree.

Font presets live in:

```text
src/features/templates/fonts/font.presets.ts
```

---

# 28. Component Acceptance Criteria

PASS

```text
Responsive

Accessible

Keyboard Navigable

Dark Mode Compatible

Tested
```

FAIL

```text
Hardcoded Colors

Inconsistent Spacing

Missing States

Accessibility Violations
```
 