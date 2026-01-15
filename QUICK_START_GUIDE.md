# 🚀 Quick Start Guide - EventOrg SaaS

Get EventOrg up and running in 10 minutes.

---

## ⚡ Fast Setup (10 Minutes)

### Step 1: Clone & Install (2 min)

```bash
git clone <repository-url>
cd event-org-saas
npm install
```

### Step 2: Database Setup (2 min)

1. Create a PostgreSQL database (use [Supabase](https://supabase.com) for free)
2. Copy connection string
3. Add to `.env`:

```env
DATABASE_URL="postgresql://postgres:password@host:5432/postgres"
```

4. Run migrations:

```bash
npx prisma generate
npx prisma db push
```

### Step 3: Environment Variables (3 min)

Copy `.env.template` to `.env` and fill in:

**Minimum Required:**
```env
DATABASE_URL="..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**For Full Features:**
- Stripe (payments)
- Twilio (WhatsApp)
- Cloudinary (images)
- OpenAI (AI features)

See `ENV_SETUP_GUIDE.md` for detailed setup.

### Step 4: Run (1 min)

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 🎯 First Steps After Setup

### 1. Create Organization
- Sign up / Sign in
- Create your organization
- Set organization name

### 2. Add Contacts
- Go to Contacts
- Add your first contact
- Or import via CSV (coming soon)

### 3. Create Your First Event
- Go to Events → New Event
- Fill in event details
- (Optional) Select a template
- Create event

### 4. Send Invitations
- Go to Event Detail
- Click "Invite" tab
- Select contacts
- Send WhatsApp invitations

### 5. View Analytics
- Go to Dashboard
- See your metrics
- View charts and trends

---

## 📚 Next Steps

### Learn the Features
- **[USER_GUIDE_PREMIUM_FEATURES.md](./USER_GUIDE_PREMIUM_FEATURES.md)** - How to use premium features
- **[README.md](./README.md)** - Feature overview

### Configure Services
- **[TWILIO_WHATSAPP_SETUP.md](./TWILIO_WHATSAPP_SETUP.md)** - WhatsApp setup
- **[STRIPE_INTEGRATION_GUIDE.md](./STRIPE_INTEGRATION_GUIDE.md)** - Payments setup

### Deploy to Production
- **[SETUP.md](./SETUP.md)** - Deployment guide
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Technical details

---

## 🆘 Troubleshooting

### Database Issues
```bash
# Reset database (development only)
npx prisma migrate reset

# Or force push
npx prisma db push --force-reset
```

### Environment Variables
- Check `.env` file exists
- Verify all required variables are set
- Restart dev server after changes

### Features Not Working
- Check service accounts are set up
- Verify API keys are correct
- Check browser console for errors

---

## 📖 Full Documentation

See **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** for complete documentation list.

---

**Ready to go!** 🎉
