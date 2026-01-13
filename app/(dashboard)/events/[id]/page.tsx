import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { EventDetailClient } from './event-detail-client'

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <EventDetailClient eventId={params.id} />
}
