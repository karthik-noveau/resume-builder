# Document 9

# Implementation Rules Specification (IRS)

This is the most important document for AI-generated development.

MSD defines **what** to build.

TAS defines **how** to build it.

IRS defines **how code must be written**.

Without IRS, AI can generate working code that becomes difficult to maintain after a few months.

This document acts as the final guardrail.

---

# 1. Purpose

The purpose of IRS is to ensure:

```text id="wzx0z0"
Consistency

Maintainability

Scalability

Readability

Reliability
```

across the entire codebase.

---

# 2. Definition of Done

A feature is complete only when:

```text id="lysggo"
Implemented

Typed

Validated

Tested

Accessible

Documented
```

---

A feature is NOT complete if:

```text id="a0mkmh"
Contains TODOs

Contains placeholders

Contains mock implementations

Fails tests
```

---

# 3. TypeScript Rules

Mandatory

```text id="psd5lc"
strict = true
```

---

Forbidden

```typescript id="rslxgf"
any;
```

---

Forbidden

```typescript id="d7g9wz"
@ts-ignore
```

---

Forbidden

```typescript id="fnhknq"
@ts-nocheck
```

---

Every type must be explicit.

---

# 4. Component Rules

Every component must:

```text id="2kg0hy"
Be Reusable

Be Typed

Be Testable

Be Accessible
```

---

Required Structure

```text id="yt8vqr"
Component

Props

Styles

Tests
```

---

Forbidden

```text id="frv8h8"
God Components
```

---

Maximum Component Size

```text id="a8x4go"
300 Lines
```

---

If larger:

```text id="rrkzd4"
Split Component
```

---

# 5. Function Rules

Maximum Function Length

```text id="0m45j3"
50 Lines
```

---

Maximum Nesting

```text id="p4d8sn"
3 Levels
```

---

Functions must:

```text id="w4r3hx"
Have Single Responsibility
```

---

# 6. File Rules

Maximum File Length

```text id="5j2bh9"
500 Lines
```

---

Preferred

```text id="z6iqx9"
<300 Lines
```

---

Large files must be split.

---

# 7. Naming Conventions

Components

```text id="2tbx9n"
PascalCase
```

Example

```text id="4dfxnk"
ResumeEditor.tsx
```

---

Functions

```text id="1e7rt4"
camelCase
```

---

Constants

```text id="xndln4"
UPPER_SNAKE_CASE
```

---

Types

```text id="haj7aq"
PascalCase
```

---

Interfaces

```text id="ozm2u6"
PascalCase
```

---

# 8. Folder Ownership Rules

Every feature owns:

```text id="g1v52t"
Components

Hooks

Services

Types

Tests
```

---

No cross-feature imports.

---

Allowed

```text id="4vkpxg"
Shared
```

---

Forbidden

```text id="f3n5gi"
Feature A

↓

Feature B Internal Imports
```

---

# 9. State Management Rules

Global State only for:

```text id="u4awlr"
Resume

Editor

Theme

Settings
```

---

Forbidden

```text id="kif5yq"
Everything In Global State
```

---

Use local state whenever possible.

---

# 10. Validation Rules

All user input must use:

```text id="v13v3k"
Zod
```

---

Validation required:

```text id="o4a2th"
Forms

Settings

Imports

Storage Reads
```

---

Never trust stored data.

---

# 11. Storage Rules

Every IndexedDB read:

```text id="9mbjqm"
Validate Schema
```

before usage.

---

Corrupted data must:

```text id="ez0jn4"
Recover

Or

Fail Gracefully
```

---

# 12. Error Handling Rules

Every async operation must handle:

```text id="j3rwpr"
Loading

Success

Failure
```

---

Forbidden

```text id="i4fgdd"
Unhandled Promise Rejections
```

---

# 13. Logging Rules

Development

```text id="vhk1ma"
Logger Allowed
```

---

Production

```text id="dwmj9q"
No Console Logs
```

---

Forbidden

```javascript id="n36kqv"
console.log();
```

---

# 14. Accessibility Rules

Every interactive element requires:

```text id="evfy9k"
Label

Role

Keyboard Support
```

---

Every form requires:

```text id="1y9rfh"
Accessible Error Messages
```

---

# 15. Performance Rules

Avoid:

```text id="xvux0g"
Unnecessary Renders
```

---

Use:

```text id="fwev9e"
Memoization

Selectors

Lazy Loading
```

when appropriate.

---

# 16. Dependency Rules

Before adding dependency:

Must answer:

```text id="xqrlg0"
Why Needed?

Can Existing Tools Solve It?

Bundle Impact?
```

---

Forbidden

```text id="tfgvv5"
Multiple Libraries Solving Same Problem
```

---

# 17. Styling Rules

Only:

```text id="o3x0rz"
TailwindCSS
```

---

Forbidden

```text id="6r6uwg"
Inline Styling
```

except dynamic calculations.

---

Forbidden

```text id="m92p8n"
Hardcoded Colors
```

---

Must use:

```text id="1v5jcf"
Design Tokens
```

---

# 18. Testing Rules

Every feature requires:

```text id="h5qv9y"
Unit Tests

Integration Tests
```

---

Critical flows require:

```text id="r7m7b7"
E2E Tests
```

---

# 19. Security Rules

Forbidden

```text id="r1mrl3"
eval()

new Function()
```

---

Forbidden

```text id="k0q4oq"
Unsafe HTML Injection
```

---

Use sanitization for:

```text id="3ijqvz"
Imported Content

External Data
```

---

# 20. PDF Export Rules

PDF engine must:

```text id="0uqqdr"
Reuse Layout Tree
```

---

Forbidden

```text id="78skaz"
Independent Layout Calculation
```

---

Single source of truth.

---

# 21. Template Rules

Templates must:

```text id="s2v1xh"
Be Stateless
```

---

Forbidden

```text id="bjlwmz"
Template Data Storage
```

---

Templates are presentation only.

---

# 22. AI Agent Rules

AI agents must:

```text id="8sm7zt"
Generate Complete Files

Generate Types

Generate Tests

Generate Documentation
```

---

AI agents must not:

```text id="y9q48j"
Generate Placeholders

Generate Stubs

Generate Fake APIs

Generate TODO Comments
```

---

# 23. Forbidden Patterns

Forbidden

```text id="oc7iq4"
Massive Components

Massive Stores

Deep Nesting

Circular Dependencies

Duplicate Logic
```

---

Forbidden

```text id="7u3n9q"
Copy Paste Programming
```

---

# 24. Refactoring Rules

When modifying code:

```text id="7hjdrh"
Improve Existing Code

Do Not Duplicate It
```

---

Always:

```text id="7n7j38"
Reuse

Extend

Refactor
```

---

# 25. Import Rules

Import Order

```text id="wbwqzh"
React

Third Party

Shared

Feature

Relative
```

---

Consistent across codebase.

---

# 26. Build Rules

Release build must pass:

```text id="r8ijy0"
Type Check

Lint

Tests

Build
```

---

Failure blocks release.

---

# 27. Documentation Rules

Every public service requires:

```text id="o0pj9r"
Description

Inputs

Outputs
```

---

Every complex function requires:

```text id="aef1w5"
Purpose Documentation
```

---

# 28. Code Review Rules

Every pull request must verify:

```text id="wp0g5g"
Typing

Tests

Accessibility

Performance

Security
```

---

# 29. Release Rules

Before release:

```text id="hbh83m"
Run Full Test Suite

Verify Export

Verify Autosave

Verify Template Switching
```

---

# 30. Acceptance Criteria

PASS

```text id="kkj37u"
No Type Errors

No Lint Errors

No Accessibility Errors

No Failed Tests

No Placeholder Code
```

---

FAIL

```text id="lm1avk"
TODO Comments

Mock Production Logic

Broken Tests

Untyped Code

Duplicate Components
```

---

# One Final Recommendation

You now have:

1. MSD — Master Specification
2. TAS — Technical Architecture Specification
3. RDSS — Resume Data Schema Specification
4. DSS — Design System Specification
5. TES — Template Engine Specification
6. CES — Canvas Engine Specification
7. EPS — Export Specification
8. TS — Testing Specification
9. IRS — Implementation Rules Specification

For an AI-first development workflow, I would add **one optional but extremely valuable final document**:

**Document 10 — Execution Plan Specification (XPS)**

This defines:

```text
Phase 1 → Project Setup

Phase 2 → Data Layer

Phase 3 → Resume Editor

Phase 4 → Templates

Phase 5 → Export

Phase 6 → Testing

Phase 7 → Release
```
