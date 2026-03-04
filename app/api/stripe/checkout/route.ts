import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import Stripe from 'stripe'
import { isEarlyAccess } from '@/lib/early-access'
import { getOrCreateUserAndOrg } from '@/lib/get-user-org'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export async function GET(request: NextRequest) {
  const { userId } = await auth()

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const clerkUser = await currentUser()
  const { organization } = await getOrCreateUserAndOrg(prisma, userId, clerkUser ?? undefined)
  const orgId = organization.id

  const searchParams = request.nextUrl.searchParams
  const plan = searchParams.get('plan')

  if (!plan || !['monthly', 'monthly_pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  // During early access, grant premium without payment; do not call Stripe
  if (isEarlyAccess()) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    return NextResponse.redirect(`${baseUrl}/api/early-access/grant?plan=${plan}`)
  }

  const priceIds = {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
    monthly_pro: process.env.STRIPE_PRICE_ID_MONTHLY_PRO!,
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceIds[plan as keyof typeof priceIds],
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      client_reference_id: orgId,
      metadata: {
        orgId,
        plan,
      },
    })

    return NextResponse.redirect(session.url!)
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
