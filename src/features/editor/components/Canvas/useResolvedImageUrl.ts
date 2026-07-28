import { useEffect, useState } from 'react'
import { imageService } from '@/shared/services/image.service'

/** Resolves an ImageAsset id (IndexedDB reference) to a displayable blob URL. */
export function useResolvedImageUrl(imageId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!imageId) {
      setUrl(null)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    void imageService.getImageDataUrl(imageId).then((resolved) => {
      if (cancelled) return
      objectUrl = resolved
      setUrl(resolved)
    })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId])

  return url
}
