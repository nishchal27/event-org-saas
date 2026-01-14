# Pricing & Stripe Integration Refactor

## 🎯 Overview

Complete refactor of pricing structure and Stripe integration based on cost-driven analysis. Removed yearly plan, added Monthly Pro tier, removed contact limits from user-facing UI, and made limits configurable via environment variables.

## ✅ Changes Summary

### 1. **Pricing Structure Overhaul**

#### Removed
- ❌ Yearly plan completely removed
- ❌ Contact limits from pricing page (user-facing)
- ❌ Confusing "Up to X contacts" messaging

#### Added
- ✅ Monthly Pro plan (₹499/month)
- ✅ Three-tier structure: Free, Monthly, Monthly Pro
- ✅ Focus on cost drivers (WhatsApp & AI) only
- ✅ "Unlimited contacts" messaging

#### New Pricing Tiers

| Plan | Price | Events | WhatsApp | AI | Contacts |
|------|-------|--------|----------|----|----------| 
| **Free** | ₹0 | 2/month | 60/month | 10/month | Unlimited* |
| **Monthly** | ₹249/month | 15/month | 300/month | 60/month | Unlimited* |
| **Monthly Pro** | ₹499/month | Unlimited | 1,000/month | 200/month | Unlimited* |

*Internal soft cap: 10,000 contacts (abuse protection, not user-facing)

### 2. **Centralized Plan Limits** (`lib/plan-limits.ts`)

**Created**: Centralized configuration system

**Features**:
- Single source of truth for all plan limits
- Environment variable overrides for important limits
- Type-safe plan types
- Easy to maintain and update

**Environment Variables**:
```env
# Free Plan
PLAN_LIMIT_FREE_WHATSAPP=60
PLAN_LIMIT_FREE_AI=10

# Monthly Plan
PLAN_LIMIT_MONTHLY_WHATSAPP=300
PLAN_LIMIT_MONTHLY_AI=60

# Monthly Pro Plan
PLAN_LIMIT_MONTHLY_PRO_WHATSAPP=1000
PLAN_LIMIT_MONTHLY_PRO_AI=200

# Internal Contact Soft Cap
PLAN_LIMIT_CONTACTS_SOFT_CAP=10000
```

### 3. **Updated All Routers**

All routers now use centralized plan limits:

- ✅ `server/routers/event.ts` - Event creation limits
- ✅ `server/routers/whatsapp.ts` - WhatsApp message limits
- ✅ `server/routers/ai.ts` - AI generation limits
- ✅ `server/routers/contact.ts` - Contact soft cap (internal only)
- ✅ `server/routers/subscription.ts` - Usage stats

### 4. **Contact Limits Removed from UI**

**Before**: "Up to 100 contacts" shown to users
**After**: "Unlimited contacts" shown, soft cap enforced internally

**Implementation**:
- Contact limits removed from pricing page
- Contact limits removed from dashboard (shows "Unlimited")
- Internal soft cap (10k) enforced for abuse protection
- User-friendly error messages if soft cap reached

### 5. **Stripe Integration Updates**

#### Checkout (`app/api/stripe/checkout/route.ts`)
- ✅ Updated to handle `monthly` and `monthly_pro` plans
- ✅ Removed `yearly` plan validation
- ✅ Added `STRIPE_PRICE_ID_MONTHLY_PRO` env variable

#### Webhook (`app/api/stripe/webhook/route.ts`)
- ✅ Enhanced `customer.subscription.updated` handler
- ✅ Automatic plan detection from Stripe price ID
- ✅ Proper subscription period handling
- ✅ Downgrade to free on cancellation

#### Security Improvements
- ✅ Webhook signature verification
- ✅ Metadata validation
- ✅ Organization verification
- ✅ Accurate period date handling

### 6. **Database Schema Updates**

**Prisma Schema** (`prisma/schema.prisma`):
```prisma
plan String // "free" | "monthly" | "monthly_pro" | "enterprise"
```

**Migration Required**:
```bash
npx prisma migrate dev --name update_plan_types
```

### 7. **UI Updates**

#### Pricing Page (`app/(dashboard)/pricing/pricing-client.tsx`)
- ✅ Removed yearly plan card
- ✅ Added Monthly Pro plan card
- ✅ Updated features list
- ✅ Removed contact limits from features
- ✅ Added "Unlimited contacts" messaging

#### Dashboard (`app/(dashboard)/dashboard/dashboard-client.tsx`)
- ✅ Contacts show as "Unlimited" (no limit display)
- ✅ Events show "∞" for unlimited plans
- ✅ Focus on WhatsApp and AI usage

---

## 🔧 Technical Implementation

### Plan Limits System

**File**: `lib/plan-limits.ts`

```typescript
export function getPlanLimits(plan: PlanType): PlanLimits {
  // Returns limits with env variable overrides
  // Supports: free, monthly, monthly_pro, enterprise
}
```

**Usage in Routers**:
```typescript
import { getPlanLimits, type PlanType } from '@/lib/plan-limits'

const plan = (subscription?.plan || 'free') as PlanType
const limits = getPlanLimits(plan)
const limit = limits.whatsapp // or limits.ai, limits.events
```

### Contact Soft Cap

Contacts are "unlimited" to users but have an internal soft cap:

```typescript
// Internal soft cap (10k default)
const softCap = limits.contacts

// Only enforced if approaching limit
if (contactCount >= softCap) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'Contact limit reached. Please contact support...',
  })
}
```

**Benefits**:
- Users don't see confusing limits
- Protection against abuse
- Can be adjusted via env variable

---

## 🔒 Stripe Integration Security

### Webhook Security

1. **Signature Verification**
   ```typescript
   event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
   ```

2. **Metadata Validation**
   ```typescript
   const orgId = session.metadata?.orgId
   const plan = session.metadata?.plan
   if (!orgId || !plan) { /* reject */ }
   ```

3. **Organization Verification**
   ```typescript
   const organization = await prisma.organization.findUnique({
     where: { clerkOrgId: orgId },
   })
   ```

### Checkout Security

1. **Authentication Required**
   - Only authenticated users can create checkout sessions
   - Organization ID from Clerk session

2. **Plan Validation**
   - Only `monthly` and `monthly_pro` accepted
   - Invalid plans rejected

3. **Metadata Storage**
   - Organization ID stored in checkout metadata
   - Plan stored in checkout metadata
   - Used for webhook verification

---

## 📊 Cost-Driven Pricing Philosophy

### Real Cost Drivers (What We Limit)

1. **WhatsApp Messages** 💬
   - Real cost: Meta WhatsApp Cloud API charges
   - Limits: 60 (free) → 300 (monthly) → 1,000 (pro)

2. **AI Generations** 🤖
   - Real cost: OpenAI API tokens
   - Limits: 10 (free) → 60 (monthly) → 200 (pro)

### Non-Cost Drivers (Unlimited or High)

1. **Events** 📅
   - Cost: CPU + DB (negligible)
   - Free: 2/month, Monthly: 15/month, Pro: Unlimited

2. **Contacts** 👥
   - Cost: Storage (negligible, few KBs)
   - All plans: Unlimited (10k soft cap internally)

3. **Attendees** ✅
   - Cost: Storage (negligible)
   - All plans: Unlimited

---

## 🚀 Migration Guide

### Step 1: Update Environment Variables

Add to `.env`:
```env
# Remove old
# STRIPE_PRICE_ID_YEARLY=...

# Add new
STRIPE_PRICE_ID_MONTHLY_PRO="price_..."

# Optional: Override limits
PLAN_LIMIT_FREE_WHATSAPP=60
PLAN_LIMIT_FREE_AI=10
PLAN_LIMIT_MONTHLY_WHATSAPP=300
PLAN_LIMIT_MONTHLY_AI=60
PLAN_LIMIT_MONTHLY_PRO_WHATSAPP=1000
PLAN_LIMIT_MONTHLY_PRO_AI=200
PLAN_LIMIT_CONTACTS_SOFT_CAP=10000
```

### Step 2: Create Stripe Products

1. Create "Monthly Pro" product in Stripe
2. Set price: ₹499/month (recurring)
3. Copy Price ID to `STRIPE_PRICE_ID_MONTHLY_PRO`

### Step 3: Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name update_plan_types

# Or push directly (dev only)
npx prisma db push
```

### Step 4: Update Existing Subscriptions

If you have existing `yearly` subscriptions:

```sql
-- Option 1: Downgrade to monthly_pro (similar limits)
UPDATE subscriptions SET plan = 'monthly_pro' WHERE plan = 'yearly';

-- Option 2: Downgrade to monthly
UPDATE subscriptions SET plan = 'monthly' WHERE plan = 'yearly';

-- Option 3: Keep as free (if canceled)
UPDATE subscriptions SET plan = 'free' WHERE plan = 'yearly' AND status = 'canceled';
```

### Step 5: Test

1. Test checkout flow for both plans
2. Test webhook events
3. Verify subscription creation
4. Test plan upgrades
5. Verify limit enforcement

---

## 📝 Files Changed

### New Files
- ✅ `lib/plan-limits.ts` - Centralized plan limits
- ✅ `STRIPE_INTEGRATION_GUIDE.md` - Comprehensive Stripe docs

### Updated Files
- ✅ `app/(dashboard)/pricing/pricing-client.tsx` - New pricing structure
- ✅ `app/(dashboard)/dashboard/dashboard-client.tsx` - Removed contact limits
- ✅ `server/routers/subscription.ts` - Uses centralized limits
- ✅ `server/routers/event.ts` - Uses centralized limits
- ✅ `server/routers/whatsapp.ts` - Uses centralized limits
- ✅ `server/routers/ai.ts` - Uses centralized limits
- ✅ `server/routers/contact.ts` - Soft cap only
- ✅ `app/api/stripe/checkout/route.ts` - Updated for monthly_pro
- ✅ `app/api/stripe/webhook/route.ts` - Enhanced webhook handling
- ✅ `prisma/schema.prisma` - Updated plan type
- ✅ `env.template` - Updated environment variables

---

## 🎯 Benefits

### For Users
- ✅ Simpler pricing (no confusing contact math)
- ✅ Clear value proposition (pay for messages, not storage)
- ✅ Easy upgrade path
- ✅ No artificial limits on contacts

### For Business
- ✅ Costs scale predictably
- ✅ Easy to adjust limits via env variables
- ✅ No database anxiety
- ✅ Clear revenue model

### For Development
- ✅ Centralized limit management
- ✅ Type-safe plan types
- ✅ Easy to add new plans
- ✅ Environment-configurable limits

---

## 🔮 Future Enhancements

1. **Usage Alerts**: Notify users approaching limits
2. **Message Packs**: Add-on packs for WhatsApp messages
3. **AI Token Packs**: Add-on packs for AI generations
4. **Customer Portal**: Self-service subscription management
5. **Proration**: Handle mid-cycle upgrades
6. **Trial Periods**: Free trial for paid plans

---

## ✅ Testing Checklist

- [ ] Pricing page shows correct plans
- [ ] Checkout works for monthly plan
- [ ] Checkout works for monthly_pro plan
- [ ] Webhook creates subscription correctly
- [ ] Webhook updates subscription correctly
- [ ] Webhook handles cancellation correctly
- [ ] Limits enforced correctly (WhatsApp)
- [ ] Limits enforced correctly (AI)
- [ ] Limits enforced correctly (Events)
- [ ] Contact soft cap works (internal)
- [ ] Dashboard shows unlimited contacts
- [ ] Environment variable overrides work
- [ ] Plan upgrades work
- [ ] Plan downgrades work

---

## 📚 Documentation

- **Stripe Integration**: See `STRIPE_INTEGRATION_GUIDE.md`
- **Plan Limits**: See `lib/plan-limits.ts` (inline docs)
- **Environment Variables**: See `env.template`

---

**Last Updated**: 2024
**Version**: 2.0.0
