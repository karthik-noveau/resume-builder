import type { PDFDocument, PDFImage } from 'pdf-lib'

import { storageService } from '@/shared/services/storage.service'
import { logger } from '@/shared/services/logger'

export class ImageEmbedder {
  private embeddedImages = new Map<string, PDFImage>()

  constructor(private pdfDoc: PDFDocument) {}

  async getImage(imageId: string): Promise<PDFImage | null> {
    if (this.embeddedImages.has(imageId)) {
      return this.embeddedImages.get(imageId)!
    }

    try {
      const asset = await storageService.getImage(imageId)
      if (!asset) return null

      let image: PDFImage
      if (asset.mimeType === 'image/jpeg') {
        image = await this.pdfDoc.embedJpg(asset.data)
      } else if (asset.mimeType === 'image/png') {
        image = await this.pdfDoc.embedPng(asset.data)
      } else {
        // pdf-lib doesn't natively support webp, so we'd need to convert it
        // but the RDSS says we compress to JPEG quality 85 before storing
        // let's assume it's JPEG or PNG for now
        logger.warn('Unsupported image mimeType', { mimeType: asset.mimeType })
        return null
      }

      this.embeddedImages.set(imageId, image)
      return image
    } catch (error) {
      logger.error('Failed to embed image', error, { imageId })
      return null
    }
  }
}
