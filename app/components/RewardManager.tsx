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
  createdAt: string;
  creator: {
    name?: string;
    nickname?: string;
  };
  claims: Array<{
    id: string;
    status: string;
    user: {
      name?: string;
      nickname?: string;
    };
  }>;
}

export default function RewardManager() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsRequired: '',
    category: 'general',
    imageUrl: ''
  });

  const categories = [
    { value: 'general', label: '💫 General', emoji: '💫' },
    { value: 'privilege', label: '👑 Privilege', emoji: '👑' },
    { value: 'item', label: '🎁 Item', emoji: '🎁' },
    { value: 'experience', label: '🎉 Experience', emoji: '🎉' }
  ];

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/admin/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.pointsRequired) {
      setMessage('Title and points are required');
      return;
    }

    try {
      const url = editingReward ? '/api/admin/rewards' : '/api/admin/rewards';
      const method = editingReward ? 'PUT' : 'POST';
      const payload = editingReward 
        ? { ...formData, id: editingReward.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        setFormData({ title: '', description: '', pointsRequired: '', category: 'general', imageUrl: '' });
        setShowCreateForm(false);
        setEditingReward(null);
        fetchRewards();
      } else {
        setMessage(data.error || 'Failed to save reward');
      }
    } catch (error) {
      setMessage('Error saving reward');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleEdit = (reward: Reward) => {
    setEditingReward(reward);
    setFormData({
      title: reward.title,
      description: reward.description || '',
      pointsRequired: reward.pointsRequired.toString(),
      category: reward.category,
      imageUrl: reward.imageUrl || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm('Are you sure you want to delete this reward?')) return;

    try {
      const response = await fetch(`/api/admin/rewards?id=${rewardId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        fetchRewards();
      } else {
        setMessage(data.error || 'Failed to delete reward');
      }
    } catch (error) {
      setMessage('Error deleting reward');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const toggleActive = async (reward: Reward) => {
    try {
      const response = await fetch('/api/admin/rewards', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reward.id,
          isActive: !reward.isActive
        })
      });

      if (response.ok) {
        fetchRewards();
      }
    } catch (error) {
      console.error('Error toggling reward status:', error);
    }
  };

  const cancelEdit = () => {
    setEditingReward(null);
    setShowCreateForm(false);
    setFormData({ title: '', description: '', pointsRequired: '', category: 'general', imageUrl: '' });
  };

  if (loading) {
    return <div className="text-center py-8">Loading rewards...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">🏆 Reward Manager</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {showCreateForm ? 'Cancel' : '+ Create Reward'}
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') || message.includes('Failed') 
          ? 'bg-red-100 text-red-700' 
          : 'bg-green-100 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">
            {editingReward ? 'Edit Reward' : 'Create New Reward'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reward Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g., Extra Screen Time, Special Treat, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe what this reward includes..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points Required *
                </label>
                <input
                  type="number"
                  value={formData.pointsRequired}
                  onChange={(e) => setFormData({ ...formData, pointsRequired: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., 100"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {editingReward ? 'Update Reward' : 'Create Reward'}
              </button>
              {editingReward && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {rewards.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🏆</div>
            <p>No rewards created yet. Create your first reward to motivate your family!</p>
          </div>
        ) : (
          rewards.map((reward) => {
            const categoryInfo = categories.find(c => c.value === reward.category) || categories[0];
            return (
              <div key={reward.id} className={`bg-white p-6 rounded-lg border shadow-sm ${!reward.isActive ? 'opacity-60' : ''}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{categoryInfo.emoji}</span>
                      <h3 className="text-xl font-semibold text-gray-800">{reward.title}</h3>
                      {!reward.isActive && (
                        <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
                          Inactive
                        </span>
                      )}
                    </div>
                    
                    {reward.description && (
                      <p className="text-gray-600 mb-3">{reward.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full font-medium">
                        💎 {reward.pointsRequired} points
                      </span>
                      <span>{categoryInfo.label}</span>
                      <span>Claims: {reward.claims.length}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => toggleActive(reward)}
                      className={`px-3 py-1 rounded text-sm ${
                        reward.isActive 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {reward.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => handleEdit(reward)}
                      className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(reward.id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
