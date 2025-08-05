'use client'

import { useState } from 'react'
import { formatBirthdateForInput } from '@/lib/utils'

interface BirthdateNotificationProps {
  onBirthdateUpdated: () => void
}

export default function BirthdateNotification({ onBirthdateUpdated }: BirthdateNotificationProps) {
  const [birthdate, setBirthdate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const updateBirthdate = async () => {
    if (!birthdate) {
      setError('Please select your birthdate')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/user/update-birthdate', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ birthdate: new Date(birthdate).toISOString() })
      })

      if (response.ok) {
        onBirthdateUpdated()
        setDismissed(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update birthdate')
      }
    } catch (error) {
      setError('An error occurred while updating your birthdate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 text-blue-400">🎂</div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Please Update Your Birthdate
          </h3>
          <div className="mt-2 text-sm text-blue-700">
            <p>We've updated our system to use birthdates instead of ages. This ensures your age is always accurate and updates automatically each year.</p>
          </div>
          <div className="mt-4 flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label htmlFor="birthdate-update" className="text-sm font-medium text-blue-800">
                Your Birthdate:
              </label>
              <input
                id="birthdate-update"
                type="date"
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-1 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                disabled={loading}
              />
            </div>
            <button
              onClick={updateBirthdate}
              disabled={loading || !birthdate}
              className="px-4 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1 text-blue-600 text-sm hover:text-blue-800"
            >
              Dismiss
            </button>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
