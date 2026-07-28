export type ExportFormat = 'pdf'

export type ExportStatus =
  | 'idle'
  | 'preparing'
  | 'rendering'
  | 'generating'
  | 'downloading'
  | 'completed'
  | 'failed'

export interface ExportState {
  status: ExportStatus
  error: string | null
  progress: number
}

export class ExportError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ExportError'
  }
}
