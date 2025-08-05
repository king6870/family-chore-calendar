'use client';

import { useState, useEffect } from 'react';

interface Reward {
  id: string;
  title: string;
  description?: string;
  pointsRequired: number;
  category: string;
  imageUrl?: string;
  isActive: boolean;
  creator: {
    name?: string;
    nickname?: string;
  };
  claims?: RewardClaim[];
}

interface RewardClaim {
  id: string;
  status: string;
  pointsSpent: number;
  claimedAt: string;
  reward: Reward;
  user: {
    name?: string;
    nickname?: string;
  };
  approver?: {
    name?: string;
    nickname?: string;
  };
}

interface User {
  totalPoints: number;
}

export default function RewardStore() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<RewardClaim[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<Reward[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'store' | 'claims' | 'claimed'>('store');

  const categories = [
    { value: 'general', label: '💫 General', emoji: '💫' },
    { value: 'privilege', label: '👑 Privilege', emoji: '👑' },
    { value: 'item', label: '🎁 Item', emoji: '🎁' },
    { value: 'experience', label: '🎉 Experience', emoji: '🎉' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [rewardsRes, claimsRes, claimedRes, userRes] = await Promise.all([
        fetch('/api/admin/rewards'),
        fetch('/api/rewards/claim'),
        fetch('/api/rewards/claimed'),
        fetch('/api/user')  // Changed from /api/user/profile to /api/user for consistency
      ]);

      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData.rewards?.filter((r: Reward) => r.isActive) || []);
      }

      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setClaims(claimsData.claims || []);
      }

      if (claimedRes.ok) {
        const claimedData = await claimedRes.json();
        setClaimedRewards(claimedData.claimedRewards || []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);  // Changed from userData.user to userData.user since main API returns { user: {...} }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimReward = async (rewardId: string, notes?: string) => {
    try {
      const response = await fetch('/api/rewards/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rewardId, notes })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setUser(prev => prev ? { ...prev, totalPoints: data.newPointsBalance } : null);
        fetchData(); // Refresh data
      } else {
        setMessage(data.error || 'Failed to claim reward');
      }
    } catch (error) {
      setMessage('Error claiming reward');
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const canAfford = (pointsRequired: number) => {
    return user && user.totalPoints >= pointsRequired;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'delivered': return 'bg-blue-100 text-blue-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading reward store...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🏪 Reward Store</h2>
        <div className="bg-purple-100 text-purple-700 px-4 py-2 rounded-lg font-medium">
          💎 {user?.totalPoints || 0} points
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') || message.includes('Failed') || message.includes('Insufficient')
          ? 'bg-red-100 text-red-700' 
          : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab('store')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'store' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏪 Store
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'claims' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 My Claims ({claims.length})
        </button>
        <button
          onClick={() => setActiveTab('claimed')}
          className={`pb-2 px-1 font-medium ${
            activeTab === 'claimed' 
              ? 'text-purple-600 border-b-2 border-purple-600' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          ✅ Claimed ({claimedRewards.length})
        </button>
      </div>

      {activeTab === 'store' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rewards.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🏪</div>
              {claimedRewards.length > 0 ? (
                <div>
                  <p className="mb-2">All available rewards have been claimed!</p>
                  <p className="text-sm">Check the "✅ Claimed" tab to see what's been redeemed, or ask your family admin to create new rewards.</p>
                </div>
              ) : (
                <p>No rewards available yet. Ask your family admin to create some rewards!</p>
              )}
            </div>
          ) : (
            rewards.map((reward) => {
              const categoryInfo = categories.find(c => c.value === reward.category) || categories[0];
              const affordable = canAfford(reward.pointsRequired);
              
              return (
                <div key={reward.id} className={`bg-white p-6 rounded-lg border shadow-sm ${!affordable ? 'opacity-60' : ''}`}>
                  {reward.imageUrl && (
                    <img 
                      src={reward.imageUrl} 
                      alt={reward.title}
                      className="w-full h-32 object-cover rounded-lg mb-4"
                    />
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{categoryInfo.emoji}</span>
                    <h3 className="text-lg font-semibold text-gray-800">{reward.title}</h3>
                  </div>
                  
                  {reward.description && (
                    <p className="text-gray-600 mb-4 text-sm">{reward.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium text-sm">
                      💎 {reward.pointsRequired} points
                    </span>
                    
                    <button
                      onClick={() => handleClaimReward(reward.id)}
                      disabled={!affordable}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        affordable
                          ? 'bg-purple-600 text-white hover:bg-purple-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {affordable ? 'Claim' : 'Not Enough Points'}
                    </button>
                  </div>
                  
                  {!affordable && (
                    <div className="mt-2 text-xs text-red-600">
                      Need {reward.pointsRequired - (user?.totalPoints || 0)} more points
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">📋</div>
              <p>No reward claims yet. Start claiming rewards from the store!</p>
            </div>
          ) : (
            claims.map((claim) => {
              const categoryInfo = categories.find(c => c.value === claim.reward.category) || categories[0];
              
              return (
                <div key={claim.id} className="bg-white p-6 rounded-lg border shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{categoryInfo.emoji}</span>
                        <h3 className="text-lg font-semibold text-gray-800">{claim.reward.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Points spent: {claim.pointsSpent}</p>
                        <p>Claimed: {new Date(claim.claimedAt).toLocaleDateString()}</p>
                        {claim.approver && (
                          <p>Approved by: {claim.approver.name || claim.approver.nickname}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'claimed' && (
        <div className="space-y-4">
          {claimedRewards.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">✅</div>
              <p>No rewards have been claimed yet.</p>
            </div>
          ) : (
            claimedRewards.map((reward) => {
              const categoryInfo = categories.find(c => c.value === reward.category) || categories[0];
              const claim = reward.claims?.[0]; // Get the most recent claim
              
              return (
                <div key={reward.id} className="bg-gray-50 p-6 rounded-lg border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{categoryInfo.emoji}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{reward.title}</h3>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          ✅ CLAIMED
                        </span>
                      </div>
                      
                      {reward.description && (
                        <p className="text-gray-600 mb-3">{reward.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>💰 {reward.pointsRequired} points</span>
                        <span>👤 Created by: {reward.creator.name || reward.creator.nickname}</span>
                      </div>
                    </div>
                    
                    {reward.imageUrl && (
                      <img 
                        src={reward.imageUrl} 
                        alt={reward.title}
                        className="w-16 h-16 object-cover rounded-lg ml-4"
                      />
                    )}
                  </div>
                  
                  {claim && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">Claimed by:</span> {claim.user.name || claim.user.nickname}
                        </div>
                        <div className="text-gray-500">
                          {new Date(claim.claimedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
