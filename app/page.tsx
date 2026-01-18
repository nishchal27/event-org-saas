import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'

export default async function Home() {
  const { userId, orgId } = await auth()

  if (userId) {
    // If user has organization, go to dashboard
    // If no org, dashboard layout will handle redirect to create-organization
    redirect('/dashboard')
  }

  // Redirect unauthenticated users to landing page
  redirect('/landing')
}
