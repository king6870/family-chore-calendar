'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ChoreCalendar from '../components/ChoreCalendar';

interface User {
  id: string;
  name: string;
  nickname: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    fetchUserData();
  }, [session, status, router]);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Family Chore Calendar</h1>
              <p className="text-gray-600 mt-1">
                Manage and track your family's chore assignments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/points')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Points
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ChoreCalendar currentUser={user} />
      </div>

      {/* Quick Tips */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Calendar Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
            <div>
              <h4 className="font-medium mb-2">✓ Completing Chores</h4>
              <ul className="text-sm space-y-1">
                <li>• Click "Mark Complete" to finish a chore</li>
                <li>• Earn points automatically when completed</li>
                <li>• Admins can mark any family member's chores</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📅 Navigation</h4>
              <ul className="text-sm space-y-1">
                <li>• Use Previous/Next to browse weeks</li>
                <li>• Click "Today" to return to current week</li>
                <li>• Today's date is highlighted in blue</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🏷️ Color Coding</h4>
              <ul className="text-sm space-y-1">
                <li>• Green: Easy chores</li>
                <li>• Yellow: Medium difficulty</li>
                <li>• Red: Hard chores</li>
                <li>• Completed chores appear faded</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📱 Mobile Friendly</h4>
              <ul className="text-sm space-y-1">
                <li>• Optimized for phone and tablet use</li>
                <li>• Swipe-friendly date navigation</li>
                <li>• Large touch targets for easy interaction</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
