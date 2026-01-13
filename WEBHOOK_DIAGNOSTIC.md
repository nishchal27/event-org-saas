# Webhook Diagnostic Guide

## 🔍 Current Issue

**Problem**: User is created in Clerk but:
- ❌ No webhook events are being sent to ngrok
- ❌ No POST requests showing in ngrok terminal
- ❌ Organization not created in database

## ⚠️ Important: Users vs Organizations

**Key Understanding:**
- When a user signs up in Clerk, they create a **USER**, not an **ORGANIZATION**
- Organizations are created separately in Clerk (via organization switcher or API)
- The webhook only fires for **organization** events, not **user** events
- Organizations are created in DB when:
  1. Webhook receives `organization.created` event (preferred)
  2. User accesses protected route AND has `orgId` in session (fallback)

## 🔧 Step-by-Step Fix

### Step 1: Verify Webhook is Configured in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Webhooks** in the sidebar
4. Check if you have an endpoint configured

**If NO endpoint exists:**
- Click **Add Endpoint**
- Enter URL: `https://illicit-everleigh-snottily.ngrok-free.dev/api/webhooks/clerk`
- **IMPORTANT**: Make sure URL has NO trailing slash
- Select these events:
  - ✅ `organization.created`
  - ✅ `organization.updated`
  - ✅ `organization.deleted`
- Click **Create**
- Copy the **Signing Secret** (starts with `whsec_`)

**If endpoint EXISTS:**
- Click on it to edit
- Verify URL matches: `https://illicit-everleigh-snottily.ngrok-free.dev/api/webhooks/clerk`
- Verify events are selected (see above)
- Check if webhook is **enabled** (should be green/active)

### Step 2: Verify Environment Variable

Check your `.env` file:
```env
CLERK_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**To get the secret:**
1. In Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **Reveal** next to "Signing Secret"
4. Copy the entire secret (starts with `whsec_`)

### Step 3: Test Webhook Endpoint

The endpoint is accessible (we confirmed via GET request):
```
https://illicit-everleigh-snottily.ngrok-free.dev/api/webhooks/clerk
```

**Test it:**
```bash
curl https://illicit-everleigh-snottily.ngrok-free.dev/api/webhooks/clerk
```

Should return:
```json
{
  "status": "ok",
  "message": "Clerk webhook endpoint is accessible",
  "webhookSecretConfigured": true,
  ...
}
```

### Step 4: Create an Organization in Clerk

**The webhook only fires when an organization is created!**

To test:
1. Sign in to your app
2. In Clerk, organizations are created via:
   - Organization switcher (if enabled in Clerk Dashboard)
   - Or via API/CLI
   
**For testing, create organization via Clerk Dashboard:**
1. Go to Clerk Dashboard → Organizations
2. Click **Create Organization**
3. Enter name
4. Click **Create**

**OR use Clerk's organization switcher in your app:**
- If you have `<OrganizationSwitcher />` component, use it
- Or manually create via Clerk API

### Step 5: Watch for Webhook Events

After creating an organization:
1. **Check ngrok terminal** - should show POST request
2. **Check your Next.js terminal** - should show webhook logs:
   ```
   ================================================================================
   🔔 WEBHOOK REQUEST RECEIVED
   ================================================================================
   📍 Timestamp: ...
   📦 Event type: organization.created
   ✅ Processing organization.created
   ✅ Organization created/updated in DB
   ```

3. **Check Clerk Dashboard → Webhooks → Your Endpoint**
   - Should show recent events
   - Check for any errors (red indicators)

### Step 6: Check Database

After webhook fires:
```bash
npx prisma studio
```

Check:
- `organizations` table - should have your organization
- `subscriptions` table - should have free plan
- `usage` table - should have current month initialized

## 🐛 Common Issues

### Issue 1: No POST requests in ngrok
**Cause**: Webhook not configured or URL mismatch

**Fix**:
- Verify webhook URL in Clerk Dashboard matches ngrok URL exactly
- No trailing slash
- HTTPS (not HTTP)
- Check webhook is enabled

### Issue 2: Webhook configured but not firing
**Cause**: Wrong events selected or organization not created

**Fix**:
- Ensure `organization.created` is selected
- Actually create an organization (not just sign up)
- Check Clerk Dashboard → Webhooks → Events tab

### Issue 3: 502 Bad Gateway
**Cause**: Server error or route not accessible

**Fix**:
- Check dev server is running
- Check route file exists: `app/api/webhooks/clerk/route.ts`
- Check for syntax errors

### Issue 4: 400 Bad Request - Verification Failed
**Cause**: Wrong webhook secret or body parsing issue

**Fix**:
- Verify `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard
- Check logs for verification errors
- Ensure using raw body (already fixed in code)

## 📊 Current Status Check

Run this checklist:

- [ ] Webhook endpoint exists in Clerk Dashboard
- [ ] Webhook URL matches ngrok URL exactly
- [ ] `organization.created` event is selected
- [ ] `CLERK_WEBHOOK_SECRET` is set in `.env`
- [ ] Dev server is running
- [ ] ngrok is running and forwarding to `localhost:3000`
- [ ] Organization created in Clerk (not just user signup)
- [ ] Webhook is enabled/active in Clerk Dashboard

## 🧪 Manual Test

To manually test if webhook works:

1. **Create organization in Clerk Dashboard**
2. **Watch ngrok terminal** - should show POST request
3. **Watch Next.js terminal** - should show webhook logs
4. **Check database** - organization should exist

## 💡 Why Organizations Aren't Created on Signup

**This is by design:**
- Users sign up → Creates USER in Clerk
- Organizations are separate entities
- User must create/join an organization
- Then webhook fires → Creates organization in DB

**Fallback mechanism:**
- If webhook fails, organization is created on-demand when user accesses protected route
- But this only works if user has `orgId` in their session
- If user doesn't have an organization in Clerk, they won't have `orgId`

## 🚀 Next Steps

1. **Verify webhook configuration in Clerk Dashboard**
2. **Create an organization in Clerk** (not just sign up)
3. **Watch for webhook events**
4. **Check database for organization**

The webhook endpoint is working (GET test passed), so the issue is likely:
- Webhook not configured in Clerk Dashboard
- Wrong URL in Clerk Dashboard
- Organization not created (only user signed up)
