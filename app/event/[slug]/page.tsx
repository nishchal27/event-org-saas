import { PublicEventClient } from './public-event-client'

export default function PublicEventPage({
  params,
}: {
  params: { slug: string }
}) {
  return <PublicEventClient slug={params.slug} />
}
