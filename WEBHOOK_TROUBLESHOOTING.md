# Clerk Webhook Troubleshooting Guide

## Quick Answers

### ✅ Organization Events Are Correct!

**You selected `organization.*` events - that's PERFECT!** 

We don't need `user.*` events because:
- Users are managed by Clerk (we don't store them in our database)
- We only store **Organizations** in Supabase
- Organizations are what matter for the SaaS (multi-tenant)

### Why Organizations Aren't Syncing

If organizations are created in Clerk but not appearing in Supabase, check these:

## Step-by-Step Debugging

### 1. Verify Webhook Endpoint is Accessible

Test if your webhook endpoint is reachable:

```bash
# With ngrok running, test the endpoint:
curl https://your-ngrok-url.ngrok.io/api/webhooks/clerk
```

Or visit in browser: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`

**Expected Response:**
```json
{
  "message": "Clerk webhook endpoint is accessible",
  "endpoint": "/api/webhooks/clerk",
  "timestamp": "2024-01-13T..."
}
```

### 2. Check ngrok is Forwarding

1. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

2. **Verify ngrok is running:**
   - You should see: `Forwarding https://xxx.ngrok.io -> http://localhost:3000`
   - Copy the HTTPS URL

3. **Check ngrok web interface:**
   - Visit: `http://localhost:4040` (ngrok web interface)
   - You'll see all incoming requests here
   - Look for requests to `/api/webhooks/clerk`

### 3. Verify Clerk Webhook Configuration

1. **Go to Clerk Dashboard:**
   - Webhooks → Your Endpoint

2. **Check Webhook URL:**
   - Should be: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - **Important:** Use HTTPS, not HTTP
   - **Important:** No trailing slash

3. **Verify Events Selected:**
   - ✅ `organization.created`
   - ✅ `organization.updated`
   - ✅ `organization.deleted`
   - ❌ You DON'T need `user.*` events

4. **Check Webhook Secret:**
   - Copy the "Signing Secret" (starts with `whsec_`)
   - Should match your `.env` file: `CLERK_WEBHOOK_SECRET`

### 4. Check Your .env File

```env
CLERK_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Verify:**
- ✅ Secret starts with `whsec_`
- ✅ No extra spaces or quotes
- ✅ Matches the secret in Clerk Dashboard

### 5. Check Server Logs

With the updated webhook code, you should see logs in your terminal:

**When webhook is called, you'll see:**
```
🔔 Webhook received at: 2024-01-13T...
📍 URL: https://...
📋 Headers: { hasSvixId: true, ... }
📦 Event type: organization.created
📦 Event data: { ... }
✅ Processing organization.created: { id: '...', name: '...' }
✅ Organization created/updated in DB: ...
✅ Subscription created: ...
✅ Usage initialized: ...
✅ Webhook processed successfully
```

**If you see errors:**
- ❌ "Missing Svix headers" → Clerk isn't sending properly
- ❌ "Error verifying webhook" → Secret mismatch
- ❌ "Error processing webhook" → Database issue

### 6. Test Webhook Manually

**Option A: Use Clerk Dashboard**
1. Go to Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click "Send test event"
4. Select `organization.created`
5. Check your terminal/logs for the event

**Option B: Create Test Organization**
1. Go to Clerk Dashboard → Organizations
2. Create a new organization
3. Watch your terminal for webhook logs
4. Check ngrok web interface (`http://localhost:4040`) for the request

### 7. Common Issues & Fixes

#### Issue: "No requests in ngrok"
**Fix:**
- Verify ngrok URL in Clerk matches exactly
- Check ngrok is forwarding to port 3000
- Restart ngrok and update Clerk webhook URL

#### Issue: "Missing Svix headers"
**Fix:**
- Request isn't from Clerk (might be a test request)
- Check webhook URL is correct in Clerk
- Verify webhook secret matches

#### Issue: "Error verifying webhook"
**Fix:**
- Webhook secret mismatch
- Check `.env` file has correct secret
- Restart dev server after changing `.env`

#### Issue: "Organization not found after creation"
**Fix:**
- Database connection issue
- Check `DATABASE_URL` in `.env`
- Verify Prisma schema is pushed: `npx prisma db push`

#### Issue: "Webhook works but org not in database"
**Fix:**
- Check Prisma logs for errors
- Verify database connection
- Check if organization already exists (upsert should handle this)

### 8. Verify Database Connection

```bash
# Test Prisma connection
npx prisma db push

# Open Prisma Studio to view data
npx prisma studio
```

In Prisma Studio, check:
- `organizations` table for your orgs
- `subscriptions` table for free plans
- `usage` table for monthly tracking

### 9. Debug Checklist

- [ ] ngrok is running and forwarding to port 3000
- [ ] Clerk webhook URL matches ngrok HTTPS URL exactly
- [ ] Webhook secret in `.env` matches Clerk Dashboard
- [ ] `organization.created` event is selected in Clerk
- [ ] Dev server is running (`npm run dev`)
- [ ] Database connection is working (`DATABASE_URL` is correct)
- [ ] You see webhook logs in terminal when creating org
- [ ] ngrok web interface shows incoming requests

### 10. Still Not Working?

**Enable More Logging:**

The webhook now has extensive logging. Check your terminal for:
- 🔔 Webhook received messages
- 📦 Event type and data
- ✅ Success messages
- ❌ Error messages

**Test the Endpoint Directly:**

```bash
# Test if endpoint is accessible
curl -X POST https://your-ngrok-url.ngrok.io/api/webhooks/clerk
```

**Check ngrok Logs:**

Visit `http://localhost:4040` to see:
- All incoming requests
- Request/response details
- Any errors

## Expected Flow

1. **User creates organization in Clerk** (via sign-up or dashboard)
2. **Clerk sends webhook** to your ngrok URL
3. **ngrok forwards** to `localhost:3000/api/webhooks/clerk`
4. **Your webhook handler:**
   - Verifies signature
   - Creates organization in Supabase
   - Creates free subscription
   - Initializes usage tracking
5. **Organization appears in database**

## Quick Test

1. **Start everything:**
   ```bash
   # Terminal 1: Start dev server
   npm run dev

   # Terminal 2: Start ngrok
   ngrok http 3000
   ```

2. **Configure Clerk:**
   - Webhook URL: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - Events: `organization.created`, `organization.updated`, `organization.deleted`
   - Copy signing secret to `.env`

3. **Create test organization:**
   - Clerk Dashboard → Organizations → Create
   - Watch terminal for logs
   - Check ngrok interface for request

4. **Verify in database:**
   ```bash
   npx prisma studio
   ```
   - Check `organizations` table
   - Should see your new organization

## Need More Help?

If still not working after these steps:
1. Share the terminal logs (webhook logs)
2. Share ngrok request details (from `localhost:4040`)
3. Share Clerk webhook event logs (from Clerk Dashboard)
4. Check database connection with `npx prisma studio`
