'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface StreakTaskOption {
  id: string;
  title: string;
  description?: string;
}

interface StreakTask {
  id: string;
  title: string;
  description?: string;
  isRequired: boolean;
  options: StreakTaskOption[];
}

interface StreakTaskCompletion {
  id: string;
  completed: boolean;
  completedAt?: string;
  uncheckedBy?: string;
  uncheckedAt?: string;
  task: StreakTask;
  option?: StreakTaskOption;
}

interface StreakDay {
  id: string;
  dayNumber: number;
  date: string;
  completed: boolean;
  taskCompletions: StreakTaskCompletion[];
}

interface Streak {
  id: string;
  title: string;
  description?: string;
  duration: number;
  pointsReward: number;
  status: string;
  currentDay: number;
  startedAt?: string;
  completedAt?: string;
  failedAt?: string;
  creator: { name: string; nickname?: string };
  assignee: { id: string; name: string; nickname?: string };
  tasks: StreakTask[];
  days: StreakDay[];
}

interface User {
  id: string;
  name: string;
  nickname?: string;
}

export default function StreaksManager() {
  const { data: session } = useSession();
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [familyMembers, setFamilyMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStreak, setEditingStreak] = useState<Streak | null>(null);
  const [showViewForm, setShowViewForm] = useState(false);
  const [viewingStreak, setViewingStreak] = useState<Streak | null>(null);

  // Create streak form state
  const [newStreak, setNewStreak] = useState({
    title: '',
    description: '',
    duration: 7,
    pointsReward: 100,
    assigneeId: '',
    tasks: [{ title: '', description: '', isRequired: true, options: [] as { title: string; description: string }[] }]
  });

  useEffect(() => {
    fetchStreaks();
    fetchFamilyMembers();
    checkAdminStatus();
  }, []);

  const fetchStreaks = async () => {
    try {
      const response = await fetch('/api/streaks');
      if (response.ok) {
        const data = await response.json();
        setStreaks(data);
      }
    } catch (error) {
      console.error('Error fetching streaks:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch('/api/family/members');
      if (response.ok) {
        const data = await response.json();
        setFamilyMembers(data || []); // Ensure it's always an array
      } else {
        console.error('Failed to fetch family members:', response.status);
        setFamilyMembers([]); // Set empty array on error
      }
    } catch (error) {
      console.error('Error fetching family members:', error);
      setFamilyMembers([]); // Set empty array on error
    }
  };

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setIsAdminOrOwner(data.user?.isAdmin || data.user?.isOwner);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const createStreak = async () => {
    try {
      const response = await fetch('/api/streaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStreak)
      });

      if (response.ok) {
        await fetchStreaks();
        setShowCreateForm(false);
        setNewStreak({
          title: '',
          description: '',
          duration: 7,
          pointsReward: 100,
          assigneeId: '',
          tasks: [{ title: '', description: '', isRequired: true, options: [] }]
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating streak:', error);
      alert('Failed to create streak');
    }
  };

  const updateStreak = async () => {
    if (!editingStreak) return;
    
    try {
      const response = await fetch(`/api/streaks/${editingStreak.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStreak)
      });

      if (response.ok) {
        await fetchStreaks();
        setShowEditForm(false);
        setEditingStreak(null);
        setNewStreak({
          title: '',
          description: '',
          duration: 7,
          pointsReward: 100,
          assigneeId: '',
          tasks: [{ title: '', description: '', isRequired: true, options: [] }]
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating streak:', error);
      alert('Failed to update streak');
    }
  };

  const openEditForm = (streak: Streak) => {
    setEditingStreak(streak);
    setNewStreak({
      title: streak.title,
      description: streak.description || '',
      duration: streak.duration,
      pointsReward: streak.pointsReward,
      assigneeId: streak.assignee.id,
      tasks: streak.tasks.map(task => ({
        title: task.title,
        description: task.description || '',
        isRequired: task.isRequired,
        options: task.options.map(option => ({
          title: option.title,
          description: option.description || ''
        }))
      }))
    });
    setShowEditForm(true);
  };

  const openViewForm = (streak: Streak) => {
    setViewingStreak(streak);
    setShowViewForm(true);
  };

  const startStreak = async (streakId: string) => {
    try {
      const response = await fetch(`/api/streaks/${streakId}/start`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchStreaks();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error starting streak:', error);
      alert('Failed to start streak');
    }
  };

  const completeTask = async (streakId: string, taskId: string, completed: boolean, optionId?: string) => {
    try {
      const response = await fetch(`/api/streaks/${streakId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed, optionId })
      });

      if (response.ok) {
        await fetchStreaks();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task');
    }
  };

  const deleteStreak = async (streakId: string) => {
    if (!confirm('Are you sure you want to delete this streak?')) return;

    try {
      const response = await fetch(`/api/streaks/${streakId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchStreaks();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting streak:', error);
      alert('Failed to delete streak');
    }
  };

  const addTask = () => {
    setNewStreak(prev => ({
      ...prev,
      tasks: [...prev.tasks, { title: '', description: '', isRequired: true, options: [] }]
    }));
  };

  const updateTask = (index: number, field: string, value: any) => {
    setNewStreak(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === index ? { ...task, [field]: value } : task
      )
    }));
  };

  const addTaskOption = (taskIndex: number) => {
    setNewStreak(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === taskIndex 
          ? { ...task, options: [...(task.options || []), { title: '', description: '' }] }
          : task
      )
    }));
  };

  const updateTaskOption = (taskIndex: number, optionIndex: number, field: string, value: string) => {
    setNewStreak(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === taskIndex 
          ? {
              ...task,
              options: (task.options || []).map((option, j) => 
                j === optionIndex ? { ...option, [field]: value } : option
              )
            }
          : task
      )
    }));
  };

  const removeTask = (index: number) => {
    if (newStreak.tasks.length > 1) {
      setNewStreak(prev => ({
        ...prev,
        tasks: prev.tasks.filter((_, i) => i !== index)
      }));
    }
  };

  const removeTaskOption = (taskIndex: number, optionIndex: number) => {
    setNewStreak(prev => ({
      ...prev,
      tasks: prev.tasks.map((task, i) => 
        i === taskIndex 
          ? { ...task, options: (task.options || []).filter((_, j) => j !== optionIndex) }
          : task
      )
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCurrentDayTasks = (streak: Streak) => {
    if (streak.status !== 'active') return [];
    const currentDay = streak.days?.find(d => d.dayNumber === streak.currentDay);
    return currentDay?.taskCompletions || [];
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">🔥 Streaks</h1>
        {isAdminOrOwner && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
          >
            Create Streak
          </button>
        )}
      </div>

      {/* Create Streak Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Streak</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={newStreak.title}
                  onChange={(e) => setNewStreak(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="e.g., Morning Routine"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newStreak.description}
                  onChange={(e) => setNewStreak(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={2}
                  placeholder="Optional description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (days)</label>
                  <input
                    type="number"
                    value={newStreak.duration}
                    onChange={(e) => setNewStreak(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Points Reward</label>
                  <input
                    type="number"
                    value={newStreak.pointsReward}
                    onChange={(e) => setNewStreak(prev => ({ ...prev, pointsReward: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to</label>
                <select
                  value={newStreak.assigneeId}
                  onChange={(e) => setNewStreak(prev => ({ ...prev, assigneeId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select family member</option>
                  {(familyMembers || []).map(member => (
                    <option key={member.id} value={member.id}>
                      {member.nickname || member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tasks</label>
                {newStreak.tasks.map((task, taskIndex) => (
                  <div key={taskIndex} className="border border-gray-200 rounded-md p-4 mb-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Task {taskIndex + 1}</h4>
                      {newStreak.tasks.length > 1 && (
                        <button
                          onClick={() => removeTask(taskIndex)}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(taskIndex, 'title', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., Wake up at 7 AM"
                      />

                      <textarea
                        value={task.description}
                        onChange={(e) => updateTask(taskIndex, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={1}
                        placeholder="Optional description"
                      />

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.isRequired}
                          onChange={(e) => updateTask(taskIndex, 'isRequired', e.target.checked)}
                          className="mr-2"
                        />
                        Required task (streak fails if not completed)
                      </label>

                      {/* Task Options */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-600">Options (choose one)</label>
                          <button
                            onClick={() => addTaskOption(taskIndex)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            Add Option
                          </button>
                        </div>

                        {(task.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={option.title}
                              onChange={(e) => updateTaskOption(taskIndex, optionIndex, 'title', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                              placeholder="e.g., Run 1 mile"
                            />
                            <input
                              type="text"
                              value={option.description}
                              onChange={(e) => updateTaskOption(taskIndex, optionIndex, 'description', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm"
                              placeholder="Optional description"
                            />
                            <button
                              onClick={() => removeTaskOption(taskIndex, optionIndex)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={addTask}
                  className="text-blue-500 hover:text-blue-700 font-medium"
                >
                  + Add Task
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={createStreak}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                disabled={!newStreak.title || !newStreak.assigneeId || (newStreak.tasks || []).some(t => !t.title)}
              >
                Create Streak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Streak Form */}
      {showEditForm && editingStreak && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Streak: {editingStreak.title}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streak Title
                </label>
                <input
                  type="text"
                  value={newStreak.title}
                  onChange={(e) => setNewStreak(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Enter streak title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newStreak.description}
                  onChange={(e) => setNewStreak(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows={3}
                  placeholder="Enter streak description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    value={newStreak.duration}
                    onChange={(e) => setNewStreak(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                    max="365"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Reward
                  </label>
                  <input
                    type="number"
                    value={newStreak.pointsReward}
                    onChange={(e) => setNewStreak(prev => ({ ...prev, pointsReward: parseInt(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    min="1"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign to Family Member
                </label>
                <select
                  value={newStreak.assigneeId}
                  onChange={(e) => setNewStreak(prev => ({ ...prev, assigneeId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="">Select family member</option>
                  {(familyMembers || []).map(member => (
                    <option key={member.id} value={member.id}>
                      {member.nickname || member.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Tasks
                </label>
                {(newStreak.tasks || []).map((task, taskIndex) => (
                  <div key={taskIndex} className="border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium">Task {taskIndex + 1}</h4>
                      <button
                        onClick={() => removeTask(taskIndex)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => updateTask(taskIndex, 'title', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Task title"
                      />
                      
                      <textarea
                        value={task.description}
                        onChange={(e) => updateTask(taskIndex, 'description', e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={2}
                        placeholder="Task description (optional)"
                      />
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={task.isRequired}
                          onChange={(e) => updateTask(taskIndex, 'isRequired', e.target.checked)}
                          className="mr-2"
                        />
                        Required task (streak fails if not completed)
                      </label>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium text-gray-700">
                            Task Options (choose one)
                          </label>
                          <button
                            onClick={() => addTaskOption(taskIndex)}
                            className="text-blue-500 hover:text-blue-700 text-sm"
                          >
                            + Add Option
                          </button>
                        </div>
                        
                        {(task.options || []).map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={option.title}
                              onChange={(e) => updateTaskOption(taskIndex, optionIndex, 'title', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
                              placeholder="Option title"
                            />
                            <input
                              type="text"
                              value={option.description}
                              onChange={(e) => updateTaskOption(taskIndex, optionIndex, 'description', e.target.value)}
                              className="flex-1 border border-gray-300 rounded-md px-3 py-1 text-sm"
                              placeholder="Option description"
                            />
                            <button
                              onClick={() => removeTaskOption(taskIndex, optionIndex)}
                              className="text-red-500 hover:text-red-700 text-sm px-2"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addTask}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600"
                >
                  + Add Task
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowEditForm(false);
                  setEditingStreak(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateStreak}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
                disabled={!newStreak.title || !newStreak.assigneeId || (newStreak.tasks || []).some(t => !t.title)}
              >
                Update Streak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Streak Modal (for active streaks) */}
      {showViewForm && viewingStreak && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">View Streak: {viewingStreak.title}</h2>
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ This streak is {viewingStreak.status} and cannot be edited. You can only view its details.
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streak Title
                </label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                  {viewingStreak.title}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 min-h-[80px]">
                  {viewingStreak.description || 'No description'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (days)
                  </label>
                  <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                    {viewingStreak.duration}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Points Reward
                  </label>
                  <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                    {viewingStreak.pointsReward}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assigned to
                </label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                  {viewingStreak.assignee.nickname || viewingStreak.assignee.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(viewingStreak.status)}`}>
                    {viewingStreak.status}
                  </span>
                  {viewingStreak.status === 'active' && (
                    <span className="ml-2 text-sm text-gray-600">
                      Day {viewingStreak.currentDay} of {viewingStreak.duration}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Tasks
                </label>
                {viewingStreak.tasks.map((task, taskIndex) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                    <div className="mb-3">
                      <h4 className="font-medium">Task {taskIndex + 1}</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                        <div className="text-sm">{task.title}</div>
                      </div>
                      
                      {task.description && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <div className="text-sm">{task.description}</div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                        <div className="text-sm">
                          {task.isRequired ? (
                            <span className="text-red-600 font-medium">Required</span>
                          ) : (
                            <span className="text-green-600 font-medium">Optional</span>
                          )}
                        </div>
                      </div>

                      {task.options.length > 0 && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Options</label>
                          <div className="space-y-1">
                            {task.options.map((option, optionIndex) => (
                              <div key={option.id} className="text-sm bg-white p-2 rounded border">
                                <div className="font-medium">{option.title}</div>
                                {option.description && (
                                  <div className="text-gray-600 text-xs">{option.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowViewForm(false);
                  setViewingStreak(null);
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Streaks List */}
      <div className="space-y-6">
        {(streaks || []).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No streaks yet</h3>
            <p className="text-gray-600">
              {isAdminOrOwner ? 'Create your first streak to get started!' : 'Ask an admin or owner to create a streak for you!'}
            </p>
          </div>
        ) : (
          (streaks || []).map(streak => (
            <div key={streak.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{streak.title}</h3>
                  {streak.description && (
                    <p className="text-gray-600 mt-1">{streak.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>👤 {streak.assignee.nickname || streak.assignee.name}</span>
                    <span>📅 {streak.duration} days</span>
                    <span>🎯 {streak.pointsReward} points</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(streak.status)}`}>
                      {streak.status}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {streak.status === 'pending' && (
                    <button
                      onClick={() => startStreak(streak.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Start
                    </button>
                  )}
                  {isAdminOrOwner && (
                    <>
                      {streak.status === 'pending' ? (
                        <button
                          onClick={() => openEditForm(streak)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Edit
                        </button>
                      ) : (
                        <button
                          onClick={() => openViewForm(streak)}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                        >
                          View
                        </button>
                      )}
                      <button
                        onClick={() => deleteStreak(streak.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {streak.status === 'active' && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>Day {streak.currentDay} of {streak.duration}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(streak.currentDay / streak.duration) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Current Day Tasks */}
              {streak.status === 'active' && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Today's Tasks (Day {streak.currentDay})</h4>
                  <div className="space-y-3">
                    {getCurrentDayTasks(streak).map(completion => (
                      <div key={completion.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={completion.completed}
                            onChange={(e) => completeTask(streak.id, completion.task.id, e.target.checked)}
                            className="h-5 w-5 text-blue-600"
                          />
                          <div>
                            <span className={`font-medium ${completion.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                              {completion.task.title}
                              {completion.task.isRequired && <span className="text-red-500 ml-1">*</span>}
                            </span>
                            {completion.task.description && (
                              <p className="text-sm text-gray-600">{completion.task.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Task Options */}
                        {(completion.task.options || []).length > 0 && (
                          <div className="flex gap-2">
                            {(completion.task.options || []).map(option => (
                              <button
                                key={option.id}
                                onClick={() => completeTask(streak.id, completion.task.id, true, option.id)}
                                className={`px-3 py-1 rounded text-sm ${
                                  completion.option?.id === option.id
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                              >
                                {option.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completion/Failure Message */}
              {streak.status === 'completed' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">🎉</span>
                    <div>
                      <h4 className="font-medium text-green-800">Streak Completed!</h4>
                      <p className="text-green-600">
                        Completed on {new Date(streak.completedAt!).toLocaleDateString()} • 
                        Earned {streak.pointsReward} points
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {streak.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">💔</span>
                    <div>
                      <h4 className="font-medium text-red-800">Streak Failed</h4>
                      <p className="text-red-600">
                        Failed on {new Date(streak.failedAt!).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
