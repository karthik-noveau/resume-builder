import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { pathToFileURL } from 'node:url'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const dist = path.join(root, 'dist')
// A Node-only build avoids browsers, a dev server, and network access in CI.
const rendererDirectory = path.join(root, 'node_modules/.tmp/prerender')
await build({
  configFile: false,
  plugins: [react()],
  resolve: { alias: { '@': path.join(root, 'src') } },
  build: { ssr: 'src/prerender.tsx', outDir: rendererDirectory, emptyOutDir: true },
})
const { renderPage, renderWorkspaceMetadata, initializeFonts, BRAND, SITE_URL, GUIDE_PATHS } = await import(pathToFileURL(path.join(rendererDirectory, 'prerender.js')).href)
{

  await initializeFonts(async (fontPath) => {
    const buffer = await readFile(path.join(root, 'public', fontPath))
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  })
  const shell = await readFile(path.join(dist, 'index.html'), 'utf8')
  const manifest = JSON.parse(await readFile(path.join(dist, '.vite/manifest.json'), 'utf8'))
  function stylesFor(entry) {
    const files = new Set()
    const visited = new Set()
    function visit(key) {
      if (visited.has(key)) return
      visited.add(key)
      const chunk = manifest[key]
      if (!chunk) throw new Error(`Missing manifest entry: ${key}`)
      for (const css of chunk.css ?? []) files.add(css)
      for (const dependency of chunk.imports ?? []) visit(dependency)
    }
    visit(entry)
    return [...files].filter(file => !shell.includes(`/${file}`)).map(file => `<link rel="stylesheet" href="/${file}">`).join('')
  }
  const pages = [
    { path: '/', file: 'index.html', entry: 'src/features/marketing/pages/HomePage.tsx' },
    { path: '/templates', file: 'templates/index.html', entry: 'src/features/templates/pages/TemplateGallery.tsx' },
    ...GUIDE_PATHS.map(route => ({ path: route, file: `${route.slice(1)}/index.html`, entry: 'src/features/marketing/pages/GuidesPage.tsx' })),
    { path: '/404', file: '404.html', entry: 'src/shared/pages/NotFound.tsx' },
  ]
  for (const page of pages) {
    const rendered = renderPage(page.path)
    const head = rendered.match(/<head>([\s\S]*?)<\/head>/)?.[1]
    const body = rendered.match(/<body>([\s\S]*)<\/body>/)?.[1]
    if (!head || !body) throw new Error(`Failed to render ${page.path}`)
    const html = shell.replace('<!--app-head-->', head + stylesFor(page.entry))
      .replace('<div id="root"></div>', body)
      .replace('<html lang="en">', '<html lang="en" data-prerendered="true">')
    const output = path.join(dist, page.file)
    await mkdir(path.dirname(output), { recursive: true })
    await writeFile(output, html)
    console.log(`Prerendered ${page.path} (${Math.round(Buffer.byteLength(html) / 1024)} kB)`)
  }
  // Private routes get a separate shell, never the public homepage's metadata.
  await writeFile(path.join(dist, 'workspace.html'), shell.replace('<!--app-head-->', renderWorkspaceMetadata()))
  const xmlOrigin = SITE_URL.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
  await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.filter(page => page.path !== '/404').map(page => `<url><loc>${xmlOrigin}${page.path}</loc></url>`).join('')}</urlset>\n`)
  // Let crawlers read noindex directives; robots.txt is not access control.
  await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`)
  await writeFile(path.join(dist, 'site.webmanifest'), JSON.stringify({
    name: BRAND.name,
    short_name: BRAND.name,
    description: BRAND.description,
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fcfbff',
    theme_color: '#7c3aed',
    lang: 'en',
    icons: [
      { src: BRAND.logo, sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/resume-builder-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }, null, 2) + '\n')
}
