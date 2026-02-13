import type { Metadata } from 'next'
import { GuideShell, GuideSectionCard, QuickStartVideoCard } from './guide-components'
import { guideSections } from './guide-content'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexnify.com'

export const metadata: Metadata = {
  title: 'User Guide | Lexnify',
  description:
    'A calm, simple guide for small event organizers: create events, invite contacts, registration, and fast check-in.',
  alternates: { canonical: `${siteUrl}/guide` },
  openGraph: {
    title: 'Lexnify User Guide',
    description:
      'Don’t worry. Just follow this. Simple steps for creating events, inviting people, and check-in.',
    url: `${siteUrl}/guide`,
    siteName: 'Lexnify',
    type: 'website',
  },
}

export default function GuidePage() {
  return (
    <GuideShell sections={guideSections.map(({ id, title }) => ({ id, title }))}>
      <QuickStartVideoCard />
      {guideSections.map((section) => (
        <GuideSectionCard key={section.id} section={section} />
      ))}
    </GuideShell>
  )
}

