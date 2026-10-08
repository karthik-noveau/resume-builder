import { it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { GuidesPage } from './GuidesPage'
import { RESUME_GUIDES } from '../content/guides'

function open(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/guides" element={<GuidesPage />} />
    <Route path="/guides/:slug" element={<GuidesPage />} />
  </Routes></MemoryRouter>)
}

it('makes every guide discoverable from the index', () => {
  open('/guides')
  for (const guide of RESUME_GUIDES) {
    expect(screen.getByRole('link', { name: new RegExp(guide.title) })).toHaveAttribute('href', `/guides/${guide.slug}`)
  }
  expect(screen.getByRole('link', { name: 'Build my resume' })).toHaveAttribute('href', '/templates?create=true')
})

it.each(RESUME_GUIDES)('renders the complete $slug guide, navigation, and matching article schema', (guide) => {
  const { container } = open(`/guides/${guide.slug}`)
  expect(screen.getByRole('heading', { level: 1, name: guide.title })).toBeVisible()
  const article = screen.getByRole('article', { name: guide.title })
  for (const section of guide.sections) {
    expect(within(article).getByRole('heading', { level: 2, name: section.title })).toBeVisible()
  }
  const structured = JSON.parse(container.querySelector('script[type="application/ld+json"]')!.textContent) as { '@graph': Record<string, unknown>[] }
  expect(structured['@graph'].find((node) => node['@type'] === 'Article')?.headline).toBe(guide.title)
  expect(within(screen.getByRole('navigation', { name: 'Related guides' })).getAllByRole('link')).toHaveLength(RESUME_GUIDES.length - 1)
})

it('returns a noindex error for an unknown guide instead of duplicating the index', () => {
  open('/guides/not-a-guide')
  expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  expect(document.head.querySelector('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
  expect(document.head.querySelector('link[rel="canonical"]')).toBeNull()
})
