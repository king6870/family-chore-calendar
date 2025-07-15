'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChoreCalendarMobile from './ChoreCalendarMobile';

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

interface ChoreCalendarProps {
  currentUser: User;
}

export default function ChoreCalendar({ currentUser }: ChoreCalendarProps) {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<ChoreAssignment[]>([]);
  const [currentWeek, setCurrentWeek] = useState<Date>(getStartOfWeek(new Date()));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
            text: `🎉 Chore completed! You earned ${data.pointsUpdate.chorePoints} points!`
          });
        } else if (!completed && data.pointsUpdate?.pointsRemoved) {
          setMessage({
            type: 'success',
            text: `Chore unmarked. Points have been adjusted.`
          });
        } else {
          setMessage({
            type: 'success',
            text: completed ? 'Chore marked as completed!' : 'Chore marked as incomplete.'
          });
        }

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({
          type: 'error',
          text: error.error || 'Failed to update chore status'
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An error occurred while updating the chore'
      });
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(getStartOfWeek(new Date()));
  };

  const getAssignmentsForDate = (date: Date): ChoreAssignment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return assignments.filter(assignment => 
      assignment.date.split('T')[0] === dateStr
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
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

  // Show mobile version on small screens
  if (isMobile) {
    return <ChoreCalendarMobile currentUser={currentUser} />;
  }

  // Desktop version
  return (
    <div className="space-y-6">
      {/* Header with Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">📅 Chore Calendar</h2>
            <p className="text-gray-600 mt-1">{formatWeekRange(currentWeek)}</p>
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
              Today
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

        {/* Success/Error Messages */}
        {message && (
          <div className={`mt-4 p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading chores...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-200">
            {weekDates.map((date, index) => {
              const dayAssignments = getAssignmentsForDate(date);
              const isCurrentDay = isToday(date);
              
              return (
                <div key={index} className={`p-4 min-h-[200px] ${isCurrentDay ? 'bg-blue-50' : ''}`}>
                  {/* Day Header */}
                  <div className="mb-3">
                    <div className={`text-sm font-medium ${isCurrentDay ? 'text-blue-800' : 'text-gray-600'}`}>
                      {dayNames[index]}
                    </div>
                    <div className={`text-lg font-bold ${isCurrentDay ? 'text-blue-900' : 'text-gray-900'}`}>
                      {date.getDate()}
                    </div>
                    {isCurrentDay && (
                      <div className="text-xs text-blue-600 font-medium">Today</div>
                    )}
                  </div>

                  {/* Chore Assignments */}
                  <div className="space-y-2">
                    {dayAssignments.length === 0 ? (
                      <div className="text-xs text-gray-400 italic">No chores assigned</div>
                    ) : (
                      dayAssignments.map((assignment) => {
                        const isMyChore = assignment.user.id === currentUser.id;
                        const canToggle = isMyChore || currentUser.isAdmin;
                        
                        return (
                          <div
                            key={assignment.id}
                            className={`p-3 rounded-lg border text-xs transition-all duration-200 ${
                              assignment.completed 
                                ? 'bg-green-50 border-green-200 opacity-75' 
                                : getDifficultyColor(assignment.chore.difficulty)
                            }`}
                          >
                            {/* Chore Header */}
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${
                                  assignment.completed ? 'line-through text-green-700' : ''
                                }`}>
                                  {assignment.chore.name}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">
                                  {assignment.user.nickname || 'Unknown'}
                                </div>
                              </div>
                              
                              {/* Points Badge */}
                              <div className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                                assignment.completed 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {assignment.chore.points}pts
                              </div>
                            </div>

                            {/* Description */}
                            {assignment.chore.description && (
                              <div className="text-xs text-gray-600 mb-2 line-clamp-2">
                                {assignment.chore.description}
                              </div>
                            )}

                            {/* Action Button */}
                            {canToggle && (
                              <button
                                onClick={() => handleChoreToggle(assignment.id, !assignment.completed)}
                                className={`w-full py-1 px-2 rounded text-xs font-medium transition-colors ${
                                  assignment.completed
                                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                                }`}
                              >
                                {assignment.completed ? '↶ Mark Incomplete' : '✓ Mark Complete'}
                              </button>
                            )}

                            {/* Completion Status */}
                            {assignment.completed && assignment.completedAt && (
                              <div className="text-xs text-green-600 mt-1">
                                ✓ Completed {new Date(assignment.completedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}

                            {/* Admin Badge */}
                            {!isMyChore && currentUser.isAdmin && (
                              <div className="text-xs text-purple-600 mt-1 font-medium">
                                👑 Admin View
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Weekly Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800">
              {assignments.length}
            </div>
            <div className="text-sm text-blue-600">Total Chores</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-800">
              {assignments.filter(a => a.completed).length}
            </div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-800">
              {assignments.filter(a => !a.completed).length}
            </div>
            <div className="text-sm text-yellow-600">Remaining</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-800">
              {assignments.filter(a => a.user.id === currentUser.id).length}
            </div>
            <div className="text-sm text-purple-600">Your Chores</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Weekly Progress</span>
            <span>
              {assignments.length > 0 
                ? Math.round((assignments.filter(a => a.completed).length / assignments.length) * 100)
                : 0
              }%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: assignments.length > 0 
                  ? `${(assignments.filter(a => a.completed).length / assignments.length) * 100}%`
                  : '0%'
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
