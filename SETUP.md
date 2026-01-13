# EventOrg SaaS - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database (Supabase PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Stripe Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# WhatsApp Cloud API (Meta)
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ACCOUNT_ID=your-business-account-id
WHATSAPP_VERIFY_TOKEN=your-verify-token

# Cloudinary (for image uploads)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# AI/LLM (OpenAI)
OPENAI_API_KEY=sk-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Database Setup
```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Service Setup Instructions

### Clerk Setup
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Enable Organizations in Clerk dashboard
4. Copy your publishable key and secret key to `.env`

### Stripe Setup
1. Go to [stripe.com](https://stripe.com) and create an account
2. Create products and prices for:
   - Monthly plan: ₹199/month
   - Yearly plan: ₹1,999/year
3. Copy price IDs to `.env`
4. Set up webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
5. Copy webhook secret to `.env`

### WhatsApp Cloud API Setup
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a Meta App
3. Add WhatsApp product
4. Get your access token and phone number ID
5. Set up webhook for message status updates
6. Copy credentials to `.env`

### Cloudinary Setup
1. Go to [cloudinary.com](https://cloudinary.com) and create an account
2. Get your cloud name, API key, and API secret
3. Create an upload preset named "event_images"
4. Copy credentials to `.env`

### OpenAI Setup (Optional)
1. Go to [openai.com](https://openai.com) and create an account
2. Generate an API key
3. Copy to `.env`

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables
4. Deploy

### Database
Use Supabase (recommended) or any PostgreSQL provider:
1. Create a new Supabase project
2. Copy the connection string to `DATABASE_URL`
3. Run `npx prisma db push` to set up schema

## Features Implemented

✅ Event Management (CRUD)
✅ Contact Management
✅ WhatsApp Invitation Automation
✅ AI Content Generation
✅ Public Event Pages (Mobile-first)
✅ Event Preview
✅ Attendee Tracking
✅ Usage Limits & Metering
✅ Subscription Management (Free, Monthly, Yearly)
✅ Stripe Payment Integration
✅ PWA Support
✅ Cloudinary Image Uploads
✅ Responsive Design

## Next Steps

1. Set up all service accounts (Clerk, Stripe, WhatsApp, Cloudinary)
2. Configure environment variables
3. Run database migrations
4. Test the application locally
5. Deploy to production
6. Set up monitoring and analytics

## Support

For issues, check the README.md or open an issue on GitHub.
