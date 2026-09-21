/** User-authored links may open websites, email or phone apps, never scripts. */
export function safeLink(value?: string): string | undefined {
  const trimmed = value?.trim() ?? ''
  try {
    const url = new URL(trimmed)
    if (!['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol)) return undefined
    return trimmed
  } catch {
    return undefined
  }
}
