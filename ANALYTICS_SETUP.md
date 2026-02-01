# Analytics & Error Tracking Setup

This app includes a comprehensive, lightweight analytics and error tracking system that doesn't affect performance.

## Features

- ✅ **Centralized Logging**: All errors and important events are logged through a single system
- ✅ **Google Analytics (GA4)**: Page views and key app events in Google Analytics (optional)
- ✅ **Sentry Integration**: Professional error tracking (free tier available)
- ✅ **Analytics Dashboard**: Track key metrics and errors in real-time
- ✅ **Performance Optimized**: All tracking is async and non-blocking
- ✅ **Feature-Specific Tracking**: QR scans, check-ins, WhatsApp, events

## Setup

### 1. Sentry (Optional but Recommended)

Sentry offers a free tier with 5,000 errors/month and 10,000 performance units/month.

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project (Next.js)
3. Copy your DSN from the project settings
4. Add to your `.env`:

```env
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
SENTRY_DSN="https://xxxxx@xxxxx.ingest.sentry.io/xxxxx"
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

5. Run Sentry wizard (optional, for better setup):

```bash
npx @sentry/wizard@latest -i nextjs
```

### 2. Google Analytics (GA4) (Optional)

To track page views and key app events in Google Analytics:

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com)
2. Add a web data stream and copy your **Measurement ID** (format: `G-XXXXXXXXXX`)
3. Add to your `.env`:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

4. Restart the app. Page views (including client-side navigation) and selected app events (e.g. `user_signup`, `event_created`, `check_in_success`) are sent to GA4. Omit the variable to disable GA.

### 3. Database Migration

Run the migration to add the analytics table:

```bash
npx prisma db push
# or
npx prisma migrate dev --name add_analytics
```

### 4. Access Analytics Dashboard

Navigate to `/analytics` in your dashboard to view:
- Total events and check-ins
- QR scan statistics
- Error tracking
- Feature usage metrics
- Daily activity charts

## Usage

### Logging Errors

```typescript
import { logger } from '@/lib/logger'

// General error
logger.error('Something went wrong', error, {
  feature: 'my_feature',
  userId: 'user123',
  organizationId: 'org456',
})

// Feature-specific helpers
logger.qrScan.error('QR scan failed', error, { eventId: 'event123' })
logger.checkIn.error('Check-in failed', error, { attendeeId: 'attendee123' })
logger.event.error('Event creation failed', error, { eventId: 'event123' })
logger.whatsapp.error('WhatsApp send failed', error, { contactId: 'contact123' })
```

### Tracking Analytics Events

```typescript
import { trackEvent } from '@/lib/analytics'

// Track an event
trackEvent('qr_scan_success', {
  eventId: 'event123',
  attendeeId: 'attendee123',
}, userId, organizationId)

// Available events:
// - qr_scan_started, qr_scan_success, qr_scan_error, qr_scan_permission_denied
// - check_in_success, check_in_error, check_in_manual
// - event_created, event_updated, event_deleted
// - whatsapp_invite_sent, whatsapp_invite_failed
// - user_signup, user_login, page_view
```

### Error Boundaries

Error boundaries are automatically set up in the root layout. For specific components:

```typescript
import { ErrorBoundary } from '@/components/error-boundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Performance

All tracking is designed to be non-blocking:

- **Async Logging**: Logs are batched and flushed every 5 seconds
- **Non-blocking**: Analytics use `requestIdleCallback` or `setTimeout(0)`
- **Lightweight**: Only 10% of transactions are sampled for performance monitoring
- **Smart Filtering**: Common, non-actionable errors are filtered out

## What Gets Tracked

### Errors
- QR scanner failures
- Check-in errors
- WhatsApp send failures
- tRPC errors
- React component errors

### Analytics
- QR scan attempts and successes
- Check-ins (QR and manual)
- Event creation/updates
- WhatsApp invitations
- User signups/logins
- Page views

## Viewing Data

1. **Analytics Dashboard**: `/analytics` - Real-time metrics and charts
2. **Google Analytics**: [analytics.google.com](https://analytics.google.com) - Page views and app events (when GA is configured)
3. **Sentry Dashboard**: [sentry.io](https://sentry.io) - Detailed error tracking with stack traces
4. **Database**: Query `analytics_events` table directly for custom analysis

## Cost

- **Sentry Free Tier**: 5,000 errors/month, 10,000 performance units/month
- **Database**: Minimal storage (events are lightweight JSON)
- **Performance Impact**: < 1ms per event (async, non-blocking)

## Troubleshooting

### Sentry not working?
- Check that `NEXT_PUBLIC_SENTRY_DSN` is set in `.env`
- Verify DSN is correct (should start with `https://`)
- Check browser console for Sentry initialization errors

### Analytics not showing?
- Ensure database migration ran successfully
- Check that events are being tracked (check network tab for `/api/analytics` calls)
- Verify user has organization access

### Google Analytics not receiving data?
- Confirm `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set in `.env` (format `G-XXXXXXXXXX`)
- GA4 can take 24–48 hours to show data; use DebugView in GA4 for real-time checks
- Ensure ad blockers or privacy extensions are not blocking `googletagmanager.com`

### Performance concerns?
- All tracking is async and won't block the UI
- Sentry sampling is set to 10% for performance monitoring
- Logs are batched to reduce database writes
