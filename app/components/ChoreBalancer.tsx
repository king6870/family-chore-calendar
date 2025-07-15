'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DistributionStats {
  totalChoresDistributed: number;
  totalPointsDistributed: number;
  memberBreakdown: {
    memberName: string;
    choreCount: number;
    totalPoints: number;
    averagePointsPerChore: number;
  }[];
  balanceScore: number;
}

interface DistributionAnalysis {
  weekStart: string;
  weekEnd: string;
  totalAssignments: number;
  memberBreakdown: {
    memberName: string;
    choreCount: number;
    totalPoints: number;
    chores: {
      name: string;
      points: number;
      date: string;
      completed: boolean;
    }[];
  }[];
  balanceScore: number;
  isBalanced: boolean;
}

export default function ChoreBalancer() {
  const { data: session } = useSession();
  const [currentWeek, setCurrentWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<DistributionAnalysis | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Get start of week (Sunday)
  function getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  useEffect(() => {
    fetchDistributionAnalysis();
  }, [currentWeek]);

  const fetchDistributionAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/balance-chores?weekStart=${currentWeek.toISOString()}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        console.error('Failed to fetch distribution analysis');
      }
    } catch (error) {
      console.error('Error fetching distribution analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceChores = async () => {
    if (!confirm('This will redistribute all chores for the selected week. Are you sure?')) {
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const response = await fetch('/api/admin/balance-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: currentWeek.toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: data.message
        });
        
        // Refresh analysis
        await fetchDistributionAnalysis();
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to balance chores'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while balancing chores'
      });
    } finally {
      setLoading(false);
    }

    // Clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(getStartOfWeek(new Date()));
  };

  const formatWeekRange = (startDate: Date): string => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  const getBalanceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getBalanceLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">⚖️ Chore Balancer</h2>
            <p className="text-gray-600 mt-1">Ensure equal distribution of chores and points</p>
            <p className="text-sm text-gray-500 mt-1">{formatWeekRange(currentWeek)}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              ← Previous
            </button>
            
            <button
              onClick={goToCurrentWeek}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              Current Week
            </button>
            
            <button
              onClick={() => navigateWeek('next')}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-blue-50 text-blue-800 border border-blue-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Current Distribution Analysis */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Current Distribution Analysis</h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Analyzing distribution...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-6">
            {/* Balance Score */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-800">Balance Score</h4>
                  <p className="text-sm text-gray-600">How evenly distributed are the chores?</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getBalanceColor(analysis.balanceScore)}`}>
                    {analysis.balanceScore}/100
                  </div>
                  <div className={`text-sm font-medium ${getBalanceColor(analysis.balanceScore)}`}>
                    {getBalanceLabel(analysis.balanceScore)}
                  </div>
                </div>
              </div>
              
              {/* Balance Bar */}
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      analysis.balanceScore >= 90 ? 'bg-green-500' :
                      analysis.balanceScore >= 70 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${analysis.balanceScore}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Member Breakdown */}
            {analysis.memberBreakdown.length > 0 ? (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Member Distribution</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysis.memberBreakdown.map((member, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-800">{member.memberName}</h5>
                        <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {member.totalPoints} pts
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        {member.choreCount} chores assigned
                      </div>

                      {/* Member's Chores */}
                      <div className="space-y-1">
                        {member.chores.slice(0, 3).map((chore, choreIndex) => (
                          <div key={choreIndex} className="flex justify-between text-xs">
                            <span className={`truncate ${chore.completed ? 'line-through text-green-600' : 'text-gray-700'}`}>
                              {chore.name}
                            </span>
                            <span className="text-gray-500 ml-2">{chore.points}pts</span>
                          </div>
                        ))}
                        {member.chores.length > 3 && (
                          <div className="text-xs text-gray-500">
                            +{member.chores.length - 3} more chores
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📋</div>
                <p>No chore assignments found for this week</p>
                <p className="text-sm">Use the balance button to distribute chores</p>
              </div>
            )}

            {/* Balance Action */}
            <div className="border-t pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="font-semibold text-gray-800">Rebalance Chores</h4>
                  <p className="text-sm text-gray-600">
                    Redistribute chores to ensure equal workload and points
                  </p>
                </div>
                
                <button
                  onClick={handleBalanceChores}
                  disabled={loading}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : analysis.balanceScore < 70
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {loading ? 'Balancing...' : 
                   analysis.balanceScore < 70 ? '⚖️ Rebalance Chores' : '✓ Redistribute Anyway'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Failed to load distribution analysis</p>
          </div>
        )}
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 How Chore Balancing Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <h4 className="font-medium mb-2">⚖️ Equal Distribution</h4>
            <ul className="text-sm space-y-1">
              <li>• Distributes chores evenly among family members</li>
              <li>• Balances total points per member</li>
              <li>• Considers age restrictions for each chore</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">🎯 Smart Algorithm</h4>
            <ul className="text-sm space-y-1">
              <li>• Assigns high-point chores first</li>
              <li>• Prioritizes members with fewer points</li>
              <li>• Spreads chores across the entire week</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
