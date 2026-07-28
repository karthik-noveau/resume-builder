# UI Prototype

The approved UI as static HTML. This is the visual source of truth: the React
implementation must match these screens, and no redesign happens in React
without updating the prototype first.

## Running it

Open `index.html` in a browser. That is the whole procedure — there is no
build step, no dev server, no package install, and no network access required.

```
open spec/ui-prototypes/index.html
```

## Structure

```
ui-prototypes/
├── index.html              entry point — links to every screen
├── assets/
│   ├── css/mockups.css     all styling, design tokens, 8 inlined web fonts
│   ├── js/mockups.js       UI-only interactions
│   ├── images/             (fonts and imagery are inlined; kept for future use)
│   ├── icons/
│   └── fonts/
├── pages/
│   ├── home.html           /
│   ├── my-resumes.html     /app
│   ├── templates.html      /templates
│   ├── guided-editor.html  /editor/:id/guided
│   ├── full-editor.html    /editor/:id
│   ├── settings.html       /settings
│   └── all-screens.html    all six screens in one file, switched by the tab bar
└── README.md
```

Every page links to every other page through the bar at the top, so the
prototype can be walked end to end without returning to `index.html`.

## What the JavaScript may do

`assets/js/mockups.js` is vanilla and strictly presentational. It drives the
theme toggle, tab switching, the template modal, category filters, colour
swatches and font selection.

It must never gain business logic, data fetching, persistence, or a framework.
If a behaviour cannot be demonstrated with a class toggle, it belongs in the
React app, not here.

## Assets

There are no external requests. All eight web fonts are inlined into
`mockups.css` as `data:` URIs, and every icon is an inline `<svg>`. The
`images/`, `icons/` and `fonts/` directories are kept as the required
structure for future assets that cannot be inlined.

## Coverage

| Requirement | Where |
| --- | --- |
| Landing page | `home.html` |
| Dashboard | `my-resumes.html` |
| Every application page | all six page files |
| Header / navigation | every page |
| Sidebar | `full-editor.html`, `guided-editor.html` |
| Footer | `home.html` |
| Cards | `my-resumes.html`, `templates.html` |
| Tables / lists | `full-editor.html` section list |
| Forms | `guided-editor.html`, `full-editor.html`, `settings.html` |
| Buttons | every page |
| Dialogs | `templates.html` template preview modal |
| Drawers | `full-editor.html` mobile panels |
| Dropdowns | `my-resumes.html` sort control |
| Tabs | `full-editor.html` appearance panel, page nav bar |
| Notifications | `home.html` privacy banner |
| Empty states | `my-resumes.html` |
| Loading states | `full-editor.html` canvas skeleton |
| Error states | `my-resumes.html` |
| Responsive layouts | all pages — mobile, tablet, laptop, desktop, ultra-wide |
