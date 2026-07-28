# Reference Specifications

The original ten specification documents this project was built from. They are
kept verbatim as the historical record of intent.

`architecture.md` at the root of `spec/` is the **current** authority and
describes the application as it is actually built. Where these reference
documents and `architecture.md` disagree, `architecture.md` wins — the
differences are real drift between the original plan and the shipped code, and
they are called out in the architecture document rather than quietly edited
away here.

| File | Document |
| --- | --- |
| `doc-1.md` | Master Specification (MSD) |
| `doc-2.md` | Technical Architecture Specification (TAS) |
| `doc-3.md` | Resume Data Schema Specification (RDSS) |
| `doc-4.md` | Design System Specification (DSS) |
| `doc-5.md` | Template Engine Specification (TES) |
| `doc-6.md` | Canvas Engine Specification (CES) |
| `doc-7.md` | Export Specification (EPS) |
| `doc-8.md` | Testing Specification (TS) |
| `doc-9.md` | Implementation Rules Specification (IRS) |
| `doc-10.md` | Execution Plan Specification (XPS) |

`ui-layouts.md` sits alongside them. Unlike the numbered documents it is not
historical — it is a maintained ASCII record of each screen *as implemented*,
with measured spacing and the reasoning behind specific layout decisions. It
complements `../ui-prototypes/` (which shows the screens) and
`../architecture.md` (which explains the flows).

## Known drift from these documents

- **Templates** — XPS phase 6 calls for seven templates; four are implemented
  (Foundation, Onyx, Clarity, Monogram).
- **Export** — EPS describes DOCX and plain-text export; only PDF exists.
- **ATS score** — presented per template as a fixed number, not computed from
  the user's resume.
- **Template definition fields** — `typography`, `spacing`, `pageLayout` and
  `sections` are declared on every template but read by nothing; each renderer
  hardcodes its own equivalents.
