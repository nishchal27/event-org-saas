# Multi-Tenant Architecture Migration Guide

## ✅ Completed Changes

### 1. Database Schema Updates
- ✅ Added `User` model (lightweight, linked to Clerk)
- ✅ Added `Membership` model (links users to organizations)
- ✅ Added `slug` field to `Organization` model
- ✅ All existing models already scoped to `organizationId` ✓

### 2. Webhook Updates
- ✅ Handle `user.created` event - creates User in DB
- ✅ Handle `user.updated` event - updates User in DB
- ✅ Handle `organization.created` event - creates Organization + Membership
- ✅ Handle `organizationMembership.created` event - creates Membership

### 3. tRPC Context Refactor
- ✅ Create/get User from DB on first access
- ✅ Resolve Organization via Membership (not just orgId)
- ✅ Get user's active organization from membership
- ✅ Returns `ctx.user`, `ctx.organization`, `ctx.membership`

### 4. Organization Router
- ✅ `organization.getMyOrganizations` - get user's orgs
- ✅ `organization.getCurrent` - get active org
- ✅ `organization.create` - create new org (via Clerk API)
- ✅ `organization.hasOrganization` - check if user has orgs

### 5. Organization Creation Flow
- ✅ Created `/create-organization` page
- ✅ Dashboard layout checks for organization membership
- ✅ Redirects to create org if no membership exists

## 🔄 Next Steps (Required)

### 1. Run Database Migration

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to database
npx prisma db push

# Or create a migration (recommended for production)
npx prisma migrate dev --name add_user_and_membership
```

### 2. Update Clerk Webhook Configuration

In Clerk Dashboard → Webhooks, ensure these events are selected:
- ✅ `user.created`
- ✅ `user.updated`
- ✅ `organization.created`
- ✅ `organization.updated`
- ✅ `organization.deleted`
- ✅ `organizationMembership.created`

### 3. Update Environment Variables

Ensure `.env` has:
```env
CLERK_SECRET_KEY="sk_test_..." # Required for creating orgs via API
CLERK_WEBHOOK_SECRET="whsec_..." # Required for webhook verification
```

### 4. Test the Flow

1. **Sign up a new user** → Should create User in DB (via webhook or fallback)
2. **Access dashboard** → Should redirect to `/create-organization`
3. **Create organization** → Should create org in Clerk + DB + Membership
4. **Access dashboard again** → Should work normally

## 📋 Architecture Overview

### User Flow
```
1. User signs in with Google (Clerk)
   ↓
2. Webhook fires: user.created → Creates User in DB
   ↓
3. User accesses dashboard
   ↓
4. Layout checks: Does user have organization?
   ↓
5a. NO → Redirect to /create-organization
5b. YES → Show dashboard
   ↓
6. User creates organization
   ↓
7. Creates org in Clerk (via API)
   ↓
8. Webhook fires: organization.created → Creates Organization + Membership
   ↓
9. User can now access dashboard
```

### Data Model
```
User (Clerk ID) → User (DB)
                ↓
         Membership
                ↓
      Organization (Tenant)
                ↓
    Events, Contacts, etc.
```

### Multi-Tenant Safety
- ✅ All queries filter by `organizationId`
- ✅ Organization resolved via Membership (not just orgId)
- ✅ User must have Membership to access org data
- ✅ Subscription/Usage scoped to Organization

## 🔒 Security Notes

1. **Organization Scoping**: All business data queries must include `organizationId` filter
2. **Membership Check**: Users can only access organizations they're members of
3. **Role-Based**: Currently all members are "admin", but structure supports future roles
4. **Webhook Verification**: All webhook requests verified with Svix signature

## 🐛 Troubleshooting

### Issue: User not created in DB
**Solution**: Check webhook configuration, ensure `user.created` event is selected

### Issue: Organization not created
**Solution**: 
- Check Clerk API key is set
- Check webhook is configured
- Check organization.created event is selected

### Issue: "No organization" redirect loop
**Solution**: 
- Check Membership table has entries
- Check user has at least one membership
- Check dashboard layout logic

### Issue: Can't create organization
**Solution**:
- Verify `CLERK_SECRET_KEY` is set
- Check Clerk API permissions
- Check slug is unique

## 📝 Migration Checklist

- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push` or create migration
- [ ] Update Clerk webhook events (add `user.created`, `user.updated`)
- [ ] Verify `CLERK_SECRET_KEY` in `.env`
- [ ] Test user signup flow
- [ ] Test organization creation flow
- [ ] Verify all existing queries still work (they should - already org-scoped)
- [ ] Test dashboard access with/without organization

## 🎯 Key Changes Summary

1. **User Table**: Lightweight, linked to Clerk, no auth data
2. **Membership Table**: Links users to organizations with roles
3. **Organization Slug**: Added for URL-friendly identifiers
4. **tRPC Context**: Now returns `user`, `organization`, `membership`
5. **Dashboard Guard**: Checks for organization membership
6. **Organization Creation**: Via Clerk API + webhook sync

All existing functionality should continue to work as all queries were already scoped to `organizationId`! 🎉
