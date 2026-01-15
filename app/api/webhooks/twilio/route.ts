import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@/lib/prisma'

/**
 * Twilio Webhook Handler for WhatsApp Message Status Updates
 * 
 * This endpoint receives status callbacks from Twilio when WhatsApp messages
 * are sent, delivered, read, or fail.
 * 
 * Webhook URL: https://yourdomain.com/api/webhooks/twilio
 * 
 * Status values:
 * - queued: Message is queued for delivery
 * - sent: Message was sent to WhatsApp
 * - delivered: Message was delivered to recipient
 * - read: Message was read by recipient
 * - failed: Message failed to send
 * - undelivered: Message could not be delivered
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    
    // Twilio sends form data, not JSON
    const messageSid = body.get('MessageSid') as string
    const messageStatus = body.get('MessageStatus') as string
    const to = body.get('To') as string
    const from = body.get('From') as string
    const errorCode = body.get('ErrorCode') as string | null
    const errorMessage = body.get('ErrorMessage') as string | null

    console.log('📱 Twilio WhatsApp Status Callback:', {
      messageSid,
      messageStatus,
      to,
      from,
      errorCode,
      errorMessage,
    })

    // Validate required fields
    if (!messageSid || !messageStatus) {
      console.warn('Missing required fields in Twilio webhook')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Log the status update
    // Note: In a production app, you might want to store message status in the database
    // For now, we'll just log it. You can extend this to:
    // 1. Store message SID when sending (in a new MessageLog table)
    // 2. Update message status in the database here
    // 3. Track delivery rates per organization

    switch (messageStatus) {
      case 'queued':
        console.log(`✅ Message ${messageSid} queued for delivery to ${to}`)
        break
      case 'sent':
        console.log(`✅ Message ${messageSid} sent to ${to}`)
        break
      case 'delivered':
        console.log(`✅ Message ${messageSid} delivered to ${to}`)
        break
      case 'read':
        console.log(`✅ Message ${messageSid} read by ${to}`)
        break
      case 'failed':
      case 'undelivered':
        console.error(`❌ Message ${messageSid} failed:`, {
          status: messageStatus,
          errorCode,
          errorMessage,
          to,
        })
        break
      default:
        console.log(`ℹ️ Message ${messageSid} status: ${messageStatus}`)
    }

    // Return TwiML response (Twilio expects a response)
    // For status callbacks, we just need to return 200 OK
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Error processing Twilio webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET handler for webhook verification (if needed)
 * Some webhook providers require GET for verification
 */
export async function GET(request: NextRequest) {
  // Twilio doesn't require GET verification, but we'll handle it gracefully
  return NextResponse.json({ message: 'Twilio webhook endpoint is active' }, { status: 200 })
}
