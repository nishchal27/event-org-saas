/**
 * Lightweight analytics tracking system
 * Tracks key events without affecting app performance
 */

export type AnalyticsEvent =
  | 'qr_scan_started'
  | 'qr_scan_success'
  | 'qr_scan_error'
  | 'qr_scan_permission_denied'
  | 'check_in_success'
  | 'check_in_error'
  | 'check_in_manual'
  | 'event_created'
  | 'event_updated'
  | 'event_deleted'
  | 'whatsapp_invite_sent'
  | 'whatsapp_invite_failed'
  | 'user_signup'
  | 'user_login'
  | 'page_view'

export interface AnalyticsProperties {
  eventId?: string
  attendeeId?: string
  errorType?: string
  errorMessage?: string
  [key: string]: any
}

/**
 * Track analytics event (non-blocking)
 */
export async function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
  userId?: string,
  organizationId?: string
) {
  // Use requestIdleCallback for non-blocking execution
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(
      () => {
        sendAnalytics(event, properties, userId, organizationId)
      },
      { timeout: 2000 }
    )
  } else {
    // Fallback: use setTimeout for older browsers
    setTimeout(() => {
      sendAnalytics(event, properties, userId, organizationId)
    }, 0)
  }
}

async function sendAnalytics(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties,
  userId?: string,
  organizationId?: string
) {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        properties: properties || {},
        userId,
        organizationId,
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      }),
    })
  } catch (err) {
    // Silently fail - analytics should never break the app
    console.debug('Analytics tracking failed:', err)
  }
}

/**
 * Track page views
 */
export function trackPageView(path: string, userId?: string, organizationId?: string) {
  trackEvent('page_view', { path }, userId, organizationId)
}
