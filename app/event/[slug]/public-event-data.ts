import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export const getPublicEventData = cache(async (slug: string) => {
  return prisma.event.findUnique({
    where: { publicSlug: slug },
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
      additionalNotes: true,
      maxCapacity: true,
      customField1Label: true,
      customField1Value: true,
      customField2Label: true,
      customField2Value: true,
      registrationClosed: true,
      organization: {
        select: {
          name: true,
          logo: true,
          accentColor: true,
          backgroundColor: true,
          fontStyle: true,
        },
      },
    },
  })
})

