/* eslint-disable react-refresh/only-export-components -- Node-only build entry; never a Fast Refresh boundary. */
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router'
import { Providers } from './app/providers'
import { AppShell } from './app/AppShell'
import { HomePage } from './features/marketing/pages/HomePage'
import { TemplateGallery } from './features/templates/pages/TemplateGallery'
import { GuidesPage } from './features/marketing/pages/GuidesPage'
import { RESUME_GUIDES } from './features/marketing/content/guides'
import { NotFound } from './shared/pages/NotFound'
import { Seo } from './shared/components/Seo/Seo'
import { BRAND, SITE_URL } from './shared/seo/brand'
import { fontRegistry } from './shared/services/font.registry'

export { BRAND, SITE_URL }
export const GUIDE_PATHS = ['/guides', ...RESUME_GUIDES.map((guide) => `/guides/${guide.slug}`)]
export const initializeFonts = (loader: (path: string) => Promise<ArrayBuffer>) => fontRegistry.initialize(loader)

/** Render the real public components with sample data only; never open a user's database. */
export function renderPage(path: string) {
  return renderToStaticMarkup(
    <html lang="en">
      <head />
      <body>
        <div id="root">
          <Providers>
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route element={<AppShell />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/templates" element={<TemplateGallery />} />
                  <Route path="/guides" element={<GuidesPage />} />
                  <Route path="/guides/:slug" element={<GuidesPage />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </MemoryRouter>
          </Providers>
        </div>
      </body>
    </html>
  )
}

export function renderWorkspaceMetadata() {
  return renderToStaticMarkup(<Seo title="Your workspace" description={BRAND.description} noindex />)
}
