import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { isEarlyAccess } from '@/lib/early-access'
import { getOrCreateUserAndOrg } from '@/lib/get-user-org'
import { currentUser } from '@clerk/nextjs/server'

const ALLOWED_PLANS = ['monthly', 'monthly_pro'] as const

/**
 * Grant premium access during early access (no payment).
 * Redirects to dashboard with success. When early_access is false, returns 400.
 */
export async function GET(request: NextRequest) {
  if (!isEarlyAccess()) {
    return NextResponse.json({ error: 'Early access is not active' }, { status: 400 })
  }

  const { userId } = await auth()
  if (!userId) {
    const url = new URL('/sign-in', request.url)
    return NextResponse.redirect(url)
  }

  const plan = request.nextUrl.searchParams.get('plan')
  if (!plan || !ALLOWED_PLANS.includes(plan as (typeof ALLOWED_PLANS)[number])) {
    const url = new URL('/pricing', request.url)
    url.searchParams.set('error', 'invalid_plan')
    return NextResponse.redirect(url)
  }

  const clerkUser = await currentUser()
  const { organization } = await getOrCreateUserAndOrg(prisma, userId, clerkUser ?? undefined)

  await prisma.subscription.upsert({
    where: { organizationId: organization.id },
    update: { plan, status: 'active' },
    create: {
      organizationId: organization.id,
      plan,
      status: 'active',
    },
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const redirectUrl = new URL('/dashboard', baseUrl)
  redirectUrl.searchParams.set('success', 'early_access')
  return NextResponse.redirect(redirectUrl)
}
