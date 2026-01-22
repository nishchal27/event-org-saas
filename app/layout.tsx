import type { Metadata, Viewport } from "next"
import * as Sentry from '@sentry/nextjs';
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeScript } from "./theme-script"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexnify.com'
const siteName = 'Lexnify - Event Management Made Simple'
const defaultDescription = 'Create events, send WhatsApp invitations, and track attendance — for groups, instructors, and organizers. WhatsApp-first event management with unique QR codes, advanced analytics, and premium features.'

export function generateMetadata(): Metadata {
  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteName,
      template: `%s | ${siteName}`,
    },
    description: defaultDescription,
    keywords: [
      'event management',
      'WhatsApp event invitations',
      'event attendance tracking',
      'QR code check-in',
      'event registration',
      'event organizer software',
      'WhatsApp automation',
      'event management India',
      'event management tool',
      'attendee management',
      'event planning software',
      'community event management',
      'workshop management',
      'seminar management',
      'training event management',
      'yoga class management',
      'fitness class management',
      'event analytics',
      'event templates',
      'contact management',
    ],
    authors: [{ name: 'Lexnify' }],
    creator: 'Lexnify',
    publisher: 'Lexnify',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: '/logo/icon.svg', type: 'image/svg+xml' },
        { url: '/logo/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: [
        { url: '/logo/icon-180.png', sizes: '180x180', type: 'image/png' },
      ],
    },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: siteUrl,
      siteName: siteName,
      title: siteName,
      description: defaultDescription,
      images: [
        {
          url: `${siteUrl}/images/hero/Speaker + audience.jpg`,
          width: 1200,
          height: 630,
          alt: 'Lexnify - Event Management Platform',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteName,
      description: defaultDescription,
      images: [`${siteUrl}/images/hero/Speaker + audience.jpg`],
      creator: '@lexnify',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: siteUrl,
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Lexnify",
    },
    other: {
      ...Sentry.getTraceData(),
    },
  }
}

export const viewport: Viewport = {
  themeColor: "#3b82f6",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/create-organization"
      afterSignInUrl="/dashboard"
      afterSignUpUrl="/create-organization"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeScript />
          <ErrorBoundary>
            <Providers>{children}</Providers>
          </ErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  )
}
