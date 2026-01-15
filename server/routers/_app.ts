import { router } from '@/lib/trpc'
import { eventRouter } from './event'
import { contactRouter } from './contact'
import { subscriptionRouter } from './subscription'
import { usageRouter } from './usage'
import { whatsappRouter } from './whatsapp'
import { aiRouter } from './ai'
import { attendeeRouter } from './attendee'
import { organizationRouter } from './organization'
import { analyticsRouter } from './analytics'
import { templateRouter } from './template'
import { exportRouter } from './export'
import { groupRouter } from './group'
import { messageTemplateRouter } from './messageTemplate'

export const appRouter = router({
  event: eventRouter,
  contact: contactRouter,
  subscription: subscriptionRouter,
  usage: usageRouter,
  whatsapp: whatsappRouter,
  ai: aiRouter,
  attendee: attendeeRouter,
  organization: organizationRouter,
  analytics: analyticsRouter,
  template: templateRouter,
  export: exportRouter,
  group: groupRouter,
  messageTemplate: messageTemplateRouter,
})

export type AppRouter = typeof appRouter
