'use client';

import { useState, useEffect } from 'react';

interface Chore {
  id: string;
  name: string;
  description: string | null;
  points: number;
  difficulty: string;
  minAge: number;
}

interface NewChore {
  name: string;
  description: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  minAge: number;
  isRecurring: boolean;
}

interface User {
  id: string;
  name: string;
  nickname: string;
  isOwner: boolean;
}

interface CustomAuctionCreatorProps {
  currentUser: User;
  onAuctionCreated: () => void;
}

export default function CustomAuctionCreator({ currentUser, onAuctionCreated }: CustomAuctionCreatorProps) {
  const [existingChores, setExistingChores] = useState<Chore[]>([]);
  const [selectedChoreIds, setSelectedChoreIds] = useState<string[]>([]);
  const [newChores, setNewChores] = useState<NewChore[]>([]);
  const [auctionDuration, setAuctionDuration] = useState(24);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchExistingChores();
  }, []);

  const fetchExistingChores = async () => {
    try {
      const response = await fetch('/api/admin/chores');
      if (response.ok) {
        const data = await response.json();
        setExistingChores(data.chores || []);
      }
    } catch (error) {
      console.error('Error fetching chores:', error);
    }
  };

  const addNewChore = () => {
    setNewChores([...newChores, {
      name: '',
      description: '',
      points: 25,
      difficulty: 'Medium',
      minAge: 12,
      isRecurring: true
    }]);
  };

  const updateNewChore = (index: number, field: keyof NewChore, value: any) => {
    const updated = [...newChores];
    updated[index] = { ...updated[index], [field]: value };
    setNewChores(updated);
  };

  const removeNewChore = (index: number) => {
    setNewChores(newChores.filter((_, i) => i !== index));
  };

  const toggleChoreSelection = (choreId: string) => {
    setSelectedChoreIds(prev => 
      prev.includes(choreId) 
        ? prev.filter(id => id !== choreId)
        : [...prev, choreId]
    );
  };

  const createCustomAuction = async () => {
    if (selectedChoreIds.length === 0 && newChores.filter(c => c.name.trim()).length === 0) {
      setMessage({
        type: 'error',
        text: 'Please select at least one existing chore or create a new chore'
      });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const currentWeek = new Date();
      currentWeek.setDate(currentWeek.getDate() - currentWeek.getDay());
      currentWeek.setHours(0, 0, 0, 0);

      const response = await fetch('/api/auctions/create-custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart: currentWeek.toISOString(),
          auctionDurationHours: auctionDuration,
          existingChoreIds: selectedChoreIds,
          newChores: newChores.filter(chore => chore.name.trim())
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({
          type: 'success',
          text: data.message
        });
        
        // Reset form and notify parent
        setSelectedChoreIds([]);
        setNewChores([]);
        setTimeout(() => {
          onAuctionCreated();
        }, 1500);
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to create custom auction'
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while creating the auction'
      });
    } finally {
      setLoading(false);
    }

    setTimeout(() => setMessage(null), 5000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-800">🎨 Create Custom Auction</h3>
        <p className="text-gray-600 mt-1">Mix existing chores with new ones for your auction</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Auction Settings */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-800 mb-3">⚙️ Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (hours)
            </label>
            <select
              value={auctionDuration}
              onChange={(e) => setAuctionDuration(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value={12}>12 hours</option>
              <option value={24}>24 hours</option>
              <option value={48}>48 hours</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Chores
            </label>
            <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
              {selectedChoreIds.length + newChores.filter(c => c.name.trim()).length} selected
            </div>
          </div>
        </div>
      </div>

      {/* Existing Chores */}
      <div>
        <h4 className="font-semibold text-gray-800 mb-3">📋 Select Existing Chores ({selectedChoreIds.length} selected)</h4>
        {existingChores.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No existing chores found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
            {existingChores.map((chore) => (
              <div
                key={chore.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedChoreIds.includes(chore.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => toggleChoreSelection(chore.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-800">{chore.name}</h5>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(chore.difficulty)}`}>
                        {chore.difficulty}
                      </span>
                      <span className="text-sm text-blue-600 font-semibold">{chore.points}pts</span>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    selectedChoreIds.includes(chore.id)
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedChoreIds.includes(chore.id) && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Chores */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-semibold text-gray-800">✨ Create New Chores ({newChores.length})</h4>
          <button
            onClick={addNewChore}
            className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            + Add New
          </button>
        </div>

        {newChores.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No new chores added yet</p>
        ) : (
          <div className="space-y-3">
            {newChores.map((chore, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h5 className="font-medium text-gray-800">New Chore #{index + 1}</h5>
                  <button
                    onClick={() => removeNewChore(index)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      value={chore.name}
                      onChange={(e) => updateNewChore(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Clean Kitchen"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Points *</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      value={chore.points}
                      onChange={(e) => updateNewChore(index, 'points', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={chore.difficulty}
                      onChange={(e) => updateNewChore(index, 'difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={chore.minAge}
                      onChange={(e) => updateNewChore(index, 'minAge', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={chore.description}
                      onChange={(e) => updateNewChore(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Button */}
      <div className="text-center">
        <button
          onClick={createCustomAuction}
          disabled={loading || (selectedChoreIds.length === 0 && newChores.filter(c => c.name.trim()).length === 0)}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            loading || (selectedChoreIds.length === 0 && newChores.filter(c => c.name.trim()).length === 0)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading ? 'Creating Auction...' : '🏛️ Create Custom Auction'}
        </button>
      </div>
    </div>
  );
}
