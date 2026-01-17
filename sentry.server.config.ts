// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
const ENVIRONMENT = process.env.NODE_ENV || 'development';

// Only initialize if DSN is provided and in production (or explicitly enabled)
if (SENTRY_DSN && (ENVIRONMENT === 'production' || process.env.ENABLE_SENTRY === 'true')) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: ENVIRONMENT,

    // Performance monitoring - only 10% sampling to avoid infinite loops
    tracesSampleRate: ENVIRONMENT === 'production' ? 0.1 : 0.01,

    // Enable logs to be sent to Sentry
    enableLogs: ENVIRONMENT === 'production',

    // Enable sending user PII (Personally Identifiable Information)
    sendDefaultPii: false, // Disable for privacy

    // Ignore common errors that aren't actionable
    ignoreErrors: [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
    ],
  });
}
