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
  const [activeTab, setActiveTab] = useState('guide')
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
          <div className="text-xs text-gray-500">Current tab: {activeTab}</div>
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
            onClick={() => setActiveTab('guide')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'guide'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            📖 User Guide
          </button>
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

          {/* User Guide Tab - Comprehensive documentation for all features */}
          {activeTab === 'guide' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">📖 Family Chore Calendar User Guide</h3>
                <p className="text-gray-600 mb-6">
                  Welcome to your family's chore management system! This guide will help you understand all the features available.
                </p>
              </div>

              {/* Home Section */}
              <div className="border-l-4 border-blue-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">🏠 Home Dashboard</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Overview:</strong> Your main dashboard showing family activity and quick stats.</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Family Info:</strong> See your family name, member count, and invite code</li>
                    <li><strong>Your Stats:</strong> View your current points, admin status, and recent activity</li>
                    <li><strong>Quick Actions:</strong> Access settings, manage points (admins), and view notifications</li>
                    <li><strong>Recent Activity:</strong> See what family members have been doing</li>
                  </ul>
                </div>
              </div>

              {/* Calendar Section */}
              <div className="border-l-4 border-green-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">📅 Calendar</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Overview:</strong> View and manage daily chore assignments.</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Daily View:</strong> See all chores assigned for each day</li>
                    <li><strong>Complete Chores:</strong> Check off completed chores to earn points</li>
                    <li><strong>Color Coding:</strong> Different colors show chore status and difficulty</li>
                    <li><strong>Navigation:</strong> Use arrows to browse different weeks</li>
                    <li><strong>Chore Details:</strong> Click on chores to see descriptions and point values</li>
                  </ul>
                </div>
              </div>

              {/* Points Section */}
              <div className="border-l-4 border-yellow-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">⭐ Points System</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Overview:</strong> Track and manage family points earned from chores.</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Earn Points:</strong> Complete chores to earn points based on difficulty</li>
                    <li><strong>Leaderboard:</strong> See who's earning the most points each week</li>
                    <li><strong>Point History:</strong> View your point earning history over time</li>
                    <li><strong>Weekly Goals:</strong> Work towards family point goals</li>
                    <li><strong>Admin Controls:</strong> Admins can manually adjust points if needed</li>
                  </ul>
                </div>
              </div>

              {/* Streaks Section */}
              <div className="border-l-4 border-red-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">🔥 Streaks</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Overview:</strong> Build habits with multi-day streak challenges.</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Create Streaks (Admins/Owners):</strong> Set up habit-building challenges for family members</li>
                    <li><strong>Daily Tasks:</strong> Complete required tasks each day to maintain your streak</li>
                    <li><strong>Task Options:</strong> Choose between different ways to complete tasks (e.g., "Run 1 mile" OR "Bike 2 miles")</li>
                    <li><strong>Required vs Optional:</strong> Some tasks are required (streak fails if missed), others are optional</li>
                    <li><strong>Progress Tracking:</strong> See your current day and overall progress</li>
                    <li><strong>Rewards:</strong> Earn bonus points when you complete a full streak</li>
                    <li><strong>Admin Override:</strong> Admins can uncheck tasks if they weren't properly completed</li>
                  </ul>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Example:</strong> A 7-day "Morning Routine" streak might include: Wake up at 7 AM (required), 
                      Exercise for 30 minutes (required, with options like running or biking), and Read for 15 minutes (optional).
                    </p>
                  </div>
                </div>
              </div>

              {/* Rewards Section */}
              <div className="border-l-4 border-purple-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">🎁 Rewards Store</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Overview:</strong> Spend your earned points on family rewards.</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Browse Rewards:</strong> See all available rewards and their point costs</li>
                    <li><strong>Claim Rewards:</strong> Spend your points to claim rewards you want</li>
                    <li><strong>Approval Process:</strong> Admins review and approve reward claims</li>
                    <li><strong>Categories:</strong> Rewards are organized by type (treats, activities, privileges, etc.)</li>
                    <li><strong>Custom Rewards:</strong> Admins can create family-specific rewards</li>
                    <li><strong>Claim History:</strong> Track your past reward claims and their status</li>
                  </ul>
                </div>
              </div>

              {/* Family Section */}
              <div className="border-l-4 border-indigo-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">👥 Family Management</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Overview:</strong> Manage your family members and settings.</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Family Members:</strong> See all family members, their roles, and points</li>
                    <li><strong>Invite Code:</strong> Share your family's invite code to add new members</li>
                    <li><strong>Join Family:</strong> Use an invite code to join an existing family</li>
                    <li><strong>Member Roles:</strong> Understand Owner, Admin, and Member permissions</li>
                    <li><strong>Profile Management:</strong> Update your nickname, birthdate, and other info</li>
                  </ul>
                </div>
              </div>

              {/* Admin Section */}
              <div className="border-l-4 border-gray-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">🛠️ Admin Panel (Admins Only)</h4>
                <div className="space-y-2 text-gray-700">
                  <p><strong>Overview:</strong> Advanced management tools for family admins.</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li><strong>Chore Management:</strong> Create, edit, and delete family chores</li>
                    <li><strong>Assignment Control:</strong> Manually assign chores to specific family members</li>
                    <li><strong>Auto-Assignment:</strong> Set up automatic chore distribution</li>
                    <li><strong>Member Management:</strong> Promote members to admin, manage permissions</li>
                    <li><strong>Reward Creation:</strong> Create custom rewards for your family</li>
                    <li><strong>Points Management:</strong> Manually adjust member points when needed</li>
                    <li><strong>Weekly Goals:</strong> Set family-wide point goals</li>
                    <li><strong>Activity Monitoring:</strong> View detailed family activity logs</li>
                  </ul>
                </div>
              </div>

              {/* User Roles Section */}
              <div className="border-l-4 border-orange-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">👑 User Roles & Permissions</h4>
                <div className="space-y-3 text-gray-700">
                  <div>
                    <p><strong>👑 Family Owner:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li>Full access to all features</li>
                      <li>Can create and manage streaks</li>
                      <li>Can manage family settings</li>
                      <li>Can promote/demote admins</li>
                      <li>Access to admin panel</li>
                    </ul>
                  </div>
                  <div>
                    <p><strong>🛠️ Family Admin:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li>Can create and manage streaks</li>
                      <li>Can manage chores and assignments</li>
                      <li>Can approve reward claims</li>
                      <li>Can adjust member points</li>
                      <li>Access to admin panel</li>
                    </ul>
                  </div>
                  <div>
                    <p><strong>👤 Family Member:</strong></p>
                    <ul className="list-disc list-inside ml-4 space-y-1 text-sm">
                      <li>Can complete assigned chores</li>
                      <li>Can participate in streaks</li>
                      <li>Can claim rewards</li>
                      <li>Can view family activity</li>
                      <li>Can update own profile</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tips Section */}
              <div className="border-l-4 border-teal-500 pl-4">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">💡 Tips for Success</h4>
                <div className="space-y-2 text-gray-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li><strong>Set Realistic Goals:</strong> Start with achievable chores and streak targets</li>
                    <li><strong>Celebrate Progress:</strong> Use the points system to recognize good work</li>
                    <li><strong>Family Meetings:</strong> Discuss chore assignments and adjust as needed</li>
                    <li><strong>Consistent Rewards:</strong> Make sure reward claims are processed promptly</li>
                    <li><strong>Age-Appropriate Tasks:</strong> Assign chores suitable for each family member's age</li>
                    <li><strong>Regular Check-ins:</strong> Review the calendar together weekly</li>
                    <li><strong>Positive Reinforcement:</strong> Focus on achievements rather than missed tasks</li>
                  </ul>
                </div>
              </div>

              {/* Getting Started */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
                <h4 className="text-xl font-semibold text-gray-900 mb-3">🚀 Getting Started Checklist</h4>
                <div className="space-y-2 text-gray-700">
                  <p className="mb-3">New to the family chore calendar? Follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-2">
                    <li><strong>Set up your profile:</strong> Add your nickname and birthdate in Settings</li>
                    <li><strong>Explore the calendar:</strong> See what chores are assigned to you</li>
                    <li><strong>Complete your first chore:</strong> Check it off to earn your first points</li>
                    <li><strong>Check out rewards:</strong> See what you can earn with your points</li>
                    <li><strong>Join a streak:</strong> Ask an admin to create a habit-building streak for you</li>
                    <li><strong>Stay engaged:</strong> Check the app daily to stay on top of your tasks</li>
                  </ol>
                </div>
              </div>

              {/* Support */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-600">
                  <strong>Need Help?</strong> Ask your family admin or owner if you have questions about any features!
                </p>
              </div>
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
