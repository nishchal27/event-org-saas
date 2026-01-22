import { Metadata } from 'next'
import { PublicEventClient } from './public-event-client'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lexnify.com'

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const event = await prisma.event.findUnique({
    where: { publicSlug: params.slug },
    select: {
      title: true,
      description: true,
      eventDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      location: true,
      locationType: true,
      imageUrl: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!event) {
    return {
      title: 'Event Not Found',
      description: 'The event you are looking for could not be found.',
    }
  }

  const eventDate = formatDate(event.eventDate)
  const description = event.description || `Join us for ${event.title} on ${eventDate} at ${event.location}`
  const title = `${event.title} | EventOrg`
  const imageUrl = event.imageUrl || `${siteUrl}/images/hero/Speaker + audience.jpg`

  return {
    title,
    description: description.substring(0, 160),
    openGraph: {
      title,
      description: description.substring(0, 200),
      type: 'website',
      url: `${siteUrl}/event/${params.slug}`,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.title,
        },
      ],
      siteName: 'EventOrg',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description.substring(0, 200),
      images: [imageUrl],
    },
    alternates: {
      canonical: `${siteUrl}/event/${params.slug}`,
    },
    other: {
      'event:start_time': event.eventDate.toISOString(),
      'event:location': event.location,
    },
  }
}

export default async function PublicEventPage({
  params,
}: {
  params: { slug: string }
}) {
  // Fetch event data for structured data
  const event = await prisma.event.findUnique({
    where: { publicSlug: params.slug },
    select: {
      title: true,
      description: true,
      eventDate: true,
      endDate: true,
      startTime: true,
      endTime: true,
      location: true,
      locationType: true,
      imageUrl: true,
      organization: {
        select: {
          name: true,
        },
      },
    },
  })

  // Structured Data (JSON-LD) for Event
  const eventStructuredData = event
    ? {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: event.title,
        description: event.description || `Join us for ${event.title}`,
        startDate: event.eventDate.toISOString(),
        endDate: event.endDate?.toISOString() || event.eventDate.toISOString(),
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: {
          '@type': event.locationType === 'online' ? 'VirtualLocation' : 'Place',
          name: event.location,
          ...(event.locationType === 'online' && {
            url: event.location,
          }),
        },
        image: event.imageUrl || `${siteUrl}/images/hero/Speaker + audience.jpg`,
        organizer: {
          '@type': 'Organization',
          name: event.organization?.name || 'EventOrg',
        },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'INR',
          availability: 'https://schema.org/InStock',
          url: `${siteUrl}/event/${params.slug}`,
        },
      }
    : null

  return (
    <>
      {eventStructuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventStructuredData) }}
        />
      )}
      <PublicEventClient slug={params.slug} />
    </>
  )
}
