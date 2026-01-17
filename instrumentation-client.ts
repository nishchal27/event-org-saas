// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Only initialize if DSN is provided and in production (or explicitly enabled)
if (SENTRY_DSN && (ENVIRONMENT === 'production' || process.env.ENABLE_SENTRY === 'true')) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance monitoring - only 10% sampling to avoid infinite loops
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0.01,

    // Session replay - disabled by default for performance
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1, // Only on errors

    // Enable logs to be sent to Sentry
    enableLogs: ENVIRONMENT === 'production',

    // Enable sending user PII (Personally Identifiable Information)
    sendDefaultPii: false, // Disable for privacy

    // Ignore common errors that aren't actionable
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
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
      const error = hint.originalException;
      if (error instanceof Error) {
        // Ignore camera permission errors (user action required)
        if (error.message.includes('Permission denied') || error.message.includes('NotAllowedError')) {
          return null;
        }
        // Ignore network errors (often transient)
        if (error.message.includes('fetch') || error.message.includes('network')) {
          return null;
        }
      }
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
