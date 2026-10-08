import { fontRegistry } from '@/shared/services/font.registry'
import { logger } from '@/shared/services/logger'

export const fontsReady = fontRegistry.initialize().catch((error: unknown) => {
  logger.error('Fonts unavailable; using fallback typography', error)
})
