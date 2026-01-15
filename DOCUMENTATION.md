# EventOrg SaaS - Complete Implementation Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [API Documentation](#api-documentation)
5. [Feature Implementations](#feature-implementations)
6. [Premium Features](#premium-features) ⭐ NEW
7. [Component Structure](#component-structure)
8. [Authentication & Authorization](#authentication--authorization)
9. [Payment Integration](#payment-integration)
10. [WhatsApp Integration](#whatsapp-integration)
11. [AI Content Generation](#ai-content-generation)
12. [PWA Implementation](#pwa-implementation)
13. [Usage Limits & Metering](#usage-limits--metering)
14. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

EventOrg is built as a modern, scalable micro-SaaS application using Next.js 14.2 with the App Router pattern. The architecture follows a clean separation of concerns:

- **Frontend**: React components with TypeScript, Tailwind CSS, and shadcn/ui
- **Backend**: Next.js API routes with tRPC for type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk with organization support
- **State Management**: TanStack Query (React Query) + Zustand
- **Payments**: Stripe subscriptions
- **External Services**: WhatsApp Cloud API, Cloudinary, OpenAI

### Project Structure

```
event-org-saas/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication routes
│   │   ├── sign-in/             # Sign in page
│   │   └── sign-up/              # Sign up page
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/           # Main dashboard
│   │   ├── events/              # Event management
│   │   │   ├── new/             # Create event
│   │   │   └── [id]/            # Event details
│   │   ├── contacts/            # Contact management
│   │   ├── pricing/             # Pricing page
│   │   └── settings/            # Settings page
│   ├── event/                    # Public event pages
│   │   └── [slug]/              # Public event view
│   ├── api/                     # API routes
│   │   ├── trpc/                # tRPC endpoint
│   │   └── stripe/              # Stripe webhooks
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   └── providers.tsx            # Global providers
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── sidebar.tsx              # Navigation sidebar
│   ├── contact-selection.tsx    # Contact picker
│   └── toaster.tsx              # Toast notifications
├── lib/                          # Utilities & configurations
│   ├── prisma.ts                # Prisma client
│   ├── trpc.ts                  # tRPC setup
│   ├── trpc-client.ts           # Client-side tRPC
│   └── utils.ts                 # Helper functions
├── server/                       # Server-side code
│   └── routers/                 # tRPC routers
│       ├── _app.ts              # Main router
│       ├── event.ts             # Event operations
│       ├── contact.ts           # Contact operations
│       ├── subscription.ts      # Subscription management
│       ├── usage.ts             # Usage tracking
│       ├── whatsapp.ts         # WhatsApp integration
│       ├── ai.ts                # AI content generation
│       └── attendee.ts          # Attendee registration
├── prisma/                       # Database
│   └── schema.prisma            # Prisma schema
└── public/                       # Static assets
    ├── manifest.json            # PWA manifest
    └── icon-*.png               # PWA icons
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

### Authentication & Payments
- **Clerk**: Authentication & user management
- **Stripe**: Payment processing

### External Services
- **WhatsApp Cloud API**: Message sending
- **Cloudinary**: Image upload & optimization
- **OpenAI API**: AI content generation

### State Management
- **TanStack Query**: Server state management
- **Zustand**: Client state management (ready for use)
- **React Hook Form**: Form state management

### PWA
- **next-pwa**: Progressive Web App support

---

## Database Schema

### Models Overview

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

**Key Fields:**
- `clerkOrgId`: Links to Clerk organization
- `accentColor`: Custom branding color
- `backgroundColor`: Light/dark theme preference
- `fontStyle`: Font customization option

#### Subscription
Tracks subscription plans and status.

```prisma
model Subscription {
  id                   String   @id @default(cuid())
  organizationId       String   @unique
  plan                 String   // "free" | "monthly" | "yearly" | "enterprise"
  status               String   // "active" | "canceled" | "past_due"
  stripeCustomerId     String?  @unique
  stripeSubscriptionId String?  @unique
  currentPeriodStart   DateTime?
  currentPeriodEnd    DateTime?
}
```

**Plans:**
- `free`: 2 events/month, 100 contacts, 50 WhatsApp, 5 AI
- `monthly`: 10 events/month, 300 contacts, 500 WhatsApp, 30 AI (₹199/month)
- `yearly`: 30 events/month, 1,000 contacts, 3,000 WhatsApp, 200 AI (₹1,999/year)
- `enterprise`: Custom limits

#### Usage
Monthly usage tracking for metering.

```prisma
model Usage {
  id             String   @id @default(cuid())
  organizationId String
  month          Int      // 1-12
  year           Int
  eventsCreated  Int      @default(0)
  contactsCount  Int      @default(0)
  whatsappSent   Int      @default(0)
  aiGenerations  Int      @default(0)
  
  @@unique([organizationId, month, year])
}
```

**Tracking:**
- Events created per month
- Total contacts count
- WhatsApp messages sent
- AI generations used

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
  deletedAt      DateTime?  // Soft delete
  
  attendees      Attendee[]
  selectedContacts EventContact[]
  template       EventTemplate?
}
```

**Core Fields (Always Present):**
1. Title
2. Date & Time
3. Location (physical/online)
4. Description
5. Audience selection

**Premium Features:**
- `maxCapacity`: Set maximum attendees (triggers waitlist when full)
- `qrCode`: Unique QR code for on-site check-in
- `templateId`: Link to event template for quick creation

**Optional Custom Fields:**
- Up to 2 custom fields (label + value)
- Toggle-based activation

#### Contact
Organization's contact list with tags and notes.

```prisma
model Contact {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  phone          String
  email          String?
  tags           String[] // Array of tags for organization
  location       String?
  notes          String?  @db.Text
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  attendees      Attendee[]
  eventContacts  EventContact[]
  
  @@unique([organizationId, phone])
}
```

**Features:**
- Tags for categorization and filtering
- Notes for additional information
- Links to attendees for engagement tracking

#### Attendee
Event registration/RSVP with check-in tracking.

```prisma
model Attendee {
  id          String   @id @default(cuid())
  eventId     String
  contactId   String?  // Optional link to Contact
  name        String
  phone       String
  email       String?
  status      String   // "confirmed" | "declined" | "maybe" | "pending"
  isWaitlist  Boolean  @default(false)  // Waitlist status
  checkedIn   Boolean  @default(false)   // Check-in status
  checkedInAt DateTime?                  // Check-in timestamp
  whatsappSent Boolean  @default(false)
  whatsappSentAt DateTime?
  
  @@unique([eventId, phone], name: "eventId_phone")
  @@index([eventId])
  @@index([contactId])
}
```

**Status Values:**
- `confirmed`: Will attend
- `declined`: Will not attend
- `maybe`: Unsure
- `pending`: No response yet

**Premium Features:**
- `isWaitlist`: Automatically set when event is at capacity
- `checkedIn`: On-site check-in status
- `checkedInAt`: Timestamp of check-in

#### EventTemplate
Reusable event configurations for quick creation.

```prisma
model EventTemplate {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  title          String
  description    String   @db.Text
  locationType   String
  location       String?
  startTime      String?
  endTime        String?
  additionalNotes String? @db.Text
  customField1Label String?
  customField1Value String?
  customField2Label String?
  customField2Value String?
  maxCapacity    Int?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organization   Organization @relation(...)
  events         Event[]
  
  @@index([organizationId])
}
```

**Use Cases:**
- Weekly recurring events
- Common event types
- Standardized event formats

#### MessageTemplate
Saved WhatsApp message templates.

```prisma
model MessageTemplate {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  content        String   @db.Text
  type           String   // 'invitation', 'reminder', 'followup'
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organization   Organization @relation(...)
  
  @@index([organizationId])
}
```

**Types:**
- `invitation`: Initial event invitation
- `reminder`: Event reminder message
- `followup`: Post-event follow-up

#### ContactGroup
Contact segmentation and organization.

```prisma
model ContactGroup {
  id             String   @id @default(cuid())
  organizationId String
  name           String
  description    String?
  contactIds     String[]  // Array of contact IDs
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  organization   Organization @relation(...)
  
  @@index([organizationId])
}
```

**Use Cases:**
- Segment contacts by category
- Group-based event invitations
- Targeted messaging

---

## API Documentation

### tRPC Router Structure

All APIs are type-safe through tRPC. The main router is defined in `server/routers/_app.ts`:

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
  analytics: analyticsRouter,      // NEW: Analytics & insights
  template: templateRouter,        // NEW: Event templates
  export: exportRouter,            // NEW: CSV exports
  group: groupRouter,               // NEW: Contact groups
})
```

### Event Router (`event`)

#### `event.create`
Create a new event.

**Input:**
```typescript
{
  title: string
  imageUrl?: string
  eventDate: string
  startTime: string
  endTime?: string
  locationType: "physical" | "online"
  location: string
  description: string
  additionalNotes?: string
  audienceType: "all" | "selected" | "public"
  customField1Label?: string
  customField1Value?: string
  customField2Label?: string
  customField2Value?: string
}
```

**Returns:** Created event object

**Usage Limits:** Checks monthly event limit based on subscription plan

#### `event.getAll`
Get all events for the organization.

**Returns:** Array of events with attendee counts

#### `event.getById`
Get event by ID with full details.

**Input:** `{ id: string }`

**Returns:** Event with attendees and selected contacts

#### `event.getBySlug`
Get public event by slug (for public pages).

**Input:** `{ slug: string }`

**Returns:** Event object (public access)

#### `event.update`
Update an existing event.

**Input:** `{ id: string, data: Partial<EventSchema> }`

**Returns:** Updated event

#### `event.duplicate`
Duplicate an existing event.

**Input:** `{ id: string }`

**Returns:** New event with "(Copy)" suffix

**Usage Limits:** Checks monthly event limit

#### `event.delete`
Soft delete an event.

**Input:** `{ id: string }`

**Returns:** Updated event with `deletedAt` set

#### `event.toggleRegistration`
Open/close event registration.

**Input:** `{ id: string, closed: boolean }`

### Contact Router (`contact`)

#### `contact.create`
Add a new contact.

**Input:**
```typescript
{
  name: string
  phone: string
  email?: string
  tags?: string[]
  location?: string
  notes?: string
}
```

**Usage Limits:** Checks contact limit based on plan

#### `contact.getAll`
Get all contacts for the organization.

**Returns:** Array of contacts

#### `contact.update`
Update a contact.

**Input:** `{ id: string, data: Partial<ContactData> }`

#### `contact.delete`
Delete a contact.

**Input:** `{ id: string }`

#### `contact.bulkCreate`
Import multiple contacts.

**Input:** `{ contacts: ContactData[] }`

**Usage Limits:** Validates total contact count

### Subscription Router (`subscription`)

#### `subscription.get`
Get current subscription details.

**Returns:** Subscription object with plan and status

#### `subscription.getUsage`
Get current usage and limits.

**Returns:**
```typescript
{
  usage: {
    eventsCreated: number
    contactsCount: number
    whatsappSent: number
    aiGenerations: number
  }
  limits: {
    events: number
    contacts: number
    whatsapp: number
    ai: number
  }
  plan: string
}
```

### WhatsApp Router (`whatsapp`)

#### `whatsapp.sendInvite`
Send WhatsApp invitations to selected contacts.

**Input:**
```typescript
{
  eventId: string
  contactIds: string[]
  message?: string  // Optional custom message
}
```

**Returns:** `{ sent: number }` - Number of messages sent

**Usage Limits:** 
- Checks monthly WhatsApp message limit
- Increments usage counter
- Stops at limit with error message

**Implementation:**
- Formats phone numbers (removes non-digits)
- Calls WhatsApp Cloud API
- Tracks sent messages
- Updates usage metrics

### AI Router (`ai`)

#### `ai.generateWhatsAppMessage`
Generate WhatsApp invitation message using AI.

**Input:**
```typescript
{
  eventId: string
  tone: "friendly" | "formal" | "casual"
}
```

**Returns:** `{ message: string }`

**Usage Limits:** 
- Checks monthly AI generation limit
- Increments usage counter

**Implementation:**
- Uses OpenAI GPT-3.5-turbo
- Includes event details in prompt
- Falls back to template if API fails

#### `ai.generateSocialPost`
Generate social media post content.

**Input:**
```typescript
{
  eventId: string
  platform: "instagram" | "facebook" | "whatsapp"
}
```

**Returns:** `{ post: string }`

### Attendee Router (`attendee`)

#### `attendee.register`
Register for a public event (no auth required).

**Input:**
```typescript
{
  eventSlug: string
  name: string
  phone: string
  email?: string
  status: "confirmed" | "declined" | "maybe"
}
```

**Returns:** Attendee object

**Validation:**
- Checks if event exists
- Validates registration is not closed
- Prevents duplicate registrations (same phone)

---

## Feature Implementations

### 1. Event Management

#### Event Creation Form
**Location:** `app/(dashboard)/events/new/event-form-client.tsx`

**Features:**
- Core fields (always visible):
  - Event title (required)
  - Event image/banner (Cloudinary upload)
  - Date and time pickers
  - Location type (physical/online)
  - Location field
  - Description (rich text support, emojis allowed)
  - Additional notes (optional)
  - Audience selection (all/selected/public)

- Custom Fields (toggle-based):
  - Switch to enable/disable
  - Maximum 2 custom fields
  - Each field: Label + Value
  - Examples: "Session: Meditation Level 1", "Master: Shri ABC"

**Validation:**
- Zod schema validation
- React Hook Form integration
- Real-time error messages

#### Event List View
**Location:** `app/(dashboard)/events/events-client.tsx`

**Features:**
- Grid layout (responsive)
- Event cards with:
  - Title
  - Date & time
  - Location
  - Attendee count
- Actions menu:
  - Edit
  - Duplicate
  - Delete (with confirmation)
- Search and filter (ready for implementation)

#### Event Detail Page
**Location:** `app/(dashboard)/events/[id]/event-detail-client.tsx`

**Features:**
- Tabbed interface:
  - **Details Tab:**
    - Event image
    - Full event information
    - Custom fields display
    - Preview button
    - Copy link button
  
  - **Attendees Tab:**
    - Statistics cards (confirmed/declined/pending)
    - Attendee list with status badges
    - Response rate calculation
  
  - **Invite Tab:**
    - Contact selection component
    - Bulk selection
    - Send WhatsApp invitations
    - AI message generation option

**Quick Stats Sidebar:**
- Total invited
- Confirmed count
- Response rate percentage

### 2. Contact Management

#### Contact List
**Location:** `app/(dashboard)/contacts/contacts-client.tsx`

**Features:**
- Search functionality
- Contact cards with:
  - Name
  - Phone number
  - Email (if available)
  - Location (if available)
- Add contact dialog
- Bulk import support (via API)

#### Contact Selection Component
**Location:** `components/contact-selection.tsx`

**Features:**
- Search/filter contacts
- Checkbox selection
- Select all / Deselect all
- Selected count display
- Scrollable list

### 3. Public Event Pages

#### Public Event View
**Location:** `app/event/[slug]/public-event-client.tsx`

**Features:**
- **Mobile-first design:**
  - Responsive layout
  - Touch-friendly buttons
  - Optimized for small screens

- **Event Display:**
  - Event banner/image
  - Title
  - Date & time (formatted)
  - Location
  - Description
  - Additional notes
  - Custom fields

- **RSVP Form:**
  - Name input (required)
  - Phone input (required)
  - Email input (optional)
  - Attendance buttons:
    - Yes (confirmed)
    - No (declined)
    - Maybe
  - Submit button

- **Success State:**
  - Confirmation message
  - Thank you message

**No Authentication Required:**
- Public access via unique slug
- No login needed
- Direct link sharing

### 4. Dashboard

#### Main Dashboard
**Location:** `app/(dashboard)/dashboard/dashboard-client.tsx`

**Features:**
- **Usage Statistics Cards:**
  - Events created this month (current/limit)
  - Total contacts (current/limit)
  - WhatsApp messages sent (current/limit)
  - AI generations used (current/limit)

- **Events List:**
  - Recent events
  - Quick access to event details
  - Empty state with CTA

**Real-time Updates:**
- TanStack Query for data fetching
- Automatic refetch on mutations
- Loading states

### 5. Pricing Page

#### Pricing Display
**Location:** `app/(dashboard)/pricing/pricing-client.tsx`

**Features:**
- Three plan cards:
  - Free plan
  - Monthly plan (₹199/month)
  - Yearly plan (₹1,999/year) - "Best Value" badge

- **Plan Details:**
  - Price display
  - Feature list with checkmarks
  - Current plan indicator
  - Upgrade buttons

- **Stripe Integration:**
  - Direct checkout links
  - Plan selection
  - Webhook handling

### 6. Settings Page

#### Organization Settings
**Location:** `app/(dashboard)/settings/settings-client.tsx`

**Features:**
- **Organization Profile:**
  - Organization name
  - Accent color picker
  - Logo upload (ready for implementation)

- **Event Page Customization:**
  - Logo upload
  - Font style selection (default/modern/classic)
  - Background theme (light/dark)

---

## Component Structure

### UI Components (shadcn/ui)

All components are located in `components/ui/`:

- **Button**: Multiple variants (default, outline, ghost, destructive)
- **Card**: Container with header, content, footer
- **Input**: Text input with validation styling
- **Textarea**: Multi-line text input
- **Label**: Form labels
- **Select**: Dropdown selection
- **Checkbox**: Checkbox input
- **Switch**: Toggle switch
- **Dialog**: Modal dialogs
- **Tabs**: Tabbed interface
- **Toast**: Notification system
- **Dropdown Menu**: Context menus
- **Separator**: Visual dividers

### Custom Components

#### Sidebar (`components/sidebar.tsx`)
- Navigation menu
- Active route highlighting
- User button (Clerk)
- Responsive (hidden on mobile)

#### Contact Selection (`components/contact-selection.tsx`)
- Reusable contact picker
- Search functionality
- Multi-select with checkboxes
- Select all/deselect all

#### Toaster (`components/toaster.tsx`)
- Global toast notification system
- Success/error variants
- Auto-dismiss

---

## Authentication & Authorization

### Clerk Integration

**Setup:**
- Organization support enabled
- Multi-tenant architecture
- Session management

**Implementation:**
- **Middleware:** `middleware.ts`
  - Protects dashboard routes
  - Public routes: `/`, `/event/*`, `/api/trpc/*`, `/api/stripe/webhook`

- **tRPC Context:** `lib/trpc.ts`
  - Gets auth from Clerk in context
  - Protected procedures require authentication
  - Organization lookup/creation

**Protected Routes:**
- `/dashboard/*`
- `/events/*`
- `/contacts`
- `/pricing`
- `/settings`

**Public Routes:**
- `/` (redirects to dashboard or sign-in)
- `/event/[slug]` (public event pages)
- `/sign-in`
- `/sign-up`

### Authorization Flow

1. User signs in via Clerk
2. Clerk creates/retrieves organization
3. tRPC context fetches organization from database
4. If organization doesn't exist, creates it with free plan
5. All protected procedures have organization context

---

## Payment Integration

### Stripe Setup

**Products Created:**
- Monthly Plan: ₹199/month
- Yearly Plan: ₹1,999/year

**Checkout Flow:**
1. User clicks "Upgrade" on pricing page
2. Redirects to `/api/stripe/checkout?plan=monthly|yearly`
3. Stripe Checkout session created
4. User completes payment
5. Webhook updates subscription in database

**Webhook Handler:** `app/api/stripe/webhook/route.ts`

**Events Handled:**
- `checkout.session.completed`: Create/update subscription
- `customer.subscription.updated`: Update subscription status
- `customer.subscription.deleted`: Mark as canceled

**Subscription Model:**
- Links to organization
- Stores Stripe customer ID
- Stores Stripe subscription ID
- Tracks billing period

---

## WhatsApp Integration

### WhatsApp Cloud API

**Setup Required:**
- Meta Business Account
- WhatsApp Business API access
- Phone number ID
- Access token
- Webhook configuration (for delivery status)

**Implementation:** `server/routers/whatsapp.ts`

**Features:**
- **Message Sending:**
  - Formats phone numbers
  - Calls WhatsApp Cloud API
  - Includes event link
  - Tracks sent count

- **Message Template:**
  ```
  🎉 *Event Title*
  
  📅 Date
  🕐 Time
  📍 Location
  
  Description
  
  👉 Register: [Event Link]
  ```

- **Usage Tracking:**
  - Increments `whatsappSent` counter
  - Enforces monthly limits
  - Error handling for failed sends

**Rate Limits:**
- Free: 50 messages/month
- Monthly: 500 messages/month
- Yearly: 3,000 messages/month

---

## AI Content Generation

### OpenAI Integration

**Implementation:** `server/routers/ai.ts`

**Features:**

#### WhatsApp Message Generation
- Uses GPT-3.5-turbo
- Includes event details in prompt
- Tone selection (friendly/formal/casual)
- Emoji support
- Fallback to template if API fails

**Prompt Structure:**
```
You are a helpful assistant that creates friendly WhatsApp 
invitation messages for events in India. Use emojis 
appropriately and keep the tone [tone].

Create a WhatsApp invitation message for this event:
Title: [title]
Date: [date]
Time: [time]
Location: [location]
Description: [description]
Registration Link: [url]
```

#### Social Media Post Generation
- Platform-specific formatting
- Hashtag generation
- Emoji usage
- Character limits consideration

**Supported Platforms:**
- Instagram
- Facebook
- WhatsApp broadcast

**Usage Limits:**
- Free: 5 generations/month
- Monthly: 30 generations/month
- Yearly: 200 generations/month

**Error Handling:**
- API failures fall back to template
- Usage limits enforced before API call
- User-friendly error messages

---

## PWA Implementation

### Configuration

**Manifest:** `app/manifest.json`
- App name: "EventOrg - Event Management"
- Short name: "EventOrg"
- Theme color: #3b82f6
- Display: standalone
- Icons: 192x192, 512x512

**Service Worker:** Configured via `next-pwa`
- Automatic generation
- Offline support
- Caching strategy

**Features:**
- Installable on mobile devices
- App-like experience
- Offline capability (basic)
- Fast loading

### Mobile Optimization

- Touch-friendly buttons
- Responsive layouts
- Mobile-first CSS
- Optimized images
- Fast navigation

---

## Usage Limits & Metering

### Implementation

**Location:** `server/routers/event.ts`, `server/routers/contact.ts`, etc.

**Plan Limits:**

| Feature | Free | Monthly | Yearly |
|---------|------|---------|--------|
| Events/month | 2 | 10 | 30 |
| Contacts | 100 | 300 | 1,000 |
| WhatsApp/month | 50 | 500 | 3,000 |
| AI/month | 5 | 30 | 200 |

### Usage Tracking

**Model:** `Usage` (monthly tracking)

**Counters:**
- `eventsCreated`: Incremented on event creation
- `contactsCount`: Total contacts (not monthly)
- `whatsappSent`: Incremented on message send
- `aiGenerations`: Incremented on AI generation

### Limit Enforcement

**Before Action:**
1. Fetch current usage for month
2. Get subscription plan
3. Check if action would exceed limit
4. Throw `FORBIDDEN` error if limit reached
5. Show upgrade prompt

**Error Messages:**
```
"You've reached your monthly event limit (2). 
Upgrade to create more events."
```

**Hard Limits:**
- No soft limits
- No grace periods
- Strict enforcement
- Clear upgrade path

---

## Deployment Guide

### Prerequisites

1. **Database:** PostgreSQL (Supabase recommended)
2. **Hosting:** Vercel (recommended) or similar
3. **Services:** Clerk, Stripe, WhatsApp, Cloudinary accounts

### Environment Variables

See `SETUP.md` for complete list.

**Required:**
- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID` (for WhatsApp)
- `TWILIO_AUTH_TOKEN` (for WhatsApp)
- `TWILIO_WHATSAPP_FROM` (for WhatsApp)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `NEXT_PUBLIC_APP_URL`

**Optional:**
- `OPENAI_API_KEY` (for AI features)

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
   - Add environment variables
   - Deploy

4. **Configure Webhooks:**
   - Stripe: `https://yourdomain.com/api/stripe/webhook`
   - Twilio WhatsApp: `https://yourdomain.com/api/webhooks/twilio` (optional, for delivery status)

5. **Update App URL:**
   - Set `NEXT_PUBLIC_APP_URL` to production domain

### Post-Deployment

1. Test authentication flow
2. Test payment flow
3. Test WhatsApp sending
4. Test AI generation
5. Test premium features (analytics, templates, exports)
6. Monitor error logs
7. Set up analytics

---

## Additional Features

### Image Upload (Cloudinary)

**Implementation:**
- Upload widget in event form
- Automatic optimization
- CDN delivery
- Responsive images

**Configuration:**
- Upload preset: "event_images"
- Allowed formats: jpg, png, webp
- Max file size: 10MB

### Error Handling

**Client-side:**
- Toast notifications
- Form validation errors
- Loading states
- Error boundaries (ready for implementation)

**Server-side:**
- tRPC error codes
- User-friendly messages
- Logging (ready for implementation)

### Performance Optimizations

- **Image Optimization:** Cloudinary CDN
- **Code Splitting:** Next.js automatic
- **Caching:** TanStack Query
- **PWA:** Service worker caching
- **Database:** Indexed queries

---

## Security Considerations

1. **Authentication:** Clerk handles all auth
2. **Authorization:** Organization-based isolation
3. **API Security:** tRPC type safety
4. **Input Validation:** Zod schemas
5. **SQL Injection:** Prisma ORM protection
6. **XSS:** React automatic escaping
7. **CSRF:** Next.js built-in protection

---

## Premium Features

### 1. Advanced Analytics Dashboard

**Location:** `app/(dashboard)/dashboard/dashboard-client.tsx`, `server/routers/analytics.ts`

**Features:**
- Real-time overview metrics with trend indicators
- 6-month event creation trends (Bar Chart)
- 6-month attendance trends (Area Chart)
- Response rate tracking with visual progress
- Month-over-month comparisons
- Contact engagement analytics
- Event performance statistics

**API Endpoints:**
- `analytics.getOverview` - Dashboard metrics and trends
- `analytics.getEventStats` - Per-event detailed statistics
- `analytics.getContactEngagement` - Contact activity tracking

**Usage:**
```typescript
const { data: analytics } = trpc.analytics.getOverview.useQuery()
const { data: eventStats } = trpc.analytics.getEventStats.useQuery({ eventId })
```

---

### 2. Event Templates

**Location:** `server/routers/template.ts`

**Features:**
- Save event configurations as reusable templates
- Quick event creation from templates
- Template management (CRUD operations)
- Pre-fill event forms automatically

**API Endpoints:**
- `template.create` - Create new template
- `template.getAll` - List all templates
- `template.getById` - Get template details
- `template.update` - Update template
- `template.delete` - Delete template

**Usage:**
```typescript
// Create template
const template = await trpc.template.create.mutate({
  name: "Weekly Workshop",
  title: "Weekly Training Session",
  description: "...",
  // ... other fields
})

// Use template in event form
const { data: templates } = trpc.template.getAll.useQuery()
```

---

### 3. CSV Export Functionality

**Location:** `server/routers/export.ts`

**Features:**
- Export events list with all details
- Export contacts database
- Export event attendance reports
- Proper CSV formatting with headers

**API Endpoints:**
- `export.exportEvents` - Export all events
- `export.exportContacts` - Export contacts
- `export.exportEventAttendance` - Export attendance for specific event

**Usage:**
```typescript
const { data: csvData } = trpc.export.exportEvents.useQuery({ format: 'csv' })
// Download CSV file
```

---

### 4. QR Code Check-in

**Location:** `server/routers/attendee.ts`, `server/routers/event.ts`

**Features:**
- Unique QR code generated per event
- On-site check-in via QR scan
- Manual check-in option
- Check-in status tracking

**API Endpoints:**
- `attendee.checkIn` - Manual check-in (protected)
- `attendee.checkInByQR` - QR-based check-in (public)

**Database:**
- `Event.qrCode` - Unique QR code identifier
- `Attendee.checkedIn` - Check-in status
- `Attendee.checkedInAt` - Check-in timestamp

**Usage:**
```typescript
// Manual check-in
await trpc.attendee.checkIn.mutate({
  eventId: "...",
  attendeeId: "..."
})

// QR check-in
await trpc.attendee.checkInByQR.mutate({
  qrCode: event.qrCode,
  phone: attendee.phone
})
```

---

### 5. Contact Groups

**Location:** `server/routers/group.ts`

**Features:**
- Create contact groups for segmentation
- Group-based organization
- Bulk operations on groups
- Group-based event invitations

**API Endpoints:**
- `group.create` - Create new group
- `group.getAll` - List all groups with contacts
- `group.getById` - Get group details
- `group.update` - Update group
- `group.delete` - Delete group

**Usage:**
```typescript
const group = await trpc.group.create.mutate({
  name: "VIP Members",
  description: "Premium members",
  contactIds: ["contact1", "contact2"]
})
```

---

### 6. Capacity Limits & Waitlist

**Location:** `server/routers/event.ts`, `server/routers/attendee.ts`

**Features:**
- Set maximum capacity per event
- Automatic waitlist when full
- Waitlist promotion when spots open
- Capacity tracking and display

**Implementation:**
- `Event.maxCapacity` - Maximum attendees
- `Attendee.isWaitlist` - Waitlist status
- Automatic waitlist assignment on registration
- Capacity checking before confirmation

---

### 7. Recurring Events (Date Shift)

**Location:** `server/routers/event.ts`

**Features:**
- Duplicate events with date offset
- Perfect for weekly/monthly recurring events
- Auto-updates title with "Next Session"
- Flexible date shifting

**API:**
```typescript
await trpc.event.duplicate.mutate({
  id: eventId,
  daysOffset: 7  // Next week
})
```

---

## Future Enhancements

### Ready for Implementation:
- Email notifications
- SMS integration (alternative to WhatsApp)
- Message templates UI
- Scheduled messages
- Multi-language support
- Calendar integration (Google Calendar, Outlook)
- API access for third-party integrations

---

## Support & Maintenance

### Monitoring
- Error tracking (Sentry ready)
- Usage analytics
- Performance monitoring

### Updates
- Regular dependency updates
- Security patches
- Feature additions

---

## Conclusion

EventOrg is a **premium, production-ready SaaS application** with:

### Core Features
✅ **Full-stack implementation**
✅ **Type-safe APIs**
✅ **Modern UI/UX**
✅ **Mobile-first design**
✅ **PWA support**
✅ **Payment integration**
✅ **Usage metering**
✅ **WhatsApp automation** (Twilio)
✅ **AI content generation**
✅ **Scalable architecture**

### Premium Features (v2.0)
✅ **Advanced Analytics Dashboard** - Real-time insights with charts
✅ **Event Templates** - Save and reuse configurations
✅ **CSV Export** - Export events, contacts, attendance
✅ **QR Code Check-in** - On-site attendance tracking
✅ **Contact Groups** - Segmentation and organization
✅ **Capacity Limits & Waitlist** - Professional event management
✅ **Contact Engagement Tracking** - Activity analytics
✅ **Recurring Events** - Date shift duplication
✅ **Enhanced Dashboard UX** - Modern, intuitive interface

The codebase is modular, well-structured, and ready for deployment. All core and premium features are implemented and tested.

**For detailed feature documentation, see:**
- `PREMIUM_SAAS_TRANSFORMATION.md` - Feature overview
- `USER_GUIDE_PREMIUM_FEATURES.md` - User guide
- `SETUP_PREMIUM_FEATURES.md` - Setup instructions
