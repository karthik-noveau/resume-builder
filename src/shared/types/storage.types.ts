export type ImageMimeType = 'image/png' | 'image/jpeg' | 'image/webp'

export interface ImageAsset {
  id: string
  resumeId: string
  mimeType: ImageMimeType
  data: Uint8Array
  width: number
  height: number
  sizeBytes: number
  createdAt: string
}

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'StorageError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues?: string[]
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
