import { SignIn } from '@clerk/nextjs'

export default function SignInPage({
  searchParams,
}: {
  searchParams: { redirect_url?: string }
}) {
  // Determine where to redirect after sign-in
  // If redirect_url is provided, use it; otherwise go to dashboard
  const redirectUrl = searchParams.redirect_url || '/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">EventOrg</h1>
          <p className="mt-2 text-gray-600">Event Management Made Simple</p>
        </div>
        <SignIn 
          fallbackRedirectUrl={redirectUrl}
        />
      </div>
    </div>
  )
}
