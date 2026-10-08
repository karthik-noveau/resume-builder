import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import { loadEnv } from 'vite'

const site = new URL(loadEnv('production', process.cwd(), 'VITE_').VITE_SITE_URL || 'https://resume-studio.netlify.app').origin
const documentFor = async file => new JSDOM(await readFile(`dist/${file}`, 'utf8')).window.document
const sitemap = new JSDOM(await readFile('dist/sitemap.xml', 'utf8'), { contentType: 'text/xml' }).window.document
const routes = [...sitemap.querySelectorAll('loc')].map(node => new URL(node.textContent).pathname)
assert.ok(routes.includes('/') && routes.includes('/templates') && routes.includes('/guides'))
assert.equal(routes.length, new Set(routes).size, 'No duplicate sitemap URLs')
for (const route of routes) {
  const file = route === '/' ? 'index.html' : `${route.slice(1)}/index.html`
  const document = await documentFor(file)
  assert.equal(document.querySelectorAll('title').length, 1, `${route}: one title`)
  assert.match(document.title, /Resume/)
  assert.equal(document.querySelectorAll('meta[name="description"]').length, 1)
  assert.equal(document.querySelectorAll('link[rel="canonical"]').length, 1)
  assert.equal(document.querySelector('link[rel="canonical"]').href, `${site}${route}`)
  assert.equal(document.querySelector('meta[property="og:url"]').content, `${site}${route}`)
  assert.match(document.querySelector('meta[name="robots"]').content, /^index, follow/)
  assert.equal(document.querySelectorAll('h1').length, 1, `${route}: real content before JS`)
  assert.ok(document.querySelector('main'))
  const graph = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)['@graph']
  assert.ok(graph.some(node => node['@type'] === 'WebSite' && node.name === 'Resume Builder'))
  assert.ok(graph.some(node => node.url === `${site}${route}` && node.description))
  assert.ok(!JSON.stringify(graph).includes('aggregateRating'))
  for (const tag of document.querySelectorAll('link[rel="stylesheet"], link[rel="icon"], script[src]')) {
    const url = new URL(tag.getAttribute('href') || tag.getAttribute('src'), site)
    await access(`dist${url.pathname}`)
  }
  const image = new URL(document.querySelector('meta[property="og:image"]').content)
  assert.equal(image.origin, site)
  await access(`dist${image.pathname}`)
  assert.ok(document.querySelector('meta[property="og:image:alt"]').content)
}
for (const file of ['workspace.html', '404.html']) {
  const document = await documentFor(file)
  assert.match(document.querySelector('meta[name="robots"]').content, /noindex, nofollow/)
  assert.equal(document.querySelector('link[rel="canonical"]'), null)
  assert.equal(document.querySelector('meta[property="og:image"]'), null)
  assert.equal(document.querySelector('script[type="application/ld+json"]'), null)
}
assert.ok(routes.every(route => route === '/' || route === '/templates' || route === '/guides' || route.startsWith('/guides/')), 'Sitemap contains only public routes')
const robots = await readFile('dist/robots.txt', 'utf8')
assert.ok(robots.includes(`Sitemap: ${site}/sitemap.xml`))
assert.ok(!robots.includes('Disallow:'))
const manifest = JSON.parse(await readFile('dist/site.webmanifest', 'utf8'))
assert.equal(manifest.name, 'Resume Builder')
for (const icon of manifest.icons) await access(`dist${icon.src}`)
console.log('SEO checks passed: rendered public content, metadata, schema, assets, sitemap, and private-page exclusions.')
