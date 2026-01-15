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

# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

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
# Generate Prisma Client (includes new premium feature models)
npx prisma generate

# Push schema to database (creates new tables and fields)
npx prisma db push

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

**New Models Created:**
- `EventTemplate` - For saving event configurations
- `MessageTemplate` - For WhatsApp message templates  
- `ContactGroup` - For contact segmentation

**Enhanced Models:**
- `Event` - Added `qrCode`, `maxCapacity`, `templateId`
- `Attendee` - Added `isWaitlist`, `checkedIn`, `checkedInAt`

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

### Twilio WhatsApp Setup
1. Go to [twilio.com](https://twilio.com) and create an account
2. Navigate to WhatsApp section
3. Get your Account SID and Auth Token
4. Set up a WhatsApp-enabled phone number
5. Format: `whatsapp:+14155238886` (use your number)
6. Copy credentials to `.env`
7. See `TWILIO_WHATSAPP_SETUP.md` for detailed instructions

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

### Core Features
✅ Event Management (CRUD)
✅ Contact Management
✅ WhatsApp Invitation Automation
✅ AI Content Generation
✅ Public Event Pages (Mobile-first)
✅ Event Preview
✅ Attendee Tracking
✅ Usage Limits & Metering
✅ Subscription Management (Free, Monthly, Pro)
✅ Stripe Payment Integration
✅ PWA Support
✅ Cloudinary Image Uploads
✅ Responsive Design

### Premium Features
✅ **Advanced Analytics Dashboard** - Real-time metrics, trends, charts
✅ **Event Templates** - Save and reuse event configurations
✅ **CSV Export** - Export events, contacts, attendance reports
✅ **QR Code Check-in** - On-site attendance tracking
✅ **Contact Groups** - Organize contacts into segments
✅ **Capacity Limits & Waitlist** - Manage event capacity automatically
✅ **Contact Engagement Tracking** - Track contact activity
✅ **Recurring Events** - Duplicate with date shift
✅ **Enhanced Dashboard UX** - Modern, intuitive interface

## Next Steps

1. Set up all service accounts (Clerk, Stripe, Twilio, Cloudinary)
2. Configure environment variables
3. Run database migrations (`npx prisma db push`)
4. (Optional) Install QR code package: `npm install qrcode @types/qrcode`
5. Test the application locally
6. Test premium features (analytics, templates, exports)
7. Deploy to production
8. Set up monitoring and analytics

## Premium Features Setup

For detailed setup instructions for premium features, see:
- `SETUP_PREMIUM_FEATURES.md` - Complete premium features setup guide
- `USER_GUIDE_PREMIUM_FEATURES.md` - User-facing feature guide
- `PREMIUM_SAAS_TRANSFORMATION.md` - Feature overview and business value

## Support

For issues, check the README.md or open an issue on GitHub.
