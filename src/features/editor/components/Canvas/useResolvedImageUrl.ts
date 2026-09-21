import { useEffect, useState } from 'react'
import { imageService } from '@/shared/services/image.service'
import { getBuiltinImageUrl } from '@/shared/utils/profileAvatar'

/** Resolves an ImageAsset id (IndexedDB reference) to a displayable blob URL. */
export function useResolvedImageUrl(imageId: string | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    const builtinUrl = getBuiltinImageUrl(imageId)
    if (builtinUrl) {
      setUrl(builtinUrl)
      return
    }
    if (!imageId) {
      setUrl(null)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    void imageService.getImageDataUrl(imageId).then((resolved) => {
      if (cancelled) {
        if (resolved) URL.revokeObjectURL(resolved)
        return
      }
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
