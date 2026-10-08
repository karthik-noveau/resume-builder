import { ALL_TEMPLATES } from '@/features/templates/registry/template.registry'
import { BRAND, SITE_URL } from './brand'

export const PUBLIC_PAGES = {
  home: {
    title: 'Free Resume Builder — PDF Downloads, No Sign-Up',
    description: `Build a professional resume with ${ALL_TEMPLATES.length} free templates. Customize your layout, edit live, and download a PDF without watermarks. No sign-up required.`,
    path: '/',
  },
  templates: {
    title: 'Free Resume Templates — Resume Builder',
    description: `Explore ${ALL_TEMPLATES.length} free resume templates in simple and modern styles. Compare one- and two-column layouts, customize your design, and download a PDF.`,
    path: '/templates',
  },
} as const

export function publicPageSchema(page: keyof typeof PUBLIC_PAGES): Record<string, unknown> {
  const metadata = PUBLIC_PAGES[page]
  const url = `${SITE_URL}${metadata.path}`
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: BRAND.name,
        url: `${SITE_URL}/`,
        description: BRAND.description,
        inLanguage: 'en',
      },
      {
        '@type': page === 'home' ? 'WebPage' : 'CollectionPage',
        '@id': `${url}#webpage`,
        url,
        name: metadata.title,
        description: metadata.description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        inLanguage: 'en',
        ...(page === 'home'
          ? { mainEntity: { '@id': `${SITE_URL}/#application` } }
          : {
              breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
                  { '@type': 'ListItem', position: 2, name: 'Resume templates', item: url },
                ],
              },
            }),
      },
      ...(page === 'home' ? [{
        '@type': 'SoftwareApplication',
        '@id': `${SITE_URL}/#application`,
        name: BRAND.name,
        url: `${SITE_URL}/`,
        image: `${SITE_URL}${BRAND.socialImage}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web browser',
        browserRequirements: 'Requires JavaScript and a modern web browser.',
        description: BRAND.description,
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        featureList: [
          `${ALL_TEMPLATES.length} resume templates`,
          'Live resume preview',
          'Custom colors and typography',
          'Selectable-text PDF export without watermarks',
          'Local browser storage; no account required',
        ],
      }] : []),
    ],
  }
}
