import type { ImageAsset, ImageMimeType } from '@/shared/types/storage.types'
import { StorageError } from '@/shared/types/storage.types'
import { storageService } from './storage.service'
import { logger } from './logger'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB
const MAX_DIMENSION_PX = 400
const JPEG_QUALITY = 0.85

class ImageServiceImpl {
  async processProfileImage(file: File, resumeId: string): Promise<ImageAsset> {
    if (file.size > MAX_SIZE_BYTES) {
      throw new StorageError(`Image exceeds 2 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`)
    }

    const validTypes: ImageMimeType[] = ['image/png', 'image/jpeg', 'image/webp']
    if (!validTypes.includes(file.type as ImageMimeType)) {
      throw new StorageError(`Unsupported image type: ${file.type}. Use PNG, JPEG, or WEBP.`)
    }

    const { data, width, height } = await this.resizeAndCompress(file)

    const asset: ImageAsset = {
      id: crypto.randomUUID(),
      resumeId,
      mimeType: 'image/jpeg',
      data,
      width,
      height,
      sizeBytes: data.byteLength,
      createdAt: new Date().toISOString(),
    }

    await storageService.saveImage(asset)
    logger.debug('Profile image processed', { id: asset.id, width, height, sizeBytes: asset.sizeBytes })
    return asset
  }

  async getImageDataUrl(id: string): Promise<string | null> {
    const asset = await storageService.getImage(id)
    if (!asset) return null

    const blob = new Blob([asset.data.buffer as ArrayBuffer], { type: asset.mimeType })
    return URL.createObjectURL(blob)
  }

  async deleteImage(id: string): Promise<void> {
    await storageService.deleteImage(id)
  }

  private async resizeAndCompress(
    file: File
  ): Promise<{ data: Uint8Array; width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const objectUrl = URL.createObjectURL(file)

      img.onload = () => {
        URL.revokeObjectURL(objectUrl)

        const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(img.width, img.height))
        const width = Math.round(img.width * scale)
        const height = Math.round(img.height * scale)

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new StorageError('Failed to get canvas 2D context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new StorageError('Failed to compress image'))
              return
            }
            blob
              .arrayBuffer()
              .then((buf) => resolve({ data: new Uint8Array(buf), width, height }))
              .catch(reject)
          },
          'image/jpeg',
          JPEG_QUALITY
        )
      }

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new StorageError('Failed to load image for processing'))
      }

      img.src = objectUrl
    })
  }
}

export const imageService = new ImageServiceImpl()
