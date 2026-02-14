# Lexnify — Product Story & Content Bucket

**Purpose of this document**  
This is the single source of truth for the Lexnify product story: the upgrade journey, decisions, audiences, and real-world experience. Use it as your **content bucket** when writing blogs, LinkedIn posts, Twitter/X threads, Facebook updates, or any other content. Everything here is organized so you can pull facts, stories, quotes, and angles without hunting through multiple docs.

**How to use it**  
- Read it end-to-end to own the full narrative.  
- Jump to a section when drafting a specific post (e.g. “why we added self-check-in”).  
- Use the **Content Hooks** and **Suggested Content Angles** at the end for ready-made snippets and ideas.

---

## Table of Contents

1. [The Story in One Minute](#1-the-story-in-one-minute)
2. [The Journey: What Changed and Why](#2-the-journey-what-changed-and-why)
3. [What Was Missing: Real Organizer Feedback](#3-what-was-missing-real-organizer-feedback)
4. [How We Decided: Keeping Both Worlds](#4-how-we-decided-keeping-both-worlds)
5. [The Product Today](#5-the-product-today)
6. [Audiences: Who We Build For](#6-audiences-who-we-build-for)
7. [Decisions and Trade-offs](#7-decisions-and-trade-offs)
8. [Vision and Direction](#8-vision-and-direction)
9. [User Guide: Built for Audience Mindset](#9-user-guide-built-for-audience-mindset)
10. [Lessons and Practical Knowledge](#10-lessons-and-practical-knowledge)
11. [Content Hooks and Pull Quotes](#11-content-hooks-and-pull-quotes)
12. [Suggested Content Angles](#12-suggested-content-angles)

---

## 1. The Story in One Minute

Lexnify is an event-organizer SaaS for small and mid-level organizers (college fests, NGOs, community events, workshops). We help them create events, manage contacts, send WhatsApp invites, and run check-in at the venue.  

We had a solid base: events, contacts, WhatsApp, and staff-led check-in. Then **real organizers asked for something that changed the product**: the ability for **guests to check themselves in** — no long queues, no dependency on one device, less chaos at the door. We didn’t replace staff check-in; we **added** self-check-in and made both work together. That meant rethinking time windows (when registration and check-in open/close), phone handling (so the same guest isn’t duplicated), and optional venue PIN for security. Today, organizers can choose: staff scan, self-check-in, or both, depending on the event. The product is clearer, more flexible, and built around how events actually run on the ground.

---

## 2. The Journey: What Changed and Why

### Where we started

- Events with a public registration page and link.
- Contacts and WhatsApp for invites.
- Check-in that was **staff-only**: someone at the door with a device scanning attendee QR codes or marking people manually.

### What we heard

Organizers said:

- “At the gate we don’t have enough devices.”  
- “We want guests to just show their phone and get checked in without waiting in a long line.”  
- “Can we have a PIN so only people at the venue can check in?”

So the ask wasn’t “remove staff check-in” — it was **add another way**: let guests check themselves in when it makes sense, and keep staff scan when it doesn’t.

### What we did (the overhaul)

We treated this as a **check-in and registration upgrade**:

- **Event time windows**  
  When registration opens/closes and when check-in opens/closes (e.g. “check-in opens 30 minutes before start, closes 4 hours after”). No check-in outside that window.

- **Phone as the key**  
  One canonical way to store and look up attendees (normalized phone) so the same person isn’t created twice and self-check-in finds them reliably.

- **Optional venue PIN**  
  For self-check-in only: organizer sets a PIN; guests enter it at the venue. Reduces abuse (e.g. someone checking in from home).

- **Self-check-in flow**  
  Guest opens the event’s check-in link/QR, enters phone (and PIN if enabled). If they’re registered and within the time window, they’re marked checked-in. Idempotent so double-tap doesn’t break anything.

- **Staff scan still there**  
  Staff can still scan attendee QR codes or do manual check-in. Same event can use both: some guests self-check-in, some get scanned.

- **One check-in experience**  
  One public check-in page that understands both “event QR” (self-check-in) and “attendee QR” (scan or guest showing their own QR). Fast, works on mobile and PWA, no confusing duplicate flows.

- **Stability and clarity**  
  PWA/cache behavior fixed so check-in and registration don’t show stale data. Errors and edge cases (wrong PIN, outside time window, duplicate phone) handled clearly and reported for monitoring.

So the story is: **we listened to real events, then upgraded the product so both “staff at the door” and “guests check themselves” are first-class options.**

---

## 3. What Was Missing: Real Organizer Feedback

### The self-check-in request

A concrete ask from the field: *“We need guests to be able to check in themselves.”*

Why it mattered:

- **Scale** — One or two devices at the gate can’t handle a large crowd quickly.  
- **Trust** — Guests feel in control when they complete the action themselves.  
- **Flexibility** — Events differ: some want full control (staff only), some want speed (self-check-in), some want both (e.g. VIP scanned, rest self-check-in).

We didn’t treat it as a small feature. We treated it as a **different way to run the door** and designed time windows, phone normalization, and optional PIN around it.

### Other gaps we addressed

- **“When can people register? When can they check in?”**  
  → Clear registration and check-in time windows (e.g. “registration closes 15 minutes before start,” “check-in opens 30 minutes before, closes 4 hours after”).

- **“Same person registered twice with different phone formats.”**  
  → Normalized phone storage and lookup so one person = one attendee per event.

- **“Someone could check in from home.”**  
  → Optional venue PIN for self-check-in only; staff scan unchanged.

- **“Check-in page was confusing (event QR vs my QR).”**  
  → Single smart check-in page: one URL/QR, context-aware (event vs attendee), minimal steps.

This section is your **evidence** for “we built this because organizers asked for it.”

---

## 4. How We Decided: Keeping Both Worlds

### The decision: both staff check-in and self-check-in

We could have chosen:

- Only self-check-in (lose control and “high-touch” events).  
- Only staff check-in (ignore scale and organizer requests).

We chose **both**, and made them work together:

- **Staff scan** — For control, VIP, or low-trust settings.  
- **Self-check-in** — For speed, fewer devices, and guest autonomy.  
- **Same event** can use both; no need to pick one forever.

### Why both

- **Event types differ** — College fest vs small workshop vs community day have different needs.  
- **Organizer preference** — Some want to touch every check-in; some want to reduce queue and stress.  
- **Technical reality** — One code path for “mark this attendee checked-in” with different entry points (staff scan, self-check-in by event QR, self-check-in by attendee QR). Same outcome, different UX.

So the product story is: **we didn’t replace the old way; we extended it.** That’s a clear decision you can explain in a post or a blog.

---

## 5. The Product Today

### In one sentence

Lexnify is an event-organizer platform where you create events, manage contacts, send WhatsApp invites, and run flexible check-in (staff scan and/or self-check-in) with clear time windows and optional venue PIN.

### Core features (for content and positioning)

| Area | What it does |
|------|----------------|
| **Events** | Create events with date, time, location, capacity; public registration page and unique link/QR; time zones and registration/check-in windows. |
| **Contacts** | Add and import contacts; link them to events; use for WhatsApp and reports. |
| **WhatsApp** | Send invites and reminders via Twilio; track who was sent a message. |
| **Check-in** | Staff scan (attendee QR or manual), self-check-in (event QR + phone ± PIN), or both; one public check-in page that adapts to event vs attendee QR. |
| **Reports & export** | See who registered, who checked in, when; export for offline use. |
| **Billing & usage** | Subscription and usage tracking (Stripe); org-level limits. |

### Who it’s for

Small and mid-level organizers: college fests, NGOs, religious/community events, coaching centers, societies, local workshops. Not enterprise; not “power users” who love complexity. People who want **outcomes** (smooth registration, clear check-in, less chaos), not systems.

---

## 6. Audiences: Who We Build For

### Primary: The organizer

- **Who** — College coordinators, NGO organizers, community managers, workshop hosts, society planners.  
- **Mindset** — Action-focused. They want to “create event → add people → send link → run check-in” without learning jargon or worrying they’ll break something.  
- **Fears** — Too many options, technical words (“slug,” “toggle”), QR not working, losing data.  
- **Needs** — Step-by-step flows, clear buttons, reassurance (“you can edit this later”), one main path with advanced options tucked away.

### Secondary: The attendee (guest)

- **Who** — Anyone with the event link or QR.  
- **Mindset** — “I just want to register / check in and be done.” No interest in dashboard or settings.  
- **Needs** — Minimal steps, mobile-friendly page, clear result (registered / checked-in). No login required for registration or check-in.

### Why this matters for content

When you write blogs or posts, you can speak to **organizers** as the main audience (“you asked for self-check-in; here’s how we did it”) and mention **attendees** as the people they serve (“your guests get a simple check-in without long queues”). The product and the user guide are both designed around these two mindsets.

---

## 7. Decisions and Trade-offs

### Time windows vs “always open”

- **Decision** — Registration and check-in have explicit open/close times (e.g. “check-in opens 30 min before, closes 4 hours after”).  
- **Trade-off** — Slightly more setup for the organizer; in return, no check-in from home days later, and behavior matches real events.  
- **Content angle** — “We added time windows so check-in only works when and where it should.”

### Venue PIN (optional)

- **Decision** — Self-check-in can require a PIN that the organizer shares at the venue. Staff scan does not use PIN.  
- **Trade-off** — One more thing for the guest to enter; in return, only people physically at the venue can self-check-in.  
- **Content angle** — “Optional PIN: keep self-check-in fast but under your control.”

### One check-in page for both event QR and attendee QR

- **Decision** — Single public URL: scan or open link; the app decides if it’s event QR (self-check-in flow) or attendee QR (confirm identity and check-in).  
- **Trade-off** — Slightly more logic in one place; in return, one link to share, no “which page do I open?” confusion.  
- **Content angle** — “One link, two flows: we made check-in simple for both staff and guests.”

### Phone normalization

- **Decision** — Store and compare phones in a normalized form so “9876543210” and “+91 98765 43210” don’t create two attendees.  
- **Trade-off** — More engineering; in return, no duplicate attendees and reliable self-check-in lookup.  
- **Content angle** — “Small detail, big impact: one phone = one attendee.”

### Keeping staff scan and manual check-in

- **Decision** — Don’t remove or hide staff scan or manual check-in when we added self-check-in.  
- **Trade-off** — More modes to document and support; in return, we fit every event type and organizer preference.  
- **Content angle** — “We didn’t replace the old way; we gave you both.”

Use these when you write “how we think” or “why we built it this way” content.

---

## 8. Vision and Direction

### Short term (what we shipped)

- Reliable, flexible check-in: staff + self-check-in, time windows, optional PIN.  
- One clear check-in experience; stable on mobile and PWA.  
- User guide and docs aligned with organizer and attendee mindset.

### Direction (for storytelling)

- **Simplicity** — Defaults that work; advanced options when needed. Language that matches non-technical organizers.  
- **Real events** — Features driven by how events actually run: queues, devices, trust, scale.  
- **Trust and safety** — Reassurance in the product and the guide (“you can change this later,” “your data is safe”).  
- **One product, many events** — Same platform for fests, workshops, community events; configuration, not separate products.

When you write vision posts, you can tie back to: “We’re building for the way events really happen — at the gate, on phones, with or without staff.”

---

## 9. User Guide: Built for Audience Mindset

### Philosophy

The user guide is **not** documentation. It’s **emotional support and clarity** for non-technical organizers. If they feel safe and unconfused, they keep using Lexnify.

### Principles (from Audience & User Guide Strategy)

- **Not** — Technical, paragraph-heavy, system-focused.  
- **Yes** — Screenshots, one action per idea, short sentences, reassurance (“Don’t worry, you can edit this later”), clear buttons and steps.

### Structure (tabs/sections)

1. Getting Started  
2. Creating Your First Event  
3. Adding Contacts  
4. Sending WhatsApp Messages  
5. Public Registration Page  
6. Check-In (very important)  
7. Viewing Reports  
8. Subscription & Billing  
9. Safety & Data  

Each section: short intro, screenshot, 3–5 steps, common mistake warning, reassurance box.

### Language

- “Event Link Name” instead of “slug.”  
- “Guests check themselves” instead of “self-check-in” where it reads friendlier.  
- “Staff QR scanner” instead of “staff scan mode.”  
- Time windows shown in plain language: “Check-in opens 4:30 PM, closes 9:00 PM.”

### Why this matters for content

When you write “how to use Lexnify” or “tips for organizers,” you’re extending the same mindset: simple, reassuring, outcome-focused. The guide is the in-product proof of how we think about our audience.

---

## 10. Lessons and Practical Knowledge

### Product

- **Listen to one strong use case.** One organizer asking for self-check-in led to a full upgrade.  
- **Extend, don’t replace.** Adding self-check-in while keeping staff scan reduced risk and fit more events.  
- **Time and place matter.** Registration and check-in windows make the product match real events.  
- **Small details (e.g. phone normalization) prevent big problems** (duplicate attendees, failed self-check-in).

### Technical

- **One source of truth for state** (e.g. one “checked-in” flag, one time-window engine) keeps behavior consistent across staff scan, self-check-in, and manual.  
- **Idempotency** at check-in (same action twice = same result) avoids duplicate or inconsistent state.  
- **PWA/cache** must be considered for public check-in and registration so users don’t see stale flows.  
- **Observability** (errors, time-window violations, PIN failures) helps support and iteration.

### Audience

- **Organizers are not technical.** Language and UI must match “I want to run my event,” not “I want to configure a system.”  
- **Reassurance reduces fear.** “You can edit later,” “nothing is deleted” — these matter as much as the feature.  
- **One primary path, advanced optional** — keeps the default experience simple.

### Content you can spin from this

- “What we learned from building self-check-in.”  
- “Why we kept both staff and self-check-in.”  
- “Small details that make event check-in reliable.”  
- “How we design for non-technical organizers.”

---

## 11. Content Hooks and Pull Quotes

Use these as-is or adapt for LinkedIn, Twitter, blog intros, or Facebook.

### Product story

- “We didn’t replace the old way; we gave you both. Staff check-in and self-check-in, same event, your choice.”  
- “One organizer asked for self-check-in. We didn’t add a button — we rethought the door.”  
- “Lexnify: create events, send WhatsApp invites, and run check-in your way — staff, guests, or both.”

### Decisions

- “We kept staff scan and added self-check-in. Different events need different doors.”  
- “Optional PIN: so only people at the venue can check in, not someone at home.”  
- “One link for check-in. We figure out if it’s the event or the guest — your guests don’t have to.”

### Audience

- “We build for people who run events, not for people who love dashboards.”  
- “The guide isn’t documentation. It’s reassurance and clarity so organizers feel safe.”  
- “One phone, one attendee. Small detail, fewer duplicate registrations and smoother check-in.”

### Vision / experience

- “Features that match how events actually run: at the gate, on phones, with or without staff.”  
- “Real feedback from real events — that’s what drove our check-in overhaul.”  
- “Simplicity by default; power when you need it.”

---

## 12. Suggested Content Angles

Use this section when you’re planning blogs or posts. Each row is a content angle you can pull from this doc.

| Angle | Source section | Possible format |
|-------|----------------|------------------|
| Why we added self-check-in | §3, §4 | Blog, LinkedIn post |
| Why we kept both staff and self-check-in | §4, §7 | Twitter thread, LinkedIn |
| What organizers asked for (and we did) | §3 | Blog, “user feedback” post |
| Time windows and why they matter | §2, §7 | Short explainer, tip post |
| One check-in link, two flows | §2, §7 | Product tip, LinkedIn |
| Who we build for (organizers, non-technical) | §6, §9 | “Who is Lexnify for” blog or post |
| How the user guide is different (reassurance, not docs) | §9 | Behind-the-scenes, culture post |
| Trade-offs we made (PIN, time windows, both modes) | §7 | “How we decide” or “product thinking” post |
| Lessons from the overhaul | §10 | Lessons-learned blog or thread |
| Vision: events as they really happen | §8 | Vision or “where we’re going” post |
| Phone normalization: small detail, big impact | §7, §10 | Technical-but-accessible short post |
| PWA and check-in: why stability mattered | §2, §10 | Dev/product story for technical audience |

---

**End of document.**  
Update this bucket as the product and story evolve; then all your future content stays aligned to one source of truth.
