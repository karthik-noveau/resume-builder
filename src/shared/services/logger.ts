type LogContext = Record<string, unknown>

interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: unknown, context?: LogContext): void
}

const isDev = import.meta.env.DEV

const devLogger: Logger = {
  debug(message, context) {
    console.debug(`[DEBUG] ${message}`, context ?? '')
  },
  info(message, context) {
    console.info(`[INFO] ${message}`, context ?? '')
  },
  warn(message, context) {
    console.warn(`[WARN] ${message}`, context ?? '')
  },
  error(message, error, context) {
    console.error(`[ERROR] ${message}`, error ?? '', context ?? '')
  },
}

const noopLogger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
}

export const logger: Logger = isDev ? devLogger : noopLogger
