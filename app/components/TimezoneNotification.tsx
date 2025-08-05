'use client'

import { useState } from 'react'
import { getTimezoneFromLocation, formatTimezone, getCurrentTimeInTimezone } from '@/lib/utils'

interface TimezoneNotificationProps {
  onTimezoneUpdated: () => void
}

export default function TimezoneNotification({ onTimezoneUpdated }: TimezoneNotificationProps) {
  const [location, setLocation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [previewTimezone, setPreviewTimezone] = useState('')

  if (dismissed) return null

  const handleLocationChange = (value: string) => {
    setLocation(value)
    if (value.trim()) {
      const timezone = getTimezoneFromLocation(value)
      setPreviewTimezone(timezone)
    } else {
      setPreviewTimezone('')
    }
  }

  const updateTimezone = async () => {
    if (!location.trim()) {
      setError('Please enter your location')
      return
    }

    const timezone = getTimezoneFromLocation(location)
    
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/family/update-timezone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          location: location.trim(),
          timezone: timezone
        })
      })

      if (response.ok) {
        onTimezoneUpdated()
        setDismissed(true)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update timezone')
      }
    } catch (error) {
      setError('An error occurred while updating your timezone')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="w-5 h-5 text-orange-400">🌍</div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            Please Set Your Family's Location & Timezone
          </h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>We need your location to set the correct timezone for your family calendar. This ensures all chore schedules and deadlines are accurate for your local time.</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <label htmlFor="location-update" className="text-sm font-medium text-orange-800">
                  Your City:
                </label>
                <input
                  id="location-update"
                  type="text"
                  value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  placeholder="e.g., New York, Los Angeles, London"
                  className="px-3 py-1 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm min-w-[200px]"
                  disabled={loading}
                />
              </div>
              <button
                onClick={updateTimezone}
                disabled={loading || !location.trim()}
                className="px-4 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Set Timezone'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1 text-orange-600 text-sm hover:text-orange-800"
              >
                Dismiss
              </button>
            </div>
            
            {previewTimezone && (
              <div className="bg-orange-100 p-3 rounded-md">
                <div className="text-sm text-orange-800">
                  <p><span className="font-medium">Detected Timezone:</span> {formatTimezone(previewTimezone)}</p>
                  <p><span className="font-medium">Current Time:</span> {getCurrentTimeInTimezone(previewTimezone)}</p>
                </div>
              </div>
            )}
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
