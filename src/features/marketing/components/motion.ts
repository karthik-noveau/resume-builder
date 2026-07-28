export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

export const viewportOnce = { once: true, margin: '-80px' } as const

/**
 * Fixed brand gradient for bookend sections (hero, privacy banner, final CTA).
 * Uses literal hex stops, not theme tokens — these sections must look identical
 * in light and dark mode, and `--color-primary`/`--color-accent` shift shade
 * between themes.
 */
export const BRAND_GRADIENT = 'linear-gradient(160deg, #0f172a 0%, #2563eb 55%, #7c3aed 100%)'
