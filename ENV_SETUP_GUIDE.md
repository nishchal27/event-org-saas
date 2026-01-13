# Environment Variables Setup Guide

Complete guide for setting up all environment variables for EventOrg SaaS.

## Quick Start

1. Copy `.env.example` to `.env`
2. Fill in the values for each service
3. Restart your development server

```bash
cp .env.example .env
# Edit .env with your values
npm run dev
```

---

## Required Variables (Minimum)

These are the **absolute minimum** required to run the app:

```env
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Note:** Without other services, some features won't work, but the app will start.

---

## Service-by-Service Setup

### 1. Database (PostgreSQL) - **REQUIRED**

#### Option A: Supabase (Recommended - Free Tier Available)

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for database to provision
4. Go to **Settings > Database**
5. Copy the **Connection string** (URI format)
6. Replace `[YOUR-PASSWORD]` with your database password

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE event_org_saas;
   ```
3. Use connection string:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/event_org_saas?schema=public"
   ```

#### Option C: Other PostgreSQL Providers

- **Neon**: [neon.tech](https://neon.tech)
- **Railway**: [railway.app](https://railway.app)
- **Render**: [render.com](https://render.com)

---

### 2. Clerk Authentication - **REQUIRED**

1. Go to [clerk.com](https://clerk.com)
2. Sign up or log in
3. Click **"Create Application"**
4. Choose authentication methods (Email, Phone, etc.)
5. **IMPORTANT:** Enable **Organizations**:
   - Go to **Organizations** in sidebar
   - Enable "Organizations" feature
   - Configure organization settings
6. Go to **API Keys** section
7. Copy your keys:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

**Production:** Use `pk_live_...` and `sk_live_...` keys in production.

---

### 3. Stripe Payments - **REQUIRED for Payments**

#### Step 1: Get API Keys

1. Go to [stripe.com](https://stripe.com)
2. Sign up or log in
3. Go to **Developers > API keys**
4. Copy your keys:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
```

#### Step 2: Create Products & Prices

1. Go to **Products** in Stripe dashboard
2. Click **"Add product"**

**Monthly Plan:**
- Name: "Monthly Plan"
- Price: ₹199
- Billing period: Monthly
- Copy the **Price ID** (starts with `price_`)

**Yearly Plan:**
- Name: "Yearly Plan"
- Price: ₹1,999
- Billing period: Yearly
- Copy the **Price ID**

```env
STRIPE_PRICE_ID_MONTHLY="price_xxxxxxxxxxxxx"
STRIPE_PRICE_ID_YEARLY="price_xxxxxxxxxxxxx"
```

#### Step 3: Set Up Webhook

1. Go to **Developers > Webhooks**
2. Click **"Add endpoint"**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret**:

```env
STRIPE_WEBHOOK_SECRET="whsec_..."
```

**Local Testing:** Use Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

---

### 4. WhatsApp Cloud API - **REQUIRED for WhatsApp Features**

#### Step 1: Create Meta App

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Click **"My Apps" > "Create App"**
3. Choose **"Business"** type
4. Fill in app details

#### Step 2: Add WhatsApp Product

1. In your app dashboard, click **"Add Product"**
2. Find **"WhatsApp"** and click **"Set Up"**
3. Go to **WhatsApp > API Setup**

#### Step 3: Get Credentials

1. **Access Token:**
   - Click **"Generate token"**
   - Select your WhatsApp Business Account
   - Copy the token (temporary tokens expire in 24 hours)
   - For production, set up a System User for permanent tokens

2. **Phone Number ID:**
   - Found in **API Setup** page
   - Copy the ID

3. **Business Account ID:**
   - Found in **API Setup** page
   - Copy the ID

```env
WHATSAPP_ACCESS_TOKEN="your-token-here"
WHATSAPP_PHONE_NUMBER_ID="123456789012345"
WHATSAPP_BUSINESS_ACCOUNT_ID="123456789012345"
```

#### Step 4: Set Up Webhook (Optional but Recommended)

1. In WhatsApp > Configuration
2. Set webhook URL: `https://yourdomain.com/api/whatsapp/webhook`
3. Set verify token (use a secure random string)
4. Subscribe to events:
   - `messages`
   - `message_status`

```env
WHATSAPP_VERIFY_TOKEN="your-random-secure-token"
```

**Note:** WhatsApp Cloud API has a free tier with limited messages. Check pricing for production use.

---

### 5. Cloudinary - **REQUIRED for Image Uploads**

1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for free account
3. Go to **Dashboard**
4. Copy your credentials:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="your-api-secret"
```

#### Create Upload Preset

1. Go to **Settings > Upload**
2. Scroll to **"Upload presets"**
3. Click **"Add upload preset"**
4. Name: `event_images`
5. **Signing mode:** Choose one:
   - **Unsigned** (easier, less secure) - for client-side uploads
   - **Signed** (more secure) - requires server-side upload
6. **Folder:** `events/` (optional, for organization)
7. Save preset

**Free Tier:** 25GB storage, 25GB bandwidth/month

---

### 6. OpenAI API - **OPTIONAL (for AI Features)**

1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys**
4. Click **"Create new secret key"**
5. Copy the key (starts with `sk-`)

```env
OPENAI_API_KEY="sk-..."
```

**Note:** 
- Requires paid account (pay-as-you-go)
- AI features will use template fallback if not provided
- Free tier has limited credits

**Alternatives:**
- **Anthropic Claude:** `ANTHROPIC_API_KEY`
- **Google AI:** `GOOGLE_AI_API_KEY`
- Modify `server/routers/ai.ts` to use different providers

---

### 7. Application URL

```env
# Development
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Production (update after deployment)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

**Important:** 
- Must include `http://` or `https://`
- No trailing slash
- Used for generating event links and redirects

---

## Environment-Specific Files

### Development
- `.env.local` - Local overrides (gitignored)
- `.env.development` - Development-specific

### Production
Set these in your hosting platform:
- **Vercel:** Project Settings > Environment Variables
- **Netlify:** Site Settings > Environment Variables
- **Railway:** Variables tab

---

## Security Best Practices

1. **Never commit `.env` to git**
   - Already in `.gitignore`
   - Use `.env.example` for templates

2. **Use different keys for dev/prod**
   - Clerk: `pk_test_` vs `pk_live_`
   - Stripe: `sk_test_` vs `sk_live_`

3. **Rotate keys regularly**
   - Especially if exposed

4. **Use secrets management**
   - Vercel: Built-in secrets
   - AWS: Secrets Manager
   - Azure: Key Vault

5. **Limit API key permissions**
   - Only grant necessary permissions
   - Use read-only keys where possible

---

## Testing Your Setup

### 1. Database Connection
```bash
npx prisma db push
npx prisma studio
```

### 2. Clerk Authentication
- Visit `/sign-in`
- Should see Clerk sign-in form

### 3. Stripe
- Visit `/pricing`
- Click "Upgrade" - should redirect to Stripe

### 4. Cloudinary
- Create an event
- Try uploading an image
- Should see image preview

### 5. WhatsApp
- Create event
- Add contacts
- Send invitation
- Check WhatsApp message delivery

### 6. AI
- Create event
- Click "Generate WhatsApp Message"
- Should generate AI content

---

## Troubleshooting

### "DATABASE_URL is not set"
- Check `.env` file exists
- Restart dev server after adding variables
- Check for typos in variable name

### "Clerk authentication not working"
- Verify keys are correct
- Check Organizations are enabled
- Ensure `NEXT_PUBLIC_` prefix on publishable key

### "Stripe webhook not receiving events"
- Verify webhook URL is correct
- Check webhook secret matches
- Use Stripe CLI for local testing

### "WhatsApp messages not sending"
- Verify access token is valid
- Check phone number ID is correct
- Ensure phone numbers are in correct format (no +, spaces)

### "Cloudinary upload failing"
- Verify upload preset exists
- Check API key and secret
- Verify cloud name is correct

---

## Cost Estimates (Monthly)

**Free Tier Available:**
- Supabase: Free (500MB database)
- Clerk: Free (10,000 MAU)
- Cloudinary: Free (25GB storage, 25GB bandwidth)

**Paid Services:**
- Stripe: 2.9% + ₹2 per transaction
- WhatsApp: ~₹0.8 per message (after free tier)
- OpenAI: ~$0.002 per generation

**Estimated Monthly Cost (100 users):**
- Database: ₹0 (free tier)
- Auth: ₹0 (free tier)
- Images: ₹0 (free tier)
- Payments: 2.9% of revenue
- WhatsApp: ~₹800 (1,000 messages)
- AI: ~₹200 (100 generations)

**Total: ~₹1,000-2,000/month** (excluding payment processing fees)

---

## Next Steps

1. ✅ Set up all required services
2. ✅ Fill in `.env` file
3. ✅ Test each integration
4. ✅ Deploy to production
5. ✅ Update production environment variables
6. ✅ Set up monitoring

---

## Support

- **Database Issues:** Check Prisma docs
- **Clerk Issues:** [clerk.com/docs](https://clerk.com/docs)
- **Stripe Issues:** [stripe.com/docs](https://stripe.com/docs)
- **WhatsApp Issues:** [developers.facebook.com/docs/whatsapp](https://developers.facebook.com/docs/whatsapp)
- **Cloudinary Issues:** [cloudinary.com/documentation](https://cloudinary.com/documentation)
