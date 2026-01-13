import { router } from '@/lib/trpc'
import { eventRouter } from './event'
import { contactRouter } from './contact'
import { subscriptionRouter } from './subscription'
import { usageRouter } from './usage'
import { whatsappRouter } from './whatsapp'
import { aiRouter } from './ai'
import { attendeeRouter } from './attendee'

export const appRouter = router({
  event: eventRouter,
  contact: contactRouter,
  subscription: subscriptionRouter,
  usage: usageRouter,
  whatsapp: whatsappRouter,
  ai: aiRouter,
  attendee: attendeeRouter,
})

export type AppRouter = typeof appRouter
