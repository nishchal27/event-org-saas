import { SignUp } from '@clerk/nextjs'

export default function SignUpPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string }
}) {
  // After sign-up, redirect to create-organization (new users need to create org)
  // Or use the redirect_url if provided
  const redirectUrl = searchParams.redirect_url || '/create-organization'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">EventOrg</h1>
          <p className="mt-2 text-gray-600">Event Management Made Simple</p>
        </div>
        <SignUp 
          fallbackRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  )
}
