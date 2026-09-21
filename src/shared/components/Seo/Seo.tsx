/**
 * Per-page document metadata.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` rendered anywhere in the
 * tree up into `<head>`, so this needs no helmet-style provider. The static
 * tags in index.html were removed for the same reason: React appends rather
 * than replaces, and two `<title>` elements mean the first one wins — which
 * would have pinned every route to the index.html title.
 */

const SITE_NAME = 'Resume Studio'

/** Override per environment with VITE_SITE_URL; canonical/og URLs must be absolute. */
const SITE_URL = new URL(import.meta.env.VITE_SITE_URL || 'https://resume-studio.netlify.app')
  .origin

const DEFAULT_IMAGE = '/og-image.png'

export interface SeoProps {
  /** Page-specific title. The site name is appended unless `appendSiteName` is false. */
  title: string
  description: string
  /** Absolute path for the canonical URL, e.g. `/templates`. Omit on noindex pages. */
  path?: string
  /** Keep private/app routes out of the index. */
  noindex?: boolean
  /** Root-relative path to the social share image. */
  image?: string
  appendSiteName?: boolean
  children?: React.ReactNode
}

export function Seo({
  title,
  description,
  path,
  noindex = false,
  image = DEFAULT_IMAGE,
  appendSiteName = true,
  children,
}: SeoProps) {
  const fullTitle = appendSiteName ? `${title} · ${SITE_NAME}` : title
  const canonical = path ? `${SITE_URL}${path}` : undefined
  const imageUrl = `${SITE_URL}${image}`

  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph and Twitter cards only matter where the page can be shared. */}
      {!noindex && (
        <>
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content={SITE_NAME} />
          <meta property="og:title" content={fullTitle} />
          <meta property="og:description" content={description} />
          <meta property="og:image" content={imageUrl} />
          {canonical && <meta property="og:url" content={canonical} />}

          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={fullTitle} />
          <meta name="twitter:description" content={description} />
          <meta name="twitter:image" content={imageUrl} />
        </>
      )}

      {children}
    </>
  )
}

export default Seo
