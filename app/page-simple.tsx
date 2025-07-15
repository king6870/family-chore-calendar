'use client'

import { useSession, signIn, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-800">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🏠 Chore Calendar</h1>
            <p className="text-gray-600">
              Manage family chores, track points, and stay organized!
            </p>
          </div>
          <button
            onClick={() => signIn('google')}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          >
            <span>Sign in with Google</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-800">🏠 Family Chore Calendar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <img
                src={session.user?.image || ''}
                alt="Profile"
                className="w-8 h-8 rounded-full"
              />
              <span className="text-gray-700">{session.user?.name}</span>
              <button
                onClick={() => signOut()}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition duration-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Your Chore Calendar!</h2>
          <p className="text-gray-600 mb-4">
            Authentication is working! The full chore system with database will be available once we resolve the setup issue.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">📅 Calendar View</h3>
              <p className="text-blue-600 text-sm">See your weekly chore assignments</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">⭐ Points System</h3>
              <p className="text-green-600 text-sm">Earn points for completed chores</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">👥 Family Groups</h3>
              <p className="text-purple-600 text-sm">Create or join family groups</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sample Chore System Features</h3>
          <div className="space-y-4">
            <div className="border-l-4 border-green-400 pl-4">
              <h4 className="font-medium text-gray-800">Easy Chores (5-10 points)</h4>
              <p className="text-gray-600 text-sm">Make bed, put toys away, feed pets</p>
            </div>
            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-medium text-gray-800">Medium Chores (15-20 points)</h4>
              <p className="text-gray-600 text-sm">Load dishwasher, vacuum, take out trash</p>
            </div>
            <div className="border-l-4 border-red-400 pl-4">
              <h4 className="font-medium text-gray-800">Hard Chores (25-40 points)</h4>
              <p className="text-gray-600 text-sm">Cook dinner, mow lawn, deep clean kitchen</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
