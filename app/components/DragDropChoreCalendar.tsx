'use client'

import { useState, useEffect } from 'react'

interface User {
  id: string
  nickname: string
  age: number
}

interface Chore {
  id: string
  name: string
  points: number
  difficulty: string
  minAge: number
}

interface ChoreAssignment {
  id: string
  userId: string
  choreId: string
  date: string
  dayOfWeek: string
  completed: boolean
  user: User
  chore: Chore
}

interface DragDropChoreCalendarProps {
  currentUser: User & { isAdmin: boolean }
}

export default function DragDropChoreCalendar({ currentUser }: DragDropChoreCalendarProps) {
  const [assignments, setAssignments] = useState<ChoreAssignment[]>([])
  const [availableChores, setAvailableChores] = useState<Chore[]>([])
  const [familyMembers, setFamilyMembers] = useState<User[]>([])
  const [currentWeek, setCurrentWeek] = useState<Date>(getStartOfWeek(new Date()))
  const [loading, setLoading] = useState(false)
  const [draggedChore, setDraggedChore] = useState<Chore | null>(null)
  const [draggedAssignment, setDraggedAssignment] = useState<ChoreAssignment | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  useEffect(() => {
    if (currentUser.isAdmin) {
      fetchData()
    }
  }, [currentWeek, currentUser.isAdmin])

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [message])

  function getStartOfWeek(date: Date): Date {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch assignments for current week
      const weekStart = currentWeek.toISOString().split('T')[0]
      const assignmentsRes = await fetch(`/api/assignments?weekStart=${weekStart}`)
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        setAssignments(assignmentsData.assignments || [])
      }

      // Fetch available chores
      const choresRes = await fetch('/api/admin/chores')
      if (choresRes.ok) {
        const choresData = await choresRes.json()
        setAvailableChores(choresData.chores || [])
      }

      // Fetch family members
      const membersRes = await fetch('/api/admin/members')
      if (membersRes.ok) {
        const membersData = await membersRes.json()
        setFamilyMembers(membersData.members || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setMessage({ type: 'error', text: 'Failed to load calendar data' })
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, item: Chore | ChoreAssignment, type: 'chore' | 'assignment') => {
    if (type === 'chore') {
      setDraggedChore(item as Chore)
      setDraggedAssignment(null)
    } else {
      setDraggedAssignment(item as ChoreAssignment)
      setDraggedChore(null)
    }
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, targetDay: string, targetUserId?: string) => {
    e.preventDefault()
    
    if (!draggedChore && !draggedAssignment) return

    const targetDate = new Date(currentWeek)
    const dayIndex = daysOfWeek.indexOf(targetDay)
    targetDate.setDate(currentWeek.getDate() + dayIndex)

    try {
      if (draggedChore && targetUserId) {
        // Creating new assignment
        const targetUser = familyMembers.find(m => m.id === targetUserId)
        if (!targetUser) return

        // Check age requirement
        if (draggedChore.minAge && targetUser.age < draggedChore.minAge) {
          setMessage({ 
            type: 'error', 
            text: `${targetUser.nickname} is too young for this chore (requires age ${draggedChore.minAge}+)` 
          })
          return
        }

        // Check if assignment already exists
        const existingAssignment = assignments.find(a => 
          a.userId === targetUserId && 
          a.choreId === draggedChore.id && 
          a.date === targetDate.toISOString().split('T')[0]
        )

        if (existingAssignment) {
          setMessage({ type: 'error', text: 'This chore is already assigned to this person on this day' })
          return
        }

        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: targetUserId,
            choreId: draggedChore.id,
            date: targetDate.toISOString().split('T')[0],
            dayOfWeek: targetDay
          })
        })

        if (response.ok) {
          setMessage({ type: 'success', text: 'Chore assigned successfully!' })
          fetchData()
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.error || 'Failed to assign chore' })
        }
      } else if (draggedAssignment && targetUserId) {
        // Moving existing assignment
        const targetUser = familyMembers.find(m => m.id === targetUserId)
        if (!targetUser) return

        // Check age requirement
        if (draggedAssignment.chore.minAge && targetUser.age < draggedAssignment.chore.minAge) {
          setMessage({ 
            type: 'error', 
            text: `${targetUser.nickname} is too young for this chore (requires age ${draggedAssignment.chore.minAge}+)` 
          })
          return
        }

        const response = await fetch(`/api/assignments/${draggedAssignment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: targetUserId,
            date: targetDate.toISOString().split('T')[0],
            dayOfWeek: targetDay
          })
        })

        if (response.ok) {
          setMessage({ type: 'success', text: 'Chore moved successfully!' })
          fetchData()
        } else {
          const error = await response.json()
          setMessage({ type: 'error', text: error.error || 'Failed to move chore' })
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    }

    setDraggedChore(null)
    setDraggedAssignment(null)
  }

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this chore assignment?')) return

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setMessage({ type: 'success', text: 'Chore assignment removed!' })
        fetchData()
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error || 'Failed to remove assignment' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' })
    }
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newWeek)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'hard': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAssignmentsForDay = (day: string, userId: string) => {
    const dayIndex = daysOfWeek.indexOf(day)
    const targetDate = new Date(currentWeek)
    targetDate.setDate(currentWeek.getDate() + dayIndex)
    const dateString = targetDate.toISOString().split('T')[0]

    return assignments.filter(a => 
      a.userId === userId && 
      a.date === dateString
    )
  }

  if (!currentUser.isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4">🔒 Admin Access Required</h2>
        <p className="text-gray-600">You need admin privileges to access the drag & drop chore calendar.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📅 Drag & Drop Chore Calendar</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateWeek('prev')}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            ← Previous Week
          </button>
          <span className="font-medium">
            {currentWeek.toLocaleDateString()} - {new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString()}
          </span>
          <button
            onClick={() => navigateWeek('next')}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
          >
            Next Week →
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded border ${
          message.type === 'success' 
            ? 'bg-green-100 border-green-400 text-green-700' 
            : 'bg-red-100 border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Available Chores Panel */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">🧹 Available Chores (Drag to Calendar)</h3>
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[80px]">
          {availableChores.map(chore => (
            <div
              key={chore.id}
              draggable
              onDragStart={(e) => handleDragStart(e, chore, 'chore')}
              className={`px-3 py-2 rounded-lg border-2 cursor-move hover:shadow-md transition-all ${getDifficultyColor(chore.difficulty)}`}
              title={`${chore.name} - ${chore.points} points - Min age: ${chore.minAge || 'Any'}`}
            >
              <div className="text-sm font-medium">{chore.name}</div>
              <div className="text-xs">{chore.points}pts • Age {chore.minAge || 'Any'}+</div>
            </div>
          ))}
          {availableChores.length === 0 && (
            <div className="text-gray-500 text-sm">No chores available. Create some chores first!</div>
          )}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row */}
          <div className="grid grid-cols-8 gap-2 mb-2">
            <div className="font-semibold text-center py-2">Family Member</div>
            {daysOfWeek.map(day => (
              <div key={day} className="font-semibold text-center py-2 bg-blue-50 rounded">
                {day}
              </div>
            ))}
          </div>

          {/* Member Rows */}
          {familyMembers.map(member => (
            <div key={member.id} className="grid grid-cols-8 gap-2 mb-2">
              {/* Member Name Column */}
              <div className="flex items-center justify-center py-4 bg-gray-50 rounded font-medium">
                <div className="text-center">
                  <div>{member.nickname}</div>
                  <div className="text-xs text-gray-600">Age {member.age}</div>
                </div>
              </div>

              {/* Day Columns */}
              {daysOfWeek.map(day => (
                <div
                  key={`${member.id}-${day}`}
                  className="min-h-[100px] p-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, day, member.id)}
                >
                  {getAssignmentsForDay(day, member.id).map(assignment => (
                    <div
                      key={assignment.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, assignment, 'assignment')}
                      className={`mb-2 p-2 rounded border cursor-move hover:shadow-md transition-all ${
                        assignment.completed 
                          ? 'bg-green-100 border-green-300 text-green-800' 
                          : getDifficultyColor(assignment.chore.difficulty)
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="text-xs font-medium">{assignment.chore.name}</div>
                          <div className="text-xs">{assignment.chore.points}pts</div>
                          {assignment.completed && (
                            <div className="text-xs text-green-600">✅ Complete</div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteAssignment(assignment.id)}
                          className="text-red-500 hover:text-red-700 text-xs ml-1"
                          title="Remove assignment"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}

          {familyMembers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No family members found.</p>
              <p className="text-sm">Add family members to start assigning chores!</p>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-center">Loading calendar...</p>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">📋 How to Use:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Assign Chores:</strong> Drag chores from the top panel to any day/person cell</li>
          <li>• <strong>Move Assignments:</strong> Drag existing assignments between days or people</li>
          <li>• <strong>Age Restrictions:</strong> System prevents assigning chores to members too young</li>
          <li>• <strong>Remove Assignments:</strong> Click the ✕ button on any assignment</li>
          <li>• <strong>Visual Feedback:</strong> Green = completed, colors indicate difficulty</li>
          <li>• <strong>Navigate Weeks:</strong> Use Previous/Next Week buttons to plan ahead</li>
        </ul>
      </div>
    </div>
  )
}
