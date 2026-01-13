# EventOrg - Event Management SaaS

A comprehensive event management micro-SaaS built for communities, NGOs, schools, and organizations in India. Features WhatsApp automation, AI content generation, and a mobile-first PWA experience.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **API**: tRPC
- **State Management**: Zustand + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui
- **Payments**: Stripe
- **Images**: Cloudinary
- **WhatsApp**: Meta WhatsApp Cloud API
- **AI**: OpenAI (or compatible LLM)
- **PWA**: next-pwa

## Features

### Core Features
- ✅ Event CRUD operations
- ✅ Contact management
- ✅ WhatsApp invitation automation
- ✅ AI-powered content generation
- ✅ Public event pages (mobile-first)
- ✅ Event preview before sending
- ✅ Attendee tracking (confirmed/declined/pending)
- ✅ Usage limits and metering
- ✅ Subscription management (Free, Monthly, Yearly)

### Pricing Tiers
- **Free**: 2 events/month, 100 contacts, 50 WhatsApp messages, 5 AI generations
- **Monthly (₹199)**: 10 events/month, 300 contacts, 500 WhatsApp messages, 30 AI generations
- **Yearly (₹1,999)**: 30 events/month, 1,000 contacts, 3,000 WhatsApp messages, 200 AI generations

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Clerk account
- Stripe account
- Cloudinary account
- WhatsApp Business API access
- OpenAI API key (optional, for AI features)

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd event-org-saas
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Fill in your environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`: Clerk credentials
- `STRIPE_SECRET_KEY` & `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: Stripe credentials
- `WHATSAPP_ACCESS_TOKEN` & `WHATSAPP_PHONE_NUMBER_ID`: WhatsApp API credentials
- `CLOUDINARY_*`: Cloudinary credentials
- `OPENAI_API_KEY`: OpenAI API key (optional)

4. Set up the database
```bash
npx prisma generate
npx prisma db push
```

5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   ├── event/             # Public event pages
│   └── api/               # API routes
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and configurations
├── server/                # tRPC routers
│   └── routers/          # API route handlers
├── prisma/               # Database schema
└── public/               # Static assets
```

## Key Features Implementation

### Event Management
- Create events with core fields (title, date, time, location, description)
- Optional custom fields (max 2)
- Event preview before sending
- Duplicate and delete events

### WhatsApp Integration
- Send bulk WhatsApp invitations
- Track sent messages
- Respect usage limits per plan

### AI Content Generation
- Generate WhatsApp invitation messages
- Generate social media posts (Instagram, Facebook)
- Usage tracking and limits

### Public Event Pages
- Mobile-first design
- No login required
- RSVP functionality
- Customizable branding

## Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Database
Use Supabase or any PostgreSQL provider. Update `DATABASE_URL` in your environment variables.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
