export default function ConfirmationPage() {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <h1 className="text-2xl font-bold">Check your email</h1>
      <div className="max-w-md text-center">
        <p className="mb-4">
          We&apos;ve sent you a magic link to your email address. Click the link in the email to sign in.
        </p>
        <p className="text-sm text-gray-500">
          If you don&apos;t see the email, check your spam folder. The link will expire after 24 hours.
        </p>
      </div>
    </div>
  )
} 