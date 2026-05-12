# Changelog

All notable changes to Lexnify / EventOrg SaaS are documented here.

---

## [2.1.0] - 2026-05-12 - Self Check-in UX Refresh

### Added

#### Self Check-in Settings
- Replaced technical minute inputs with organizer-friendly dropdowns on `/events/[id]/checkin`.
- Added a live schedule preview for:
  - Check-in opens
  - Check-in closes
  - Registration closes
- Added registration close options for both before and after the event starts.
- Preserved custom/legacy saved offsets in dropdowns as read-compatible custom options.

### Changed

#### Beginner-Friendly Defaults
- Self check-in settings now open with the switch enabled by default in the dashboard UI.
- Default open self check-in: 1 hour before event start (`60`).
- Default close self check-in: 4 hours after event end (`240`).
- Default stop registrations: 2 hours after event start (`-120`).
- Timezone continues to use the event timezone, falling back to `Asia/Kolkata`.

#### Registration Close Offset Contract
- `registrationClosesMinutesBeforeStart` now supports signed values:
  - Positive values mean registration closes before event start.
  - `0` means registration closes at event start.
  - Negative values mean registration closes after event start.
- Example: `-120` means registration closes 2 hours after the event starts.
- Existing positive saved values remain backward-compatible.

#### Validation and Scheduling
- `server/routers/event.ts` now accepts registration close offsets from `-7 * 24 * 60` to `7 * 24 * 60` minutes.
- `lib/event-schedule.ts` no longer clamps registration close offsets to zero, so after-start registration windows are enforced correctly.
- Check-in open and close offsets remain non-negative.

### Removed

- Removed the "Advanced custom minutes" section from the self check-in settings UI.

### Files Updated

- `app/(dashboard)/events/[id]/checkin/checkin-client.tsx`
- `lib/event-schedule.ts`
- `server/routers/event.ts`
- `DEVELOPER_GUIDE.md`
- `CHANGELOG.md`

### Developer Notes

- Do not add a new database field for registration close-after-start behavior. Use signed values in `registrationClosesMinutesBeforeStart`.
- Keep schedule previews and backend enforcement aligned by using `computeEventSchedule`.
- The database schema was not changed for this release.

---

## [2.0.0] - 2024 - Premium SaaS Transformation

### Major Release

This release transformed EventOrg into a premium, value-driven SaaS platform with stronger event management, analytics, exports, QR check-in, and subscription features.

### Added

#### Analytics and Insights
- Advanced analytics dashboard.
- Real-time overview metrics with trend indicators.
- Six-month event creation trends.
- Six-month attendance trends.
- Response rate tracking.
- Month-over-month comparisons.
- Contact engagement analytics.
- Event performance statistics.
- New router: `server/routers/analytics.ts`.

#### Event Management
- Event templates with reusable configurations.
- Template selection and auto-fill in the event creation form.
- Capacity limits and waitlist support.
- QR code check-in with one unique event QR.
- Manual check-in option.
- Check-in status tracking.
- Event duplication with date shifting for recurring events.

#### Contact Management
- Contact groups for segmentation.
- Bulk operations for grouped contacts.
- Group-based event invitations.
- Contact engagement tracking.

#### Export and Reporting
- CSV export for events.
- CSV export for contacts.
- CSV export for event attendance reports.

#### UI and UX
- Enhanced dashboard layout.
- Interactive charts with Recharts.
- Improved event detail page.
- QR check-in entry points.
- Enhanced capacity and waitlist display.
- Improved event form with template and capacity fields.

### Changed

#### Positioning and Messaging
- Updated positioning from "NGO-focused" to broader language for groups, instructors, communities, and organizers.
- Removed biased language and old class-specific terminology.
- Updated landing page copy, testimonials, and FAQ content.

#### WhatsApp Integration
- Migrated from Meta WhatsApp Cloud API to Twilio WhatsApp API.
- Updated webhook endpoints.
- Improved phone number formatting and error handling.

#### Database Schema
- Added `EventTemplate`.
- Added `MessageTemplate`.
- Added `ContactGroup`.
- Enhanced `Event` with `qrCode`, `maxCapacity`, and `templateId`.
- Enhanced `Attendee` with `isWaitlist`, `checkedIn`, and `checkedInAt`.
- Added database indexes for performance.

### Fixed

- Fixed duplicate imports.
- Fixed type errors in the event form.
- Fixed export CSV formatting.
- Improved error handling across premium flows.

### Technical

#### New Routers
- `server/routers/analytics.ts`
- `server/routers/template.ts`
- `server/routers/export.ts`
- `server/routers/group.ts`

#### Enhanced Routers
- `server/routers/event.ts`
- `server/routers/attendee.ts`

#### Dependencies
- `recharts`
- `qrcode`
- `html5-qrcode`

---

## [1.0.0] - 2024 - Initial Release

### Added

- Event CRUD operations.
- Contact management.
- WhatsApp invitation automation.
- AI content generation.
- Public event pages.
- Attendee tracking.
- Usage limits and metering.
- Subscription management.
- Stripe payment integration.
- PWA support.

---

## Migration Notes

### From v2.0.0 to v2.1.0

1. Install dependencies if needed:

   ```bash
   npm install
   ```

2. Regenerate Prisma client if your local setup requires it:

   ```bash
   npx prisma generate
   ```

3. No database migration is required for the self check-in UX refresh.

4. When reviewing registration windows, remember:
   - `registrationClosesMinutesBeforeStart > 0` closes before event start.
   - `registrationClosesMinutesBeforeStart = 0` closes at event start.
   - `registrationClosesMinutesBeforeStart < 0` closes after event start.

### From v1.0.0 to v2.0.0

1. Update dependencies:

   ```bash
   npm install
   ```

2. Generate Prisma client and push schema:

   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. Update environment variables:
   - Replace Meta WhatsApp variables with Twilio variables.
   - Review Stripe, Clerk, Cloudinary, and OpenAI variables in `.env.template`.

4. Test premium features:
   - Analytics dashboard.
   - Event templates.
   - CSV exports.
   - QR check-in.
   - Capacity limits and waitlists.

---

## Version History

- **v2.1.0** - Self Check-in UX Refresh (Current)
- **v2.0.0** - Premium SaaS Transformation
- **v1.0.0** - Initial Release

---

**Last Updated:** 2026-05-12
