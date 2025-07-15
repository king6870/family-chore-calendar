'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import FamilyManager from './components/FamilyManager'
import AdminPanel from './components/AdminPanel'
import PointsTracker from './components/PointsTracker'
import PointsDisplay from './components/PointsDisplay'
import ChoreCalendar from './components/ChoreCalendar'
import ChoreAuction from './components/ChoreAuction'

interface User {
  id: string
  name: string
  nickname: string
  age: number
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
}

export default function Home() {
  const { data: session, status } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [family, setFamily] = useState<Family | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    // Set a maximum loading time of 10 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('Loading timeout reached, setting loading to false')
      setLoading(false)
    }, 10000)

    if (session) {
      fetchUserData()
    } else if (status !== 'loading') {
      setLoading(false)
    }

    return () => clearTimeout(loadingTimeout)
  }, [session, status])

  const fetchUserData = async () => {
    try {
      console.log('Fetching user data...')
      const response = await fetch('/api/user')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('User data received:', userData)
        setUser(userData.user)
        setFamily(userData.family)
      } else {
        console.error('Failed to fetch user data:', response.status)
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  // Don't show loading screen - go straight to content
  if (!session && status !== 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#1f2937' }}>🏠 Chore Calendar</h1>
            <p style={{ color: '#6b7280' }}>
              Manage family chores, track points, and stay organized!
            </p>
          </div>
          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full font-medium py-3 px-4 rounded-lg transition duration-200"
            style={{ backgroundColor: '#3b82f6', color: 'white' }}
            onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3b82f6'}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
        <div style={{ color: '#1f2937' }}>Loading...</div>
      </div>
    )
  }

  // Show family setup if user doesn't have a family
  if (session && (!user || !user.familyId)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
        <FamilyManager onFamilyCreated={fetchUserData} />
      </div>
    )
  }

  if (session && user && family) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#f9fafb' }}>
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h1 className="text-2xl font-bold" style={{ color: '#1f2937' }}>🏠 {family.name}</h1>
                <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                  {user.nickname} ({user.age}y)
                  {user.isOwner && <span className="ml-1 px-1 text-xs rounded" style={{ backgroundColor: '#dc2626', color: 'white' }}>OWNER</span>}
                  {user.isAdmin && !user.isOwner && <span className="ml-1 px-1 text-xs rounded" style={{ backgroundColor: '#3b82f6', color: 'white' }}>ADMIN</span>}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <img
                  src={session.user?.image || ''}
                  alt="Profile"
                  className="w-8 h-8 rounded-full"
                />
                <span style={{ color: '#374151' }}>{session.user?.name}</span>
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

            {/* Navigation Tabs */}
            <nav className="mt-4">
              <div className="flex space-x-1">
                {[
                  { id: 'home', label: '🏠 Home', icon: '🏠' },
                  { id: 'calendar', label: '📅 Calendar', icon: '📅' },
                  { id: 'points', label: '⭐ Points', icon: '⭐' },
                  { id: 'auctions', label: '🏛️ Auctions', icon: '🏛️' },
                  { id: 'family', label: '👥 Family', icon: '👥' },
                  ...(user.isAdmin ? [{ id: 'admin', label: '🛠️ Admin', icon: '🛠️' }] : [])
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSection(tab.id)}
                    className="px-4 py-2 rounded-lg font-medium transition duration-200"
                    style={{
                      backgroundColor: activeSection === tab.id ? '#3b82f6' : 'transparent',
                      color: activeSection === tab.id ? 'white' : '#6b7280'
                    }}
                    onMouseOver={(e) => {
                      if (activeSection !== tab.id) {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#f3f4f6'
                      }
                    }}
                    onMouseOut={(e) => {
                      if (activeSection !== tab.id) {
                        (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'
                      }
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Home Section */}
          {activeSection === 'home' && (
            <>
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-2xl font-bold mb-4" style={{ color: '#1f2937' }}>Welcome to {family.name}!</h2>
                <p className="mb-4" style={{ color: '#6b7280' }}>
                  🎉 You're successfully part of the family! Invite code: <code style={{ backgroundColor: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{family.inviteCode}</code>
                </p>
                
                {/* Quick Points Overview */}
                <div className="mb-6">
                  <PointsDisplay compact={true} showWeekly={true} showRank={false} />
                </div>
                
                <div className="grid md:grid-cols-3 gap-6 mt-6">
                  <button
                    onClick={() => window.location.href = '/calendar'}
                    className="p-4 rounded-lg transition duration-200 text-left hover:shadow-md"
                    style={{ backgroundColor: '#dbeafe' }}
                  >
                    <h3 className="font-semibold mb-2" style={{ color: '#1e40af' }}>📅 Calendar View</h3>
                    <p className="text-sm" style={{ color: '#3730a3' }}>See your weekly chore assignments</p>
                  </button>
                  <button
                    onClick={() => setActiveSection('points')}
                    className="p-4 rounded-lg transition duration-200 text-left hover:shadow-md"
                    style={{ backgroundColor: '#dcfce7' }}
                  >
                    <h3 className="font-semibold mb-2" style={{ color: '#166534' }}>⭐ Points System</h3>
                    <p className="text-sm" style={{ color: '#15803d' }}>Earn points for completed chores</p>
                  </button>
                  <button
                    onClick={() => setActiveSection('family')}
                    className="p-4 rounded-lg transition duration-200 text-left hover:shadow-md"
                    style={{ backgroundColor: '#fae8ff' }}
                  >
                    <h3 className="font-semibold mb-2" style={{ color: '#7c2d92' }}>👥 Family Management</h3>
                    <p className="text-sm" style={{ color: '#86198f' }}>Manage family settings</p>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1f2937' }}>Chore System Features</h3>
                <div className="space-y-4">
                  <div className="border-l-4 pl-4" style={{ borderColor: '#10b981' }}>
                    <h4 className="font-medium" style={{ color: '#1f2937' }}>Easy Chores (5-10 points)</h4>
                    <p className="text-sm" style={{ color: '#6b7280' }}>Make bed, put toys away, feed pets</p>
                  </div>
                  <div className="border-l-4 pl-4" style={{ borderColor: '#f59e0b' }}>
                    <h4 className="font-medium" style={{ color: '#1f2937' }}>Medium Chores (15-20 points)</h4>
                    <p className="text-sm" style={{ color: '#6b7280' }}>Load dishwasher, vacuum, take out trash</p>
                  </div>
                  <div className="border-l-4 pl-4" style={{ borderColor: '#ef4444' }}>
                    <h4 className="font-medium" style={{ color: '#1f2937' }}>Hard Chores (25-40 points)</h4>
                    <p className="text-sm" style={{ color: '#6b7280' }}>Cook dinner, mow lawn, deep clean kitchen</p>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: '#f0fdf4' }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#166534' }}>✅ System Status</h4>
                  <ul className="text-sm space-y-1" style={{ color: '#15803d' }}>
                    <li>✓ Google Authentication: Working</li>
                    <li>✓ Database Integration: Working</li>
                    <li>✓ Family System: Working</li>
                    <li>✓ User Interface: Working</li>
                    <li>⏳ Full Chore Management: Ready to implement</li>
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Calendar Section */}
          {activeSection === 'calendar' && (
            <ChoreCalendar currentUser={user} />
          )}

          {/* Points Section */}
          {activeSection === 'points' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Points Overview */}
                <div className="lg:col-span-1">
                  <PointsDisplay 
                    showWeekly={true} 
                    showRank={true} 
                    compact={false} 
                  />
                </div>
                
                {/* Detailed Points Analytics */}
                <div className="lg:col-span-2">
                  <PointsTracker 
                    showAllMembers={user.isAdmin} 
                  />
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: '#1f2937' }}>Quick Actions</h3>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setActiveSection('calendar')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    📅 View Calendar
                  </button>
                  <button
                    onClick={() => window.location.href = '/calendar'}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    📅 Full Calendar
                  </button>
                  <button
                    onClick={() => window.location.href = '/points'}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    📊 Detailed Analytics
                  </button>
                  {user.isAdmin && (
                    <button
                      onClick={() => setActiveSection('admin')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      🛠️ Manage Points
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Auctions Section */}
          {activeSection === 'auctions' && (
            <ChoreAuction currentUser={{
              id: user.id,
              name: user.name,
              nickname: user.nickname,
              age: user.age,
              isAdmin: user.isAdmin,
              isOwner: user.isOwner,
              totalPoints: user.totalPoints,
              email: user.email
            }} />
          )}

          {/* Family Section */}
          {activeSection === 'family' && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#1f2937' }}>👥 Family Management</h2>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg" style={{ backgroundColor: '#f0fdf4' }}>
                  <h3 className="font-semibold mb-2" style={{ color: '#166534' }}>Family Information</h3>
                  <p className="text-sm mb-2" style={{ color: '#15803d' }}>
                    <strong>Family Name:</strong> {family.name}
                  </p>
                  <p className="text-sm mb-2" style={{ color: '#15803d' }}>
                    <strong>Invite Code:</strong> <code style={{ backgroundColor: '#dcfce7', padding: '2px 6px', borderRadius: '4px' }}>{family.inviteCode}</code>
                  </p>
                  <p className="text-sm" style={{ color: '#15803d' }}>
                    <strong>Your Role:</strong> {user.isAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2" style={{ color: '#1f2937' }}>Share Invite Code</h3>
                  <p className="text-sm mb-3" style={{ color: '#6b7280' }}>
                    Share this code with family members so they can join: <strong>{family.inviteCode}</strong>
                  </p>
                  <button 
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: '#3b82f6', color: 'white' }}
                    onClick={() => {
                      navigator.clipboard.writeText(family.inviteCode)
                      alert('Invite code copied to clipboard!')
                    }}
                  >
                    Copy Invite Code
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Admin Section */}
          {activeSection === 'admin' && user.isAdmin && (
            <AdminPanel 
              currentUser={{
                id: user.id,
                name: user.name,
                nickname: user.nickname,
                age: user.age,
                isAdmin: user.isAdmin,
                isOwner: user.isOwner,
                totalPoints: user.totalPoints,
                email: user.email
              }}
              onRefresh={fetchUserData}
            />
          )}
        </main>
      </div>
    )
  }

  // Minimal loading state
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
      <div style={{ color: '#1f2937' }}>Loading...</div>
    </div>
  )
}
