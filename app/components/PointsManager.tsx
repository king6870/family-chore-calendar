'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FamilyMember {
  id: string;
  name: string;
  nickname: string;
  totalPoints: number;
  isAdmin: boolean;
  isOwner: boolean;
}

interface PointsTransaction {
  id: string;
  points: number;
  date: string;
  choreName?: string;
  reason?: string;
  awardedBy: string;
}

export default function PointsManager() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [pointsAmount, setPointsAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [transactionType, setTransactionType] = useState<'award' | 'deduct'>('award');
  const [recentTransactions, setRecentTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchFamilyMembers();
    fetchRecentTransactions();
  }, []);

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/admin/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
    }
  };

  const fetchRecentTransactions = async () => {
    try {
      const response = await fetch('/api/points/transactions');
      if (response.ok) {
        const data = await response.json();
        setRecentTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handlePointsTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMember || pointsAmount <= 0) {
      setMessage({ type: 'error', text: 'Please select a member and enter a valid points amount' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const finalPoints = transactionType === 'deduct' ? -pointsAmount : pointsAmount;
      
      const response = await fetch('/api/points/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedMember,
          points: finalPoints,
          reason: reason || `Manual ${transactionType} by admin`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        
        // Reset form
        setSelectedMember('');
        setPointsAmount(0);
        setReason('');
        
        // Refresh data
        fetchFamilyMembers();
        fetchRecentTransactions();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to process transaction' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while processing the transaction' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPoints = async (userId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to reset all points for ${memberName}? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/points/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        fetchFamilyMembers();
        fetchRecentTransactions();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to reset points' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred while resetting points' });
    } finally {
      setLoading(false);
    }
  };

  const selectedMemberData = members.find(m => m.id === selectedMember);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Points Manager</h2>

        {message && (
          <div className={`mb-4 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Points Transaction Form */}
        <form onSubmit={handlePointsTransaction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Family Member
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Choose a member...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.nickname || member.name} ({member.totalPoints} points)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Type
              </label>
              <select
                value={transactionType}
                onChange={(e) => setTransactionType(e.target.value as 'award' | 'deduct')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="award">Award Points</option>
                <option value="deduct">Deduct Points</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Points Amount
              </label>
              <input
                type="number"
                min="1"
                value={pointsAmount || ''}
                onChange={(e) => setPointsAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter points amount"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Reason for points adjustment"
              />
            </div>
          </div>

          {selectedMemberData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-800">
                    {selectedMemberData.nickname || selectedMemberData.name}
                  </p>
                  <p className="text-sm text-blue-600">
                    Current Points: {selectedMemberData.totalPoints}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">After transaction:</p>
                  <p className="font-bold text-blue-800">
                    {selectedMemberData.totalPoints + (transactionType === 'deduct' ? -pointsAmount : pointsAmount)} points
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !selectedMember || pointsAmount <= 0}
            className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
              loading || !selectedMember || pointsAmount <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : transactionType === 'award'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : `${transactionType === 'award' ? 'Award' : 'Deduct'} ${pointsAmount} Points`}
          </button>
        </form>
      </div>

      {/* Family Points Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Family Points Overview</h3>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                  member.isOwner ? 'bg-yellow-500' : member.isAdmin ? 'bg-blue-500' : 'bg-gray-500'
                }`}>
                  {(member.nickname || member.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-800">
                    {member.nickname || member.name}
                    {member.isOwner && <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Owner</span>}
                    {member.isAdmin && !member.isOwner && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Admin</span>}
                  </p>
                  <p className="text-sm text-gray-600">{member.totalPoints} total points</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleResetPoints(member.id, member.nickname || member.name || 'Unknown')}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  disabled={loading}
                >
                  Reset Points
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Point Transactions</h3>
          <div className="space-y-2">
            {recentTransactions.slice(0, 10).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">
                    {new Date(transaction.date).toLocaleDateString()} at {new Date(transaction.date).toLocaleTimeString()}
                  </p>
                  <p className="text-sm text-gray-800">
                    {transaction.choreName || transaction.reason || 'Points adjustment'}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.points > 0 ? '+' : ''}{transaction.points} pts
                  </p>
                  <p className="text-xs text-gray-500">by {transaction.awardedBy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
