'use client';

import { useState, useEffect } from 'react';

interface TimezoneSelectorProps {
  onTimezoneSelect: (location: string, timezone: string) => void;
  onSkip?: () => void;
}

// Common US timezones with their locations
const TIMEZONE_OPTIONS = [
  // Pacific Time
  { location: 'Seattle, Washington', timezone: 'America/Los_Angeles', display: 'Pacific Time (PST/PDT)' },
  { location: 'Los Angeles, California', timezone: 'America/Los_Angeles', display: 'Pacific Time (PST/PDT)' },
  { location: 'San Francisco, California', timezone: 'America/Los_Angeles', display: 'Pacific Time (PST/PDT)' },
  { location: 'Portland, Oregon', timezone: 'America/Los_Angeles', display: 'Pacific Time (PST/PDT)' },
  
  // Mountain Time
  { location: 'Denver, Colorado', timezone: 'America/Denver', display: 'Mountain Time (MST/MDT)' },
  { location: 'Phoenix, Arizona', timezone: 'America/Phoenix', display: 'Mountain Time (MST - No DST)' },
  { location: 'Salt Lake City, Utah', timezone: 'America/Denver', display: 'Mountain Time (MST/MDT)' },
  
  // Central Time
  { location: 'Chicago, Illinois', timezone: 'America/Chicago', display: 'Central Time (CST/CDT)' },
  { location: 'Dallas, Texas', timezone: 'America/Chicago', display: 'Central Time (CST/CDT)' },
  { location: 'Houston, Texas', timezone: 'America/Chicago', display: 'Central Time (CST/CDT)' },
  
  // Eastern Time
  { location: 'New York, New York', timezone: 'America/New_York', display: 'Eastern Time (EST/EDT)' },
  { location: 'Miami, Florida', timezone: 'America/New_York', display: 'Eastern Time (EST/EDT)' },
  { location: 'Atlanta, Georgia', timezone: 'America/New_York', display: 'Eastern Time (EST/EDT)' },
  
  // Other
  { location: 'Anchorage, Alaska', timezone: 'America/Anchorage', display: 'Alaska Time (AKST/AKDT)' },
  { location: 'Honolulu, Hawaii', timezone: 'Pacific/Honolulu', display: 'Hawaii Time (HST)' },
];

export default function TimezoneSelector({ onTimezoneSelect, onSkip }: TimezoneSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<typeof TIMEZONE_OPTIONS[0] | null>(null);
  const [customLocation, setCustomLocation] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [detectedTimezone, setDetectedTimezone] = useState<string | null>(null);

  useEffect(() => {
    // Try to detect user's timezone
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedTimezone(detected);
      
      // Try to find a matching option
      const match = TIMEZONE_OPTIONS.find(option => option.timezone === detected);
      if (match) {
        setSelectedOption(match);
      }
    } catch (error) {
      console.log('Could not detect timezone:', error);
    }
  }, []);

  const handleSubmit = () => {
    if (selectedOption) {
      onTimezoneSelect(selectedOption.location, selectedOption.timezone);
    } else if (showCustom && customLocation.trim()) {
      // Use detected timezone or default to Pacific
      const timezone = detectedTimezone || 'America/Los_Angeles';
      onTimezoneSelect(customLocation.trim(), timezone);
    }
  };

  const getCurrentTime = (timezone: string) => {
    try {
      return new Date().toLocaleTimeString('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid timezone';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🌍 Where are you located?</h2>
          <p className="text-gray-600">
            This helps us show you the correct times for chores and activities.
          </p>
          {detectedTimezone && (
            <p className="text-sm text-blue-600 mt-2">
              Detected timezone: {detectedTimezone}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {!showCustom ? (
            <>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {TIMEZONE_OPTIONS.map((option, index) => (
                  <label
                    key={index}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedOption?.timezone === option.timezone
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="timezone"
                      value={option.timezone}
                      checked={selectedOption?.timezone === option.timezone}
                      onChange={() => setSelectedOption(option)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{option.location}</div>
                      <div className="text-sm text-gray-600">{option.display}</div>
                      <div className="text-xs text-blue-600">
                        Current time: {getCurrentTime(option.timezone)}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={() => setShowCustom(true)}
                className="w-full text-blue-600 hover:text-blue-700 text-sm underline"
              >
                My location isn't listed
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter your location:
                </label>
                <input
                  type="text"
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                  placeholder="e.g., Toronto, Canada"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll use your browser's detected timezone: {detectedTimezone || 'Pacific Time'}
                </p>
              </div>

              <button
                onClick={() => setShowCustom(false)}
                className="text-blue-600 hover:text-blue-700 text-sm underline"
              >
                ← Back to list
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={!selectedOption && (!showCustom || !customLocation.trim())}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Continue
          </button>
          {onSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-700 transition-colors"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
