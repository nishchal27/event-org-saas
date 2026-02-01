# EventOrg - WhatsApp-First Event Management SaaS Platform

> **A live SaaS platform** actively used by real users for creating events, managing attendees, and automating WhatsApp communications. Perfect for trainers, coaches, community organizers, and event managers who want to streamline their event operations with modern technology.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.9-2D3748)](https://www.prisma.io/)
[![Status](https://img.shields.io/badge/Status-Live%20%26%20In%20Production-success)]()

---

## 🎯 Overview

**EventOrg** is a comprehensive event management platform designed for organizations that need to create events, manage contacts, send WhatsApp invitations, and track attendance—all in one place. Built with modern web technologies, it offers a beautiful user experience, robust features, and scalable architecture.

**Currently live and serving real users** - This SaaS platform is deployed, actively maintained, and used by trainers, coaches, and event organizers to manage their events and communications.

### Who It's For

- **Fitness Trainers & Coaches** - Manage class schedules, send reminders, track attendance
- **Community Organizers** - Organize meetups, workshops, and community events
- **Instructors & Educators** - Schedule sessions, manage student registrations
- **Event Organizers** - Professional event management with analytics and reporting
- **Small Businesses** - Streamline event operations and customer communications

### Key Value Propositions

✅ **WhatsApp-First Communication** - Leverage WhatsApp for invitations and reminders (the preferred communication channel in many markets)  
✅ **Zero-Friction Check-in** - Unique QR codes per attendee for fast, professional check-in  
✅ **Advanced Analytics** - Real-time insights into event performance and engagement  
✅ **Mobile-First PWA** - Install on any device for quick access  
✅ **AI-Powered Content** - Generate professional messages and social media posts  
✅ **Live & Production** - Deployed SaaS actively serving real users with subscription management and payment processing

---

## ✨ Features

### Core Features

- **Event Management**
  - Create, edit, and manage events with rich details
  - Public event pages with mobile-optimized design
  - Custom fields for event-specific information
  - Image uploads with Cloudinary integration
  - Event preview before publishing

- **Contact Management**
  - Comprehensive contact database
  - Tags and notes for organization
  - Bulk import via CSV
  - Search and filter capabilities
  - Contact activity history

- **WhatsApp Integration**
  - Automated WhatsApp invitations via Twilio API
  - Message tracking and delivery status
  - Personalized messages with contact names
  - Usage limits per subscription plan
  - Message templates for consistency

- **Attendee Tracking**
  - RSVP management (confirmed/declined/pending)
  - Real-time attendance tracking
  - Capacity limits and automatic waitlist
  - Multiple check-in methods (QR scan, manual, self-service)

- **AI Content Generation**
  - Generate WhatsApp invitation messages
  - Create social media posts (Instagram, Facebook, Twitter, LinkedIn)
  - Multiple tone options (professional, casual, friendly)
  - Usage tracking and limits

- **Subscription Management**
  - Stripe integration for payments
  - Three-tier pricing (Free, Monthly, Pro)
  - Usage metering and limit enforcement
  - Automatic subscription management

### Premium Features

- **📊 Advanced Analytics Dashboard**
  - Real-time metrics with trend indicators
  - 6-month event creation and attendance trends
  - Response rate tracking with visual progress
  - Contact engagement analytics
  - Month-over-month comparisons
  - Interactive charts and visualizations

- **🎫 Unique QR Codes Per Attendee**
  - Each attendee receives a unique QR code
  - Fast check-in (5-10 seconds vs 30-45 seconds)
  - Multiple check-in methods tracked
  - Professional on-site experience

- **📋 Event Templates**
  - Save event configurations as reusable templates
  - Quick event creation from saved templates
  - Pre-fill forms for common event types
  - Saves 5-10 minutes per event creation

- **📤 CSV Export**
  - Export events with all details
  - Export contacts database
  - Export attendance reports
  - Professional data portability

- **👥 Contact Groups & Segmentation**
  - Organize contacts into groups
  - Tag-based segmentation
  - Bulk operations on groups
  - Group-based event invitations

- **⏰ Recurring Events**
  - Duplicate events with date offset
  - Perfect for weekly/monthly recurring events
  - Auto-updates for consistent management

- **💬 Message Templates**
  - Save WhatsApp message templates
  - Template types: invitation, reminder, follow-up
  - Consistent messaging across events

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14.2 (App Router) - React framework with server-side rendering
- **Language**: TypeScript - Type-safe development
- **Styling**: Tailwind CSS - Utility-first CSS framework
- **UI Components**: shadcn/ui + Radix UI - Accessible, high-quality components
- **State Management**: TanStack Query (React Query) + Zustand
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts - For analytics visualizations

### Backend
- **API**: tRPC - End-to-end type-safe APIs
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk - User and organization management
- **Payments**: Stripe - Subscription and payment processing

### External Services
- **WhatsApp**: Twilio WhatsApp API - Message sending
- **Images**: Cloudinary - Image upload and optimization
- **AI**: OpenAI API - Content generation (optional, with template fallback)
- **Analytics**: Vercel Analytics + Speed Insights

### Infrastructure
- **PWA**: next-pwa - Progressive Web App support
- **Deployment**: Vercel (recommended) or any Node.js hosting
- **Database Hosting**: Supabase, Railway, or any PostgreSQL provider

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Supabase recommended for easy setup)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd event-org-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.template .env
   ```
   
   Fill in your environment variables (see [Environment Variables](#environment-variables) section below).

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Environment Variables

**Required:**
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**For Payments (Stripe):**
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO="price_..."
```

**For WhatsApp (Twilio):**
```env
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
```

**For Images (Cloudinary):**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**For AI (OpenAI - Optional):**
```env
OPENAI_API_KEY="sk-..."
```

**For Webhooks:**
```env
CLERK_WEBHOOK_SECRET="whsec_..."
```

> **Note**: See `env.template` for a complete list of all environment variables with descriptions.

---

## 📁 Project Structure

```
event-org-saas/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication routes (sign-in, sign-up)
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── analytics/            # Analytics dashboard
│   │   ├── contacts/             # Contact management
│   │   │   └── groups/           # Contact groups
│   │   ├── events/               # Event management
│   │   │   ├── [id]/             # Event detail pages
│   │   │   │   ├── checkin/      # Check-in interface
│   │   │   │   └── scan/         # QR scanner
│   │   │   ├── new/              # Create event
│   │   │   └── templates/        # Event templates
│   │   ├── pricing/              # Pricing page
│   │   └── settings/             # Settings & message templates
│   ├── event/                    # Public event pages
│   ├── checkin/                  # Public check-in pages
│   ├── api/                      # API routes
│   │   ├── trpc/                 # tRPC API endpoint
│   │   ├── stripe/               # Stripe webhooks
│   │   ├── webhooks/             # Other webhooks
│   │   └── qr/                   # QR code generation
│   └── landing/                  # Marketing landing page
├── components/                   # React components
│   ├── ui/                       # shadcn/ui components
│   └── landing/                  # Landing page components
├── lib/                          # Utilities and configurations
│   ├── prisma.ts                 # Prisma client
│   ├── trpc.ts                   # tRPC setup
│   ├── analytics.ts              # Analytics utilities
│   └── utils.ts                  # General utilities
├── server/                       # Server-side code
│   └── routers/                  # tRPC routers
│       ├── event.ts              # Event operations
│       ├── contact.ts            # Contact operations
│       ├── analytics.ts          # Analytics endpoints
│       ├── template.ts            # Event templates
│       ├── export.ts             # CSV exports
│       ├── group.ts              # Contact groups
│       └── ...                   # Other routers
├── prisma/                       # Database
│   └── schema.prisma             # Prisma schema
├── public/                       # Static assets
└── hooks/                        # React hooks
```

---

## 🏗️ Architecture

### High-Level Architecture

EventOrg follows a modern full-stack architecture:

- **Frontend**: Next.js App Router with React Server Components and Client Components
- **API Layer**: tRPC for type-safe, end-to-end APIs
- **Database**: PostgreSQL with Prisma ORM for type-safe database access
- **Authentication**: Clerk handles user authentication and organization management
- **State Management**: TanStack Query for server state, Zustand for client state

### Key Design Decisions

1. **Type Safety**: TypeScript + tRPC + Prisma ensure end-to-end type safety
2. **Multi-tenancy**: Organization-based isolation using Clerk organizations
3. **Progressive Enhancement**: PWA support for mobile-first experience
4. **Scalability**: Designed for horizontal scaling with stateless architecture
5. **Developer Experience**: Hot reload, type checking, and comprehensive tooling

### Database Schema Highlights

- **Organizations**: Multi-tenant architecture with organization isolation
- **Events**: Rich event data with capacity, QR codes, and templates
- **Attendees**: Registration tracking with unique QR codes per attendee
- **Contacts**: Comprehensive contact management with groups and tags
- **Subscriptions**: Stripe integration for plan management
- **Usage**: Monthly usage tracking for metering and limits

> **For detailed architecture documentation, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)**

---

## 💰 Pricing Tiers

### Free Plan
- 2 events per month
- Manual WhatsApp messaging
- 10 AI generations per month
- Basic analytics
- Public event pages
- Contact management

### Monthly Plan (₹249/month)
- 15 events per month
- Manual WhatsApp messaging
- 60 AI generations per month
- Unique QR code per attendee
- Reminder system
- Event templates
- CSV exports
- Advanced analytics
- Contact groups
- Capacity limits & waitlist

### Pro Plan (₹499/month)
- Unlimited events
- Manual WhatsApp messaging
- 200 AI generations per month
- All premium features
- Priority support
- Early access to automation features

---

## 🚢 Deployment

### Recommended: Vercel

1. **Push code to GitHub**
   ```bash
   git push origin main
   ```

2. **Import project in Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure build settings (auto-detected for Next.js)

3. **Add environment variables**
   - Add all required environment variables in Vercel dashboard
   - Use Vercel's environment variable management

4. **Deploy**
   - Vercel will automatically deploy on push
   - Set up custom domain if needed

### Database Setup

Use a managed PostgreSQL service:
- **Supabase** (recommended for easy setup)
- **Railway**
- **Neon**
- **AWS RDS**
- Any PostgreSQL provider

Update `DATABASE_URL` in your environment variables.

### Webhook Configuration

After deployment, configure webhooks:

1. **Stripe Webhook**
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

2. **Clerk Webhook**
   - URL: `https://yourdomain.com/api/webhooks/clerk`
   - Events: `organization.created`, `organization.updated`, `organization.deleted`

---

## 📚 Documentation

Comprehensive documentation is available:

- **[README.md](./README.md)** - Project overview and quick start (you are here)
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Complete technical documentation for developers
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Feature implementation details and business value
- **[USER_GUIDE.md](./USER_GUIDE.md)** - User-facing guide for all features
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes

### Additional Resources

- **[ANALYTICS_SETUP.md](./ANALYTICS_SETUP.md)** - Analytics configuration
- **[PWA_INSTALLATION.md](./PWA_INSTALLATION.md)** - PWA setup guide
- **[SEO_OPTIMIZATION.md](./SEO_OPTIMIZATION.md)** - SEO best practices

---

## 🧪 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Build
npm run build        # Build for production
npm start            # Start production server

# Database
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run db:generate  # Generate Prisma Client

# Linting
npm run lint         # Run ESLint
```

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Test locally with `npm run dev`
4. Run linting: `npm run lint`
5. Update database schema if needed: `npm run db:push`
6. Commit and push changes

---

## 🎯 Production Status

**Current Status: Live & In Production ✅**

- **Deployment**: Live and serving real users
- **Overall Completion**: ~95%
- **Backend**: ~98% complete
- **Frontend**: ~95% complete
- **UI/UX**: ~90% complete

All core features and premium features are implemented, functional, and actively used by real customers. The platform is deployed, maintained, and continuously improved based on user feedback.

### Recent Major Updates (v2.0.0)

- ✅ Advanced Analytics Dashboard
- ✅ Unique QR Codes Per Attendee
- ✅ Event Templates System
- ✅ CSV Export Functionality
- ✅ Contact Groups & Segmentation
- ✅ Capacity Limits & Waitlist
- ✅ Contact Engagement Tracking
- ✅ Recurring Events
- ✅ Message Templates
- ✅ Enhanced Dashboard UX

---

## 🤝 Contributing

This is a private project. For questions or issues, please contact the maintainers.

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🔗 Links

- **Live Application**: Currently deployed and serving real users
- **Documentation**: See [Documentation](#-documentation) section above
- **Support**: Open an issue on GitHub

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices:
- Next.js team for the amazing framework
- Prisma team for the excellent ORM
- Clerk for seamless authentication
- Stripe for payment processing
- All open-source contributors whose work made this possible

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Live & In Production ✅
