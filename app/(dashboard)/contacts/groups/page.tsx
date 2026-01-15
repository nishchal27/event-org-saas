import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { GroupsClient } from './groups-client'

export default async function GroupsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <GroupsClient />
}
