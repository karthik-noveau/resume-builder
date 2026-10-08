# Resume Builder

A local-first resume workspace built with React, TypeScript, Vite, and IndexedDB. It includes 41 templates, guided and visual editors, PDF preview/export, a rules-based ATS review, and editable backups.

## Development

Use Node.js 22 and pnpm 10.21.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

```sh
pnpm test
pnpm lint
pnpm build
pnpm preview
pnpm audit --prod
```

CI runs the tests, lint, build, and production dependency audit on pull requests and pushes to main or master. Run the Playwright suite with `pnpm test:e2e` after installing its browsers; CI also runs the Chromium, Firefox and WebKit browser suites. Browser tests build the app and start an isolated production preview on port 5186. Failed checks retain traces and screenshots for inspection.

## Deploy

1. Copy `.env.example` to `.env.local` for a local build, or set `VITE_SITE_URL` in the host's environment. Use the actual public HTTPS origin, without a route or trailing slash.
2. Build with `pnpm build` and publish `dist` over HTTPS.
3. Netlify uses the included `netlify.toml`: prerendered public pages, private workspace rewrites, real HTTP 404 responses, security headers, immutable hashed assets, and revalidated HTML. Other hosts need equivalent configuration.
4. Verify direct navigation to `/templates`, `/app`, `/settings`, and `/editor/<id>`, and the generated `robots.txt`/`sitemap.xml` on the deployed origin.
5. Smoke-test creating a resume, reloading after an edit, PDF preview/download, and backup restore on the deployed site. Storage is origin-specific; localhost resumes do not automatically appear in production.

## Brand and search visibility

The public name is **Resume Builder** and the brand line is **Your story. Your next move.** Keep the single-line wordmark and violet document mark consistent. Public identity lives in `src/shared/seo/brand.ts`; public page titles, descriptions, and the structured-data graph live in `src/shared/seo/publicPages.ts`. Guide content lives in `src/features/marketing/content/guides.ts`; guide metadata and schema helpers live in `src/shared/config/`. Each published guide has a canonical URL, article metadata, breadcrumbs, and related links. Existing database names, backup formats, and storage keys deliberately retain their original identifiers so rebranding does not lose saved work.

`pnpm build` renders the actual public React pages to `dist/index.html`, `dist/templates/index.html`, and the guide pages under `dist/guides/` using bundled fonts and sample resumes. This runs in Node without Chromium or network services. The browser preserves that HTML while fonts and the initial route load, then React owns the interface and metadata. `pnpm test:seo` checks the emitted HTML, schema, canonical URLs, sitemap, social assets, and private-page directives. CI runs it after the build.

`VITE_SITE_URL` must be the final public origin. It controls every canonical URL, structured-data ID, social image URL, robots sitemap reference, and sitemap entry. The existing Netlify origin remains the default until a production domain is confirmed. Query variants of the gallery canonicalize to `/templates`. The sitemap includes the homepage, template gallery, guide index, and published guides. Private workspace and share pages send `noindex, nofollow` in both the initial HTML and Netlify response headers; do not block them in robots.txt, since crawlers must read those directives. Unknown paths return `404.html` with HTTP 404.

After deploying, verify the domain in Google Search Console and submit `/sitemap.xml`. Check the live home, gallery, and guide URLs with URL Inspection and social preview tools. Changing domains also requires redirects from the old origin and a plan for existing browser-local resumes. Schema describes real features and free pricing; it deliberately contains no invented reviews, ratings, or rich-result promises. Search engines choose whether and how to display results.

## Import and editing

Import a PDF, DOCX or TXT file (up to 10 MB), or paste text. Extraction runs locally; PDF import requires selectable text and supports up to 30 pages. Review the extracted contact details, jobs, education and other sections before creating a resume. Complex layouts may need correction; scanned PDFs need OCR before import.

Guided setup requires the key fields in each section before advancing: name and email, a summary, education, and a skill category with at least one skill. Work experience can be skipped by explicitly choosing **I don’t have work experience yet** when there are no work entries. Added work entries still require a company and role. Full Editor remains available at any point and preserves unfinished drafts without requiring completion. On mobile, Content, Design and Canvas have separate views. Click content on the canvas to select it, or double-click a text field to edit it. **Preview & export** opens the generated PDF for review, then **Export PDF** downloads that same file. Template thumbnails open a larger preview; only **Use template** creates a draft or applies a design.

Resume readiness shows completion guidance until career content has been added. Job descriptions and keywords are saved with each resume and included in backups, but are excluded from share links and PDF exports.

## Storage and recovery

Editable resumes and uploaded photos stay in IndexedDB in the current browser. There is no account or cloud synchronization. Clearing site data removes these copies. Private browsing may discard them when the session closes.

Settings → **Download backup** exports current resume content, design settings, and referenced photos to a JSON file. Version history and Trash are local recovery tools and are not included in this backup. Restore validates the file and adds fresh copies in one database transaction, without replacing existing resumes or workspace preferences. Backups are limited to 20 MB and 200 resumes. They contain personal information and should be stored privately. A PDF is a finished document, not an editable backup.

Saving is debounced, flushed on navigation, and warns before a tab closes with pending changes. The save shortcut commits the focused field. A temporary recovery copy in the same tab protects unfinished edits during reload and is removed after a successful save. A failed write stays visibly unsaved and can be retried. Saves compare a revision number in an IndexedDB transaction. A stale tab cannot overwrite a newer save: a conflict offers **Reload saved version** or **Save my draft as a copy**. Edits are not automatically merged.

The editor’s **Version history** button keeps the last 30 saved versions for each resume. Restoring an earlier version also preserves the current version. Deleting a resume moves it to **Trash** on the dashboard; restoring it brings back its photos and history. Permanent deletion requires confirmation and removes the resume’s photos and history. Uploaded photos that older versions or Undo may reference are retained until permanent deletion.

Share links default to a **Read-only preview** with a PDF download, without importing any resume or photo into the recipient’s workspace. **Editable copy** is also available, and existing links still open editable copies. These links contain a snapshot, not a hosted access-controlled document: recipients have the shared data, and later edits do not update it.

PDF export uses self-hosted Noto fallback fonts for extended Latin, Greek, Cyrillic, Tamil and Devanagari characters. Unsupported characters produce a clear export error instead of silently becoming missing glyphs; the original text remains in the editor. The Noto fonts come from [the Noto project](https://github.com/notofonts/noto-fonts) under the bundled [SIL Open Font License](public/fonts/Noto-LICENSE.txt).

## Product boundaries

This is a production-buildable **local-first application**, not an account-based subscription service. Authentication, cloud storage/sync, billing and entitlements, transactional email, hosted monitoring, and a support operation are not implemented. Adding those requires a selected backend and payment provider, credentials, access-control testing, and deployment verification. No deployment or payment service is provisioned by this repository.

The ATS score is an explained local rubric, not a score from an employer's ATS. Job matching uses editable keywords and aliases, not semantic hiring predictions. PDF/layout checks do not simulate a vendor parser. Automatic fixes preserve existing facts and support undo; users should review every export.

## Privacy and operations

The app has no resume-upload service or analytics. Logs are disabled in production. If monitoring is added, redact resume text, contact details, and photos. Fonts and assets are served with the app. The static host still handles normal HTTP requests; the product's local-data design does not replace the operator's privacy disclosures.
