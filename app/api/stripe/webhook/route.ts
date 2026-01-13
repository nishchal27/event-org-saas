import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const orgId = session.metadata?.orgId
        const plan = session.metadata?.plan

        if (orgId && plan) {
          const organization = await prisma.organization.findUnique({
            where: { clerkOrgId: orgId },
          })

          if (organization) {
            await prisma.subscription.upsert({
              where: { organizationId: organization.id },
              update: {
                plan,
                status: 'active',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodStart: new Date(session.created * 1000),
                currentPeriodEnd: new Date((session.created + 2592000) * 1000), // 30 days
              },
              create: {
                organizationId: organization.id,
                plan,
                status: 'active',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodStart: new Date(session.created * 1000),
                currentPeriodEnd: new Date((session.created + 2592000) * 1000),
              },
            })
          }
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        // Update subscription status in database
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'active' : 'canceled',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
