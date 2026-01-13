# Clerk Webhook Deep Debugging Guide

## 🔍 Issues Fixed

### 1. **Body Parsing Issue (CRITICAL FIX)**
**Problem**: The webhook was using `await req.json()` which parses the body, but Svix requires the **raw body string** for signature verification.

**Fix**: Changed to `await req.text()` to get the raw body, then parse it manually for processing.

```typescript
// ❌ WRONG - This breaks Svix verification
const payload = await req.json()
const body = JSON.stringify(payload)

// ✅ CORRECT - Use raw body for verification
const body = await req.text()
const payload = JSON.parse(body)
```

### 2. **Module-Level Error (502 Fix)**
**Problem**: Throwing errors at module level crashes the server when the route loads.

**Fix**: Moved error checking inside the handler function.

### 3. **Route Configuration**
Added route segment config to ensure proper handling:
```typescript
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
```

## 🧪 Testing Steps

### Step 1: Verify Route is Accessible
```bash
# Test GET endpoint
curl http://localhost:3000/api/webhooks/clerk/test

# Test POST endpoint
curl -X POST http://localhost:3000/api/webhooks/clerk/test \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Step 2: Check Environment Variables
```bash
# In your .env file, ensure you have:
CLERK_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**To get the secret:**
1. Go to Clerk Dashboard → Webhooks
2. Click on your webhook endpoint
3. Copy the "Signing Secret" (starts with `whsec_`)

### Step 3: Verify ngrok is Running
```bash
# Check ngrok status
# Should show: https://your-url.ngrok-free.dev -> http://localhost:3000
```

### Step 4: Check Clerk Webhook Configuration
1. Go to Clerk Dashboard → Webhooks
2. Verify the endpoint URL matches your ngrok URL:
   ```
   https://your-ngrok-url.ngrok-free.dev/api/webhooks/clerk
   ```
3. Ensure these events are selected:
   - ✅ `organization.created`
   - ✅ `organization.updated`
   - ✅ `organization.deleted`

### Step 5: Test Webhook Manually
```bash
# Create a test webhook payload (from Clerk docs)
curl -X POST https://your-ngrok-url.ngrok-free.dev/api/webhooks/clerk \
  -H "Content-Type: application/json" \
  -H "svix-id: test-id" \
  -H "svix-timestamp: $(date +%s)" \
  -H "svix-signature: test-sig" \
  -d '{"type":"organization.created","data":{"id":"org_test"}}'
```

**Note**: This will fail verification (expected), but you should see logs in your terminal.

### Step 6: Check Server Logs
When Clerk sends a webhook, you should see:
```
🔔 Webhook received at: [timestamp]
📍 URL: [url]
📋 Headers: { hasSvixId: true, hasSvixTimestamp: true, hasSvixSignature: true }
📦 Event type: organization.created
✅ Processing organization.created: { id: '...', name: '...' }
✅ Organization created/updated in DB: [id]
✅ Subscription created: [id]
✅ Usage initialized: [id]
✅ Webhook processed successfully
```

## 🐛 Common Issues & Solutions

### Issue 1: 502 Bad Gateway
**Cause**: Server crash or route not accessible

**Solutions**:
1. ✅ Fixed: Moved error checking inside handler
2. Restart dev server: `npm run dev`
3. Check if route file exists: `app/api/webhooks/clerk/route.ts`
4. Check for syntax errors in the file

### Issue 2: 400 Bad Request - Missing Headers
**Cause**: Request not coming from Clerk, or headers stripped

**Solutions**:
1. Verify ngrok is forwarding headers correctly
2. Check Clerk webhook URL in dashboard
3. Ensure webhook secret is correct

### Issue 3: 400 Bad Request - Verification Failed
**Cause**: Signature verification fails

**Solutions**:
1. ✅ Fixed: Using raw body (`req.text()`) instead of parsed JSON
2. Verify `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard
3. Check if body is being modified (middleware, proxy, etc.)

### Issue 4: No Logs Appearing
**Cause**: Request not reaching the handler

**Solutions**:
1. Check middleware isn't blocking: `/api/webhooks/clerk` should be in `isPublicRoute`
2. Check ngrok is forwarding correctly
3. Check Clerk is sending to correct URL
4. Add logging at the very start of the handler

### Issue 5: Organization Not Created in DB
**Cause**: Database error or Prisma issue

**Solutions**:
1. Check database connection: `DATABASE_URL` in `.env`
2. Check Prisma schema matches
3. Run migrations: `npx prisma db push`
4. Check terminal for Prisma errors

## 🔧 Debugging Checklist

- [ ] Dev server is running (`npm run dev`)
- [ ] ngrok is running and forwarding to `localhost:3000`
- [ ] `.env` file has `CLERK_WEBHOOK_SECRET` set
- [ ] Clerk webhook URL matches ngrok URL (no trailing slash)
- [ ] Clerk webhook has correct events selected
- [ ] Middleware allows `/api/webhooks/clerk` (in `isPublicRoute`)
- [ ] Route file exists: `app/api/webhooks/clerk/route.ts`
- [ ] No syntax errors in route file
- [ ] Database is accessible
- [ ] Prisma client is generated: `npx prisma generate`

## 📊 Monitoring

### Check ngrok Requests
Visit: `http://localhost:4040` (ngrok web interface)
- See all incoming requests
- Check request/response details
- Verify headers are present

### Check Server Terminal
Look for:
- `🔔 Webhook received` - Request reached handler
- `📋 Headers` - Headers present
- `📦 Event type` - Event identified
- `✅ Processing` - Event being processed
- `✅ Webhook processed successfully` - Success!

### Check Database
```bash
npx prisma studio
```
- Check `organizations` table
- Check `subscriptions` table
- Check `usage` table

## 🚀 Next Steps After Fix

1. **Create an organization in Clerk Dashboard**
2. **Watch terminal logs** - Should see webhook processing
3. **Check database** - Organization should appear
4. **Verify subscription** - Free plan should be created
5. **Verify usage** - Current month usage initialized

## 📝 Current Implementation Status

✅ Fixed body parsing (raw body for Svix)
✅ Fixed module-level errors (502 fix)
✅ Added route configuration
✅ Added comprehensive logging
✅ Added error handling
✅ Middleware configured correctly
✅ Test endpoint created

The webhook should now work correctly!
