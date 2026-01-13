# Clerk Webhook Events - When They Fire

## 📋 Your Configured Events

You have these events configured:
- ✅ `user.created`
- ✅ `user.updated`
- ✅ `user.deleted`
- ✅ `organization.created`
- ✅ `organization.updated`
- ✅ `organization.deleted`
- ✅ `organizationMembership.created`

## 🔔 When Each Event Fires

### 1. `user.created` 
**When it fires:**
- ✅ User signs up for the first time (via Google OAuth, email, etc.)
- ✅ User is created in Clerk Dashboard manually
- ✅ User is created via Clerk API

**What happens in your webhook:**
```typescript
// Creates User record in your database
{
  clerkId: "user_xxx",
  email: "user@example.com",
  name: "John Doe"
}
```

**Example flow:**
1. User clicks "Sign in with Google"
2. Completes OAuth flow
3. Clerk creates user account
4. **Webhook fires** → `user.created`
5. Your webhook creates User in DB

---

### 2. `user.updated`
**When it fires:**
- ✅ User updates their profile (name, email, etc.)
- ✅ Admin updates user in Clerk Dashboard
- ✅ User profile updated via Clerk API

**What happens in your webhook:**
```typescript
// Updates User record in your database
// Updates email, name fields
```

**Example flow:**
1. User goes to settings
2. Changes name from "John" to "John Smith"
3. Clerk updates user profile
4. **Webhook fires** → `user.updated`
5. Your webhook updates User in DB

---

### 3. `user.deleted`
**When it fires:**
- ✅ User deletes their account
- ✅ Admin deletes user in Clerk Dashboard
- ✅ User deleted via Clerk API

**What happens in your webhook:**
- Currently just logs the event
- You can add logic to soft-delete or cascade delete user data

**Example flow:**
1. User requests account deletion
2. Clerk deletes user account
3. **Webhook fires** → `user.deleted`
4. Your webhook can handle cleanup (optional)

---

### 4. `organization.created`
**When it fires:**
- ✅ Organization created via your app (`/create-organization` page)
- ✅ Organization created in Clerk Dashboard
- ✅ Organization created via Clerk API
- ✅ Organization created via Clerk's organization switcher (if enabled)

**What happens in your webhook:**
```typescript
// Creates Organization in DB
// Creates Membership (if created_by is provided)
// Creates free Subscription
// Initializes Usage for current month
```

**Example flow:**
1. User fills out organization form
2. Your app calls Clerk API to create org
3. Clerk creates organization
4. **Webhook fires** → `organization.created`
5. Your webhook:
   - Creates Organization in DB
   - Creates Membership (user → org)
   - Creates free Subscription
   - Initializes Usage

---

### 5. `organization.updated`
**When it fires:**
- ✅ Organization name/logo updated in Clerk Dashboard
- ✅ Organization updated via Clerk API
- ✅ Organization updated via your app (if you add org settings)

**What happens in your webhook:**
```typescript
// Updates Organization record
// Updates name, slug, logo
```

**Example flow:**
1. Admin updates org name in Clerk Dashboard
2. Clerk updates organization
3. **Webhook fires** → `organization.updated`
4. Your webhook updates Organization in DB

---

### 6. `organization.deleted`
**When it fires:**
- ✅ Organization deleted in Clerk Dashboard
- ✅ Organization deleted via Clerk API

**What happens in your webhook:**
```typescript
// Deletes Organization (cascade deletes related records)
// Prisma cascade will handle:
// - Memberships
// - Events
// - Contacts
// - Subscription
// - Usage
```

**Example flow:**
1. Admin deletes organization in Clerk Dashboard
2. Clerk deletes organization
3. **Webhook fires** → `organization.deleted`
4. Your webhook deletes Organization (cascade handles rest)

---

### 7. `organizationMembership.created`
**When it fires:**
- ✅ User is added to an organization
- ✅ User joins organization via invitation
- ✅ Admin adds user to org in Clerk Dashboard
- ✅ Membership created via Clerk API

**What happens in your webhook:**
```typescript
// Creates Membership record
// Links User to Organization
// Sets role (default: "admin")
```

**Example flow:**
1. Admin invites user to organization
2. User accepts invitation
3. Clerk creates membership
4. **Webhook fires** → `organizationMembership.created`
5. Your webhook creates Membership in DB

---

## 🔄 Complete User Journey

### First-Time User Flow:

```
1. User signs up with Google
   ↓
2. Clerk creates user account
   ↓
3. 🔔 WEBHOOK: user.created
   → Creates User in your DB
   ↓
4. User redirected to /create-organization
   ↓
5. User fills form, clicks "Create Organization"
   ↓
6. Your app calls Clerk API to create org
   ↓
7. Clerk creates organization
   ↓
8. 🔔 WEBHOOK: organization.created
   → Creates Organization in DB
   → Creates Membership (user → org)
   → Creates Subscription (free plan)
   → Initializes Usage
   ↓
9. 🔔 WEBHOOK: organizationMembership.created (if separate event)
   → Creates/updates Membership
   ↓
10. User can now access dashboard
```

### Existing User Flow:

```
1. User signs in
   ↓
2. User already exists in DB (from previous signup)
   ↓
3. User accesses dashboard
   ↓
4. Dashboard checks: Has organization?
   ↓
5a. YES → Show dashboard
5b. NO → Redirect to /create-organization
```

---

## ⚠️ Important Notes

### Webhook Timing
- Webhooks fire **asynchronously** after the event
- There may be a **small delay** (usually < 1 second)
- Your app should handle cases where webhook hasn't fired yet

### Fallback Mechanisms
Your code has fallbacks:

1. **User Creation Fallback:**
   - If `user.created` webhook hasn't fired
   - `lib/trpc.ts` creates user on first tRPC call

2. **Organization Creation:**
   - Your `organization.create` mutation creates org in DB immediately
   - Webhook also creates it (upsert handles duplicates)

3. **Membership Creation:**
   - `organization.create` creates membership immediately
   - Webhook also creates it (upsert handles duplicates)

### Webhook Reliability
- ✅ Webhooks are **idempotent** (upsert prevents duplicates)
- ✅ Fallback mechanisms ensure data consistency
- ✅ Even if webhook fails, your app still works

---

## 🧪 Testing Webhooks

### Test User Creation:
1. Sign up a new user
2. Check your terminal for: `✅ Processing user.created`
3. Check database: `SELECT * FROM users WHERE clerk_id = 'user_xxx'`

### Test Organization Creation:
1. Create organization via `/create-organization`
2. Check terminal for: `✅ Processing organization.created`
3. Check database:
   ```sql
   SELECT * FROM organizations WHERE clerk_org_id = 'org_xxx';
   SELECT * FROM memberships WHERE organization_id = '...';
   SELECT * FROM subscriptions WHERE organization_id = '...';
   ```

### Test Membership:
1. Add user to organization in Clerk Dashboard
2. Check terminal for: `✅ Processing organizationMembership.created`
3. Check database: `SELECT * FROM memberships WHERE ...`

---

## 📊 Event Summary Table

| Event | When It Fires | What Your Webhook Does |
|-------|---------------|------------------------|
| `user.created` | User signs up | Creates User in DB |
| `user.updated` | User updates profile | Updates User in DB |
| `user.deleted` | User deletes account | Logs event (optional cleanup) |
| `organization.created` | Org created | Creates Org + Membership + Subscription + Usage |
| `organization.updated` | Org updated | Updates Org in DB |
| `organization.deleted` | Org deleted | Deletes Org (cascade) |
| `organizationMembership.created` | User added to org | Creates Membership |

---

## 🔍 Monitoring Webhooks

### Check if Webhooks Are Firing:

1. **Clerk Dashboard:**
   - Go to Webhooks → Your Endpoint
   - See "Recent Events" tab
   - Check for successful deliveries

2. **Your Terminal:**
   - Look for logs like:
     ```
     🔔 WEBHOOK REQUEST RECEIVED
     📦 Event type: user.created
     ✅ Processing user.created
     ✅ User created/updated in DB
     ```

3. **ngrok (if using):**
   - Visit `http://localhost:4040`
   - See incoming POST requests to `/api/webhooks/clerk`

---

## ✅ Your Current Setup

You have all the necessary events configured! The webhook will fire automatically when:

1. ✅ **User signs up** → `user.created`
2. ✅ **User updates profile** → `user.updated`
3. ✅ **User deletes account** → `user.deleted`
4. ✅ **Organization created** → `organization.created`
5. ✅ **Organization updated** → `organization.updated`
6. ✅ **Organization deleted** → `organization.deleted`
7. ✅ **User added to org** → `organizationMembership.created`

Everything is set up correctly! 🎉
