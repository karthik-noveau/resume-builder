import { SITE_URL } from '@/shared/seo/brand'
export { BRAND, SITE_URL as SITE_ORIGIN, serializeJsonLd } from '@/shared/seo/brand'

export function siteUrl(path = '/'): string {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    throw new Error('Site paths must start with a single slash')
  }
  const url = new URL(path, SITE_URL)
  url.search = ''
  url.hash = ''
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'
  return url.href
}

export const PUBLIC_PAGES = {
  guides: {
    path: '/guides',
    title: 'Resume Writing Guides',
    description: 'Practical resume guides for choosing a layout, preparing for applicant tracking systems, and checking your PDF before you apply. Start with a free template.',
  },
} as const
