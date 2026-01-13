import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { prisma } from '@/lib/prisma'

// Disable body parsing - we need raw body for Svix verification
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Get webhook secret - don't throw error at module level (causes 502)
// We'll check it in the handler instead
const getWebhookSecret = () => {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    console.error('❌ CLERK_WEBHOOK_SECRET is not set in environment variables')
    return null
  }
  return secret
}

// GET handler for testing webhook endpoint accessibility
export async function GET(req: NextRequest) {
  console.log('='.repeat(80))
  console.log('🧪 WEBHOOK TEST - GET REQUEST')
  console.log('='.repeat(80))
  console.log('📍 URL:', req.url)
  console.log('📍 Method:', req.method)
  console.log('✅ Webhook endpoint is accessible')
  
  const webhookSecret = getWebhookSecret()
  const envCheck = {
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
    DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
  }
  
  return NextResponse.json({
    status: 'ok',
    message: 'Clerk webhook endpoint is accessible',
    webhookSecretConfigured: !!webhookSecret,
    webhookSecretLength: webhookSecret?.length || 0,
    environment: envCheck,
    timestamp: new Date().toISOString(),
    path: '/api/webhooks/clerk',
    instructions: {
      step1: 'Go to Clerk Dashboard → Webhooks',
      step2: 'Add endpoint: https://illicit-everleigh-snottily.ngrok-free.dev/api/webhooks/clerk',
      step3: 'Select events: organization.created, organization.updated, organization.deleted',
      step4: 'Copy signing secret to CLERK_WEBHOOK_SECRET in .env',
      step5: 'Create an organization in Clerk (not just sign up)',
      step6: 'Watch ngrok terminal for POST requests',
    },
  })
}

export async function POST(req: NextRequest) {
  const timestamp = new Date().toISOString()
  console.log('='.repeat(80))
  console.log('🔔 WEBHOOK REQUEST RECEIVED')
  console.log('='.repeat(80))
  console.log('📍 Timestamp:', timestamp)
  console.log('📍 URL:', req.url)
  console.log('📍 Method:', req.method)
  console.log('📍 Headers present:', {
    'content-type': req.headers.get('content-type'),
    'user-agent': req.headers.get('user-agent'),
  })
  
  // Check webhook secret
  const webhookSecret = getWebhookSecret()
  if (!webhookSecret) {
    console.error('❌ Webhook secret not configured')
    console.error('❌ CLERK_WEBHOOK_SECRET env var:', process.env.CLERK_WEBHOOK_SECRET ? 'SET (but empty?)' : 'NOT SET')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }
  console.log('✅ Webhook secret found (length:', webhookSecret.length, ')')
  
  // Get the Svix headers for verification
  const svix_id = req.headers.get('svix-id')
  const svix_timestamp = req.headers.get('svix-timestamp')
  const svix_signature = req.headers.get('svix-signature')

  console.log('📋 Headers:', {
    hasSvixId: !!svix_id,
    hasSvixTimestamp: !!svix_timestamp,
    hasSvixSignature: !!svix_signature,
  })

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('❌ Missing Svix headers')
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    })
  }

  // Get the RAW body as text - CRITICAL for Svix verification
  // We must use .text() not .json() because Svix needs the raw string
  console.log('📥 Reading request body...')
  const body = await req.text()
  console.log('📥 Body length:', body.length, 'bytes')
  console.log('📥 Body preview (first 200 chars):', body.substring(0, 200))
  
  // Parse the body for processing
  let payload: any
  try {
    payload = JSON.parse(body)
    console.log('✅ Body parsed successfully')
  } catch (err) {
    console.error('❌ Invalid JSON in webhook body')
    console.error('❌ Parse error:', err)
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(webhookSecret!)

  let evt: any

  // Verify the payload with the headers
  console.log('🔐 Verifying webhook signature...')
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any
    console.log('✅ Webhook signature verified successfully')
  } catch (err: any) {
    console.error('❌ Error verifying webhook signature')
    console.error('❌ Error message:', err.message)
    console.error('❌ Error stack:', err.stack)
    console.error('❌ Headers used:', {
      'svix-id': svix_id?.substring(0, 20) + '...',
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature?.substring(0, 20) + '...',
    })
    return NextResponse.json(
      { error: 'Webhook verification failed', message: err.message },
      { status: 400 }
    )
  }

  // Handle the webhook
  const eventType = evt.type
  console.log('📦 Event type:', eventType)
  console.log('📦 Event data:', JSON.stringify(evt.data, null, 2))

  try {
    switch (eventType) {
      case 'user.created': {
        const { id, email_addresses, first_name, last_name } = evt.data
        const email = email_addresses?.[0]?.email_address
        const name = [first_name, last_name].filter(Boolean).join(' ') || null

        console.log('✅ Processing user.created:', { id, email, name })

        // Create user in database if not exists
        const user = await prisma.user.upsert({
          where: { clerkId: id },
          update: {
            email: email || '',
            name: name || undefined,
          },
          create: {
            clerkId: id,
            email: email || '',
            name: name || undefined,
          },
        })
        console.log('✅ User created/updated in DB:', user.id)

        break
      }

      case 'user.updated': {
        const { id, email_addresses, first_name, last_name } = evt.data
        const email = email_addresses?.[0]?.email_address
        const name = [first_name, last_name].filter(Boolean).join(' ') || null

        // Update user in database
        await prisma.user.updateMany({
          where: { clerkId: id },
          data: {
            email: email || undefined,
            name: name || undefined,
          },
        })

        break
      }

      case 'organization.created': {
        const { id, name, slug, image_url, created_by } = evt.data
        console.log('✅ Processing organization.created:', { id, name, slug, created_by })

        // Generate slug if not provided
        const orgSlug = slug || name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `org-${id.slice(0, 8)}`

        // Create organization in database
        const org = await prisma.organization.upsert({
          where: { clerkOrgId: id },
          update: {
            name: name || slug || 'My Organization',
            slug: orgSlug,
            logo: image_url || null,
          },
          create: {
            clerkOrgId: id,
            name: name || slug || 'My Organization',
            slug: orgSlug,
            logo: image_url || null,
          },
        })
        console.log('✅ Organization created/updated in DB:', org.id)

        // If created_by is provided, create membership
        if (created_by) {
          const user = await prisma.user.findUnique({
            where: { clerkId: created_by },
          })

          if (user) {
            // Create membership with admin role
            const membership = await prisma.membership.upsert({
              where: {
                userId_organizationId: {
                  userId: user.id,
                  organizationId: org.id,
                },
              },
              update: {},
              create: {
                userId: user.id,
                organizationId: org.id,
                role: 'admin',
              },
            })
            console.log('✅ Membership created:', membership.id)
          } else {
            console.warn('⚠️ User not found for created_by:', created_by)
          }
        }

        // Create free subscription if it doesn't exist
        const subscription = await prisma.subscription.upsert({
          where: { organizationId: org.id },
          update: {},
          create: {
            organizationId: org.id,
            plan: 'free',
            status: 'active',
          },
        })
        console.log('✅ Subscription created:', subscription.id)

        // Initialize usage for current month
        const now = new Date()
        const usage = await prisma.usage.upsert({
          where: {
            organizationId_month_year: {
              organizationId: org.id,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
            },
          },
          update: {},
          create: {
            organizationId: org.id,
            month: now.getMonth() + 1,
            year: now.getFullYear(),
          },
        })
        console.log('✅ Usage initialized:', usage.id)

        break
      }

      case 'organization.updated': {
        const { id, name, slug, image_url } = evt.data

        // Update organization in database
        await prisma.organization.updateMany({
          where: { clerkOrgId: id },
          data: {
            name: name || slug || undefined,
            slug: slug || undefined,
            logo: image_url || undefined,
          },
        })

        break
      }

      case 'organization.deleted': {
        const { id } = evt.data

        // Delete organization (cascade will handle related records)
        await prisma.organization.deleteMany({
          where: { clerkOrgId: id },
        })

        break
      }

      case 'organizationMembership.created': {
        const { id, organization_id, public_user_data } = evt.data
        const clerkUserId = public_user_data?.user_id

        console.log('✅ Processing organizationMembership.created:', { id, organization_id, clerkUserId })

        if (clerkUserId && organization_id) {
          // Find user and organization
          const user = await prisma.user.findUnique({
            where: { clerkId: clerkUserId },
          })

          const organization = await prisma.organization.findUnique({
            where: { clerkOrgId: organization_id },
          })

          if (user && organization) {
            // Create membership
            const membership = await prisma.membership.upsert({
              where: {
                userId_organizationId: {
                  userId: user.id,
                  organizationId: organization.id,
                },
              },
              update: {},
              create: {
                userId: user.id,
                organizationId: organization.id,
                role: 'admin', // Default to admin for now
              },
            })
            console.log('✅ Membership created:', membership.id)
          } else {
            console.warn('⚠️ User or organization not found:', { user: !!user, organization: !!organization })
          }
        }

        break
      }

      case 'organizationMembership.updated':
      case 'organizationMembership.deleted': {
        // These events can be used for future features like role-based access
        // For now, we just log them
        console.log(`Organization membership ${eventType}:`, evt.data)
        break
      }

      default:
        console.log(`Unhandled webhook event type: ${eventType}`)
    }

    console.log('✅ Webhook processed successfully')
    return NextResponse.json({ received: true, eventType })
  } catch (error) {
    console.error('❌ Error processing webhook:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Webhook handler failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
