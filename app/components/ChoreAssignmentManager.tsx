'use client';

import React, { useState, useEffect } from 'react';

interface Chore {
  id: string;
  name: string;
  description?: string;
  points: number;
  difficulty: string;
  minAge: number;
  isRecurring: boolean;
}

interface FamilyMember {
  id: string;
  name?: string;
  nickname?: string;
  email: string;
  age?: number;
}

interface Assignment {
  id: string;
  dueDate: Date;
  completed: boolean;
  notes?: string;
  chore: {
    name: string;
    points: number;
    difficulty: string;
  };
  user: {
    name?: string;
    nickname?: string;
  };
}

export default function ChoreAssignmentManager() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    choreId: '',
    assignedUserIds: [] as string[],
    dueDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchAssignmentData();
  }, []);

  const fetchAssignmentData = async () => {
    try {
      const response = await fetch('/api/admin/assign-chores');
      const data = await response.json();
      
      if (response.ok) {
        setChores(data.chores || []);
        setFamilyMembers(data.familyMembers || []);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to fetch data' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.choreId || formData.assignedUserIds.length === 0) {
      setMessage({ type: 'error', text: 'Please select a chore and at least one family member' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/admin/assign-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setFormData({
          choreId: '',
          assignedUserIds: [],
          dueDate: new Date().toISOString().split('T')[0],
          notes: ''
        });
        setShowForm(false);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign chore' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedUserIds: prev.assignedUserIds.includes(userId)
        ? prev.assignedUserIds.filter(id => id !== userId)
        : [...prev.assignedUserIds, userId]
    }));
  };

  const selectedChore = chores.find(c => c.id === formData.choreId);
  const eligibleMembers = familyMembers.filter(member => 
    !selectedChore || !member.age || member.age >= selectedChore.minAge
  );
  const restrictedMembers = familyMembers.filter(member => 
    selectedChore && member.age && member.age < selectedChore.minAge
  );

  if (loading && chores.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          📋 Assign Chores
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          ➕ Assign Chore
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-2 text-sm underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Available Chores */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Available Chores</h3>
        {chores.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {chores.map((chore) => (
              <div key={chore.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{chore.name}</h4>
                  {chore.isRecurring && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      🔄 Recurring
                    </span>
                  )}
                </div>
                
                {chore.description && (
                  <p className="text-sm text-gray-600 mb-2">{chore.description}</p>
                )}
                
                <div className="space-y-1 text-sm text-gray-500">
                  <div>💰 {chore.points} points</div>
                  <div>📊 {chore.difficulty}</div>
                  {chore.minAge > 0 && <div>👶 Min age: {chore.minAge}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No chores available.</p>
            <p className="text-sm">Create some chores first to assign them to family members.</p>
          </div>
        )}
      </div>

      {/* Family Members */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Family Members</h3>
        {familyMembers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {familyMembers.map((member) => (
              <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <h4 className="font-medium text-gray-900">
                  {member.name || member.nickname || 'Unknown'}
                </h4>
                <div className="space-y-1 text-sm text-gray-500">
                  <div>📧 {member.email}</div>
                  {member.age && <div>👶 Age: {member.age}</div>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">👥</div>
            <p>No family members found.</p>
          </div>
        )}
      </div>

      {/* Assignment Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">📋 Assign Chore</h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Chore *
                  </label>
                  <select
                    value={formData.choreId}
                    onChange={(e) => setFormData(prev => ({ ...prev, choreId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a chore...</option>
                    {chores.map(chore => (
                      <option key={chore.id} value={chore.id}>
                        {chore.name} ({chore.points} pts, {chore.difficulty})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedChore && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-medium text-blue-900">{selectedChore.name}</h4>
                    <div className="text-sm text-blue-700 space-y-1">
                      <div>💰 {selectedChore.points} points</div>
                      <div>📊 {selectedChore.difficulty} difficulty</div>
                      {selectedChore.minAge > 0 && <div>👶 Minimum age: {selectedChore.minAge}</div>}
                      {selectedChore.isRecurring && <div>🔄 Recurring chore</div>}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign to Family Members *
                  </label>
                  
                  {/* Eligible Members */}
                  {eligibleMembers.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {eligibleMembers.map(member => (
                        <label key={member.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assignedUserIds.includes(member.id)}
                            onChange={() => handleUserToggle(member.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm">
                            {member.name || member.nickname || 'Unknown'}
                            {member.age && ` (${member.age} years old)`}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                  {/* Restricted Members */}
                  {restrictedMembers.length > 0 && (
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <p className="text-xs text-yellow-700 font-medium mb-1">
                        ⚠️ Too young for this chore:
                      </p>
                      {restrictedMembers.map(member => (
                        <div key={member.id} className="text-xs text-yellow-600">
                          {member.name || member.nickname || 'Unknown'} 
                          ({member.age} years old, needs {selectedChore?.minAge}+)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Any special instructions..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading || !formData.choreId || formData.assignedUserIds.length === 0}
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Assigning...' : '✅ Assign Chore'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
