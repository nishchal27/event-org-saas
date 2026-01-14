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
            // Get subscription details from Stripe for accurate period dates
            let periodStart = new Date(session.created * 1000)
            let periodEnd = new Date((session.created + 2592000) * 1000) // Default 30 days

            if (session.subscription) {
              try {
                const stripeSubscription = await stripe.subscriptions.retrieve(
                  session.subscription as string
                )
                periodStart = new Date(stripeSubscription.current_period_start * 1000)
                periodEnd = new Date(stripeSubscription.current_period_end * 1000)
              } catch (error) {
                console.error('Error fetching subscription from Stripe:', error)
                // Use defaults if fetch fails
              }
            }

            await prisma.subscription.upsert({
              where: { organizationId: organization.id },
              update: {
                plan,
                status: 'active',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
              },
              create: {
                organizationId: organization.id,
                plan,
                status: 'active',
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: session.subscription as string,
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
              },
            })
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        // Get subscription item to determine plan
        const subscriptionItem = subscription.items.data[0]
        const priceId = subscriptionItem?.price.id

        // Map Stripe price IDs to plan names
        const priceIdToPlan: Record<string, string> = {
          [process.env.STRIPE_PRICE_ID_MONTHLY || '']: 'monthly',
          [process.env.STRIPE_PRICE_ID_MONTHLY_PRO || '']: 'monthly_pro',
        }

        const plan = priceIdToPlan[priceId] || 'monthly'

        // Update subscription in database
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            plan,
            status: subscription.status === 'active' ? 'active' : 'canceled',
            currentPeriodStart: new Date(subscription.current_period_start * 1000),
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        })
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        // Downgrade to free plan when subscription is canceled
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: 'canceled',
            plan: 'free', // Downgrade to free
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
