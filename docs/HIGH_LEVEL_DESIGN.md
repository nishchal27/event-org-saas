# Lexnify Event-Org SaaS — High-Level Design

This document describes the system context, route model, data model, main workflows, and data flow for developers.

### Design legend (icons & colors)

Icons and colors are used consistently across all diagrams:

| Icon | Meaning                   | Color (fill)            | Use                               |
| ---- | ------------------------- | ----------------------- | --------------------------------- |
| 👤   | Organizer / User / People | `#E3F2FD` (light blue)  | Organizer, User, auth context     |
| 👥   | Attendee / Audience       | `#BBDEFB` (blue)        | Attendee, public users            |
| 🔐   | Auth / Protected          | `#FFF3E0` (amber)       | Clerk, protected routes, security |
| ⚙️   | App / Backend             | `#E0F7FA` (cyan)        | Next.js, tRPC, middleware         |
| 🗄️   | Data / Database           | `#E8F5E9` (green)       | PostgreSQL, Prisma, DB            |
| 💳   | Billing                   | `#C8E6C9` (light green) | Stripe, subscription              |
| 💬   | Messaging                 | `#A5D6A7` (green)       | Twilio, WhatsApp                  |
| 🔌   | External service          | `#F3E5F5` (purple)      | Cloudinary, external APIs         |
| 📡   | Monitoring                | `#FFEBEE` (light red)   | Sentry                            |
| 📄   | Public / Route            | `#E3F2FD` (light blue)  | Public routes, pages              |
| ✅   | Check-in / Success        | `#C8E6C9` (green)       | Check-in, success states          |
| 📋   | Event / Entity            | `#E1F5FE` (cyan)        | Event, entity                     |
| 📇   | Contact                   | `#E1F5FE` (cyan)        | Contacts, address book            |
| 📊   | Analytics                 | `#FFF3E0` (amber)       | Analytics, reports                |

---

## 1. System context

```mermaid
flowchart TB
  subgraph users [Users]
    Organizer["👤 Organizer (signed-in)"]
    Attendee["👥 Attendee (anonymous on public pages)"]
  end

  subgraph app [Lexnify App]
    Next["⚙️ Next.js 14 App Router"]
    TRPC["⚙️ tRPC API (/api/trpc)"]
    Next --> TRPC
  end

  subgraph auth [Auth & Billing]
    Clerk["🔐 Clerk (auth + org)"]
    Stripe["💳 Stripe (checkout + webhooks)"]
  end

  subgraph data [Data]
    DB[("🗄️ PostgreSQL + Prisma")]
  end

  subgraph external [External Services]
    Twilio["💬 Twilio (WhatsApp)"]
    Cloudinary["🔌 Cloudinary (images)"]
    Sentry["📡 Sentry (monitoring)"]
  end

  Organizer --> Next
  Attendee --> Next
  Next --> Clerk
  TRPC --> DB
  Next --> Stripe
  TRPC --> Twilio
  Next --> Cloudinary
  Next --> Sentry
  Stripe --> Next
  Clerk --> Next

  style Organizer fill:#E3F2FD,stroke:#1976D2
  style Attendee fill:#BBDEFB,stroke:#1565C0
  style Next fill:#E0F7FA,stroke:#0097A7
  style TRPC fill:#E0F7FA,stroke:#0097A7
  style Clerk fill:#FFF3E0,stroke:#E65100
  style Stripe fill:#C8E6C9,stroke:#388E3C
  style DB fill:#E8F5E9,stroke:#2E7D32
  style Twilio fill:#A5D6A7,stroke:#2E7D32
  style Cloudinary fill:#F3E5F5,stroke:#7B1FA2
  style Sentry fill:#FFEBEE,stroke:#C62828
```

- **Organizers** use the dashboard (protected); **attendees** use public event and check-in pages.
- All API calls from the app go through **Next.js**; authenticated and org-scoped logic uses **tRPC** with **Clerk** in context.
- **Stripe** and **Clerk** webhooks hit public Next.js API routes; **Twilio** is used from tRPC for WhatsApp.

---

## 2. Route classification (public vs protected)

```mermaid
flowchart TB

  Request["Incoming request"]
  Middleware["⚙️ Clerk middleware"]

  Request --> Middleware

  subgraph public_routes [📄 Public Routes]
    direction TB

    subgraph public_pages [🌐 Public Pages]
      direction LR
      Landing["📄 /"]
      LandingAlt["📄 /landing"]
      Guide["📄 /guide(...)"]
      Event["📄 /event(...)"]
      Checkin["📄 /checkin(...)"]
      CreateOrg["📄 /create-organization(...)"]
    end

    subgraph public_auth [🔐 Public Auth]
      direction LR
      SignIn["🔐 /sign-in(...)"]
      SignUp["🔐 /sign-up(...)"]
    end

    subgraph public_api [⚙️ APIs & Webhooks]
      direction LR
      TRPC["⚙️ /api/trpc(...)"]
      StripeWh["💳 /api/stripe/webhook"]
      ClerkWh["🔐 /api/webhooks/clerk(...)"]
      Monitoring["📡 /monitoring"]
    end
  end

  subgraph protected_routes [🔐 Protected - Clerk Auth Required]
    direction TB

    subgraph protected_main [👤 Core Dashboard]
      direction LR
      Dashboard["👤 /(dashboard)/*"]
      Events["📋 /events/*"]
      Contacts["📇 /contacts/*"]
      Analytics["📊 /analytics/*"]
      Settings["⚙️ /settings/*"]
    end

    subgraph protected_special [💳 Special Features]
      direction LR
      Pricing["💳 /pricing/*"]
      Scan["✅ /events/[id]/scan"]
    end
  end

  Middleware --> public_routes
  Middleware --> protected_routes

  style Request fill:#E0F7FA,stroke:#0097A7
  style Middleware fill:#E0F7FA,stroke:#0097A7
  style Landing fill:#E3F2FD,stroke:#1976D2
  style LandingAlt fill:#E3F2FD,stroke:#1976D2
  style Guide fill:#E3F2FD,stroke:#1976D2
  style Event fill:#E3F2FD,stroke:#1976D2
  style Checkin fill:#E3F2FD,stroke:#1976D2
  style SignIn fill:#FFF3E0,stroke:#E65100
  style SignUp fill:#FFF3E0,stroke:#E65100
  style CreateOrg fill:#E3F2FD,stroke:#1976D2
  style TRPC fill:#E0F7FA,stroke:#0097A7
  style StripeWh fill:#C8E6C9,stroke:#388E3C
  style ClerkWh fill:#FFF3E0,stroke:#E65100
  style Monitoring fill:#FFEBEE,stroke:#C62828
  style Dashboard fill:#FFF3E0,stroke:#E65100
  style Events fill:#FFF3E0,stroke:#E65100
  style Contacts fill:#FFF3E0,stroke:#E65100
  style Analytics fill:#FFF3E0,stroke:#E65100
  style Settings fill:#FFF3E0,stroke:#E65100
  style Pricing fill:#C8E6C9,stroke:#388E3C
  style Scan fill:#C8E6C9,stroke:#2E7D32
```

- **Public**: No auth; used for landing, guide, event page, check-in, sign-in/up, create-org, tRPC (procedure-level auth), Stripe/Clerk webhooks, Sentry monitoring.
- **Protected**: Clerk `userId` required; unauthenticated users are redirected to `/sign-in` with `redirect_url`.

---

## 3. Core data model

Entity colors (conceptually): 🏢 Organization (purple), 👤 User (blue), 📋 Event (cyan), 👥 Attendee (blue), 📇 Contact (cyan), 💳 Subscription (green), 🗄️ Usage (green). Junction tables (e.g. Membership, EventContact) link entities.

```mermaid
erDiagram
  Organization ||--o{ Event : "has"
  Organization ||--o{ Contact : "has"
  Organization ||--o{ Membership : "has"
  Organization ||--o| Subscription : "has"
  Organization ||--o{ Usage : "has"
  Organization ||--o{ EventTemplate : "has"
  Organization ||--o{ MessageTemplate : "has"
  Organization ||--o{ ContactGroup : "has"

  User ||--o{ Membership : "has"
  Membership }o--|| Organization : "belongs to"
  Membership }o--|| User : "belongs to"

  Event ||--o{ Attendee : "has"
  Event ||--o{ EventContact : "selectedContacts"
  Event }o--o| EventTemplate : "template"
  Contact ||--o{ EventContact : "eventContacts"
  EventContact }o--|| Event : "event"
  EventContact }o--|| Contact : "contact"

  Contact ||--o{ Attendee : "optional link"
  Attendee }o--|| Event : "event"

  Organization {
    string id
    string clerkOrgId
    string name
    string slug
  }

  User {
    string id
    string clerkUserId
    string email
  }

  Membership {
    string userId
    string organizationId
    string role
  }

  Event {
    string id
    string organizationId
    string publicSlug
    string qrCode
    string timeZone
    boolean selfCheckInEnabled
    string selfCheckInPinHash
    datetime eventDate
    datetime endDate
  }

  Attendee {
    string id
    string eventId
    string phone
    string phoneNormalized
    string attendeeQrCode
    string checkInMethod
    boolean checkedIn
  }

  Contact {
    string id
    string organizationId
    string phone
    string phoneNormalized
  }

  EventContact {
    string eventId
    string contactId
  }

  Subscription {
    string organizationId
    string stripeCustomerId
    string plan
  }

  Usage {
    string organizationId
    int month
    int year
  }
```

- **Organization** is the tenant; synced with Clerk via `clerkOrgId`. **User** and **Membership** tie Clerk users to orgs and roles.
- **Event** has a unique `publicSlug` and optional `qrCode` for event-level check-in; **Attendee** has optional `attendeeQrCode` and `checkInMethod` (e.g. `qr_scan`, `manual`, `event_qr`, `self_qr`).
- **Contact** is org-scoped; **EventContact** links contacts to events (selected contacts for an event). **Attendee** can optionally reference a **Contact**.
- **Subscription** and **Usage** are org-scoped for billing and limits.

---

## 4. Organizer workflow (event → invite → check-in)

```mermaid
sequenceDiagram
  participant Org as 👤 Organizer
  participant App as ⚙️ Next.js + tRPC
  participant Clerk as 🔐 Clerk
  participant DB as 🗄️ PostgreSQL
  participant Twilio as 💬 Twilio
  participant Attendee as 👥 Attendee

  Org->>App: Sign in (Clerk)
  App->>Clerk: Auth + org context
  Clerk-->>App: userId, orgId

  Org->>App: Create event (event.create)
  App->>DB: Event + publicSlug, qrCode, time windows
  DB-->>App: Event

  Org->>App: Add/import contacts (contact.*)
  App->>DB: Contact, EventContact
  Org->>App: Select contacts for event (event.addContacts / eventContacts)
  App->>DB: EventContact

  alt Send WhatsApp
    Org->>App: whatsapp.send (eventId, contactIds)
    App->>DB: Load contacts + event
    App->>Twilio: Send messages
    App->>DB: Mark whatsappSent on Attendee
  end

  Org->>App: Share event link / event QR
  Note over App,Attendee: Public link: /event/[slug]

  Attendee->>App: Open /event/[slug]
  App->>DB: event.getBySlug (public)
  DB-->>App: Event
  App-->>Attendee: Registration form

  Attendee->>App: attendee.register
  App->>DB: Create Attendee (phoneNormalized, attendeeQrCode)
  DB-->>App: Attendee

  Note over Org: At venue: check-in
  alt Staff manual check-in
    Org->>App: attendee.checkIn (manual) [protected]
    App->>DB: Update Attendee checkedIn, checkInMethod
  else Staff scan attendee QR
    Org->>App: /events/[id]/scan → attendee.checkInByAttendeeQR
    App->>DB: Lookup by attendeeQrCode, update checkIn
  else Self check-in (event QR + phone + PIN)
    Attendee->>App: /checkin/[eventQr] → getCheckInContext → selfCheckIn
    App->>DB: Time window + PIN check, update Attendee
  else Attendee scans own QR
    Attendee->>App: /checkin/[attendeeQr] → getCheckInContext → checkInByQR
    App->>DB: Update Attendee checkedIn, checkInMethod
  end
```

- Organizer is always in **org context** (Clerk + tRPC `ctx.organizationId`).
- Event has **time windows** (registration open/close, check-in open/close) and optional **self-check-in** with venue PIN; all check-in paths are idempotent where applicable.

### 4.1 Organization context and dashboard

- **Single source of truth for “has org”:** The server layout (`app/(dashboard)/layout.tsx`) calls `auth()` and passes `hasOrganization = !!orgId` to `DashboardLayoutClient`. This value is provided to all dashboard children via **DashboardOrgContext** (`app/(dashboard)/dashboard-org-context.tsx`). The dashboard page does not infer “has org” from Clerk client state alone.
- **Set active org before redirect:** When the user has orgs but no active org and should go to the dashboard, the app calls Clerk **`setActive({ organization: id })`** (first membership’s org id) then performs **full-page navigation** (`window.location.href = '/dashboard'`) so the next server request sees the updated session cookie. This is implemented only in **dashboard-layout-client.tsx** (the create-organization page does not do setActive + redirect, to avoid duplicate logic). If the server has no org but the client has memberships, the dashboard page can repair the session once by calling `setActive` and reloading.
- **Gate org-dependent queries:** The dashboard page (`dashboard-client.tsx`) enables `event.getAll` and `subscription.getUsage` only when `hasOrganization` from context is true. When `hasOrganization` is false, it does not run those queries and instead shows an empty state (“Create or select an organization to continue”) with a CTA to `/create-organization`. This avoids 401s and redirect loops when the server has no active org.
- **No "create org" when client has org:** If the client has an active org (e.g. sidebar shows it) but the server has no org, the dashboard never shows "Create or select organization"; it shows "Loading your organization…" (one sync: setActive + reload) or "Couldn't load, refresh or use switcher above" with a Refresh button. Only when there is no org on both client and server does it show the create-org CTA. This avoids contradictory UI (org in sidebar vs create-org in main).
- **Global 401 handling:** tRPC `UNAUTHORIZED` is handled globally (e.g. in `app/providers.tsx`) by redirecting to `/create-organization` (not `/sign-in`) so signed-in users without an org land on create-organization instead of a sign-in ↔ dashboard loop.

---

## 5. Attendee workflow (public event + check-in)

```mermaid
flowchart TB
  Start([👥 Attendee has link or QR])
  EventPage["📄 Open /event/[slug]"]
  GetEvent["⚙️ tRPC: event.getBySlug (public)"]
  RegForm["📋 Show registration form"]
  Register["⚙️ tRPC: attendee.register"]
  PostReg["📋 Show confirmation / optional attendee QR"]

  CheckinEntry["📄 Open /checkin/[qrCode]"]
  GetContext["⚙️ tRPC: attendee.getCheckInContext (public)"]
  IsEventQR{QR = event QR?}
  IsAttendeeQR{QR = attendee QR?}

  EventQRFlow["📋 Show event self-check-in form"]
  SelfCheckIn["👥 Enter phone + optional PIN"]
  SelfCheckInCall["⚙️ tRPC: attendee.selfCheckIn"]
  TimePinCheck{Time window + PIN OK?}
  SelfDone["✅ Mark checked-in (event_qr / self_qr)"]

  AttendeeQRFlow["👥 Show attendee identity"]
  ScanConfirm["✅ Confirm check-in"]
  CheckInByQR["⚙️ tRPC: attendee.checkInByQR"]
  ScanDone["✅ Mark checked-in (qr_scan)"]

  Start --> EventPage
  EventPage --> GetEvent
  GetEvent --> RegForm
  RegForm --> Register
  Register --> PostReg

  Start --> CheckinEntry
  CheckinEntry --> GetContext
  GetContext --> IsEventQR
  IsEventQR -->|yes| EventQRFlow
  IsEventQR -->|no| IsAttendeeQR
  IsAttendeeQR -->|yes| AttendeeQRFlow
  EventQRFlow --> SelfCheckIn
  SelfCheckIn --> SelfCheckInCall
  SelfCheckInCall --> TimePinCheck
  TimePinCheck -->|yes| SelfDone
  AttendeeQRFlow --> ScanConfirm
  ScanConfirm --> CheckInByQR
  CheckInByQR --> ScanDone

  style Start fill:#BBDEFB,stroke:#1565C0
  style EventPage fill:#E3F2FD,stroke:#1976D2
  style GetEvent fill:#E0F7FA,stroke:#0097A7
  style RegForm fill:#E1F5FE,stroke:#0288D1
  style Register fill:#E0F7FA,stroke:#0097A7
  style PostReg fill:#E1F5FE,stroke:#0288D1
  style CheckinEntry fill:#E3F2FD,stroke:#1976D2
  style GetContext fill:#E0F7FA,stroke:#0097A7
  style EventQRFlow fill:#E1F5FE,stroke:#0288D1
  style SelfCheckIn fill:#BBDEFB,stroke:#1565C0
  style SelfCheckInCall fill:#E0F7FA,stroke:#0097A7
  style TimePinCheck fill:#FFF3E0,stroke:#E65100
  style SelfDone fill:#C8E6C9,stroke:#2E7D32
  style AttendeeQRFlow fill:#BBDEFB,stroke:#1565C0
  style ScanConfirm fill:#C8E6C9,stroke:#2E7D32
  style CheckInByQR fill:#E0F7FA,stroke:#0097A7
  style ScanDone fill:#C8E6C9,stroke:#2E7D32
```

- **getCheckInContext** returns whether the QR is an event or attendee and whether self-check-in and PIN are required.
- **selfCheckIn** is used when the attendee opens the event QR and enters phone (and PIN if enabled); **checkInByQR** is used when the attendee scans their own attendee QR (or staff scans it at `/events/[id]/scan`).

---

## 6. Data flow (request path)

```mermaid
flowchart LR
  subgraph client [Client]
    Browser["👤 Browser"]
  end

  subgraph next [⚙️ Next.js]
    Middleware["🔐 Middleware (Clerk)"]
    Page["📄 Page / API route"]
    TRPCHandler["⚙️ tRPC handler"]
    Page --> TRPCHandler
    Middleware --> Page
  end

  subgraph trpc_layer [⚙️ tRPC layer]
    Context["🔐 createContext: Clerk auth, org resolution"]
    Router["⚙️ appRouter (event, contact, attendee, etc.)"]
    Context --> Router
    TRPCHandler --> Context
  end

  subgraph data_layer [🗄️ Data layer]
    Prisma["🗄️ Prisma Client"]
    PostgreSQL[("🗄️ PostgreSQL")]
    Prisma --> PostgreSQL
    Router --> Prisma
  end

  subgraph external_services [🔌 External]
    ClerkAPI["🔐 Clerk API"]
    StripeAPI["💳 Stripe API"]
    TwilioAPI["💬 Twilio API"]
  end

  Browser -->|"HTTP"| Middleware
  Router --> ClerkAPI
  Router --> StripeAPI
  Router --> TwilioAPI

  style Browser fill:#E3F2FD,stroke:#1976D2
  style Middleware fill:#FFF3E0,stroke:#E65100
  style Page fill:#E0F7FA,stroke:#0097A7
  style TRPCHandler fill:#E0F7FA,stroke:#0097A7
  style Context fill:#FFF3E0,stroke:#E65100
  style Router fill:#E0F7FA,stroke:#0097A7
  style Prisma fill:#E8F5E9,stroke:#2E7D32
  style PostgreSQL fill:#E8F5E9,stroke:#2E7D32
  style ClerkAPI fill:#FFF3E0,stroke:#E65100
  style StripeAPI fill:#C8E6C9,stroke:#388E3C
  style TwilioAPI fill:#A5D6A7,stroke:#2E7D32
```

- **Browser** → **Middleware**: public routes pass through; protected routes require Clerk `userId` or redirect to sign-in.
- **tRPC**: Context loads user and **active organization** from Clerk session (`auth().orgId`); **protectedProcedure** enforces auth and org. The dashboard layout receives `hasOrganization` from the server and exposes it via **DashboardOrgContext**; the dashboard page only runs org-dependent queries (e.g. event.getAll, subscription.getUsage) when `hasOrganization` is true. **publicProcedure** is used for event.getBySlug, attendee.register, getCheckInContext, checkInByQR, selfCheckIn.
- **Routers** perform business logic and use **Prisma** for all DB access; external calls (Clerk, Stripe, Twilio) are used from procedures or server-side code.

---

## 7. tRPC router overview

| Router          | Purpose                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| event           | CRUD events, getBySlug (public), time windows, self-check-in PIN, addContacts                                                        |
| contact         | CRUD contacts (org-scoped), import                                                                                                   |
| attendee        | register (public), getCheckInContext (public), checkInByQR (public), selfCheckIn (public), checkIn / checkInByAttendeeQR (protected) |
| organization    | getMyOrganizations, getCurrent, switch, create, update                                                                               |
| subscription    | get, getUsage (Stripe-backed)                                                                                                        |
| usage           | getCurrent (org usage)                                                                                                               |
| whatsapp        | send (Twilio)                                                                                                                        |
| ai              | Social posts, copy, suggestions (tokens tracked)                                                                                     |
| analytics       | getSummary, event/org analytics                                                                                                      |
| template        | Event templates CRUD                                                                                                                 |
| export          | Export attendees/contacts                                                                                                            |
| group           | Contact groups CRUD                                                                                                                  |
| messageTemplate | WhatsApp message templates CRUD                                                                                                      |

---

## 8. Key files reference

| Area                | Path                                              |
| ------------------- | ------------------------------------------------- |
| Auth & routes       | `middleware.ts`                                   |
| tRPC app router     | `server/routers/_app.ts`                          |
| tRPC context        | `lib/trpc.ts`                                     |
| Schema              | `prisma/schema.prisma`                            |
| Event time windows  | `lib/event-schedule.ts`                           |
| Phone normalization | `lib/phone.ts`                                    |
| Venue PIN           | `lib/venue-pin.ts`                                |
| Public event page   | `app/event/[slug]/...`                            |
| Public check-in     | `app/checkin/[qrCode]/...`                        |
| Staff scanner       | `app/events/[id]/scan/...`                        |
| Dashboard layout    | `app/(dashboard)/layout.tsx`                      |
| Dashboard layout client | `app/(dashboard)/dashboard-layout-client.tsx` |
| Dashboard org context | `app/(dashboard)/dashboard-org-context.tsx`    |
| Create organization | `app/(dashboard)/create-organization/[[...rest]]/page.tsx` |

This high-level design should stay in sync with the codebase; when adding new routers, public/protected routes, or entities, update this document and the diagrams accordingly. For setup, APIs, and troubleshooting see **DEVELOPER_GUIDE.md**; for quick start see **README.md**.
