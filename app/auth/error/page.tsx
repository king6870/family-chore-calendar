'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
  Callback: 'Error in the OAuth callback. Please check your OAuth configuration.',
  OAuthSignin: 'Error constructing an authorization URL.',
  OAuthCallback: 'Error handling the response from the OAuth provider.',
  OAuthCreateAccount: 'Could not create OAuth account in the database.',
  EmailCreateAccount: 'Could not create email account in the database.',
  Signin: 'Error signing in.',
  OAuthAccountNotLinked: 'The OAuth account is not linked to any existing account.',
  EmailSignin: 'Check your email for a sign in link.',
  CredentialsSignin: 'Sign in failed. Check the details you provided are correct.',
  SessionRequired: 'Please sign in to access this page.',
}

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl')

  const errorMessage = error ? errorMessages[error] || errorMessages.Default : errorMessages.Default

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error: {error || 'Unknown'}
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{errorMessage}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Debug Information */}
          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium text-gray-800 mb-2">Debug Information:</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Error Code:</strong> {error || 'None'}</p>
              <p><strong>Callback URL:</strong> {callbackUrl || 'None'}</p>
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Link
              href="/api/auth/signin"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </Link>
            
            <Link
              href="/"
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
