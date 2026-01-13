# EventOrg API Reference

Complete API reference for all tRPC endpoints.

## Base URL

All tRPC endpoints are available at: `/api/trpc`

## Client Usage

```typescript
import { trpc } from '@/lib/trpc-client'

// Example: Get all events
const { data: events } = trpc.event.getAll.useQuery()

// Example: Create event
const createEvent = trpc.event.create.useMutation()
createEvent.mutate({ title: 'My Event', ... })
```

---

## Event Router

### `event.create`

Create a new event.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  title: string                    // Required, min 1 char
  imageUrl?: string                 // Optional, must be valid URL
  eventDate: string                 // ISO date string
  startTime: string                 // HH:mm format
  endTime?: string                  // Optional, HH:mm format
  locationType: "physical" | "online"
  location: string                  // Required, min 1 char
  description: string              // Required, min 1 char
  additionalNotes?: string          // Optional
  audienceType: "all" | "selected" | "public"
  customField1Label?: string        // Optional
  customField1Value?: string        // Optional
  customField2Label?: string        // Optional
  customField2Value?: string        // Optional
}
```

**Returns:**
```typescript
{
  id: string
  organizationId: string
  title: string
  imageUrl: string | null
  eventDate: Date
  startTime: string
  endTime: string | null
  locationType: string
  location: string
  description: string
  additionalNotes: string | null
  audienceType: string
  isPublic: boolean
  publicSlug: string
  customField1Label: string | null
  customField1Value: string | null
  customField2Label: string | null
  customField2Value: string | null
  registrationClosed: boolean
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
}
```

**Errors:**
- `FORBIDDEN`: Monthly event limit reached
- `UNAUTHORIZED`: Not authenticated

**Example:**
```typescript
const event = await trpc.event.create.mutate({
  title: "Community Meditation",
  eventDate: "2024-12-25",
  startTime: "10:00",
  endTime: "11:00",
  locationType: "physical",
  location: "Community Center, Mumbai",
  description: "Join us for a peaceful meditation session",
  audienceType: "public"
})
```

---

### `event.getAll`

Get all events for the organization.

**Type:** `protectedProcedure`

**Input:** None

**Returns:**
```typescript
Array<{
  id: string
  title: string
  eventDate: Date
  startTime: string
  location: string
  _count: {
    attendees: number
  }
  // ... other fields
}>
```

**Example:**
```typescript
const { data: events } = trpc.event.getAll.useQuery()
```

---

### `event.getById`

Get event by ID with full details.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  id: string
}
```

**Returns:**
```typescript
{
  id: string
  // ... all event fields
  attendees: Array<{
    id: string
    name: string
    phone: string
    status: string
    contact: Contact | null
  }>
  selectedContacts: Array<{
    contact: Contact
  }>
  _count: {
    attendees: number
  }
}
```

**Errors:**
- `NOT_FOUND`: Event doesn't exist
- `UNAUTHORIZED`: Not authenticated

---

### `event.getBySlug`

Get public event by slug (no auth required).

**Type:** `publicProcedure`

**Input:**
```typescript
{
  slug: string
}
```

**Returns:** Event object (public fields only)

**Errors:**
- `NOT_FOUND`: Event doesn't exist

---

### `event.update`

Update an existing event.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  id: string
  data: Partial<EventSchema>  // Any event fields
}
```

**Returns:** Updated event

**Errors:**
- `NOT_FOUND`: Event doesn't exist
- `UNAUTHORIZED`: Not authenticated or not owner

---

### `event.duplicate`

Duplicate an existing event.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  id: string
}
```

**Returns:** New event with "(Copy)" suffix

**Errors:**
- `NOT_FOUND`: Event doesn't exist
- `FORBIDDEN`: Monthly event limit reached

---

### `event.delete`

Soft delete an event.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  id: string
}
```

**Returns:** Event with `deletedAt` set

**Errors:**
- `NOT_FOUND`: Event doesn't exist

---

### `event.toggleRegistration`

Open/close event registration.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  id: string
  closed: boolean
}
```

**Returns:** Updated event

---

## Contact Router

### `contact.create`

Add a new contact.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  name: string              // Required, min 1 char
  phone: string            // Required, min 10 chars
  email?: string           // Optional, must be valid email
  tags?: string[]          // Optional array
  location?: string        // Optional
  notes?: string           // Optional
}
```

**Returns:** Created contact

**Errors:**
- `FORBIDDEN`: Contact limit reached
- `UNAUTHORIZED`: Not authenticated

---

### `contact.getAll`

Get all contacts.

**Type:** `protectedProcedure`

**Input:** None

**Returns:** Array of contacts

---

### `contact.update`

Update a contact.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  id: string
  data: {
    name?: string
    phone?: string
    email?: string | null
    tags?: string[]
    location?: string | null
    notes?: string | null
  }
}
```

**Returns:** Updated contact

---

### `contact.delete`

Delete a contact.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  id: string
}
```

**Returns:** Deleted contact

---

### `contact.bulkCreate`

Import multiple contacts.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  contacts: Array<{
    name: string
    phone: string
    email?: string | null
    tags?: string[]
    location?: string | null
  }>
}
```

**Returns:** `{ count: number }` - Number of contacts created

**Errors:**
- `FORBIDDEN`: Would exceed contact limit

---

## Subscription Router

### `subscription.get`

Get current subscription.

**Type:** `protectedProcedure`

**Input:** None

**Returns:**
```typescript
{
  id: string
  organizationId: string
  plan: "free" | "monthly" | "yearly" | "enterprise"
  status: "active" | "canceled" | "past_due"
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  createdAt: Date
  updatedAt: Date
}
```

---

### `subscription.getUsage`

Get current usage and limits.

**Type:** `protectedProcedure`

**Input:** None

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

---

## WhatsApp Router

### `whatsapp.sendInvite`

Send WhatsApp invitations.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  eventId: string
  contactIds: string[]      // Array of contact IDs
  message?: string         // Optional custom message
}
```

**Returns:**
```typescript
{
  sent: number  // Number of messages successfully sent
}
```

**Errors:**
- `FORBIDDEN`: Would exceed WhatsApp limit
- `NOT_FOUND`: Event not found
- `UNAUTHORIZED`: Not authenticated

**Example:**
```typescript
const result = await trpc.whatsapp.sendInvite.mutate({
  eventId: "event_123",
  contactIds: ["contact_1", "contact_2"],
  message: "Custom invitation message" // Optional
})
// Returns: { sent: 2 }
```

---

## AI Router

### `ai.generateWhatsAppMessage`

Generate WhatsApp message using AI.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  eventId: string
  tone: "friendly" | "formal" | "casual"
}
```

**Returns:**
```typescript
{
  message: string  // Generated message text
}
```

**Errors:**
- `FORBIDDEN`: AI generation limit reached
- `NOT_FOUND`: Event not found

---

### `ai.generateSocialPost`

Generate social media post.

**Type:** `protectedProcedure`

**Input:**
```typescript
{
  eventId: string
  platform: "instagram" | "facebook" | "whatsapp"
}
```

**Returns:**
```typescript
{
  post: string  // Generated post text
}
```

**Errors:**
- `FORBIDDEN`: AI generation limit reached
- `NOT_FOUND`: Event not found

---

## Attendee Router

### `attendee.register`

Register for a public event (no auth required).

**Type:** `publicProcedure`

**Input:**
```typescript
{
  eventSlug: string
  name: string              // Required
  phone: string            // Required, min 10 chars
  email?: string | null    // Optional
  status: "confirmed" | "declined" | "maybe"
}
```

**Returns:**
```typescript
{
  id: string
  eventId: string
  name: string
  phone: string
  email: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}
```

**Errors:**
- `NOT_FOUND`: Event not found
- `FORBIDDEN`: Registration closed

**Example:**
```typescript
const attendee = await trpc.attendee.register.mutate({
  eventSlug: "abc123xyz",
  name: "John Doe",
  phone: "9876543210",
  email: "john@example.com",
  status: "confirmed"
})
```

---

## Error Codes

All tRPC errors follow standard HTTP status codes:

- `UNAUTHORIZED` (401): Not authenticated
- `FORBIDDEN` (403): Action not allowed (usually limit reached)
- `NOT_FOUND` (404): Resource doesn't exist
- `BAD_REQUEST` (400): Invalid input
- `INTERNAL_SERVER_ERROR` (500): Server error

---

## Type Safety

All APIs are fully type-safe. TypeScript will:
- Autocomplete input fields
- Validate return types
- Catch errors at compile time
- Provide IntelliSense support

---

## Rate Limiting

Currently, rate limiting is handled by:
- Usage limits per subscription plan
- Monthly quotas
- Hard limits (no grace periods)

Future: API rate limiting can be added at the middleware level.

---

## Webhooks

### Stripe Webhook

**Endpoint:** `/api/stripe/webhook`

**Events Handled:**
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Security:** Signature verification required

---

## Testing

### Example: Create and Invite Flow

```typescript
// 1. Create event
const event = await trpc.event.create.mutate({
  title: "Test Event",
  eventDate: "2024-12-25",
  startTime: "10:00",
  locationType: "physical",
  location: "Test Location",
  description: "Test description",
  audienceType: "public"
})

// 2. Add contacts
await trpc.contact.create.mutate({
  name: "John Doe",
  phone: "9876543210"
})

// 3. Get contacts
const contacts = await trpc.contact.getAll.query()

// 4. Send invitations
await trpc.whatsapp.sendInvite.mutate({
  eventId: event.id,
  contactIds: [contacts[0].id]
})
```

---

## Best Practices

1. **Always handle errors:**
   ```typescript
   try {
     await mutation.mutate(data)
   } catch (error) {
     // Handle error
   }
   ```

2. **Use loading states:**
   ```typescript
   const { data, isLoading } = trpc.event.getAll.useQuery()
   ```

3. **Invalidate queries after mutations:**
   ```typescript
   const utils = trpc.useUtils()
   await mutation.mutate(data)
   await utils.event.getAll.invalidate()
   ```

4. **Check limits before actions:**
   ```typescript
   const { data: usage } = trpc.subscription.getUsage.useQuery()
   if (usage.usage.eventsCreated >= usage.limits.events) {
     // Show upgrade prompt
   }
   ```

---

## Support

For API issues or questions, refer to:
- `DOCUMENTATION.md` for detailed implementation
- `SETUP.md` for configuration
- GitHub issues for bug reports
