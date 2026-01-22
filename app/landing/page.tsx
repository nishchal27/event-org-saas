import { Metadata } from 'next'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Features } from '@/components/landing/Features'
import { PremiumFeatures } from '@/components/landing/PremiumFeatures'
import { EventFormPreview } from '@/components/landing/EventFormPreview'
import { Pricing } from '@/components/landing/Pricing'
import { Testimonials } from '@/components/landing/Testimonials'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { FAQ } from '@/components/landing/FAQ'
import { CTA } from '@/components/landing/CTA'
import { Footer } from '@/components/landing/Footer'
import { ScrollToTop } from '@/components/landing/ScrollToTop'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexnify.com'

export const metadata: Metadata = {
  title: 'Event Management Made Simple | WhatsApp-First Event & Attendance Tool',
  description: 'Create events, send WhatsApp invitations, and track attendance — for groups, instructors, and organizers. Now with unique QR codes per attendee, reminder system, advanced analytics, and more premium features. Start free, no credit card required.',
  keywords: [
    'event management',
    'WhatsApp event invitations',
    'event attendance tracking',
    'QR code check-in',
    'event registration',
    'event organizer software',
    'WhatsApp automation',
    'event management India',
    'workshop management',
    'seminar management',
    'training event management',
    'yoga class management',
    'fitness class management',
    'community event management',
  ],
  openGraph: {
    title: 'Lexnify - Event Management Made Simple',
    description: 'Create events, send WhatsApp invitations, and track attendance — for groups, instructors, and organizers.',
    url: `${siteUrl}/landing`,
    siteName: 'Lexnify',
    images: [
      {
        url: `${siteUrl}/images/hero/Speaker + audience.jpg`,
        width: 1200,
        height: 630,
        alt: 'Lexnify - Event Management Platform',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lexnify - Event Management Made Simple',
    description: 'Create events, send WhatsApp invitations, and track attendance — for groups, instructors, and organizers.',
    images: [`${siteUrl}/images/hero/Speaker + audience.jpg`],
  },
  alternates: {
    canonical: `${siteUrl}/landing`,
  },
}

// Structured Data (JSON-LD) for SEO
const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EventOrg',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'INR',
    lowPrice: '0',
    highPrice: '499',
    offerCount: '3',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    ratingCount: '2000',
    bestRating: '5',
    worstRating: '1',
  },
  description: 'WhatsApp-first event management tool for creating events, sending invitations, and tracking attendance. Perfect for trainers, coaches, and organizers.',
  url: siteUrl,
  logo: `${siteUrl}/logo/fav-icon.png`,
  featureList: [
    'WhatsApp Event Invitations',
    'QR Code Check-in',
    'Advanced Analytics',
    'Event Templates',
    'Contact Management',
    'AI Content Generation',
    'CSV Export',
    'Capacity & Waitlist Management',
  ],
  screenshot: `${siteUrl}/images/hero/Speaker + audience.jpg`,
}

const organizationStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'EventOrg',
  url: siteUrl,
  logo: `${siteUrl}/logo/fav-icon.png`,
  description: 'Event management platform for creating events, sending WhatsApp invitations, and tracking attendance.',
  sameAs: [
    // Add social media links when available
  ],
}

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Do I need a credit card to get started?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No, you can start using EventOrg completely free. Our free plan includes everything you need to create events and send WhatsApp notifications. No credit card required.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is this suitable for fitness trainers and coaches?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely! EventOrg is perfect for trainers, coaches, and instructors. You can create class schedules, send WhatsApp reminders to students, track attendance, and manage repeat events easily.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do WhatsApp messages work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'EventOrg generates professional WhatsApp invitation and reminder messages for you. Simply copy the message and send it via WhatsApp with one click. Track what you\'ve sent with our reminder checklist. Automated sending coming soon for Pro users.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I use this for community events and meetups?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! EventOrg works great for housing societies, spiritual groups, clubs, and associations. Create events, notify members via WhatsApp, and track who\'s attending—all in one place.',
      },
    },
  ],
}

export default function LandingPage() {
  return (
    <>
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <PremiumFeatures />
          <EventFormPreview />
          <Pricing />
          <Testimonials />
          <HowItWorks />
          <FAQ />
          <CTA />
        </main>
        <Footer />
        <ScrollToTop />
      </div>
    </>
  )
}
