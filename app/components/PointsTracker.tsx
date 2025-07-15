'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PointsData {
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  dailyPoints: { date: string; points: number }[];
  weeklyHistory: { weekStart: string; points: number }[];
  monthlyHistory: { month: string; points: number }[];
  choreBreakdown: { choreName: string; points: number; count: number }[];
  ranking: { userId: string; name: string; nickname: string; points: number; rank: number }[];
  weeklyGoal: number;
  weeklyProgress: number;
}

interface PointsTrackerProps {
  userId?: string;
  showAllMembers?: boolean;
}

export default function PointsTracker({ userId, showAllMembers = false }: PointsTrackerProps) {
  const { data: session } = useSession();
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'all'>('week');
  const [selectedMember, setSelectedMember] = useState<string>('');

  const targetUserId = userId || session?.user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchPointsData();
    }
  }, [targetUserId, timeframe, selectedMember]);

  const fetchPointsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: showAllMembers && selectedMember ? selectedMember : targetUserId || '',
        timeframe,
        includeRanking: showAllMembers ? 'true' : 'false'
      });

      const response = await fetch(`/api/points/tracker?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPointsData(data);
      }
    } catch (error) {
      console.error('Error fetching points data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-5/6"></div>
            <div className="h-3 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!pointsData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No points data available</p>
      </div>
    );
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-800">Points Tracker</h2>
        
        <div className="flex flex-col sm:flex-row gap-2">
          {showAllMembers && pointsData.ranking && (
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Members</option>
              {pointsData.ranking.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.nickname || member.name}
                </option>
              ))}
            </select>
          )}
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as 'week' | 'month' | 'all')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Points Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Points</p>
              <p className="text-3xl font-bold">{pointsData.totalPoints}</p>
            </div>
            <div className="text-4xl opacity-80">🏆</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">This Week</p>
              <p className="text-3xl font-bold">{pointsData.weeklyPoints}</p>
            </div>
            <div className="text-4xl opacity-80">📅</div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">This Month</p>
              <p className="text-3xl font-bold">{pointsData.monthlyPoints}</p>
            </div>
            <div className="text-4xl opacity-80">📊</div>
          </div>
        </div>
      </div>

      {/* Weekly Goal Progress */}
      {pointsData.weeklyGoal > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Weekly Goal Progress</h3>
            <span className="text-sm text-gray-600">
              {pointsData.weeklyPoints} / {pointsData.weeklyGoal} points
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className={`h-4 rounded-full transition-all duration-300 ${getProgressColor(pointsData.weeklyProgress)}`}
              style={{ width: `${Math.min(pointsData.weeklyProgress, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>0</span>
            <span className="font-medium">{pointsData.weeklyProgress.toFixed(1)}%</span>
            <span>{pointsData.weeklyGoal}</span>
          </div>
        </div>
      )}

      {/* Family Ranking */}
      {showAllMembers && pointsData.ranking && pointsData.ranking.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Leaderboard</h3>
          <div className="space-y-3">
            {pointsData.ranking.map((member, index) => (
              <div
                key={member.userId}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                  index === 1 ? 'bg-gray-50 border border-gray-200' :
                  index === 2 ? 'bg-orange-50 border border-orange-200' :
                  'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-500 text-white' :
                    index === 2 ? 'bg-orange-500 text-white' :
                    'bg-gray-300 text-gray-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {member.nickname || member.name}
                    </p>
                    <p className="text-sm text-gray-600">{member.points} points</p>
                  </div>
                </div>
                {index < 3 && (
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points History Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Points History</h3>
        
        {timeframe === 'week' && pointsData.dailyPoints.length > 0 && (
          <div className="space-y-2">
            {pointsData.dailyPoints.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-20">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max((day.points / Math.max(...pointsData.dailyPoints.map(d => d.points))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800 w-12 text-right">
                  {day.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {timeframe === 'month' && pointsData.weeklyHistory.length > 0 && (
          <div className="space-y-2">
            {pointsData.weeklyHistory.map((week, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-24">
                  Week {index + 1}
                </span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max((week.points / Math.max(...pointsData.weeklyHistory.map(w => w.points))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800 w-12 text-right">
                  {week.points}
                </span>
              </div>
            ))}
          </div>
        )}

        {timeframe === 'all' && pointsData.monthlyHistory.length > 0 && (
          <div className="space-y-2">
            {pointsData.monthlyHistory.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 w-20">
                  {month.month}
                </span>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max((month.points / Math.max(...pointsData.monthlyHistory.map(m => m.points))) * 100, 5)}%`
                      }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800 w-12 text-right">
                  {month.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chore Breakdown */}
      {pointsData.choreBreakdown.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Points by Chore</h3>
          <div className="space-y-3">
            {pointsData.choreBreakdown.map((chore, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{chore.choreName}</p>
                  <p className="text-sm text-gray-600">Completed {chore.count} times</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{chore.points} pts</p>
                  <p className="text-xs text-gray-500">
                    {chore.count > 0 ? Math.round(chore.points / chore.count) : 0} avg
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
