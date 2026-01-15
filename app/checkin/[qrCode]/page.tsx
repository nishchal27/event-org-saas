import { CheckInPublicClient } from './checkin-public-client'

export default function PublicCheckInPage({
  params,
}: {
  params: { qrCode: string }
}) {
  return <CheckInPublicClient qrCode={params.qrCode} />
}
