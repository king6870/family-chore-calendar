'use client'

import { useState, useEffect } from 'react'
import PointsManager from './PointsManager'
import ChoreAuction from './ChoreAuction'

interface User {
  id: string
  name: string
  nickname: string
  age: number
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
  isRecurring: boolean
}

interface AdminPanelProps {
  currentUser: User
  onRefresh: () => void
}

export default function AdminPanel({ currentUser, onRefresh }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('members')
  const [members, setMembers] = useState<User[]>([])
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Chore form state
  const [choreForm, setChoreForm] = useState({
    id: '',
    name: '',
    description: '',
    points: '',
    minAge: '',
    difficulty: 'Easy',
    isRecurring: false
  })
  const [editingChore, setEditingChore] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers()
    } else if (activeTab === 'chores') {
      fetchChores()
    }
  }, [activeTab])

  const fetchMembers = async () => {
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
          onRefresh() // Refresh parent component
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

  const handleChoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const method = editingChore ? 'PUT' : 'POST'
      const response = await fetch('/api/admin/chores', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...choreForm,
          points: parseInt(choreForm.points),
          minAge: parseInt(choreForm.minAge) || 0
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(editingChore ? 'Chore updated!' : 'Chore created!')
        setChoreForm({
          id: '', name: '', description: '', points: '', minAge: '', difficulty: 'Easy', isRecurring: false
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

  const handleDeleteChore = async (choreId: string) => {
    if (!confirm('Are you sure you want to delete this chore?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/chores?id=${choreId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSuccess('Chore deleted!')
        fetchChores()
      } else {
        setError('Failed to delete chore')
      }
    } catch (error) {
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const startEditChore = (chore: Chore) => {
    setChoreForm({
      id: chore.id,
      name: chore.name,
      description: chore.description || '',
      points: chore.points.toString(),
      minAge: chore.minAge.toString(),
      difficulty: chore.difficulty,
      isRecurring: chore.isRecurring
    })
    setEditingChore(chore.id)
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4" style={{ color: '#1f2937' }}>🔒 Access Denied</h2>
        <p style={{ color: '#6b7280' }}>You need admin privileges to access this panel.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#1f2937' }}>
          🛠️ Admin Panel {currentUser.isOwner && '(Owner)'}
        </h2>
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

      {/* Navigation Tabs */}
      <nav className="mb-6">
        <div className="flex space-x-1">
          {[
            { id: 'members', label: '👥 Members', icon: '👥' },
            { id: 'chores', label: '📋 Chores', icon: '📋' },
            { id: 'points', label: '🏆 Points Manager', icon: '🏆' },
            { id: 'auctions', label: '🏛️ Chore Auctions', icon: '🏛️' },
            ...(currentUser.isOwner ? [{ id: 'danger', label: '⚠️ Danger Zone', icon: '⚠️' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-lg font-medium transition duration-200"
              style={{
                backgroundColor: activeTab === tab.id ? '#dc2626' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#6b7280'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1f2937' }}>Family Members</h3>
          <div className="space-y-4">
            {members.map((member) => (
              <div key={member.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold" style={{ color: '#1f2937' }}>
                      {member.nickname} ({member.age}y)
                      {member.isOwner && <span className="ml-2 px-2 py-1 text-xs rounded" style={{ backgroundColor: '#dc2626', color: 'white' }}>OWNER</span>}
                      {member.isAdmin && !member.isOwner && <span className="ml-2 px-2 py-1 text-xs rounded" style={{ backgroundColor: '#3b82f6', color: 'white' }}>ADMIN</span>}
                    </h4>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      {member.name} • {member.totalPoints} points
                    </p>
                  </div>
                  
                  {member.id !== currentUser.id && (
                    <div className="flex space-x-2">
                      {currentUser.isOwner && (
                        <>
                          {!member.isAdmin && (
                            <button
                              onClick={() => handleMemberAction('promote_admin', member.id)}
                              disabled={loading}
                              className="px-3 py-1 text-sm rounded transition duration-200"
                              style={{ backgroundColor: '#10b981', color: 'white' }}
                            >
                              Make Admin
                            </button>
                          )}
                          
                          {member.isAdmin && !member.isOwner && (
                            <button
                              onClick={() => handleMemberAction('demote_admin', member.id)}
                              disabled={loading}
                              className="px-3 py-1 text-sm rounded transition duration-200"
                              style={{ backgroundColor: '#f59e0b', color: 'white' }}
                            >
                              Remove Admin
                            </button>
                          )}
                          
                          {!member.isOwner && (
                            <button
                              onClick={() => {
                                if (confirm(`Kick ${member.nickname} from family?`)) {
                                  handleMemberAction('kick_member', member.id)
                                }
                              }}
                              disabled={loading}
                              className="px-3 py-1 text-sm rounded transition duration-200"
                              style={{ backgroundColor: '#ef4444', color: 'white' }}
                            >
                              Kick
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Leave Family Button */}
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={() => {
                if (currentUser.isOwner) {
                  alert('As the family creator and owner, you cannot leave the family. You can only delete the family if you are the only member.')
                  return
                }
                if (confirm('Are you sure you want to leave this family?')) {
                  handleMemberAction('leave_family', currentUser.id)
                }
              }}
              disabled={loading}
              className="px-4 py-2 rounded-lg transition duration-200"
              style={{ backgroundColor: '#6b7280', color: 'white' }}
            >
              Leave Family
            </button>
          </div>
        </div>
      )}

      {/* Chores Tab */}
      {activeTab === 'chores' && (
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#1f2937' }}>Manage Chores</h3>
          
          {/* Chore Form */}
          <form onSubmit={handleChoreSubmit} className="mb-6 p-4 border rounded-lg">
            <h4 className="font-semibold mb-3" style={{ color: '#1f2937' }}>
              {editingChore ? 'Edit Chore' : 'Add New Chore'}
            </h4>
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Chore name"
                value={choreForm.name}
                onChange={(e) => setChoreForm({...choreForm, name: e.target.value})}
                className="px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="Points"
                value={choreForm.points}
                onChange={(e) => setChoreForm({...choreForm, points: e.target.value})}
                className="px-3 py-2 border rounded-lg"
                min="1"
                required
              />
              <input
                type="number"
                placeholder="Minimum age"
                value={choreForm.minAge}
                onChange={(e) => setChoreForm({...choreForm, minAge: e.target.value})}
                className="px-3 py-2 border rounded-lg"
                min="0"
              />
              <select
                value={choreForm.difficulty}
                onChange={(e) => setChoreForm({...choreForm, difficulty: e.target.value})}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <textarea
              placeholder="Description (optional)"
              value={choreForm.description}
              onChange={(e) => setChoreForm({...choreForm, description: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg mt-4"
              rows={2}
            />
            <div className="flex items-center mt-4">
              <input
                type="checkbox"
                id="isRecurring"
                checked={choreForm.isRecurring}
                onChange={(e) => setChoreForm({...choreForm, isRecurring: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="isRecurring" className="text-sm" style={{ color: '#374151' }}>
                Recurring chore
              </label>
            </div>
            <div className="flex space-x-2 mt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg transition duration-200"
                style={{ backgroundColor: '#3b82f6', color: 'white' }}
              >
                {editingChore ? 'Update' : 'Create'} Chore
              </button>
              {editingChore && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingChore(null)
                    setChoreForm({
                      id: '', name: '', description: '', points: '', minAge: '', difficulty: 'Easy', isRecurring: false
                    })
                  }}
                  className="px-4 py-2 rounded-lg transition duration-200"
                  style={{ backgroundColor: '#6b7280', color: 'white' }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Chores List */}
          <div className="space-y-3">
            {chores.map((chore) => (
              <div key={chore.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold" style={{ color: '#1f2937' }}>
                      {chore.name} ({chore.points} pts)
                      <span className="ml-2 px-2 py-1 text-xs rounded" style={{ 
                        backgroundColor: chore.difficulty === 'Easy' ? '#10b981' : chore.difficulty === 'Medium' ? '#f59e0b' : '#ef4444',
                        color: 'white'
                      }}>
                        {chore.difficulty}
                      </span>
                      {chore.isRecurring && (
                        <span className="ml-2 px-2 py-1 text-xs rounded" style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
                          Recurring
                        </span>
                      )}
                    </h4>
                    <p className="text-sm" style={{ color: '#6b7280' }}>
                      Min age: {chore.minAge}y
                      {chore.description && ` • ${chore.description}`}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => startEditChore(chore)}
                      className="px-3 py-1 text-sm rounded transition duration-200"
                      style={{ backgroundColor: '#3b82f6', color: 'white' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteChore(chore.id)}
                      className="px-3 py-1 text-sm rounded transition duration-200"
                      style={{ backgroundColor: '#ef4444', color: 'white' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points Manager Tab */}
      {activeTab === 'points' && (
        <div>
          <PointsManager />
        </div>
      )}

      {/* Chore Auctions Tab */}
      {activeTab === 'auctions' && (
        <div>
          <ChoreAuction currentUser={currentUser} />
        </div>
      )}

      {/* Danger Zone Tab (Owner Only) */}
      {activeTab === 'danger' && currentUser.isOwner && (
        <div>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#dc2626' }}>⚠️ Danger Zone</h3>
          <div className="border border-red-300 rounded-lg p-4" style={{ backgroundColor: '#fef2f2' }}>
            <h4 className="font-semibold mb-2" style={{ color: '#dc2626' }}>Delete Family</h4>
            <p className="text-sm mb-4" style={{ color: '#7f1d1d' }}>
              This will permanently delete the family and all associated data. 
              You can only do this if you're the only member left.
            </p>
            <button
              onClick={handleDeleteFamily}
              disabled={loading || members.length > 1}
              className="px-4 py-2 rounded-lg transition duration-200"
              style={{ 
                backgroundColor: members.length > 1 ? '#9ca3af' : '#dc2626', 
                color: 'white' 
              }}
            >
              {members.length > 1 ? 'Remove all members first' : 'Delete Family'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
