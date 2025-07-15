'use client'

import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'OAuthAccountNotLinked':
        return 'This email is already associated with another account. Please sign in with the original provider.'
      case 'EmailCreateAccount':
        return 'Could not create account with this email.'
      case 'Callback':
        return 'Authentication callback error.'
      case 'OAuthCallback':
        return 'OAuth provider error.'
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account.'
      case 'EmailSignin':
        return 'Email sign-in error.'
      case 'CredentialsSignin':
        return 'Invalid credentials.'
      case 'SessionRequired':
        return 'Please sign in to access this page.'
      default:
        return 'An authentication error occurred.'
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#dc2626' }}>🚫 Authentication Error</h1>
          <p style={{ color: '#6b7280' }}>
            {getErrorMessage(error)}
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={() => signIn('google')}
            className="w-full font-medium py-3 px-4 rounded-lg transition duration-200"
            style={{ backgroundColor: '#3b82f6', color: 'white' }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
          >
            Try Again with Google
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full font-medium py-3 px-4 rounded-lg transition duration-200"
            style={{ backgroundColor: '#6b7280', color: 'white' }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#4b5563'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#6b7280'}
          >
            Go Home
          </button>
        </div>

        {error === 'OAuthAccountNotLinked' && (
          <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
            <h3 className="font-semibold mb-2" style={{ color: '#92400e' }}>💡 Solution:</h3>
            <p className="text-sm" style={{ color: '#92400e' }}>
              Clear your browser cookies for this site and try signing in again, or use a different browser/incognito mode.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthError() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
