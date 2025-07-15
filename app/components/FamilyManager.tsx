'use client'

import { useState } from 'react'

interface FamilyManagerProps {
  onFamilyCreated: () => void
}

export default function FamilyManager({ onFamilyCreated }: FamilyManagerProps) {
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
    setSuccess('')

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
        setSuccess(`Family "${familyName}" created successfully! Invite code: ${data.inviteCode}`)
        setTimeout(() => {
          onFamilyCreated()
        }, 2000)
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
    setSuccess('')

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
        setSuccess('Successfully joined the family!')
        setTimeout(() => {
          onFamilyCreated()
        }, 2000)
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
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>Family Setup</h2>
        <p style={{ color: '#6b7280' }}>Create a new family or join an existing one</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}>
          {success}
        </div>
      )}

      {mode === 'choose' && (
        <div className="space-y-4">
          <button
            onClick={() => setMode('create')}
            className="w-full font-medium py-3 px-4 rounded-lg transition duration-200"
            style={{ backgroundColor: '#3b82f6', color: 'white' }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
          >
            Create New Family
          </button>
          <button
            onClick={() => setMode('join')}
            className="w-full font-medium py-3 px-4 rounded-lg transition duration-200"
            style={{ backgroundColor: '#10b981', color: 'white' }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#059669'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#10b981'}
          >
            Join Existing Family
          </button>
        </div>
      )}

      {mode === 'create' && (
        <form onSubmit={createFamily} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Family Name
            </label>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="The Smith Family"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db', color: '#1f2937' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="S, L, M, P, etc."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db', color: '#1f2937' }}
              required
            />
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              Use a short nickname like S, L, M, P for easy identification
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Your Age
            </label>
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="25"
              min="1"
              max="100"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db', color: '#1f2937' }}
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="flex-1 font-medium py-2 px-4 rounded-lg transition duration-200"
              style={{ backgroundColor: '#6b7280', color: 'white' }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 font-medium py-2 px-4 rounded-lg transition duration-200"
              style={{ 
                backgroundColor: loading ? '#9ca3af' : '#3b82f6', 
                color: 'white' 
              }}
            >
              {loading ? 'Creating...' : 'Create Family'}
            </button>
          </div>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={joinFamily} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Family Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="ABC123"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db', color: '#1f2937' }}
              required
            />
            <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
              Ask your family admin for the invite code
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Your Nickname
            </label>
            <input
              type="text"
              value={joinNickname}
              onChange={(e) => setJoinNickname(e.target.value)}
              placeholder="S, L, M, P, etc."
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db', color: '#1f2937' }}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: '#374151' }}>
              Your Age
            </label>
            <input
              type="number"
              value={joinAge}
              onChange={(e) => setJoinAge(e.target.value)}
              placeholder="25"
              min="1"
              max="100"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2"
              style={{ borderColor: '#d1d5db', color: '#1f2937' }}
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setMode('choose')}
              className="flex-1 font-medium py-2 px-4 rounded-lg transition duration-200"
              style={{ backgroundColor: '#6b7280', color: 'white' }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 font-medium py-2 px-4 rounded-lg transition duration-200"
              style={{ 
                backgroundColor: loading ? '#9ca3af' : '#10b981', 
                color: 'white' 
              }}
            >
              {loading ? 'Joining...' : 'Join Family'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
