import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

/**
 * Analytics API endpoint
 * Lightweight, non-blocking analytics tracking
 */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth()
    const body = await req.json()

    const { event, properties, userId, organizationId, timestamp, userAgent, url } = body

    if (!event) {
      return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
    }

    // Get user and organization from database if needed
    let dbUserId: string | undefined
    let dbOrganizationId: string | undefined

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        include: {
          memberships: {
            include: { organization: true },
            take: 1,
          },
        },
      })

      if (user) {
        dbUserId = user.id
        if (user.memberships[0]) {
          dbOrganizationId = user.memberships[0].organizationId
        }
      }
    }

    // Use provided organizationId if available, otherwise use user's org
    // Validate organizationId exists if provided
    let finalOrgId: string | undefined = dbOrganizationId
    
    if (organizationId) {
      // Verify the organization exists
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
      })
      if (org) {
        finalOrgId = organizationId
      }
    }

    // Store analytics event (non-blocking insert)
    await prisma.analyticsEvent.create({
      data: {
        event,
        properties: properties || {},
        userId: dbUserId,
        organizationId: finalOrgId,
        userAgent: userAgent || req.headers.get('user-agent') || undefined,
        url: url || undefined,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Silently fail - analytics should never break the app
    console.error('Analytics tracking error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
