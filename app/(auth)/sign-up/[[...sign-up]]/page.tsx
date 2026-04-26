import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string }
}) {
  const redirectUrl = searchParams.redirect_url || '/create-organization'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">Lexnify</h1>
          <p className="mt-2 text-gray-600">Event Management Made Simple</p>
        </div>

        <SignUp fallbackRedirectUrl={redirectUrl} />

        <p className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-gray-700">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-gray-700">
            Privacy Policy
          </Link>.
        </p>

      </div>
    </div>
  )
}