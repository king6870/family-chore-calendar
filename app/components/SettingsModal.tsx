'use client'

import { useState, useEffect } from 'react'
import { calculateAge, formatBirthdateForInput, getTimezoneFromLocation, formatTimezone, getCurrentTimeInTimezone } from '@/lib/utils'

interface User {
  id: string
  name: string
  nickname: string
  birthdate: string | null
  familyId: string
  isAdmin: boolean
  isOwner: boolean
  totalPoints: number
  email: string
}

interface Family {
  id: string
  name: string
  inviteCode: string
  location?: string
  timezone?: string
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  family: Family
  onUpdate: () => void
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  family, 
  onUpdate 
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Profile settings
  const [name, setName] = useState(currentUser.name || '')
  const [nickname, setNickname] = useState(currentUser.nickname || '')
  const [birthdate, setBirthdate] = useState(
    currentUser.birthdate ? formatBirthdateForInput(currentUser.birthdate) : ''
  )

  // Family settings
  const [familyName, setFamilyName] = useState(family.name || '')
  const [familyLocation, setFamilyLocation] = useState(family.location || '')
  const [previewTimezone, setPreviewTimezone] = useState(family.timezone || '')

  // Handle family location change
  const handleFamilyLocationChange = (value: string) => {
    setFamilyLocation(value)
    if (value.trim()) {
      const timezone = getTimezoneFromLocation(value)
      setPreviewTimezone(timezone)
    } else {
      setPreviewTimezone(family.timezone || '')
    }
  }

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setName(currentUser.name || '')
      setNickname(currentUser.nickname || '')
      setBirthdate(currentUser.birthdate ? formatBirthdateForInput(currentUser.birthdate) : '')
      setFamilyName(family.name || '')
      setFamilyLocation(family.location || '')
      setPreviewTimezone(family.timezone || '')
      setMessage(null)
    }
  }, [isOpen, currentUser, family])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  if (!isOpen) return null

  const updateProfile = async () => {
    if (!nickname.trim()) {
      setMessage({ type: 'error', text: 'Nickname is required' })
      return
    }

    if (!birthdate) {
      setMessage({ type: 'error', text: 'Birthdate is required' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/update-profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || null,
          nickname: nickname.trim(),
          birthdate: new Date(birthdate).toISOString()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        onUpdate()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating your profile' })
    } finally {
      setLoading(false)
    }
  }

  const updateFamily = async () => {
    if (!familyName.trim()) {
      setMessage({ type: 'error', text: 'Family name is required' })
      return
    }

    if (!familyLocation.trim()) {
      setMessage({ type: 'error', text: 'Family location is required' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/family/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: familyName.trim(),
          location: familyLocation.trim(),
          timezone: previewTimezone
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Family name updated successfully!' })
        onUpdate()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update family name' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while updating family name' })
    } finally {
      setLoading(false)
    }
  }

  const regenerateInviteCode = async () => {
    if (!confirm('Are you sure you want to generate a new invite code? The old code will no longer work.')) {
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch('/api/family/regenerate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'New invite code generated successfully!' })
        onUpdate()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate new invite code' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while generating new invite code' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">⚙️ Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 Profile
          </button>
          {currentUser.isOwner && (
            <button
              onClick={() => setActiveTab('family')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'family'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Family
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Messages */}
          {message && (
            <div className={`mb-4 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nickname *
                    </label>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="Enter your nickname"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Birthdate *
                    </label>
                    <input
                      type="date"
                      value={birthdate}
                      onChange={(e) => setBirthdate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                      required
                    />
                    {birthdate && (
                      <p className="mt-1 text-sm text-gray-500">
                        Current age: {calculateAge(birthdate)} years old
                      </p>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Account Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Email:</span> {currentUser.email}</p>
                      <p><span className="font-medium">Role:</span> {
                        currentUser.isOwner ? '👑 Owner' : 
                        currentUser.isAdmin ? '⭐ Admin' : 
                        '👤 Member'
                      }</p>
                      <p><span className="font-medium">Total Points:</span> {currentUser.totalPoints}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={updateProfile}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Family Tab */}
          {activeTab === 'family' && currentUser.isOwner && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Family Settings</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Family Name *
                    </label>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="Enter family name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Family Location *
                    </label>
                    <input
                      type="text"
                      value={familyLocation}
                      onChange={(e) => handleFamilyLocationChange(e.target.value)}
                      placeholder="e.g., New York, Los Angeles, London"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                      required
                    />
                    {previewTimezone && (
                      <div className="mt-2 p-2 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">Timezone:</span> {formatTimezone(previewTimezone)}
                        </p>
                        <p className="text-xs text-blue-700">
                          <span className="font-medium">Current Time:</span> {getCurrentTimeInTimezone(previewTimezone)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Invite Code</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-mono bg-white px-3 py-2 rounded border">
                          {family.inviteCode}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Share this code with family members to join
                        </p>
                      </div>
                      <button
                        onClick={regenerateInviteCode}
                        disabled={loading}
                        className="ml-4 px-3 py-2 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
                      >
                        🔄 New Code
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={updateFamily}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Updating...' : 'Update Family Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
