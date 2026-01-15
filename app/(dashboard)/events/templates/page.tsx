import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { TemplatesClient } from './templates-client'

export default async function TemplatesPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <TemplatesClient />
}
