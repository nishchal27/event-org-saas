import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/landing',
  '/guide(.*)',
  '/event(.*)',
  '/checkin(.*)',
  '/api/trpc(.*)',
  '/api/stripe/webhook',
  '/api/webhooks/clerk',
  '/api/webhooks/clerk/test',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/privacy',
  '/terms',
  '/monitoring', // Sentry tunnel route - must be public
])

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname
  const method = req.method

  const isDev = process.env.NODE_ENV === 'development'
  // Avoid noisy logs in production (perf + privacy)
  if (isDev) console.log(`[MIDDLEWARE] ${method} ${pathname}`)

  // Allow public routes to pass through WITHOUT auth check
  if (isPublicRoute(req)) {
    if (isDev) console.log(`[MIDDLEWARE] ✅ Public route, allowing: ${pathname}`)
    return NextResponse.next()
  }

  // For all other routes, check authentication
  if (isDev) console.log(`[MIDDLEWARE] 🔒 Protected route, checking auth: ${pathname}`)
  const { userId } = await auth()
  
  if (!userId) {
    if (isDev) console.log(`[MIDDLEWARE] ❌ Not authenticated, redirecting to sign-in`)
    const signInUrl = new URL('/sign-in', req.url)
    signInUrl.searchParams.set('redirect_url', req.url)
    return NextResponse.redirect(signInUrl)
  }

  if (isDev) console.log(`[MIDDLEWARE] ✅ Authenticated (userId: ${userId}), allowing: ${pathname}`)
  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)).*)',
  ],
}
