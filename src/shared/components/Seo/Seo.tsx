import { BRAND, SITE_ORIGIN, serializeJsonLd, siteUrl } from '@/shared/config/site'

export interface SeoProps {
  title: string
  description: string
  path?: string
  noindex?: boolean
  image?: string
  imageAlt?: string
  appendSiteName?: boolean
  type?: 'website' | 'article'
  structuredData?: Record<string, unknown>
  children?: React.ReactNode
}

/** React 19 owns these tags after the build-time snapshot is handed over in main.tsx. */
export function Seo({ title, description, path, noindex = false,
  image = BRAND.socialImage, imageAlt = BRAND.socialImageAlt,
  appendSiteName = true, type = 'website', structuredData, children,
}: SeoProps) {
  const fullTitle = appendSiteName ? `${title} · ${BRAND.name}` : title
  const canonical = !noindex && path ? siteUrl(path) : undefined
  const imageUrl = new URL(image, SITE_ORIGIN).href

  return (
    <>
      <title data-seo="true">{fullTitle}</title>
      <meta data-seo="true" name="description" content={description} />
      <meta data-seo="true" name="robots" content={noindex
        ? 'noindex, nofollow'
        : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      {canonical && <link data-seo="true" rel="canonical" href={canonical} />}
      {!noindex && (
        <>
          <meta data-seo="true" property="og:type" content={type} />
          <meta data-seo="true" property="og:site_name" content={BRAND.name} />
          <meta data-seo="true" property="og:locale" content="en_US" />
          <meta data-seo="true" property="og:title" content={fullTitle} />
          <meta data-seo="true" property="og:description" content={description} />
          <meta data-seo="true" property="og:image" content={imageUrl} />
          <meta data-seo="true" property="og:image:alt" content={imageAlt} />
          <meta data-seo="true" property="og:image:type" content="image/png" />
          <meta data-seo="true" property="og:image:width" content={String(BRAND.socialImageWidth)} />
          <meta data-seo="true" property="og:image:height" content={String(BRAND.socialImageHeight)} />
          {canonical && <meta data-seo="true" property="og:url" content={canonical} />}
          <meta data-seo="true" name="twitter:card" content="summary_large_image" />
          <meta data-seo="true" name="twitter:title" content={fullTitle} />
          <meta data-seo="true" name="twitter:description" content={description} />
          <meta data-seo="true" name="twitter:image" content={imageUrl} />
          <meta data-seo="true" name="twitter:image:alt" content={imageAlt} />
        </>
      )}
      {!noindex && structuredData && <script data-seo="true" type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(structuredData) }} />}
      {children}
    </>
  )
}

export default Seo
