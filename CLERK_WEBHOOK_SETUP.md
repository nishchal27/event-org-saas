# Clerk Webhook Setup Guide

This guide explains how to set up the Clerk webhook to sync organizations with your database.

## What the Webhook Does

The Clerk webhook automatically syncs organization data between Clerk and your database:

- **organization.created**: Creates organization in database when created in Clerk
- **organization.updated**: Updates organization name/logo when changed in Clerk
- **organization.deleted**: Deletes organization from database when deleted in Clerk
- **organizationMembership**: Tracks membership changes (for future role-based features)

## Setup Steps

### 1. Install Dependencies

The webhook requires the `svix` package for signature verification:

```bash
npm install svix
```

### 2. Get Webhook Secret from Clerk

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter your webhook URL:
   - **Development**: `http://localhost:3000/api/webhooks/clerk`
   - **Production**: `https://yourdomain.com/api/webhooks/clerk`
6. Select the following events:
   - ✅ `organization.created`
   - ✅ `organization.updated`
   - ✅ `organization.deleted`
   - ✅ `organizationMembership.created` (optional)
   - ✅ `organizationMembership.updated` (optional)
   - ✅ `organizationMembership.deleted` (optional)
7. Click **Create**
8. Copy the **Signing Secret** (starts with `whsec_`)

### 3. Add to Environment Variables

Add the webhook secret to your `.env` file:

```env
CLERK_WEBHOOK_SECRET="whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 4. Test the Webhook

#### Local Testing with ngrok (Recommended)

1. Start your Next.js dev server:
   ```bash
   npm run dev
   ```

2. Start ngrok in a separate terminal:
   ```bash
   ngrok http 3000
   ```

3. Copy the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io`)

4. In Clerk Dashboard:
   - Go to **Webhooks**
   - Add/Edit your endpoint
   - Set URL to: `https://your-ngrok-url.ngrok.io/api/webhooks/clerk`
   - Select events and save

5. Test the webhook:
   - Create/update an organization in Clerk Dashboard
   - Check ngrok terminal for incoming requests
   - Verify the organization was created/updated in your database
   - Check your Next.js terminal for any errors

**Note:** ngrok URLs change on free tier. Update Clerk webhook URL when ngrok restarts.

#### Alternative: Local Testing with Clerk CLI

1. Install Clerk CLI:
   ```bash
   npm install -g @clerk/cli
   ```

2. Login to Clerk:
   ```bash
   clerk login
   ```

3. Start webhook forwarding:
   ```bash
   clerk listen --forward-to http://localhost:3000/api/webhooks/clerk
   ```

4. Create/update an organization in Clerk Dashboard
5. Check your terminal for webhook events
6. Verify the organization was created/updated in your database

#### Production Testing

1. Deploy your application
2. Update webhook URL in Clerk Dashboard to production URL
3. Create a test organization in Clerk
4. Check your database to verify it was synced
5. Check application logs for any errors

## Webhook Events Handled

### organization.created

When a new organization is created in Clerk:
- Creates organization record in database
- Sets up free subscription
- Initializes usage tracking for current month

**Database Actions:**
```typescript
- Creates Organization record
- Creates Subscription (free plan)
- Creates Usage record (current month)
```

### organization.updated

When organization details are updated in Clerk:
- Updates organization name
- Updates organization logo
- Syncs any metadata changes

**Database Actions:**
```typescript
- Updates Organization.name
- Updates Organization.logo
```

### organization.deleted

When an organization is deleted in Clerk:
- Deletes organization from database
- Cascade deletes all related records (events, contacts, subscriptions, usage)

**Database Actions:**
```typescript
- Deletes Organization (cascade deletes related records)
```

## Security

The webhook uses Svix signature verification to ensure requests are from Clerk:

1. Verifies `svix-id` header
2. Verifies `svix-timestamp` header
3. Verifies `svix-signature` header using webhook secret
4. Rejects requests with invalid signatures

## Troubleshooting

### Webhook Not Receiving Events

1. **Check webhook URL is correct:**
   - Development: `http://localhost:3000/api/webhooks/clerk`
   - Production: `https://yourdomain.com/api/webhooks/clerk`

2. **Verify webhook secret matches:**
   - Check `.env` file has correct `CLERK_WEBHOOK_SECRET`
   - Ensure it matches the signing secret in Clerk Dashboard

3. **Check webhook is enabled:**
   - Go to Clerk Dashboard > Webhooks
   - Verify endpoint is active
   - Check event subscriptions are selected

4. **Check middleware allows webhook:**
   - Verify `/api/webhooks/clerk` is in `isPublicRoute` matcher
   - Webhook should bypass authentication

### Organization Not Created in Database

1. **Check webhook logs:**
   - Look for errors in application logs
   - Check for signature verification failures

2. **Verify database connection:**
   - Ensure `DATABASE_URL` is correct
   - Test database connection

3. **Check Prisma schema:**
   - Verify Organization model exists
   - Check for any migration issues

### Signature Verification Failing

1. **Verify webhook secret:**
   - Ensure `CLERK_WEBHOOK_SECRET` matches Clerk Dashboard
   - Check for typos or extra spaces

2. **Check headers:**
   - Verify `svix-id`, `svix-timestamp`, `svix-signature` headers are present
   - Check if middleware is modifying headers

## Manual Sync (Fallback)

If webhook fails, organizations are still created on-demand when users access protected routes. The tRPC `protectedProcedure` creates organizations if they don't exist:

```typescript
// In lib/trpc.ts - protectedProcedure
if (!organization && ctx.orgId) {
  organization = await ctx.prisma.organization.create({
    data: {
      clerkOrgId: ctx.orgId,
      name: 'My Organization',
    },
  })
  // ... creates subscription and usage
}
```

This ensures the system works even if webhooks are temporarily unavailable.

## Benefits of Webhook Sync

1. **Real-time sync**: Organizations are created immediately when created in Clerk
2. **Metadata sync**: Organization name/logo updates automatically
3. **Cleanup**: Organizations are deleted when removed from Clerk
4. **Reliability**: Redundant sync mechanism (webhook + on-demand creation)

## Next Steps

After setting up the webhook:

1. ✅ Test webhook with Clerk CLI (local)
2. ✅ Deploy to production
3. ✅ Update webhook URL in Clerk Dashboard
4. ✅ Monitor webhook events in Clerk Dashboard
5. ✅ Set up error alerts for webhook failures

## Support

- **Clerk Webhook Docs**: [clerk.com/docs/integrations/webhooks](https://clerk.com/docs/integrations/webhooks)
- **Svix Documentation**: [docs.svix.com](https://docs.svix.com)
