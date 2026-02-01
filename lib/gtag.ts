/**
 * Google Analytics (GA4) helpers.
 * Use from client code only. No-op when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set.
 */

const GA_MEASUREMENT_ID = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID : undefined

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

/**
 * Send a custom event to GA4.
 * Safe to call from client; does nothing if GA is not loaded or ID is missing.
 */
export function gtagEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>
) {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return
  window.gtag('event', eventName, params)
}

/**
 * Send a page view to GA4 (e.g. for custom routes or virtual pages).
 */
export function gtagPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || !GA_MEASUREMENT_ID || typeof window.gtag !== 'function') return
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: path,
    ...(title && { page_title: title }),
  })
}
