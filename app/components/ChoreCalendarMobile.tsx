'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface ChoreAssignment {
  id: string;
  date: string;
  dayOfWeek: string;
  completed: boolean;
  completedAt: string | null;
  chore: {
    id: string;
    name: string;
    description: string | null;
    points: number;
    difficulty: string;
  };
  user: {
    id: string;
    nickname: string | null;
  };
}

interface User {
  id: string;
  name: string;
  nickname: string;
  isAdmin: boolean;
}

interface ChoreCalendarMobileProps {
  currentUser: User;
}

export default function ChoreCalendarMobile({ currentUser }: ChoreCalendarMobileProps) {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<ChoreAssignment[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Get start of week (Sunday)
  function getStartOfWeek(date: Date): Date {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  // Get week dates
  function getWeekDates(startDate: Date): Date[] {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  }

  const weekDates = getWeekDates(currentWeek);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  useEffect(() => {
    fetchAssignments();
  }, [currentWeek]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/assignments?weekStart=${currentWeek.toISOString()}`);
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      } else {
        console.error('Failed to fetch assignments');
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoreToggle = async (assignmentId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setAssignments(prev => prev.map(assignment => 
          assignment.id === assignmentId 
            ? { ...assignment, completed, completedAt: completed ? new Date().toISOString() : null }
            : assignment
        ));

        // Show success message with points info
        if (completed && data.pointsUpdate?.pointsAwarded) {
          setMessage({
            type: 'success',
            text: `🎉 +${data.pointsUpdate.chorePoints} points!`
          });
        } else {
          setMessage({
            type: 'success',
            text: completed ? '✓ Completed!' : '↶ Unmarked'
          });
        }

        // Clear message after 2 seconds
        setTimeout(() => setMessage(null), 2000);
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: 'Failed to update'
        });
        setTimeout(() => setMessage(null), 2000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Update failed'
      });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getAssignmentsForDate = (date: Date): ChoreAssignment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return assignments.filter(assignment => 
      assignment.date.split('T')[0] === dateStr
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const selectedDateAssignments = getAssignmentsForDate(selectedDate);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📅 Chores</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 bg-gray-100 rounded-lg"
              disabled={loading}
            >
              ←
            </button>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 bg-gray-100 rounded-lg"
              disabled={loading}
            >
              →
            </button>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex space-x-1 overflow-x-auto pb-2">
          {weekDates.map((date, index) => {
            const dayAssignments = getAssignmentsForDate(date);
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isCurrentDay = isToday(date);
            
            return (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`flex-shrink-0 p-3 rounded-lg text-center min-w-[60px] transition-colors ${
                  isSelected 
                    ? 'bg-blue-600 text-white' 
                    : isCurrentDay 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <div className="text-xs font-medium">{dayNames[index]}</div>
                <div className="text-lg font-bold">{date.getDate()}</div>
                {dayAssignments.length > 0 && (
                  <div className={`text-xs mt-1 ${
                    isSelected ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {dayAssignments.length} chore{dayAssignments.length !== 1 ? 's' : ''}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Success/Error Messages */}
        {message && (
          <div className={`mt-3 p-3 rounded-lg text-sm ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Selected Date Chores */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-gray-800">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
            {isToday(selectedDate) && (
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Today
              </span>
            )}
          </h3>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2 text-sm">Loading...</p>
            </div>
          ) : selectedDateAssignments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>No chores assigned for this day!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateAssignments.map((assignment) => {
                const isMyChore = assignment.user.id === currentUser.id;
                const canToggle = isMyChore || currentUser.isAdmin;
                
                return (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-lg border transition-all ${
                      assignment.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-white border-gray-200'
                    }`}
                  >
                    {/* Chore Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className={`font-medium ${
                          assignment.completed ? 'line-through text-green-700' : 'text-gray-900'
                        }`}>
                          {assignment.chore.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Assigned to: {assignment.user.nickname || 'Unknown'}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Points Badge */}
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          assignment.completed 
                            ? 'bg-green-200 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {assignment.chore.points}pts
                        </span>
                        
                        {/* Difficulty Badge */}
                        <span className={`px-2 py-1 rounded text-xs ${getDifficultyColor(assignment.chore.difficulty)}`}>
                          {assignment.chore.difficulty}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    {assignment.chore.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {assignment.chore.description}
                      </p>
                    )}

                    {/* Action Button */}
                    {canToggle && (
                      <button
                        onClick={() => handleChoreToggle(assignment.id, !assignment.completed)}
                        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                          assignment.completed
                            ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {assignment.completed ? '↶ Mark as Incomplete' : '✓ Mark as Complete'}
                      </button>
                    )}

                    {/* Completion Status */}
                    {assignment.completed && assignment.completedAt && (
                      <div className="text-sm text-green-600 mt-2 text-center">
                        ✓ Completed at {new Date(assignment.completedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}

                    {/* Admin Badge */}
                    {!isMyChore && currentUser.isAdmin && (
                      <div className="text-sm text-purple-600 mt-2 text-center font-medium">
                        👑 Admin View
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold text-gray-800 mb-3">This Week</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {assignments.filter(a => a.user.id === currentUser.id).length}
            </div>
            <div className="text-sm text-gray-600">Your Chores</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {assignments.filter(a => a.user.id === currentUser.id && a.completed).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}
