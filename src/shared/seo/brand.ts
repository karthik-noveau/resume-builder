/** Public identity. Storage keys intentionally keep their original names. */
export const BRAND = {
  name: 'Resume Builder',
  tagline: 'Your story. Your next move.',
  description: 'A free resume builder with professional templates, live editing, and PDF downloads. No account or watermarks.',
  defaultOrigin: 'https://resume-studio.netlify.app',
  logo: '/resume-builder-mark.svg',
  socialImage: '/og-resume-builder.png',
  socialImageAlt: 'Resume Builder — create, refine, and download a professional resume.',
  socialImageWidth: 1731,
  socialImageHeight: 909,
} as const

export function resolveSiteOrigin(value: string = BRAND.defaultOrigin): string {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('VITE_SITE_URL must be an HTTP(S) origin without credentials, a path, query, or fragment')
  }
  return url.origin
}

export const SITE_URL = resolveSiteOrigin(import.meta.env.VITE_SITE_URL || BRAND.defaultOrigin)

export function serializeJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}
