# Stripe Integration Guide

## 🔒 Overview

This guide covers the complete Stripe payment integration for EventOrg SaaS, including setup, security, webhook handling, and subscription management.

## 📋 Table of Contents

1. [Stripe Setup](#stripe-setup)
2. [Environment Variables](#environment-variables)
3. [Pricing Plans](#pricing-plans)
4. [Checkout Flow](#checkout-flow)
5. [Webhook Handling](#webhook-handling)
6. [Security Best Practices](#security-best-practices)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Stripe Setup

### Step 1: Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete business verification
3. Switch to **Test Mode** for development

### Step 2: Get API Keys

1. Navigate to **Developers** → **API keys**
2. Copy:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### Step 3: Create Products & Prices

#### Create Monthly Plan (₹249/month)

1. Go to **Products** → **Add product**
2. Name: `Monthly Plan`
3. Description: `For small NGOs & communities`
4. Pricing:
   - **Price**: ₹249
   - **Billing period**: Monthly (recurring)
   - **Currency**: INR
5. Copy the **Price ID** (starts with `price_`)

#### Create Monthly Pro Plan (₹499/month)

1. Go to **Products** → **Add product**
2. Name: `Monthly Pro Plan`
3. Description: `For serious & growing organizations`
4. Pricing:
   - **Price**: ₹499
   - **Billing period**: Monthly (recurring)
   - **Currency**: INR
5. Copy the **Price ID** (starts with `price_`)

### Step 4: Configure Webhook

1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Copy the **Signing secret** (starts with `whsec_`)

---

## 🔐 Environment Variables

Add these to your `.env` file:

```env
# Stripe API Keys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Stripe Price IDs (from Step 3)
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_MONTHLY_PRO="price_..."

# Stripe Webhook Secret (from Step 4)
STRIPE_WEBHOOK_SECRET="whsec_..."
```

---

## 💰 Pricing Plans

### Current Plans

| Plan | Price | Events | WhatsApp | AI | Contacts |
|------|-------|--------|-----------|----|----------| 
| **Free** | ₹0 | 2/month | 60/month | 10/month | Unlimited* |
| **Monthly** | ₹249/month | 15/month | 300/month | 60/month | Unlimited* |
| **Monthly Pro** | ₹499/month | Unlimited | 1,000/month | 200/month | Unlimited* |

*Contacts have an internal soft cap (10,000) for abuse protection, not shown to users.

### Plan Limits Configuration

Limits are centralized in `lib/plan-limits.ts` and can be overridden via environment variables:

```env
# Free Plan Limits
PLAN_LIMIT_FREE_WHATSAPP=60
PLAN_LIMIT_FREE_AI=10

# Monthly Plan Limits
PLAN_LIMIT_MONTHLY_WHATSAPP=300
PLAN_LIMIT_MONTHLY_AI=60

# Monthly Pro Plan Limits
PLAN_LIMIT_MONTHLY_PRO_WHATSAPP=1000
PLAN_LIMIT_MONTHLY_PRO_AI=200

# Internal Contact Soft Cap (abuse protection)
PLAN_LIMIT_CONTACTS_SOFT_CAP=10000
```

---

## 🛒 Checkout Flow

### User Journey

1. User clicks "Upgrade" on pricing page
2. Redirects to `/api/stripe/checkout?plan=monthly` or `plan=monthly_pro`
3. Stripe Checkout page opens
4. User enters payment details
5. Payment processed
6. Webhook fires: `checkout.session.completed`
7. Subscription created/updated in database
8. User redirected to dashboard with success message

### Implementation

**File**: `app/api/stripe/checkout/route.ts`

```typescript
// Creates Stripe Checkout session
// Validates plan (monthly or monthly_pro)
// Sets metadata (orgId, plan)
// Redirects to Stripe Checkout
```

**Security**:
- ✅ Requires authentication (Clerk)
- ✅ Validates plan parameter
- ✅ Uses organization ID from Clerk session
- ✅ Stores metadata for webhook verification

---

## 🔔 Webhook Handling

### Webhook Endpoint

**File**: `app/api/stripe/webhook/route.ts`

### Events Handled

#### 1. `checkout.session.completed`

Triggered when user completes payment.

**Actions**:
- Creates/updates subscription in database
- Sets plan based on metadata
- Links Stripe customer ID
- Links Stripe subscription ID
- Sets billing period dates

**Security**:
- ✅ Verifies webhook signature
- ✅ Validates organization exists
- ✅ Uses metadata for plan verification

#### 2. `customer.subscription.updated`

Triggered when subscription changes (plan upgrade/downgrade, renewal).

**Actions**:
- Updates subscription status
- Updates plan if price changed
- Updates billing period end date

**Plan Detection**:
- Maps Stripe price ID to plan name
- Updates database accordingly

#### 3. `customer.subscription.deleted`

Triggered when subscription is canceled.

**Actions**:
- Sets status to `canceled`
- Downgrades plan to `free`
- Preserves billing period end date

### Webhook Security

```typescript
// 1. Verify signature
event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

// 2. Validate metadata
if (!orgId || !plan) { /* reject */ }

// 3. Verify organization exists
const organization = await prisma.organization.findUnique({...})

// 4. Process event
```

---

## 🔒 Security Best Practices

### ✅ Implemented

1. **Webhook Signature Verification**
   - All webhook requests verified with Stripe signature
   - Prevents unauthorized requests

2. **Metadata Validation**
   - Organization ID stored in checkout metadata
   - Verified in webhook handler

3. **Authentication Required**
   - Checkout endpoint requires Clerk authentication
   - Organization ID from authenticated session

4. **Plan Validation**
   - Only valid plans accepted (`monthly`, `monthly_pro`)
   - Invalid plans rejected with 400 error

5. **Idempotency**
   - Database upserts prevent duplicate subscriptions
   - Safe to retry webhook events

### 🛡️ Additional Recommendations

1. **Rate Limiting**
   - Add rate limiting to checkout endpoint
   - Prevent abuse

2. **Logging**
   - Log all webhook events for audit trail
   - Monitor failed webhook processing

3. **Error Handling**
   - Graceful error handling in webhook
   - Retry mechanism for failed events

4. **Testing**
   - Use Stripe CLI for local webhook testing
   - Test all subscription scenarios

---

## 🧪 Testing

### Local Testing with Stripe CLI

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward Webhooks**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Trigger Test Events**
   ```bash
   # Test checkout completion
   stripe trigger checkout.session.completed

   # Test subscription update
   stripe trigger customer.subscription.updated

   # Test subscription deletion
   stripe trigger customer.subscription.deleted
   ```

### Test Cards

Use Stripe test cards:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Auth**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC works.

---

## 🐛 Troubleshooting

### Issue: Webhook not receiving events

**Solutions**:
1. Check webhook endpoint URL is correct
2. Verify webhook secret matches
3. Check Stripe dashboard for failed deliveries
4. Ensure endpoint is publicly accessible
5. Check server logs for errors

### Issue: Subscription not updating

**Solutions**:
1. Verify webhook signature verification
2. Check database connection
3. Verify organization exists
4. Check webhook event logs in Stripe dashboard
5. Ensure metadata is set correctly

### Issue: Wrong plan assigned

**Solutions**:
1. Verify price ID mapping in webhook handler
2. Check Stripe product/price configuration
3. Verify metadata in checkout session
4. Check database subscription record

### Issue: Checkout redirect fails

**Solutions**:
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly
2. Check success/cancel URLs
3. Verify Stripe API keys are correct
4. Check browser console for errors

---

## 📊 Database Schema

### Subscription Model

```prisma
model Subscription {
  id                 String       @id @default(cuid())
  organizationId     String       @unique
  plan               String       // "free" | "monthly" | "monthly_pro" | "enterprise"
  status             String       // "active" | "canceled" | "past_due"
  stripeCustomerId   String?      @unique
  stripeSubscriptionId String?    @unique
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
}
```

### Plan Types

- `free`: Default plan, no payment
- `monthly`: ₹249/month subscription
- `monthly_pro`: ₹499/month subscription
- `enterprise`: Custom pricing (manual setup)

---

## 🔄 Subscription Lifecycle

### 1. Initial Subscription

```
User clicks "Upgrade"
  ↓
Checkout session created
  ↓
Payment processed
  ↓
Webhook: checkout.session.completed
  ↓
Subscription created in DB
  ↓
User redirected to dashboard
```

### 2. Plan Upgrade

```
User upgrades from Monthly to Monthly Pro
  ↓
New checkout session (monthly_pro)
  ↓
Payment processed
  ↓
Webhook: checkout.session.completed
  ↓
Subscription updated (plan = monthly_pro)
```

### 3. Subscription Renewal

```
Monthly billing cycle ends
  ↓
Stripe charges customer
  ↓
Webhook: customer.subscription.updated
  ↓
Subscription period updated in DB
```

### 4. Subscription Cancellation

```
User cancels in Stripe dashboard
  ↓
Webhook: customer.subscription.deleted
  ↓
Status set to "canceled"
  ↓
Plan downgraded to "free"
```

---

## 📝 Code Structure

```
app/api/stripe/
  ├── checkout/
  │   └── route.ts          # Checkout session creation
  └── webhook/
      └── route.ts          # Webhook event handling

lib/
  └── plan-limits.ts        # Centralized plan limits

server/routers/
  └── subscription.ts       # Subscription queries

app/(dashboard)/pricing/
  └── pricing-client.tsx    # Pricing page UI
```

---

## ✅ Checklist

### Setup Checklist

- [ ] Stripe account created
- [ ] Test mode API keys obtained
- [ ] Products and prices created
- [ ] Webhook endpoint configured
- [ ] Webhook secret copied
- [ ] Environment variables set
- [ ] Test checkout flow
- [ ] Test webhook events
- [ ] Verify subscription creation
- [ ] Test plan upgrades
- [ ] Test subscription cancellation

### Production Checklist

- [ ] Switch to live mode
- [ ] Update API keys
- [ ] Update webhook endpoint URL
- [ ] Test with real payment
- [ ] Monitor webhook deliveries
- [ ] Set up error alerts
- [ ] Configure billing emails
- [ ] Test subscription renewals

---

## 🎯 Key Features

### ✅ Implemented

1. **Secure Checkout**: Stripe Checkout with authentication
2. **Webhook Handling**: All subscription events handled
3. **Plan Management**: Automatic plan assignment and updates
4. **Limit Enforcement**: Usage limits based on plan
5. **Environment Config**: Limits configurable via env vars
6. **Error Handling**: Graceful error handling throughout
7. **Type Safety**: Full TypeScript support

### 🔮 Future Enhancements

1. **Customer Portal**: Let users manage subscriptions
2. **Usage Alerts**: Notify users approaching limits
3. **Proration**: Handle mid-cycle upgrades
4. **Trial Periods**: Add free trial support
5. **Coupons**: Support discount codes
6. **Invoices**: Generate and email invoices

---

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Stripe Security](https://stripe.com/docs/security)

---

## 🆘 Support

For issues:
1. Check Stripe Dashboard → Developers → Logs
2. Review server logs
3. Test with Stripe CLI
4. Verify environment variables
5. Check webhook delivery status

---

**Last Updated**: 2024
**Version**: 1.0.0
