# UI Layout Reference

ASCII wireframes of each top-level page, redrawn 2026-07-12 directly against
screenshots taken during a live re-audit of the running app (not from
memory). Useful as a quick-reference map of the app's screens without
needing to run it. Still an approximation — see the actual components under
`src/features/*` and `src/app/*` for exact markup.

## 1. Home (marketing landing page — `/`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ✦ Resume Studio      Home  My Resumes  Templates  Settings                         (☾) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ✦ Free forever · No sign-up · 100% offline                                           │
│                                                                                          │
│   Build a resume                                              ┌────────┐               │
│   that lands the                                          ┌────────┐ │ ← tilted, behind │
│   interview.                                           ┌────────┐    │ │                │
│         ^^^^^^^^^^^ (blue → violet gradient text)      │ Alex   │ ← │ │ ← tilted, behind │
│                                                         │ Morgan │   └─┘                │
│   Four ATS-friendly templates, full color and          │ ...... │                       │
│   font control, and instant PDF export — no            │ ...... │ ← front card, largest │
│   account, no cloud, no catch.                          │ ...... │                       │
│                                                         └────────┘                       │
│   ( Start Building → )   Browse Templates                                               │
│                                                                                          │
│   ▦ 4 templates    🛡 100% private    🎁 Free forever                                    │
│                                                                                          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Three overlapping resume-card previews fan out on the right (two tilted
copies peeking out behind, one larger upright card in front) — not a single
card. Headline wraps to 3 lines; "lands the interview." is the blue→violet
gradient portion. Source: `src/features/marketing/pages/HomePage.tsx`,
`HeroSection.tsx`.

## 2. My Resumes (Dashboard — `/app`, empty state)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ✦ Resume Studio      Home  [My Resumes]  Templates  Settings                        (☾) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  My Resumes                                              (⬆ Import Resume) (+ New Resume)│
│  Create your first resume                                                               │
│                                                                                          │
│                                                                                          │
│                                       ┌────┐                                            │
│                                       │ 📄 │  (circular icon badge)                      │
│                                       └────┘                                            │
│                                    No resumes yet                                       │
│                       Create your first resume to get started.                          │
│                              It only takes a few minutes.                               │
│                                                                                          │
│                                 ( + Create Resume )                                     │
│                                                                                          │
│                        (rest of page is empty, plain background)                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2b. My Resumes (with a resume)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│  My Resumes                                              (⬆ Import Resume) (+ New Resume)│
│  1 resume · Last edited just now                                                        │
│                                                                                          │
│  ( 🔍 Search resumes...        )  ( ↕ Last updated  v)                                   │
│                                                                                          │
│  ┌──────────────┐                                                                       │
│  │              │   ← thumbnail (white page, actual resume content rendered small)       │
│  │  Alex Morgan │                                                                       │
│  │  ...........│                                                                       │
│  │  ...........│                                                                       │
│  │              │                                                                       │
│  ├──────────────┤                                                                       │
│  │ Untitled Resume                                                                      │
│  │ Updated 12 Jul 2026                                                                   │
│  └──────────────┘                                                                       │
│  (additional cards would continue in a grid, wrapping left-to-right)                     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Search box and sort dropdown sit side by side, left-aligned, well short of
full width — they don't span the page. Each card is a single column (search
bar width ≈ card grid area); the "⋯" resume-actions menu button is part of
the card but only emphasized on hover (confirmed — it's invisible until
hover, not just de-emphasized). Card date format is `D Mon YYYY` (e.g.
"Updated 12 Jul 2026"), not `Mon D, YYYY`. Source:
`src/features/resume/pages/Dashboard.tsx`, `ResumeCard.tsx`.

## 3. Templates (`/templates`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ✦ Resume Studio      Home  My Resumes  [Templates]  Settings                        (☾) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  (All Templates) ( Fresher/Entry-level ) ( Experienced )  4 templates  (🔍 Search... )  │
│                                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐★RECOMMENDED  ✓┌──────────┐                     │
│  │▓▓ dark   │ │▓▓ chips  │ │ ATS SAFE                │ │█ Alex    │                     │
│  │▓▓ sidebar│ │▓▓ +badge │ │ Alex Morgan             │ │█ Morgan  │                     │
│  │▓▓ ......│ │▓▓ ......│ │ ..................       │ │█ ......  │                     │
│  └──────────┘ └──────────┘ └──────────┘              │ └──────────┘                     │
│  Foundation      Onyx          Clarity                    Monogram                       │
│  [Fresher]       [Fresher]     [Experienced]              [Experienced]                  │
│  Dark photo      Dark photo    Clean single-column         Bold color sidebar            │
│  sidebar with    sidebar with  layout with icon-            with a monogram              │
│  contact...      skill chips…  labeled sections...         mark, built...                │
│  ──────────      ──────────   ──────────                  ──────────                    │
│  ⓘATS 62% ●      ⓘATS 52% ●    ⓘATS 92% ●                   ⓘATS 68% ●                    │
│                                                                                          │
│                                                          ( ▦ Open in Builder )  ← floating│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

4-column card grid, all cards equal width. Only the "Recommended"/ATS-eligible
card (Clarity) shows the two pills + a filled checkmark badge in its
top-right corner. "Open in Builder" is a floating button pinned to the
bottom-right corner of the viewport, not part of the grid flow. Source:
`src/features/templates/pages/TemplateGallery.tsx`. The pill placement was
patched 2026-07-06 so the badges no longer overlap Clarity's name/headline
text — see `TemplateGallery.module.css` `.pillGroup` / `.previewButton`.

### 3b. Same component, "create resume" flow (`/templates?create=true`)

Reached via "+ Create Resume" from the empty dashboard (2.) or "+ New
Resume" from the top of the dashboard. Same grid, but three chrome
differences from the standalone Templates page:

```
│ ← Back to My Resumes                                                                     │
│ ✦ Choose Your Template                                                                    │
│ Pick a professional layout to build your resume — you can switch anytime without losing  │
│ your data.                                                                                │
│ (All Templates) ( Fresher/Entry-level ) ( Experienced )  4 templates  (🔍 Search... )    │
│ ...same 4-column grid...                                                                  │
│                                                          ( ✦ Create Resume )  ← floating  │
```

This mode keeps a page header; the standalone Templates tab does not. The
back link and step title are needed context inside the create flow, whereas
the library tab is already labelled by the top nav, so it opens straight
onto the filters row. The floating bottom-right button also reads "Create
Resume" (not "Open in Builder") — clicking it creates the resume and drops
straight into the Guided Editor (5.). Source: same `TemplateGallery.tsx`,
gated on a `create` search param.

## 4. Settings (`/settings`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ✦ Resume Studio      Home  My Resumes  Templates  [Settings]                        (☾) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  Settings                                                                                │
│  Defaults applied to every new resume you create.                                       │
│                                                                                          │
│  RESUME DEFAULTS                                                                         │
│  ┌──────────────────────────────────────────────┐   ┌───────────────────┐               │
│  │ 🎨  Default color theme                       │   │ PREVIEW           │               │
│  │     ( Light                             v )   │   │ ▓▓▓▓▓▓▓▓▓▓ (name) │               │
│  │     Applied automatically when you start...   │   │ ──────────────── │               │
│  │ ─────────────────────────────────────────     │   │ ──────────────── │               │
│  │ T   Default font family                       │   │ ──────────────── │               │
│  │     ( Professional                      v )   │   │                   │               │
│  │     Controls headings, body text, spacing...  │   │ ▓▓▓▓▓▓ (heading)  │               │
│  │ ─────────────────────────────────────────     │   │ ──────────────── │               │
│  │ 📄  Default page size                         │   │ ──────────────── │               │
│  │     ( A4 (210 × 297mm)                  v )   │   │                   │               │
│  │     Match the paper size your target region... │   │ This is how your  │              │
│  └──────────────────────────────────────────────┘   │ default color     │               │
│                                                       │ theme (Light) and │               │
│  APPEARANCE                                          │ font (Professional│               │
│  ┌──────────────────────────────────────────────┐   │ will look on a    │               │
│  │ ☀  Interface theme            ( Light | Dark )│   │ new resume.       │               │
│  │     Applies across the whole app, independent  │   └───────────────────┘               │
│  │     of resume color presets.                   │                                       │
│  └──────────────────────────────────────────────┘                                       │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Two-column layout: left column is the RESUME DEFAULTS + APPEARANCE cards
described above; right column is a sticky "Preview" card showing a greeked
placeholder resume that live-updates its accent color as the color-theme
dropdown changes, with a caption naming the currently-selected theme and
font. This preview column did not exist as of the 2026-07-06 audit — it's
new. Each row inside a settings card is icon + label/select/helper-text
stacked, separated by hairlines. Source:
`src/features/settings/pages/Settings.tsx`.

## 5. Guided Editor (`/editor/:id/guided`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ✦ ← Untitled Resume ✓Saved                                          ( ▦ Full Editor )    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← thin full-width bar
│                                                                                          │
│ (●) Personal details    ┌───────────────────────┐        Profile strength      100%     │
│     Contact & links     │ 👤  Personal details   │        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░           │
│ ( ) Summary             │     Step 1 of 5        │        ┌─────────────────┐            │
│     Your elevator pitch │                        │        │ Alex Morgan     │            │
│ ( ) Work experience     │ (+) Upload photo        │        │ Senior Product..│            │
│     Roles & achievemts  │                        │        │ ................│            │
│ ( ) Education           │ Full name               │        │ ................│            │
│     Degrees & schools   │ [ Alex Morgan        ]  │        └─────────────────┘            │
│ ( ) Skills              │ Professional headline   │        🛡 Private by default — this   │
│     Tools & strengths   │ [ Senior Product Mgr ]  │           preview and everything you  │
│                         │ Email                   │           type stay on your device.   │
│                         │ [ alex.morgan@...    ]  │                                       │
│ Every change saves      │ Phone / Location /      │                                       │
│ automatically — come    │ Website / LinkedIn ...  │                                       │
│ back anytime.           └───────────────────────┘                                        │
│                                       ( Back )  ( Next )  ← pinned, bare buttons          │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Three columns: step list (left) → active step's form in a white card
(center) → live preview + progress (right).

The two side rails are **chrome**: `--color-surface` plus a `--color-divider`
border on their inner edge, the same treatment `.header` and `.mobileStepper`
already use. The centre column is left transparent so `--color-background`
shows through, reading as the **canvas** the card floats on. The decorative
`.wash` blobs live inside `.stepMain` (not `.main`) for this reason — the
opaque rails would otherwise cover them, since both blobs sit in the corners.
`.stepContent` carries `position: relative; z-index: 1` to stay above them.

Nothing on this page scrolls except the inside of the card. `.stepCard` is a
fixed-height frame that fills the column down to just above the nav pill, so
its height is the same on every step regardless of how long the form is. It
is a flex column of two parts: `.stepCardHeader` (step title + counter) is
`flex-shrink: 0` and stays put, while `.stepCardBody` takes the remaining
space and is the only scroll container. Padding lives on those two children
rather than on `.stepCard` so the body's scrollbar sits flush with the
card's inner edge, and `.stepCard` is `overflow: hidden` so scrolled content
clips to its rounded corners.

Back/Next are two bare buttons (`.stepActionsBar` — a flex row with no
background, border or shadow) pinned at the bottom-right, below the card;
the two never overlap. `.stepActions` is the positioning strip:
centred on `.stepMain` with the same `max-width: 36rem` and horizontal
padding as `.stepContent`, so the pill's right edge lands exactly on the
card's right edge. The strip is `pointer-events: none` (only the pill is
clickable) so it can't swallow clicks meant for anything beneath it.
`.stepContent`'s bottom padding is what reserves the pill's band and
therefore sets where the card stops. Source:
`src/features/editor/pages/GuidedEditorPage.tsx`.

## 6. Full Editor (`/editor/:id`)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│✦ ← Untitled Resume ✓Saved      ↶ ↷ | 🔍- 100% 🔍+ ⛶        ☑          ( ⬇ Export PDF )   │
├───────────────┬──────────────────────────────────────────────┬─────────────────────────┤
│ SECTIONS      │                                              │ PERSONAL INFO       (⌃)  │
│ Profile str.  │  Alex Morgan                                 │ (◎) ( Upload photo )     │
│ 100%          │  Senior Product Manager                      │ Full name                │
│ ▓▓▓▓▓▓▓▓▓▓░░  │  Austin,TX · phone · email · alexmorgan.dev  │ [ Alex Morgan          ] │
│               │  ─────────────────────────────────────────   │ Professional headline    │
│ ≡  Summary  1 │  👤  Summary                                  │ [ Senior Product Mgr   ] │
│ ▤  Experience2│  Product manager with 7+ years shipping...    │ Email                    │
│ 🎓 Education 1│                                              │ [ alex.morgan@ex...    ] │
│ ⚡ Skills    2│  💼  Work Experience                          │ Phone                    │
│ 📁 Projects  1│  Senior Product Manager      Jan 2022–Present │ [ +1 (555) 123-4567    ] │
│ 🏅 Certs     1│  Northwind Systems                  Austin,TX │ Location                 │
│ ▤  Custom    1│   • Led a team of 4 designers and 12 eng...   │ [ Austin, TX           ] │
│               │   • Defined and drove the pricing strategy... │ Website / LinkedIn /     │
│ APPEARANCE (v)│   • Partnered with sales and support...       │ GitHub / Portfolio ...   │
│ + Add section │  Product Manager              Jun 2018–Dec 21 │                          │
│               │  Delta Cloud                          Remote  │                          │
│               │              ⌃ Page 1 of 2 ⌄  ← floating pill │                          │
└───────────────┴──────────────────────────────────────────────┴─────────────────────────┘
```

Toolbar (single row): brand + back + title + saved indicator, then
undo/redo, then zoom controls, then a checklist icon, then Export PDF —
all on one line, no wrapping. Left sidebar: section list with per-section
counts, then collapsible "Appearance" (templates/colors/fonts — this is
where template switching lives, not the toolbar), then "+ Add section".
Center: the actual resume canvas, with a floating "Page N of M" pill
docked bottom-center. Right: Personal Info form, collapsible via the
chevron next to its heading. Source: `src/features/editor/pages/EditorPage.tsx`,
`Toolbar.tsx`, `Sidebar.tsx`, `AppearancePanel.tsx`, `PropertiesPanel.tsx`,
`Canvas.tsx`.

## Notes from the 2026-07-06 audit

- App chrome brand color is violet (`--color-primary` in
  `src/styles/tokens.css`), independent of resume color presets (still blue
  by default) — see the `project_theme_architecture_coupling` memory for how
  that's wired. The resume canvas content (name, headline, section icons,
  divider) stays blue on purpose in every screenshot above.
- `e2e/` covers create → edit → template switch → export → delete across all
  six pages above; shared setup lives in `e2e/utils/flows.ts`.

## Notes from the 2026-07-12 re-audit

All six pages were re-checked live against a running `pnpm dev` instance.
Changes since 2026-07-06, folded into the sections above:

- **Settings gained a right-hand live Preview column** (section 4) — the
  biggest change. Previously the page was single-column with empty space on
  the right; now it's two-column with a sticky greeked-resume preview that
  reacts to the color-theme dropdown.
- **The Templates gallery has a second entry point** with different chrome
  (section 3b, `/templates?create=true`): reached from "Create Resume" /
  "New Resume" on the dashboard, it swaps the header, subhead, and floating
  button text, and adds a "Back to My Resumes" link, versus the standalone
  `/templates` page reached from the top nav.
- Dashboard resume-card dates render as `12 Jul 2026` (`D Mon YYYY`), not
  `Jul 5, 2026` as previously documented.
- Home, dashboard empty/populated states, Guided Editor, and Full Editor
  layouts (sections 1, 2, 2b, 5, 6) were confirmed unchanged from the prior
  audit.
