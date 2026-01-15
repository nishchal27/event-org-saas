import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { MessageTemplatesClient } from './message-templates-client'

export default async function MessageTemplatesPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <MessageTemplatesClient />
}
