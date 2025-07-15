'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface PointsDisplayProps {
  userId?: string;
  showWeekly?: boolean;
  showRank?: boolean;
  compact?: boolean;
}

interface PointsInfo {
  totalPoints: number;
  weeklyPoints: number;
  rank?: number;
  totalMembers?: number;
  weeklyGoal?: number;
  weeklyProgress?: number;
}

export default function PointsDisplay({ 
  userId, 
  showWeekly = true, 
  showRank = false, 
  compact = false 
}: PointsDisplayProps) {
  const { data: session } = useSession();
  const [pointsInfo, setPointsInfo] = useState<PointsInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const targetUserId = userId || session?.user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchPointsInfo();
    }
  }, [targetUserId]);

  const fetchPointsInfo = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: targetUserId || '',
        includeRanking: showRank ? 'true' : 'false'
      });

      const response = await fetch(`/api/points/tracker?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPointsInfo({
          totalPoints: data.totalPoints,
          weeklyPoints: data.weeklyPoints,
          rank: data.ranking?.find((r: any) => r.userId === targetUserId)?.rank,
          totalMembers: data.ranking?.length,
          weeklyGoal: data.weeklyGoal,
          weeklyProgress: data.weeklyProgress
        });
      }
    } catch (error) {
      console.error('Error fetching points info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${compact ? 'p-4' : 'p-6'}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!pointsInfo) {
    return null;
  }

  const getRankEmoji = (rank?: number) => {
    if (!rank) return '📊';
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '📊';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-md p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Your Points</p>
            <p className="text-2xl font-bold">{pointsInfo.totalPoints}</p>
            {showWeekly && (
              <p className="text-blue-100 text-xs">+{pointsInfo.weeklyPoints} this week</p>
            )}
          </div>
          <div className="text-3xl opacity-80">
            {showRank ? getRankEmoji(pointsInfo.rank) : '🏆'}
          </div>
        </div>
        {showRank && pointsInfo.rank && (
          <div className="mt-2 text-blue-100 text-xs">
            Rank #{pointsInfo.rank} of {pointsInfo.totalMembers}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Points</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Points</p>
              <p className="text-3xl font-bold">{pointsInfo.totalPoints}</p>
            </div>
            <div className="text-4xl opacity-80">🏆</div>
          </div>
        </div>

        {showWeekly && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">This Week</p>
                <p className="text-3xl font-bold">{pointsInfo.weeklyPoints}</p>
              </div>
              <div className="text-4xl opacity-80">📅</div>
            </div>
          </div>
        )}
      </div>

      {showRank && pointsInfo.rank && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Family Ranking</p>
              <p className="text-xl font-bold text-gray-800">
                #{pointsInfo.rank} of {pointsInfo.totalMembers}
              </p>
            </div>
            <div className="text-3xl">{getRankEmoji(pointsInfo.rank)}</div>
          </div>
        </div>
      )}

      {pointsInfo.weeklyGoal && pointsInfo.weeklyGoal > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Weekly Goal</p>
            <span className="text-xs text-gray-500">
              {pointsInfo.weeklyPoints} / {pointsInfo.weeklyGoal}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(pointsInfo.weeklyProgress || 0)}`}
              style={{ width: `${Math.min(pointsInfo.weeklyProgress || 0, 100)}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span className="font-medium">{(pointsInfo.weeklyProgress || 0).toFixed(1)}%</span>
            <span>{pointsInfo.weeklyGoal}</span>
          </div>
        </div>
      )}
    </div>
  );
}
