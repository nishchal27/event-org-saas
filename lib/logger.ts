/**
 * Centralized logging and error tracking system
 * Optimized for performance - all operations are async and non-blocking
 */

// Extend Window interface for Sentry
declare global {
  interface Window {
    Sentry?: {
      captureException: (error: Error, options?: any) => void
      captureMessage: (message: string, options?: any) => void
    }
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, any>

interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  userId?: string
  organizationId?: string
  feature?: string
  error?: Error
}

// In-memory buffer for batching logs (prevents blocking)
let logBuffer: LogEntry[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_INTERVAL = 5000 // 5 seconds
const MAX_BUFFER_SIZE = 50

/**
 * Browser-compatible async execution
 * Uses setImmediate in Node.js, setTimeout in browsers
 */
function nextTick(callback: () => void) {
  if (typeof setImmediate !== 'undefined') {
    // Node.js environment
    setImmediate(callback)
  } else {
    // Browser environment
    setTimeout(callback, 0)
  }
}

/**
 * Flush logs to Sentry and console (non-blocking)
 */
async function flushLogs() {
  if (logBuffer.length === 0) return

  const logsToFlush = [...logBuffer]
  logBuffer = []

  // Flush asynchronously without blocking
  nextTick(() => {
    logsToFlush.forEach((log) => {
      // Console logging (only in development or for errors)
      if (process.env.NODE_ENV === 'development' || log.level === 'error') {
        const consoleMethod = log.level === 'error' ? console.error : console.log
        consoleMethod(`[${log.level.toUpperCase()}] ${log.message}`, log.context || '')
      }

      // Send to Sentry for errors and warnings (client-side only)
      if (typeof window !== 'undefined' && window.Sentry) {
        try {
          if (log.level === 'error' && log.error) {
            window.Sentry.captureException(log.error, {
              level: log.level,
              tags: {
                feature: log.feature,
                userId: log.userId,
                organizationId: log.organizationId,
              },
              extra: log.context,
            })
          } else if (log.level === 'warn') {
            window.Sentry.captureMessage(log.message, {
              level: 'warning',
              tags: {
                feature: log.feature,
              },
              extra: log.context,
            })
          }
        } catch (err) {
          // Silently fail if Sentry is not available
        }
      }
    })
  })
}

/**
 * Schedule log flush (debounced)
 */
function scheduleFlush() {
  if (flushTimer) {
    clearTimeout(flushTimer)
  }
  flushTimer = setTimeout(flushLogs, FLUSH_INTERVAL)

  // Force flush if buffer is too large
  if (logBuffer.length >= MAX_BUFFER_SIZE) {
    flushLogs()
  }
}

/**
 * Core logging function (non-blocking)
 */
function log(
  level: LogLevel,
  message: string,
  options?: {
    context?: LogContext
    userId?: string
    organizationId?: string
    feature?: string
    error?: Error
  }
) {
  const entry: LogEntry = {
    level,
    message,
    context: options?.context,
    timestamp: new Date().toISOString(),
    userId: options?.userId,
    organizationId: options?.organizationId,
    feature: options?.feature,
    error: options?.error,
  }

  logBuffer.push(entry)
  scheduleFlush()

  // For critical errors, flush immediately
  if (level === 'error' && options?.error) {
    nextTick(flushLogs)
  }
}

/**
 * Public logging API
 */
export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === 'development') {
      log('debug', message, { context })
    }
  },

  info: (message: string, context?: LogContext) => {
    log('info', message, { context })
  },

  warn: (message: string, context?: LogContext) => {
    log('warn', message, { context })
  },

  error: (
    message: string,
    error?: Error | unknown,
    context?: {
      feature?: string
      userId?: string
      organizationId?: string
      [key: string]: any
    }
  ) => {
    const err = error instanceof Error ? error : new Error(String(error))
    log('error', message, {
      error: err,
      context: context as LogContext,
      feature: context?.feature,
      userId: context?.userId,
      organizationId: context?.organizationId,
    })
  },

  // Feature-specific logging helpers
  qrScan: {
    error: (message: string, error: Error, context?: LogContext) => {
      logger.error(message, error, { feature: 'qr_scan', ...context })
    },
    info: (message: string, context?: LogContext) => {
      logger.info(message, { feature: 'qr_scan', ...context })
    },
  },

  checkIn: {
    error: (message: string, error: Error, context?: LogContext) => {
      logger.error(message, error, { feature: 'check_in', ...context })
    },
    info: (message: string, context?: LogContext) => {
      logger.info(message, { feature: 'check_in', ...context })
    },
  },

  event: {
    error: (message: string, error: Error, context?: LogContext) => {
      logger.error(message, error, { feature: 'event', ...context })
    },
    info: (message: string, context?: LogContext) => {
      logger.info(message, { feature: 'event', ...context })
    },
  },

  whatsapp: {
    error: (message: string, error: Error, context?: LogContext) => {
      logger.error(message, error, { feature: 'whatsapp', ...context })
    },
    info: (message: string, context?: LogContext) => {
      logger.info(message, { feature: 'whatsapp', ...context })
    },
  },
}

/**
 * Track analytics events (lightweight, non-blocking)
 */
export const analytics = {
  track: async (
    event: string,
    properties?: Record<string, any>,
    userId?: string,
    organizationId?: string
  ) => {
    // Non-blocking analytics tracking
    nextTick(async () => {
      try {
        // Store in database for analytics dashboard
        if (typeof window !== 'undefined') {
          // Client-side: send to API
          await fetch('/api/analytics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event,
              properties,
              userId,
              organizationId,
              timestamp: new Date().toISOString(),
            }),
          }).catch(() => {
            // Silently fail - don't block the app
          })
        }
      } catch (err) {
        // Silently fail - analytics should never break the app
      }
    })
  },
}

/**
 * Flush all pending logs (call on app shutdown)
 */
export function flushAllLogs() {
  if (flushTimer) {
    clearTimeout(flushTimer)
  }
  return flushLogs()
}
