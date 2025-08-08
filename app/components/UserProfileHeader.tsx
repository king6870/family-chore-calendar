'use client'

import { useSession, signOut } from 'next-auth/react'
import { calculateAge } from '@/lib/utils'

interface User {
  id: string
  name: string
  nickname: string
  birthdate?: string | null
  isAdmin: boolean
  isOwner: boolean
}

interface UserProfileHeaderProps {
  user: User
  title: string
  showSettings?: boolean
  onSettingsClick?: () => void
}

export default function UserProfileHeader({ 
  user, 
  title, 
  showSettings = false, 
  onSettingsClick 
}: UserProfileHeaderProps) {
  const { data: session } = useSession()

  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold" style={{ color: '#1f2937' }}>{title}</h1>
            <span className="text-sm px-2 py-1 rounded" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
              {user.nickname} ({calculateAge(user.birthdate)}y)
              {user.isOwner && <span className="ml-1 px-1 text-xs rounded" style={{ backgroundColor: '#dc2626', color: 'white' }}>OWNER</span>}
              {user.isAdmin && !user.isOwner && <span className="ml-1 px-1 text-xs rounded" style={{ backgroundColor: '#3b82f6', color: 'white' }}>ADMIN</span>}
            </span>
            {showSettings && (
              <button
                onClick={onSettingsClick}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Settings"
              >
                ⚙️
              </button>
            )}
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
  )
}
