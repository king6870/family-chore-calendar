'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PointsTracker from '../components/PointsTracker';
import PointsDisplay from '../components/PointsDisplay';

interface User {
  id: string;
  name: string;
  nickname: string;
  isAdmin: boolean;
  isOwner: boolean;
}

export default function PointsPage() {
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
              <h1 className="text-3xl font-bold text-gray-900">Points Tracking</h1>
              <p className="text-gray-600 mt-1">
                Track your progress and see how you're doing!
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Points Overview */}
          <div className="lg:col-span-1">
            <PointsDisplay 
              showWeekly={true} 
              showRank={true} 
              compact={false} 
            />
          </div>

          {/* Right Column - Detailed Analytics */}
          <div className="lg:col-span-2">
            <PointsTracker 
              showAllMembers={user.isAdmin} 
            />
          </div>
        </div>

        {/* Additional Insights Section */}
        <div className="mt-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Points Insights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Achievement Level</p>
                    <p className="text-2xl font-bold">
                      {user.isOwner ? 'Family Leader' : user.isAdmin ? 'Admin' : 'Member'}
                    </p>
                  </div>
                  <div className="text-4xl opacity-80">
                    {user.isOwner ? '👑' : user.isAdmin ? '⭐' : '🌟'}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Status</p>
                    <p className="text-2xl font-bold">Active</p>
                  </div>
                  <div className="text-4xl opacity-80">🔥</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm">Motivation</p>
                    <p className="text-2xl font-bold">Keep Going!</p>
                  </div>
                  <div className="text-4xl opacity-80">💪</div>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Tips to Earn More Points</h3>
              <ul className="space-y-2 text-blue-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Complete chores consistently to build momentum
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Focus on higher-difficulty chores for more points
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Try to meet your weekly goals for bonus satisfaction
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  Help family members with their chores when possible
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
