import { NextRequest, NextResponse } from 'next/server'

// Simple test endpoint to verify the route is accessible
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Clerk webhook endpoint is accessible',
    timestamp: new Date().toISOString(),
    path: '/api/webhooks/clerk',
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  return NextResponse.json({
    status: 'ok',
    message: 'Test POST received',
    bodyLength: body.length,
    headers: {
      'content-type': req.headers.get('content-type'),
      'svix-id': req.headers.get('svix-id'),
      'svix-timestamp': req.headers.get('svix-timestamp'),
      'svix-signature': req.headers.get('svix-signature'),
    },
    timestamp: new Date().toISOString(),
  })
}
