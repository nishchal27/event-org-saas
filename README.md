# EventOrg - WhatsApp-First Event & Attendance Tool

Create events, notify people on WhatsApp, and track attendance — for groups, instructors, and organizers. Perfect for trainers, coaches, communities, and event organizers. Features WhatsApp automation, AI content generation, and a mobile-first PWA experience.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **API**: tRPC
- **State Management**: Zustand + TanStack Query
- **UI**: Tailwind CSS + shadcn/ui
- **Payments**: Stripe
- **Images**: Cloudinary
- **WhatsApp**: Twilio WhatsApp API
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
- ✅ Subscription management (Free, Monthly, Pro)

### Premium Features
- ✅ **Advanced Analytics Dashboard** - Real-time metrics, trends, and insights with interactive charts
- ✅ **Event Templates** - Save and reuse event configurations for quick creation
- ✅ **CSV Export** - Export events, contacts, and attendance reports
- ✅ **QR Code Check-in** - On-site attendance tracking with QR codes
- ✅ **Contact Groups** - Organize contacts into groups for better segmentation
- ✅ **Capacity Limits & Waitlist** - Set max capacity and automatic waitlist management
- ✅ **Contact Engagement Tracking** - Track contact activity and engagement rates
- ✅ **Recurring Events** - Duplicate events with date shift for recurring series
- ✅ **Enhanced Dashboard UX** - Modern, intuitive interface with quick actions

### Pricing Tiers
- **Free**: 2 events/month, 60 WhatsApp messages, 10 AI generations, basic analytics
- **Monthly (₹249)**: 15 events/month, 300 WhatsApp messages, 60 AI generations, full analytics, templates, exports, QR check-in
- **Monthly Pro (₹499)**: Unlimited events, 800 WhatsApp messages, 200 AI generations, all premium features, priority support

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
- **Event templates** for quick creation
- **Capacity limits** and automatic waitlist
- **QR code check-in** for on-site attendance
- Event preview before sending
- Duplicate events with date shift for recurring series
- Delete events (soft delete)

### Analytics & Insights
- **Real-time dashboard** with key metrics
- **6-month trends** (events and attendance)
- **Response rate tracking**
- **Contact engagement** analytics
- Month-over-month comparisons
- Interactive charts and visualizations

### Contact Management
- Add, edit, and organize contacts
- **Contact groups** for segmentation
- **Tag-based organization**
- **CSV export** for backup and reporting
- Bulk import support
- Contact activity history

### WhatsApp Integration
- Send bulk WhatsApp invitations
- Track sent messages and delivery status
- **Message templates** (coming soon)
- Respect usage limits per plan
- Personalized messages with contact names

### AI Content Generation
- Generate WhatsApp invitation messages
- Generate social media posts (Instagram, Facebook, Twitter, LinkedIn)
- Multiple tone options
- Usage tracking and limits

### Public Event Pages
- Mobile-first design
- No login required
- RSVP functionality with capacity awareness
- **Waitlist support** when event is full
- Customizable branding
- QR code for check-in

### Export & Reporting
- **CSV export** for events
- **CSV export** for contacts
- **CSV export** for attendance reports
- All exports include comprehensive data

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

## Documentation

Comprehensive documentation is available:

- **[README.md](./README.md)** - Project overview and quick start (you are here)
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** - Complete technical documentation for developers
- **[IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)** - Feature implementation details and business value
- **[USER_GUIDE.md](./USER_GUIDE.md)** - User-facing guide for all features
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes

## Support

For issues and questions, please open an issue on GitHub.
