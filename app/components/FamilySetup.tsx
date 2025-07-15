'use client'

import { useState } from 'react'

interface FamilySetupProps {
  onComplete: () => void
}

export default function FamilySetup({ onComplete }: FamilySetupProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create family form
  const [familyName, setFamilyName] = useState('')
  const [nickname, setNickname] = useState('')
  const [age, setAge] = useState('')

  // Join family form
  const [inviteCode, setInviteCode] = useState('')
  const [joinNickname, setJoinNickname] = useState('')
  const [joinAge, setJoinAge] = useState('')

  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim() || !nickname.trim() || !age) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/family/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          familyName: familyName.trim(),
          nickname: nickname.trim(),
          age: parseInt(age),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onComplete()
      } else {
        setError(data.error || 'Failed to create family')
      }
    } catch (error) {
      setError('An error occurred while creating the family')
    } finally {
      setLoading(false)
    }
  }

  const joinFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim() || !joinNickname.trim() || !joinAge) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/family/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          nickname: joinNickname.trim(),
          age: parseInt(joinAge),
        }),
      })

      const data = await response.json()

      if (response.ok) {
        onComplete()
      } else {
        setError(data.error || 'Failed to join family')
      }
    } catch (error) {
      setError('An error occurred while joining the family')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏠 Family Setup</h1>
          <p className="text-gray-600">
            Create a new family or join an existing one to get started!
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {mode === 'choose' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('create')}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
            >
              Create New Family
            </button>
            <button
              onClick={() => setMode('join')}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
            >
              Join Existing Family
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={createFamily} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="The Smith Family"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="S, L, M, P, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use a short nickname like S, L, M, P for easy identification
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                {loading ? 'Creating...' : 'Create Family'}
              </button>
            </div>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={joinFamily} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Family Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="ABC123"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Ask your family admin for the invite code
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Nickname
              </label>
              <input
                type="text"
                value={joinNickname}
                onChange={(e) => setJoinNickname(e.target.value)}
                placeholder="S, L, M, P, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Age
              </label>
              <input
                type="number"
                value={joinAge}
                onChange={(e) => setJoinAge(e.target.value)}
                placeholder="25"
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMode('choose')}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                {loading ? 'Joining...' : 'Join Family'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
