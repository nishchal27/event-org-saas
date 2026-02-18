# Lexnify — Event Management SaaS

A live SaaS platform for creating events, managing attendees, sending WhatsApp invitations, and tracking attendance. Built for trainers, coaches, community organizers, and event managers.

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-Live%20%26%20In%20Production-success)]()

---

## Quick Start

**Prerequisites:** Node.js 18+, PostgreSQL, npm or yarn

```bash
git clone <repository-url>
cd event-org-saas
npm install
cp env.template .env
# Edit .env with your credentials (see env.template for list)
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Documentation

| Document | Purpose |
|----------|---------|
| **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)** | Complete technical documentation: setup, architecture, APIs, auth, deployment, troubleshooting, analytics, PWA, SEO. |
| **[docs/HIGH_LEVEL_DESIGN.md](./docs/HIGH_LEVEL_DESIGN.md)** | System design: context, routes, data model, workflows, and diagrams. |
| **[CHANGELOG.md](./CHANGELOG.md)** | Version history. |

**User-facing help** is in the app at `/guide` (no login required).

---

## Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run lint         # Run ESLint
```

---

## License

MIT — see LICENSE file.
