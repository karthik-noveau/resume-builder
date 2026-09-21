# Resume Studio

A local-first resume workspace built with React, TypeScript, Vite, and IndexedDB. It includes 40 templates, guided and visual editors, PDF preview/export, a rules-based ATS review, and editable backups.

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

CI runs the tests, lint, build, and production dependency audit on pull requests and pushes to main. The existing Playwright suite can be run separately with `pnpm test:e2e` after installing its browsers; native Chrome review supplements the unit/integration suite.

## Deploy

1. Copy `.env.example` to `.env.local` for a local build, or set `VITE_SITE_URL` in the host's environment. Use the actual public HTTPS origin, without a route or trailing slash.
2. Build with `pnpm build` and publish `dist` over HTTPS.
3. Netlify uses the included `netlify.toml`: SPA fallback, security headers, immutable hashed assets, and revalidated HTML. Other hosts need equivalent configuration.
4. Verify direct navigation to `/templates`, `/app`, `/settings`, and `/editor/<id>`, and the generated `robots.txt`/`sitemap.xml` on the deployed origin.
5. Smoke-test creating a resume, reloading after an edit, PDF preview/download, and backup restore on the deployed site. Storage is origin-specific; localhost resumes do not automatically appear in production.

## Storage and recovery

Editable resumes and uploaded photos stay in IndexedDB in the current browser. There is no account or cloud synchronization. Clearing site data removes these copies. Private browsing may discard them when the session closes.

Settings → **Download backup** exports resume content, design settings, and referenced photos to a JSON file. Restore validates the file and adds fresh copies in one database transaction, without replacing existing resumes or workspace preferences. Backups are limited to 20 MB and 200 resumes. They contain personal information and should be stored privately. A PDF is a finished document, not an editable backup.

Saving is debounced, flushed on navigation, and warns before a tab closes with pending changes. A failed write stays visibly unsaved and can be retried. Avoid editing the same resume in multiple tabs at once; there is no cross-tab merge system.

## Product boundaries

This is a production-buildable **local-first application**, not an account-based subscription service. Authentication, cloud storage/sync, billing and entitlements, transactional email, hosted monitoring, and a support operation are not implemented. Adding those requires a selected backend and payment provider, credentials, access-control testing, and deployment verification. No deployment or payment service is provisioned by this repository.

The ATS score is an explained local rubric, not a score from an employer's ATS. Job matching uses editable keywords and aliases, not semantic hiring predictions. PDF/layout checks do not simulate a vendor parser. Automatic fixes preserve existing facts and support undo; users should review every export.

## Privacy and operations

The app has no resume-upload service or analytics. Logs are disabled in production. If monitoring is added, redact resume text, contact details, and photos. Fonts and assets are served with the app. The static host still handles normal HTTP requests; the product's local-data design does not replace the operator's privacy disclosures.
