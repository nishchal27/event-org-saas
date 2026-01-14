import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { ClerkProvider } from "@clerk/nextjs"
import "./globals.css"
import { Providers } from "./providers"
import { ThemeScript } from "./theme-script"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EventOrg - Event Management Made Simple",
  description: "Create, manage, and invite attendees to your events with WhatsApp automation",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EventOrg",
  },
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
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeScript />
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
