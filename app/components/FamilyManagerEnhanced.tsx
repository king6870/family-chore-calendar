'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { calculateAge, formatBirthdateForInput, getTimezoneFromLocation, formatTimezone, getCurrentTimeInTimezone } from '@/lib/utils'

interface User {
  id: string
  name: string
  nickname: string
  age: number
  birthdate?: string | null
  isAdmin: boolean
  isOwner: boolean
  totalPoints: number
  email: string
}

interface Chore {
  id: string
  name: string
  description: string | null
  points: number
  minAge: number
  difficulty: string
}

interface FamilyManagerEnhancedProps {
  currentUser: User
  family: { id: string; name: string; inviteCode: string } | null
  onFamilyCreated: () => void
  onRefresh: () => void
}

export default function FamilyManagerEnhanced({ 
  currentUser, 
  family, 
  onFamilyCreated, 
  onRefresh 
}: FamilyManagerEnhancedProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'chores' | 'create-join'>('overview')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Family creation/joining state
  const [mode, setMode] = useState<'choose' | 'create' | 'join'>('choose')
  const [familyName, setFamilyName] = useState('')
  const [nickname, setNickname] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [location, setLocation] = useState('')
  const [previewTimezone, setPreviewTimezone] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [joinNickname, setJoinNickname] = useState('')
  const [joinBirthdate, setJoinBirthdate] = useState('')

  // Members management state
  const [members, setMembers] = useState<User[]>([])

  // Chores management state
  const [chores, setChores] = useState<Chore[]>([])
  const [choreForm, setChoreForm] = useState({
    id: '',
    name: '',
    description: '',
    points: '',
    minAge: '',
    difficulty: 'Medium'
  })
  const [editingChore, setEditingChore] = useState<string | null>(null)

  useEffect(() => {
    if (family) {
      if (activeTab === 'members') {
        fetchMembers()
      } else if (activeTab === 'chores') {
        fetchChores()
      }
    }
  }, [activeTab, family])

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const fetchMembers = async () => {
    if (!currentUser.isAdmin) return
    
    try {
      const response = await fetch('/api/admin/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members)
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchChores = async () => {
    if (!currentUser.isAdmin) return
    
    try {
      const response = await fetch('/api/admin/chores')
      if (response.ok) {
        const data = await response.json()
        setChores(data.chores)
      }
    } catch (error) {
      console.error('Error fetching chores:', error)
    }
  }

  // Handle location change and timezone preview
  const handleLocationChange = (value: string) => {
    setLocation(value)
    if (value.trim()) {
      const timezone = getTimezoneFromLocation(value)
      setPreviewTimezone(timezone)
    } else {
      setPreviewTimezone('')
    }
  }

  // Family creation/joining functions
  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim() || !nickname.trim() || !birthdate || !location.trim()) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/family/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyName: familyName.trim(),
          nickname: nickname.trim(),
          birthdate: new Date(birthdate).toISOString(),
          location: location.trim(),
          timezone: getTimezoneFromLocation(location),
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
    if (!inviteCode.trim() || !joinNickname.trim() || !joinBirthdate) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/family/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          nickname: joinNickname.trim(),
          birthdate: new Date(joinBirthdate).toISOString(),
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

  // Member management functions
  const handleMemberAction = async (action: string, targetUserId: string, newOwnerId?: string) => {
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, targetUserId, newOwnerId })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Action completed successfully!')
        if (action === 'leave_family') {
          onRefresh()
        } else {
          fetchMembers()
        }
      } else {
        setError(data.error || 'Action failed')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteFamily = async () => {
    if (!confirm('Are you sure you want to delete this family? This action cannot be undone.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/family', {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Family deleted successfully!')
        setTimeout(() => onRefresh(), 1500)
      } else {
        setError(data.error || 'Failed to delete family')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // If no family, show create/join interface
  if (!family) {
    return (
      <>
        {/* User Profile Header */}
        <div className="bg-white shadow-sm mb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold" style={{ color: '#1f2937' }}>🏠 Family Setup</h1>
                <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  {currentUser.nickname} ({calculateAge(currentUser.birthdate)}y)
                  {currentUser.isOwner && <span className="ml-1 px-1 text-xs rounded" style={{ backgroundColor: '#dc2626', color: 'white' }}>OWNER</span>}
                  {currentUser.isAdmin && !currentUser.isOwner && <span className="ml-1 px-1 text-xs rounded" style={{ backgroundColor: '#3b82f6', color: 'white' }}>ADMIN</span>}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <img
                  src={session?.user?.image || ''}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span style={{ color: '#374151' }}>{session?.user?.name}</span>
                <button
                  onClick={() => signOut()}
                  className="px-3 py-1 rounded text-sm transition duration-200"
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                  onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#dc2626'}
                  onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#ef4444'}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6 text-center">👨‍👩‍👧‍👦 Family Management</h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}

        {mode === 'choose' && (
          <div className="text-center space-y-4">
            <p className="text-gray-600 mb-6">You're not part of a family yet. Would you like to create a new family or join an existing one?</p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setMode('create')}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🏠 Create New Family
              </button>
              <button
                onClick={() => setMode('join')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                👥 Join Existing Family
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => setMode('choose')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold">Create New Family</h3>
            </div>
            
            <form onSubmit={createFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Name
                </label>
                <input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="The Smith Family"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mom, Dad, S, L, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Birthdate
                </label>
                <input
                  type="date"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]} // Can't be in the future
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Location (City)
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., New York, Los Angeles, London"
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
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : '🏠 Create Family'}
              </button>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div>
            <div className="flex items-center mb-4">
              <button
                onClick={() => setMode('choose')}
                className="text-blue-600 hover:text-blue-800 mr-4"
              >
                ← Back
              </button>
              <h3 className="text-xl font-semibold">Join Existing Family</h3>
            </div>
            
            <form onSubmit={joinFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Family Invite Code
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ABC123"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Ask a family member for the 6-character invite code</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={joinNickname}
                  onChange={(e) => setJoinNickname(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mom, Dad, S, L, etc."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Birthdate
                </label>
                <input
                  type="date"
                  value={joinBirthdate}
                  onChange={(e) => setJoinBirthdate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  max={new Date().toISOString().split('T')[0]} // Can't be in the future
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Joining...' : '👥 Join Family'}
              </button>
            </form>
          </div>
        )}
        </div>
      </>
    )
  }
  // If family exists, show family management interface
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 sm:mb-0">👨‍👩‍👧‍👦 {family.name}</h2>
        <div className="text-sm text-gray-600">
          <p>Invite Code: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{family.inviteCode}</span></p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {success}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            📊 Overview
          </button>
          
          {currentUser.isAdmin && (
            <>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Members
              </button>
              
              <button
                onClick={() => setActiveTab('chores')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🧹 Chore Management
              </button>
            </>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">👤 Your Profile</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nickname:</span> {currentUser.nickname}</p>
                <p><span className="font-medium">Age:</span> {currentUser.age}</p>
                <p><span className="font-medium">Role:</span> {
                  currentUser.isOwner ? '👑 Owner' : 
                  currentUser.isAdmin ? '⭐ Admin' : 
                  '👤 Member'
                }</p>
                <p><span className="font-medium">Total Points:</span> {currentUser.totalPoints}</p>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">🏠 Family Info</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Family Name:</span> {family.name}</p>
                <p><span className="font-medium">Invite Code:</span> 
                  <span className="font-mono bg-white px-2 py-1 rounded ml-2">{family.inviteCode}</span>
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Share this code with family members to invite them!
                </p>
              </div>
            </div>
          </div>

          {currentUser.isAdmin && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚡ Admin Quick Actions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab('members')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                >
                  👥 Manage Members
                </button>
                <button
                  onClick={() => setActiveTab('chores')}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                >
                  🧹 Manage Chores
                </button>
              </div>
            </div>
          )}

          {currentUser.isOwner && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">⚠️ Owner Actions</h3>
              <p className="text-sm text-red-700 mb-3">
                These actions are permanent and cannot be undone.
              </p>
              <button
                onClick={handleDeleteFamily}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? 'Deleting...' : '🗑️ Delete Family'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && currentUser.isAdmin && (
        <MembersManagement 
          members={members}
          currentUser={currentUser}
          onMemberAction={handleMemberAction}
          loading={loading}
        />
      )}

      {activeTab === 'chores' && currentUser.isAdmin && (
        <ChoresManagement 
          chores={chores}
          choreForm={choreForm}
          setChoreForm={setChoreForm}
          editingChore={editingChore}
          setEditingChore={setEditingChore}
          onChoreSubmit={handleChoreSubmit}
          onChoreEdit={handleChoreEdit}
          onChoreDelete={handleChoreDelete}
          loading={loading}
        />
      )}
    </div>
  )

  // Chore management functions
  async function handleChoreSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const method = editingChore ? 'PUT' : 'POST'
      const url = editingChore ? `/api/admin/chores/${editingChore}` : '/api/admin/chores'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: choreForm.name,
          description: choreForm.description || null,
          points: parseInt(choreForm.points),
          minAge: parseInt(choreForm.minAge),
          difficulty: choreForm.difficulty
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingChore ? 'Chore updated successfully!' : 'Chore created successfully!')
        setChoreForm({
          id: '',
          name: '',
          description: '',
          points: '',
          minAge: '',
          difficulty: 'Medium'
        })
        setEditingChore(null)
        fetchChores()
      } else {
        setError(data.error || 'Failed to save chore')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  function handleChoreEdit(chore: Chore) {
    setChoreForm({
      id: chore.id,
      name: chore.name,
      description: chore.description || '',
      points: chore.points.toString(),
      minAge: chore.minAge.toString(),
      difficulty: chore.difficulty
    })
    setEditingChore(chore.id)
    
    // Scroll to top of page to show the edit form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleChoreDelete(choreId: string) {
    if (!confirm('Are you sure you want to delete this chore?')) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/admin/chores/${choreId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Chore deleted successfully!')
        fetchChores()
      } else {
        setError(data.error || 'Failed to delete chore')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }
}

// Members Management Component
function MembersManagement({ 
  members, 
  currentUser, 
  onMemberAction, 
  loading 
}: {
  members: User[]
  currentUser: User
  onMemberAction: (action: string, targetUserId: string, newOwnerId?: string) => void
  loading: boolean
}) {
  const [selectedNewOwner, setSelectedNewOwner] = useState('')

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold">👥 Family Members</h3>
      
      <div className="grid gap-4">
        {members.map((member) => (
          <div key={member.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <div className="mb-3 sm:mb-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold">{member.nickname}</h4>
                  {member.isOwner && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">👑 Owner</span>}
                  {member.isAdmin && !member.isOwner && <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">⭐ Admin</span>}
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Age: {member.age} | Points: {member.totalPoints}</p>
                  <p className="text-xs">{member.email}</p>
                </div>
              </div>
              
              {member.id !== currentUser.id && (
                <div className="flex flex-wrap gap-2">
                  {currentUser.isOwner && (
                    <>
                      <button
                        onClick={() => onMemberAction(member.isAdmin ? 'demote' : 'promote', member.id)}
                        disabled={loading}
                        className={`px-3 py-1 text-xs rounded ${
                          member.isAdmin 
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        } disabled:opacity-50`}
                      >
                        {member.isAdmin ? '⬇️ Demote' : '⬆️ Promote'}
                      </button>
                      
                      <button
                        onClick={() => onMemberAction('kick', member.id)}
                        disabled={loading}
                        className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                      >
                        🚫 Kick
                      </button>
                    </>
                  )}
                  
                  {currentUser.isAdmin && !member.isOwner && member.id !== currentUser.id && (
                    <button
                      onClick={() => onMemberAction('kick', member.id)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      🚫 Kick
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {currentUser.isOwner && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-3">👑 Transfer Ownership</h4>
          <p className="text-sm text-yellow-700 mb-3">
            Transfer family ownership to another member. You will become a regular admin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedNewOwner}
              onChange={(e) => setSelectedNewOwner(e.target.value)}
              className="px-3 py-2 border border-yellow-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
            >
              <option value="">Select new owner...</option>
              {members
                .filter(m => m.id !== currentUser.id && !m.isOwner)
                .map(member => (
                  <option key={member.id} value={member.id}>
                    {member.nickname} ({member.email})
                  </option>
                ))}
            </select>
            <button
              onClick={() => {
                if (selectedNewOwner && confirm('Are you sure you want to transfer ownership? This cannot be undone.')) {
                  onMemberAction('transfer_ownership', currentUser.id, selectedNewOwner)
                  setSelectedNewOwner('')
                }
              }}
              disabled={!selectedNewOwner || loading}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Transferring...' : '👑 Transfer'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Chores Management Component
function ChoresManagement({
  chores,
  choreForm,
  setChoreForm,
  editingChore,
  setEditingChore,
  onChoreSubmit,
  onChoreEdit,
  onChoreDelete,
  loading
}: {
  chores: Chore[]
  choreForm: any
  setChoreForm: (form: any) => void
  editingChore: string | null
  setEditingChore: (id: string | null) => void
  onChoreSubmit: (e: React.FormEvent) => void
  onChoreEdit: (chore: Chore) => void
  onChoreDelete: (choreId: string) => void
  loading: boolean
}) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'hard': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">🧹 Chore Management</h3>
        <button
          onClick={() => {
            setChoreForm({
              id: '',
              name: '',
              description: '',
              points: '',
              minAge: '',
              difficulty: 'Medium'
            })
            setEditingChore(null)
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
        >
          ➕ Add New Chore
        </button>
      </div>

      {/* Chore Form */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">
          {editingChore ? '✏️ Edit Chore' : '➕ Create New Chore'}
        </h4>
        
        <form onSubmit={onChoreSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chore Name *
            </label>
            <input
              type="text"
              value={choreForm.name}
              onChange={(e) => setChoreForm({...choreForm, name: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Make bed, Take out trash, etc."
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Points *
            </label>
            <input
              type="number"
              value={choreForm.points}
              onChange={(e) => setChoreForm({...choreForm, points: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="5-40"
              min="1"
              max="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Age *
            </label>
            <input
              type="number"
              value={choreForm.minAge}
              onChange={(e) => setChoreForm({...choreForm, minAge: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="3-18"
              min="1"
              max="100"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty *
            </label>
            <select
              value={choreForm.difficulty}
              onChange={(e) => setChoreForm({...choreForm, difficulty: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="Easy">Easy (5-10 pts)</option>
              <option value="Medium">Medium (15-20 pts)</option>
              <option value="Hard">Hard (25-40 pts)</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={choreForm.description}
              onChange={(e) => setChoreForm({...choreForm, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional details about this chore..."
              rows={2}
            />
          </div>
          
          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : editingChore ? '💾 Update Chore' : '➕ Create Chore'}
            </button>
            
            {editingChore && (
              <button
                type="button"
                onClick={() => {
                  setEditingChore(null)
                  setChoreForm({
                    id: '',
                    name: '',
                    description: '',
                    points: '',
                    minAge: '',
                    difficulty: 'Medium'
                  })
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Chores List */}
      <div className="space-y-3">
        <h4 className="font-semibold">📋 Current Chores ({chores.length})</h4>
        
        {chores.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No chores created yet.</p>
            <p className="text-sm">Create your first chore using the form above!</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {chores.map((chore) => (
              <div key={chore.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <div className="mb-3 sm:mb-0 flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="font-semibold">{chore.name}</h5>
                      <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(chore.difficulty)}`}>
                        {chore.difficulty}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Points: {chore.points} | Min Age: {chore.minAge}+</p>
                      {chore.description && (
                        <p className="text-xs italic">{chore.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => onChoreEdit(chore)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => onChoreDelete(chore.id)}
                      disabled={loading}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
