'use client';

import React, { useState, useEffect } from 'react';
import { 
  getRecurrenceOptions, 
  getDayOptions, 
  formatRecurrenceDescription,
  parseRecurrencePattern,
  validateRecurrencePattern,
  RecurrencePattern 
} from '../../lib/recurringChores';

interface RecurringChore {
  id: string;
  name: string;
  description?: string | null;
  points: number;
  minAge: number;
  difficulty: string;
  familyId: string;
  basePoints: number;
  isRecurring: boolean;
  recurrenceType?: string | null;
  recurrenceInterval?: number | null;
  recurrenceDays?: string | null;
  recurrenceEndDate?: Date | null;
  lastGenerated?: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export default function RecurringChoreManager() {
  const [recurringChores, setRecurringChores] = useState<RecurringChore[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingChore, setEditingChore] = useState<RecurringChore | null>(null);
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    points: 10,
    minAge: 0,
    difficulty: 'Easy',
    recurrenceType: 'weekly',
    recurrenceInterval: 1,
    recurrenceDays: ['monday'],
    recurrenceEndDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchRecurringChores();
  }, []);

  const fetchRecurringChores = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/recurring-chores');
      if (response.ok) {
        const data = await response.json();
        setRecurringChores(data.recurringChores);
      }
    } catch (error) {
      console.error('Error fetching recurring chores:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate recurrence pattern
      const pattern: Partial<RecurrencePattern> = {
        type: formData.recurrenceType as RecurrencePattern['type'],
        interval: formData.recurrenceInterval,
        days: formData.recurrenceDays,
        endDate: formData.recurrenceEndDate ? new Date(formData.recurrenceEndDate) : undefined
      };

      const validation = validateRecurrencePattern(pattern);
      if (!validation.isValid) {
        setMessage({ type: 'error', text: validation.errors.join(', ') });
        setLoading(false);
        return;
      }

      const response = await fetch('/api/admin/recurring-chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingChore && { id: editingChore.id }),
          ...formData
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        resetForm();
        fetchRecurringChores();
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save recurring chore' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      points: 10,
      minAge: 0,
      difficulty: 'Easy',
      recurrenceType: 'weekly',
      recurrenceInterval: 1,
      recurrenceDays: ['monday'],
      recurrenceEndDate: '',
      isActive: true
    });
    setShowCreateForm(false);
    setEditingChore(null);
  };

  const handleEdit = (chore: RecurringChore) => {
    setEditingChore(chore);
    setFormData({
      name: chore.name,
      description: chore.description || '',
      points: chore.points,
      minAge: chore.minAge,
      difficulty: chore.difficulty,
      recurrenceType: chore.recurrenceType || 'weekly',
      recurrenceInterval: chore.recurrenceInterval || 1,
      recurrenceDays: chore.recurrenceDays ? JSON.parse(chore.recurrenceDays) : ['monday'],
      recurrenceEndDate: chore.recurrenceEndDate ? chore.recurrenceEndDate.toString().split('T')[0] : '',
      isActive: chore.isActive
    });
    setShowCreateForm(true);
  };

  const generateChores = async (startDate: string, endDate: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/recurring-chores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: data.message });
        setShowGenerateModal(false);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to generate chores' });
    } finally {
      setLoading(false);
    }
  };

  const recurrenceOptions = getRecurrenceOptions();
  const dayOptions = getDayOptions();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">🔄 Recurring Chores</h2>
        <div className="space-x-2">
          <button
            onClick={() => setShowGenerateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📅 Generate Chores
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ➕ Add Recurring Chore
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-md p-6 border">
          <h3 className="text-lg font-semibold mb-4">
            {editingChore ? 'Edit Recurring Chore' : 'Create Recurring Chore'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chore Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Age
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.minAge}
                  onChange={(e) => setFormData(prev => ({ ...prev, minAge: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recurrence Type *
                </label>
                <select
                  value={formData.recurrenceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {recurrenceOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recurrence-specific options */}
            {(formData.recurrenceType === 'weekly' || formData.recurrenceType === 'biweekly') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Days of the Week *
                </label>
                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                  {dayOptions.map(day => (
                    <label key={day.value} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.recurrenceDays.includes(day.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              recurrenceDays: [...prev.recurrenceDays, day.value]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              recurrenceDays: prev.recurrenceDays.filter(d => d !== day.value)
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{day.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {formData.recurrenceType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repeat every N days *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.recurrenceInterval}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrenceInterval: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.recurrenceEndDate}
                onChange={(e) => setFormData(prev => ({ ...prev, recurrenceEndDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                Active (chores will be generated)
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : (editingChore ? 'Update' : 'Create')} Recurring Chore
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Recurring Chores List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Existing Recurring Chores</h3>
          
          {loading && !showCreateForm ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading recurring chores...</p>
            </div>
          ) : recurringChores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">📋</div>
              <p>No recurring chores created yet</p>
              <p className="text-sm">Create your first recurring chore to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recurringChores.map(chore => {
                const pattern = parseRecurrencePattern(chore);
                const description = pattern ? formatRecurrenceDescription(pattern) : 'Unknown pattern';
                
                return (
                  <div key={chore.id} className={`border rounded-lg p-4 ${
                    chore.isActive ? 'border-gray-200' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{chore.name}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            chore.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {chore.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {chore.description && (
                          <p className="text-sm text-gray-600 mb-2">{chore.description}</p>
                        )}
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Points:</span> {chore.points}
                          </div>
                          <div>
                            <span className="font-medium">Difficulty:</span> {chore.difficulty}
                          </div>
                          <div>
                            <span className="font-medium">Min Age:</span> {chore.minAge}
                          </div>
                          <div>
                            <span className="font-medium">Pattern:</span> {description}
                          </div>
                        </div>
                        
                        {chore.lastGenerated && (
                          <div className="text-xs text-gray-500 mt-2">
                            Last generated: {new Date(chore.lastGenerated).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(chore)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Generate Chores Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate Chores from Patterns</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const startDate = formData.get('startDate') as string;
              const endDate = formData.get('endDate') as string;
              generateChores(startDate, endDate);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Chores'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
