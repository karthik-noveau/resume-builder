import { BRAND, siteUrl } from './site'

const websiteId = `${siteUrl()}#website`

export function websiteSchema() {
  return {
    '@type': 'WebSite', '@id': websiteId, name: BRAND.name,
    url: siteUrl(), description: BRAND.description, inLanguage: 'en',
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem', position: index + 1, name: item.name, item: siteUrl(item.path),
    })),
  }
}

export function pageSchema(path: string, name: string, description: string, type = 'WebPage') {
  return {
    '@type': type, '@id': `${siteUrl(path)}#webpage`, url: siteUrl(path),
    name, description, inLanguage: 'en', isPartOf: { '@id': websiteId },
  }
}

export function schemaGraph(...nodes: Record<string, unknown>[]) {
  return { '@context': 'https://schema.org', '@graph': [websiteSchema(), ...nodes] }
}
