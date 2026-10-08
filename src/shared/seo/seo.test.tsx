import { renderToStaticMarkup } from 'react-dom/server'
import { describe, it, expect } from 'vitest'
import { Seo } from '@/shared/components/Seo/Seo'
import { resolveSiteOrigin, serializeJsonLd } from './brand'

describe('search metadata boundaries', () => {
  it('rejects invalid or path-based origins instead of silently publishing incorrect URLs', () => {
    expect(resolveSiteOrigin('https://resume.example/')).toBe('https://resume.example')
    for (const value of ['javascript:alert(1)', 'https://example.com/app', 'https://name:secret@example.com', 'https://example.com/?tracking=1', 'https://example.com/#fragment']) {
      expect(() => resolveSiteOrigin(value)).toThrow()
    }
  })

  it('keeps private routes out of canonical links, social previews, and structured data', () => {
    const html = renderToStaticMarkup(<Seo title="Private resume" description="Private workspace" path="/app" noindex structuredData={{ name: 'Private details' }} />)
    expect(html).toContain('noindex, nofollow')
    expect(html).not.toContain('canonical')
    expect(html).not.toContain('og:')
    expect(html).not.toContain('application/ld+json')
    expect(html).not.toContain('Private details')
  })

  it('escapes JSON-LD script boundaries without changing its data', () => {
    const payload = { name: '</script><script>alert("x")</script> & text' }
    const encoded = serializeJsonLd(payload)
    expect(encoded).not.toContain('</script>')
    expect(JSON.parse(encoded)).toEqual(payload)
  })
})
