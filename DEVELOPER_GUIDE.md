# EventOrg Developer Guide

Complete technical documentation for developers working on EventOrg SaaS.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [tRPC, React Query & API Layer](#trpc-react-query--api-layer)
7. [Check-in System (Premium)](#check-in-system-premium--how-it-works)
8. [Setup & Configuration](#setup--configuration)
9. [Service Integrations](#service-integrations)
10. [Component Structure](#component-structure)
11. [Authentication & Authorization](#authentication--authorization)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Clone repository
git clone <repository-url>
cd event-org-saas

# Install dependencies
npm install

# Set up environment variables
cp .env.template .env
# Edit .env with your credentials

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

**For detailed setup instructions, see [Setup & Configuration](#setup--configuration) section below.**

---

## Architecture Overview

EventOrg is built as a modern, scalable micro-SaaS application using Next.js 14.2 with the App Router pattern.

### Architecture Principles
- **Frontend**: React components with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Next.js API routes with tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk with organization support
- **State Management**: TanStack Query (React Query) + Zustand
- **Payments**: Stripe subscriptions
- **External Services**: Twilio WhatsApp API, Cloudinary, OpenAI

### Project Structure

```
event-org-saas/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication routes
│   ├── (dashboard)/              # Protected dashboard routes
│   ├── event/                     # Public event pages
│   ├── api/                       # API routes
│   └── ...
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   └── ...
├── lib/                           # Utilities & configurations
│   ├── prisma.ts                  # Prisma client
│   ├── trpc.ts                    # tRPC server context & procedures
│   ├── trpc-client.ts             # tRPC client (single, credentials)
│   ├── trpc-auth-error.ts        # Global auth error handler (401/403)
│   ├── rate-limit.ts             # In-memory rate limiter for public procedures
│   └── ...
├── server/                        # Server-side code
│   └── routers/                  # tRPC routers
├── prisma/                        # Database
│   └── schema.prisma              # Prisma schema
└── public/                        # Static assets
```

---

## Technology Stack

### Core Framework
- **Next.js 14.2**: React framework with App Router
- **TypeScript**: Type-safe development
- **React 18**: UI library

### Styling & UI
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality component library
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library

### Backend & API
- **tRPC**: End-to-end typesafe APIs
- **Prisma**: Next-generation ORM
- **PostgreSQL**: Relational database
- **Zod**: Schema validation
- **Luxon**: Timezone-safe date/time computations (event windows)
- **libphonenumber-js**: Phone parsing/normalization (mixed IN-default + international)

### Authentication & Payments
- **Clerk**: Authentication & user management
- **Stripe**: Payment processing

### External Services
- **Twilio WhatsApp API**: Message sending
- **Cloudinary**: Image upload & optimization
- **OpenAI API**: AI content generation

### State Management
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **React Hook Form**: Form state management

### PWA
- **next-pwa**: Progressive Web App support

---

## Database Schema

### Core Models

#### Organization
Represents an organization (tenant) in the system.

```prisma
model Organization {
  id                String   @id @default(cuid())
  clerkOrgId        String   @unique
  name              String
  logo              String?
  accentColor       String?  @default("#3b82f6")
  backgroundColor   String?  @default("light")
  fontStyle         String?  @default("default")
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  subscription      Subscription?
  events            Event[]
  contacts          Contact[]
  usage             Usage[]
}
```

#### Event
Core event entity with premium features.

```prisma
model Event {
  id              String   @id @default(cuid())
  organizationId  String
  title           String
  imageUrl        String?
  eventDate       DateTime
  endDate         DateTime?
  startTime       String
  endTime         String?
  locationType    String   // "physical" | "online"
  location        String
  description     String   @db.Text
  additionalNotes String?  @db.Text
  audienceType    String   // "all" | "selected" | "public"
  isPublic        Boolean  @default(false)
  publicSlug      String   @unique
  qrCode          String?  @unique  // For QR check-in
  maxCapacity     Int?              // Capacity limit
  templateId      String?            // Link to template
  
  // Custom fields (max 2)
  customField1Label String?
  customField1Value String?
  customField2Label String?
  customField2Value String?
  
  registrationClosed Boolean @default(false)
  // Premium check-in controls
  timeZone                          String  @default("Asia/Kolkata")
  registrationClosesMinutesBeforeStart Int   @default(0)
  checkInOpensMinutesBefore         Int     @default(30)
  checkInClosesMinutesAfter         Int     @default(240)
  selfCheckInEnabled                Boolean @default(false)
  selfCheckInPinHash                String? // hashed, never plaintext
  deletedAt      DateTime?  // Soft delete
  
  attendees      Attendee[]
  selectedContacts EventContact[]
  template       EventTemplate?
}
```

#### Attendee
Event registration/RSVP with check-in tracking.

```prisma
model Attendee {
  id             String    @id @default(cuid())
  eventId        String
  contactId      String?
  name           String
  phone          String
  phoneNormalized String?
  email          String?
  status         String
  isWaitlist     Boolean   @default(false)
  checkedIn      Boolean   @default(false)
  checkedInAt    DateTime?
  whatsappSent   Boolean   @default(false)
  whatsappSentAt DateTime?
  attendeeQrCode String?   @unique  // Unique QR per attendee
  checkInMethod  String?   // 'qr_scan', 'manual', 'event_qr', 'self_qr'
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  @@unique([eventId, phone], name: "eventId_phone")
  @@index([eventId])
  @@index([contactId])
  @@index([attendeeQrCode])
  @@index([phoneNormalized])
}
```

**For complete schema, see `prisma/schema.prisma`**

---

## Event Scheduling, Timezones, and Windows (Critical)

EventOrg enforces **professional boundaries** so registration and check-ins cannot happen outside the allowed time window.

### Source of truth
- **Dates**: `Event.eventDate` and `Event.endDate` are treated as **date-only values** (coming from a date input like `YYYY-MM-DD`).
- **Times**: `Event.startTime`/`Event.endTime` are strings in `HH:mm`.
- **Timezone**: `Event.timeZone` is an IANA timezone string (default `Asia/Kolkata`).

### Computation
The authoritative computation lives in `lib/event-schedule.ts`:
- `computeEventSchedule`
- `gateRegistration`
- `gateCheckIn`

It produces:
- `registrationClosesAt`
- `checkInOpensAt`
- `checkInClosesAt`

Defaults:
- `checkInOpensMinutesBefore = 30`
- `checkInClosesMinutesAfter = 240`
- `registrationClosesMinutesBeforeStart = 0`

### Enforcement points
Time windows are enforced in `server/routers/attendee.ts`:
- `attendee.register`
- `attendee.checkIn` (manual)
- `attendee.checkInByQR` (public)
- `attendee.selfCheckIn` (public)
- `attendee.checkInByAttendeeQR` (staff scan)

### Edge cases
- If `endTime` is missing, the schedule assumes **+2 hours** (avoids “never-ending check-in”).
- Multi-day events are supported via `endDate`.

---

## API Reference

### Base URL
All tRPC endpoints are available at: `/api/trpc`

### Client Usage

```typescript
import { trpc } from '@/lib/trpc-client'

// Example: Get all events
const { data: events } = trpc.event.getAll.useQuery()

// Example: Create event
const createEvent = trpc.event.create.useMutation()
createEvent.mutate({ title: 'My Event', ... })
```

### Router Structure

```typescript
export const appRouter = router({
  event: eventRouter,
  contact: contactRouter,
  subscription: subscriptionRouter,
  usage: usageRouter,
  whatsapp: whatsappRouter,
  ai: aiRouter,
  attendee: attendeeRouter,
  organization: organizationRouter,
  analytics: analyticsRouter,
  template: templateRouter,
  export: exportRouter,
  group: groupRouter,
  messageTemplate: messageTemplateRouter,
})
```

### Key Endpoints

#### Event Router
- `event.create` - Create new event
- `event.getAll` - Get all events
- `event.getById` - Get event by ID
- `event.getBySlug` - Get public event by slug
- `event.getCheckInSummary` - Lightweight check-in counts for scanner UI (perf)
- `event.update` - Update event
- `event.duplicate` - Duplicate event with date offset
- `event.delete` - Soft delete event
- `event.toggleRegistration` - Open/close registration

#### Contact Router
- `contact.create` - Add contact
- `contact.getAll` - Get all contacts
- `contact.update` - Update contact
- `contact.delete` - Delete contact
- `contact.bulkCreate` - Import multiple contacts

#### Analytics Router
- `analytics.getOverview` - Dashboard metrics and trends
- `analytics.getEventStats` - Per-event statistics
- `analytics.getContactEngagement` - Contact activity tracking

#### Template Router
- `template.create` - Create event template
- `template.getAll` - List all templates
- `template.getById` - Get template details
- `template.update` - Update template
- `template.delete` - Delete template

#### Export Router
- `export.exportEvents` - Export events as CSV
- `export.exportContacts` - Export contacts as CSV
- `export.exportEventAttendance` - Export attendance report

#### Group Router
- `group.create` - Create contact group
- `group.getAll` - List all groups
- `group.getById` - Get group details
- `group.update` - Update group
- `group.delete` - Delete group

#### Attendee Router
- `attendee.register` - Register for public event
- `attendee.checkIn` - Manual check-in
- `attendee.getCheckInContext` - Resolve QR kind + requirements + window status (public)
- `attendee.checkInByQR` - QR-based check-in (public, supports attendee QR + legacy event QR)
- `attendee.selfCheckIn` - PIN-secured self check-in (public, recommended)
- `attendee.checkInByAttendeeQR` - Check-in by attendee QR (protected)

**For complete API documentation with input/output schemas, see the full API reference in the codebase or check individual router files in `server/routers/`.**

---

## tRPC, React Query & API Layer

The app uses a **single tRPC client** and centralized error handling so protected procedures receive auth and users get consistent feedback.

### Single tRPC client and credentials

- **Client definition:** `lib/trpc-client.ts` exports `trpc` (React hooks) and `trpcClient` (the configured client).
- **Usage:** `app/providers.tsx` uses `trpcClient` from `lib/trpc-client.ts` (no inline client). All requests send cookies via `credentials: 'include'` in the link’s custom `fetch`, so Clerk can resolve the session and protected procedures (e.g. `event.create`) do not get 401 from missing auth.

Do not create a second tRPC client elsewhere; use `trpcClient` so credentials and behavior stay consistent.

### Centralized auth error handling

- **Module:** `lib/trpc-auth-error.ts` — getter/setter for a global handler and `isTrpcAuthError(error)`.
- **Registration:** In `app/providers.tsx`, `QueryCache` and `MutationCache` are configured with `onError` that calls this handler when the error is a tRPC `UNAUTHORIZED` or `FORBIDDEN`.
- **Behavior:** The handler is set in a `useEffect` to show a toast and redirect to `/sign-in` on 401; on 403 it only shows a toast. Per-mutation `onError` can still override for custom messages (e.g. event limit reached).

### React Query defaults

- **Mutations:** Default `retry: 0` so failed auth or validation does not retry; the global auth handler handles 401/403.
- **Queries:** No retry for `UNAUTHORIZED`; once credentials are fixed, the global handler redirects. Custom retry for 401 has been removed from `event.getAll` and similar.

### Mutation loading and double-submit

- Critical mutations (e.g. event create, contact create) use `mutation.isLoading` (or `isPending` in v5) to disable the submit button and show a loading label (e.g. "Creating...") so users cannot double-submit.

### Debounce hook

- **Hook:** `hooks/use-debounced-value.ts` — `useDebouncedValue<T>(value, delayMs)` returns a value that updates only after the input has been stable for `delayMs`.
- **Use when:** You add server-side search or any input that triggers API calls on change; use the debounced value for the request to avoid excessive calls.

### Rate limiting (public procedures)

- **Module:** `lib/rate-limit.ts` — in-memory rate limiter for public tRPC procedures only.
- **Scope:** `attendee.register`, `attendee.checkInByQR`, `attendee.selfCheckIn` (write-like, 20/min per IP); `attendee.getCheckInContext`, `event.getBySlug` (read-like, 60/min per IP).
- **Integration:** `app/api/trpc/[trpc]/route.ts` parses procedure paths from the request URL; if any path is public, it runs the rate limit check and returns **429 Too Many Requests** when over limit.
- **Identifier:** Client IP from `x-forwarded-for` or `x-real-ip` (set by Vercel/reverse proxies).
- **Serverless:** The default implementation is in-memory and does not span multiple instances. For production on Vercel or multi-instance deployments, consider replacing with **Upstash Redis** (`@upstash/ratelimit`) and calling it from the same route before `fetchRequestHandler`.

### Performance: Create Event page

- **SSR shell:** `app/(dashboard)/events/new/page.tsx` is a server component that renders the heading and container so the first paint has content before the client bundle runs.
- **Embedded form:** `EventFormClient` accepts an `embedded` prop; when `true` it only renders the form and dialogs (no duplicate layout). The new-event page uses `<EventFormClient embedded />`.
- **Code-splitting:** The Cloudinary upload widget (`CldUploadWidget`) is loaded with `next/dynamic` and `ssr: false` in the event form so the initial JS bundle is smaller and TBT/LCP improve.

---

## Check-in System (Premium) — How It Works

There are **two first-class check-in modes**:

1) **Self check-in (recommended default)**
- Attendee scans the **Event QR** printed at the venue.
- Attendee enters **phone** (+ **venue PIN** when enabled).
- Backend enforces time window and PIN.

2) **Staff scanning (optional)**
- Organizer opens `/events/[id]/scan`.
- Staff scans **Attendee QR** from attendee’s phone.
- Backend enforces org ownership + time window.

### Public routes involved
- `/event/[slug]`: registration page
- `/checkin/[qrCode]`: smart public check-in UI (event QR or attendee QR)

### Security: Venue PIN
- PIN is stored hashed in `Event.selfCheckInPinHash`.
- Hash/verify utilities: `lib/venue-pin.ts` (`hashVenuePin`, `verifyVenuePin`)

### Idempotency
- If an attendee is already checked in, the API returns success-like data (no scary errors).

---

## Setup & Configuration

### Environment Variables

**Required:**
```env
# Database (add ?pgbouncer=true if using a connection pooler e.g. PgBouncer, Supabase pooler)
DATABASE_URL="postgresql://user:password@host:5432/dbname"
# Optional: direct URL for migrations (no pooler)
# DATABASE_DIRECT_URL="postgresql://user:password@host:5432/dbname"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**For Payments (Stripe):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_YEARLY="price_..."
```

**For WhatsApp (Twilio):**
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

**For Images (Cloudinary):**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**For AI (OpenAI - Optional):**
```env
OPENAI_API_KEY="sk-..."
```

**For Webhooks:**
```env
CLERK_WEBHOOK_SECRET="whsec_..."
```

### Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### Premium Features Setup

**QR + Self Check-in Dependencies:**
```bash
npm install qrcode @types/qrcode html5-qrcode luxon libphonenumber-js
npm install -D @types/luxon
```

**For detailed environment setup, see the [Service Integrations](#service-integrations) section below.**

---

## Service Integrations

### Clerk Authentication

**Setup:**
1. Create account at [clerk.com](https://clerk.com)
2. Create application
3. Enable Organizations in dashboard
4. Copy API keys to `.env`

**Webhook Setup:**
1. Go to Webhooks in Clerk dashboard
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `organization.created`, `organization.updated`, `organization.deleted`
4. Copy signing secret to `.env`

**For detailed webhook setup, see `CLERK_WEBHOOK_SETUP.md` (to be merged).**

### Stripe Payments

**Setup:**
1. Create account at [stripe.com](https://stripe.com)
2. Get API keys from Developers > API keys
3. Create products and prices:
   - Monthly Plan: ₹249/month
   - Pro Plan: ₹499/month
4. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
5. Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
6. Copy webhook secret to `.env`

**For detailed Stripe integration, see `STRIPE_INTEGRATION_GUIDE.md` (to be merged).**

### Twilio WhatsApp

**Setup:**
1. Create account at [twilio.com](https://twilio.com)
2. Get Account SID and Auth Token
3. Set up WhatsApp sandbox (for testing) or get production number
4. Format: `whatsapp:+14155238886`
5. Copy credentials to `.env`

**For detailed Twilio setup, see `TWILIO_WHATSAPP_SETUP.md` (to be merged).**

### Cloudinary Images

**Setup:**
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get cloud name, API key, and API secret
3. Create upload preset: `event_images`
4. Configure preset:
   - Signing mode: Unsigned (with restrictions)
   - Resource type: Image only
   - Allowed formats: jpg, jpeg, png, webp, gif
   - Max file size: 5 MB
   - Folder: `events/`
5. Copy credentials to `.env`

**For security configuration, see `CLOUDINARY_SECURITY_GUIDE.md` (to be merged).**

### OpenAI (Optional)

**Setup:**
1. Create account at [platform.openai.com](https://platform.openai.com)
2. Generate API key
3. Copy to `.env`

**Note:** AI features will use template fallback if API key is not provided.

---

## Component Structure

### UI Components (shadcn/ui)

All components are located in `components/ui/`:
- Button, Card, Input, Textarea, Label, Select
- Checkbox, Switch, Dialog, Tabs, Toast
- Dropdown Menu, Separator

### Custom Components

- `components/sidebar.tsx` - Navigation sidebar
- `components/contact-selection.tsx` - Contact picker
- `components/toaster.tsx` - Toast notifications
- `components/qr-code-display.tsx` - QR code display
- `components/attendee-qr-display.tsx` - Attendee QR display
- `components/pwa-reload-on-update.tsx` - Prevent stale PWA clients after deploy

### Key libraries (premium check-in & API layer)
- `lib/event-schedule.ts` - Time window computation + gating
- `lib/phone.ts` - Mixed phone normalization (IN-friendly + international)
- `lib/venue-pin.ts` - PIN hashing/verification (scrypt)
- `lib/trpc-client.ts` - Single tRPC client with credentials
- `lib/trpc-auth-error.ts` - Global 401/403 handler (toast + redirect)
- `lib/rate-limit.ts` - Rate limiting for public tRPC procedures
- `hooks/use-debounced-value.ts` - Debounced value for search/API-triggering inputs

---

## Authentication & Authorization

### Clerk Integration

**Middleware:** `middleware.ts`
- Protects dashboard routes
- Public routes: `/`, `/event/*`, `/checkin/*`, `/api/trpc/*`, `/api/stripe/webhook`

**tRPC Context:** `lib/trpc.ts`
- Gets auth from Clerk
- Protected procedures require authentication
- Organization lookup/creation

**Global auth error handling:** `lib/trpc-auth-error.ts` + `app/providers.tsx`
- QueryCache/MutationCache `onError` call the global handler for tRPC `UNAUTHORIZED`/`FORBIDDEN`
- Handler shows a toast and redirects to `/sign-in` on 401; toast only on 403
- Ensures users see clear feedback when the session is missing or access is denied

**Protected Routes:**
- `/dashboard/*`
- `/events/*`
- `/contacts`
- `/pricing`
- `/settings`

**Public Routes:**
- `/` (redirects to dashboard or sign-in)
- `/event/[slug]` (public event pages)
- `/checkin/[qrCode]` (public self check-in)
- `/sign-in`, `/sign-up`

---

## Deployment

### Prerequisites
1. PostgreSQL database (Supabase recommended)
2. Hosting platform (Vercel recommended)
3. Service accounts (Clerk, Stripe, Twilio, Cloudinary)

### Deployment Steps

1. **Database Setup:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

2. **Build:**
   ```bash
   npm run build
   ```

3. **Deploy to Vercel:**
   - Connect GitHub repository
   - Add all environment variables
   - Deploy

4. **Configure Webhooks:**
   - Stripe: `https://yourdomain.com/api/stripe/webhook`
   - Clerk: `https://yourdomain.com/api/webhooks/clerk`
   - Twilio: `https://yourdomain.com/api/webhooks/twilio` (optional)

5. **Update App URL:**
   - Set `NEXT_PUBLIC_APP_URL` to production domain

### Post-Deployment
1. Test authentication flow
2. Test payment flow
3. Test WhatsApp sending
4. Test AI generation
5. Test premium features
6. Monitor error logs
7. Set up analytics

---

## Troubleshooting

### 401 on tRPC (e.g. event.create, event.getAll)

- **Two cases:**  
  1. **No session** — Cookies not sent or session expired; Clerk cannot resolve the user.  
  2. **No organization** — User is signed in (`userId` present) but `orgId` is undefined (no org created or selected in Clerk). Protected procedures that require `ctx.organization` then throw UNAUTHORIZED.
- **Sign-in → dashboard loop:** If the global handler redirects 401 to `/sign-in`, signed-in users with no org get sent to sign-in; Clerk then sends them back to dashboard; dashboard tRPC calls 401 again → loop. The app avoids this by redirecting **all** UNAUTHORIZED to `/create-organization`. If the user is not signed in, the dashboard layout (which wraps create-organization) redirects to `/sign-in`.
- **Fix (no session):** Use the single tRPC client from `lib/trpc-client.ts` with `credentials: 'include'` in `app/providers.tsx`.
- **Fix (no org):** User must create or select an organization at `/create-organization`. Ensure Clerk has Organizations enabled and the user completes the create-organization flow.

### 429 Too Many Requests on public procedures

- **Cause:** Rate limit exceeded for a public procedure (`attendee.register`, `attendee.getCheckInContext`, `attendee.checkInByQR`, `attendee.selfCheckIn`, `event.getBySlug`) per IP.
- **Limits:** Write-like (register, check-in) 20/min; read-like (getCheckInContext, getBySlug) 60/min per IP.
- **Implementation:** In-memory in `lib/rate-limit.ts`; for serverless/multi-instance use Upstash Redis and integrate in `app/api/trpc/[trpc]/route.ts`.

### Prepared statement "s3" / "s6" / "s7" does not exist (Prisma)

- **Cause:** Your database connection goes through a **connection pooler** (e.g. PgBouncer, Supabase pooler) in **transaction** mode. Prisma uses prepared statements (s1, s2, s3, …); with transaction pooling, each request can hit a different backend connection, so the prepared statement created on one connection does not exist on another — hence PostgreSQL error `26000` and "prepared statement \"sN\" does not exist". This can surface as 500s on `template.getAll`, `event.getAll`, `event.create`, or any procedure that runs Prisma queries.
- **Fix:** Add `?pgbouncer=true` to your **pooled** `DATABASE_URL` in `.env` so Prisma disables prepared statements for that connection:
  ```env
  DATABASE_URL="postgresql://user:password@host:5432/dbname?pgbouncer=true"
  ```
  If you already have query params, append with `&`: `...?existing=param&pgbouncer=true`.
- **Migrations:** Use a direct URL (no pooler, no `pgbouncer=true`) for migrations, e.g. `DATABASE_DIRECT_URL` in `prisma/schema.prisma`. The schema already supports `directUrl` for this.

### Database Issues
```bash
# Reset database (development only)
npx prisma migrate reset

# Or force push
npx prisma db push --force-reset
```

### Environment Variables
- Check `.env` file exists
- Verify all required variables are set
- Restart dev server after changes

### Webhook Issues
- Verify webhook URLs are correct
- Check webhook secrets match
- Use ngrok for local testing
- Check webhook event logs

### Service Integration Issues
- Verify API keys are correct
- Check service account status
- Review service-specific error logs
- Test with service dashboards

**For detailed troubleshooting guides, see:**
- `WEBHOOK_TROUBLESHOOTING.md` (to be merged)
- `WEBHOOK_DEEP_DEBUG.md` (to be merged)
- `WEBHOOK_DIAGNOSTIC.md` (to be merged)

---

## Additional Resources

- **README.md** - Project overview and features
- **CHANGELOG.md** - Version history
- **IMPLEMENTATION_GUIDE.md** - Feature implementation details
- **USER_GUIDE.md** - User-facing documentation
- **docs/HIGH_LEVEL_DESIGN.md** - System context, data model, workflows, and data flow (Mermaid diagrams)
- **docs/PRODUCT_STORY_AND_CONTENT_BUCKET.md** - Product story and content source for blogs/posts

---

**Last Updated:** 2026
**Version:** 3.0.0
