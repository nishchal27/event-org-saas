/**
 * Sentry Client Configuration
 * Only loads in production or when SENTRY_DSN is set
 */

import * as Sentry from '@sentry/nextjs'

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN
const ENVIRONMENT = process.env.NODE_ENV || 'development'

if (SENTRY_DSN && ENVIRONMENT === 'production') {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions (lightweight)
    
    // Session replay (disabled by default for performance)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1, // Only on errors
    
    // Ignore common errors that aren't actionable
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      'conduitPage',
      // Network errors
      'NetworkError',
      'Failed to fetch',
      'Network request failed',
      // QR Scanner specific
      'No QR code found',
      'QR code parse error',
    ],
    
    // Filter out noisy errors
    beforeSend(event, hint) {
      // Don't send if it's a known non-critical error
      const error = hint.originalException
      if (error instanceof Error) {
        // Ignore camera permission errors (user action required)
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          return null
        }
        // Ignore network errors (often transient)
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return null
        }
      }
      return event
    },
    
    // BrowserTracing is automatically included in @sentry/nextjs
    // No need to manually add it
  })
}
