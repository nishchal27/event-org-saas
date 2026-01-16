import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { QRScannerClient } from './qr-scanner-client'

export default async function QRScannerPage({ params }: { params: { id: string } }) {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return <QRScannerClient eventId={params.id} />
}
