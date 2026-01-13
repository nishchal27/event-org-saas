import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900">EventOrg</h1>
          <p className="mt-2 text-gray-600">Event Management Made Simple</p>
        </div>
        <SignUp />
      </div>
    </div>
  )
}
