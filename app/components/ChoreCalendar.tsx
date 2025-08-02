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

  // Drag & Drop states (Admin only)
  const [availableChores, setAvailableChores] = useState<any[]>([]);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [draggedChore, setDraggedChore] = useState<any | null>(null);
  const [draggedAssignment, setDraggedAssignment] = useState<ChoreAssignment | null>(null);
  
  // Cursor error message state
  const [cursorError, setCursorError] = useState<{
    message: string;
    x: number;
    y: number;
    visible: boolean;
  }>({
    message: '',
    x: 0,
    y: 0,
    visible: false
  });

  // Screen warning state
  const [screenWarning, setScreenWarning] = useState<{
    message: string;
    visible: boolean;
    type: 'age' | 'date' | 'duplicate' | 'general';
  }>({
    message: '',
    visible: false,
    type: 'general'
  });

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
    // Fetch additional data for admin drag & drop
    if (currentUser.isAdmin) {
      fetchChoresAndMembers();
    }
  }, [currentWeek, currentUser.isAdmin]);

  const fetchChoresAndMembers = async () => {
    try {
      // Fetch available chores
      const choresRes = await fetch('/api/admin/chores');
      if (choresRes.ok) {
        const choresData = await choresRes.json();
        setAvailableChores(choresData.chores || []);
      }

      // Fetch family members
      const membersRes = await fetch('/api/admin/members');
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        setFamilyMembers(membersData.members || []);
      }
    } catch (error) {
      console.error('Error fetching chores and members:', error);
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      // Ensure we send midnight UTC for the week start
      const weekStartUTC = new Date(currentWeek);
      weekStartUTC.setUTCHours(0, 0, 0, 0);
      const weekStartStr = weekStartUTC.toISOString();
      console.log('Fetching assignments for week starting:', weekStartStr);
      const response = await fetch(`/api/assignments?weekStart=${weekStartStr}`);
      if (response.ok) {
        const data = await response.json();
        // Handle both possible response formats and ensure it's an array
        const assignmentsData = data.assignments || data || [];
        const assignmentsArray = Array.isArray(assignmentsData) ? assignmentsData : [];
        console.log('Fetched assignments:', assignmentsArray.length, assignmentsArray);
        setAssignments(assignmentsArray);
      } else {
        console.error('Failed to fetch assignments');
        setAssignments([]);
        setMessage({ type: 'error', text: 'Failed to load assignments' });
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
      setAssignments([]);
      setMessage({ type: 'error', text: 'Error loading assignments' });
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
        console.log('Chore toggle successful:', data);
        
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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Chore toggle failed:', response.status, errorData);
        setMessage({
          type: 'error',
          text: errorData.error || 'Failed to update chore status'
        });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Network or parsing error during chore toggle:', error);
      setMessage({
        type: 'error',
        text: 'Network error occurred. Please try again.'
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
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Ensure assignments is an array before filtering
    if (!Array.isArray(assignments)) {
      return [];
    }
    
    let filteredAssignments = assignments.filter(assignment => 
      assignment.date.split('T')[0] === dateStr
    );
    
    // Debug logging for Sunday specifically
    if (dayName === 'Sunday') {
      console.log(`Sunday (${dateStr}) assignments:`, filteredAssignments);
      console.log('All assignments:', assignments.map(a => ({ date: a.date.split('T')[0], dayOfWeek: a.dayOfWeek, chore: a.chore.name })));
    }
    
    // For non-admins, only show their own chores
    if (!currentUser.isAdmin) {
      filteredAssignments = filteredAssignments.filter(assignment => 
        assignment.user.id === currentUser.id
      );
    }
    
    return filteredAssignments;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'hard': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Cursor error functions
  const calculateErrorPosition = (clientX: number, clientY: number) => {
    const messageHeight = 80; // Approximate height of error message
    const topMargin = 20;
    const bottomMargin = 20;
    
    let x = clientX;
    let y = clientY - messageHeight - 20; // Try to position above cursor first
    let isAbove = true;
    
    // If too close to top of screen, position below cursor
    if (y < topMargin) {
      y = clientY + 40; // Position below cursor
      isAbove = false;
    }
    
    // If too close to bottom of screen when below, force above
    if (!isAbove && y + messageHeight > window.innerHeight - bottomMargin) {
      y = clientY - messageHeight - 20;
      isAbove = true;
    }
    
    // Ensure x doesn't go off screen edges
    const messageWidth = 200; // Approximate width
    if (x - messageWidth/2 < 10) {
      x = messageWidth/2 + 10;
    } else if (x + messageWidth/2 > window.innerWidth - 10) {
      x = window.innerWidth - messageWidth/2 - 10;
    }
    
    return { x, y, isAbove };
  };

  const showCursorError = (message: string, event: React.DragEvent) => {
    const { x, y } = calculateErrorPosition(event.clientX, event.clientY);
    
    setCursorError({
      message,
      x,
      y,
      visible: true
    });
  };

  const hideCursorError = () => {
    setCursorError(prev => ({ ...prev, visible: false }));
  };

  const updateCursorErrorPosition = (event: React.DragEvent) => {
    if (cursorError.visible) {
      const { x, y } = calculateErrorPosition(event.clientX, event.clientY);
      
      setCursorError(prev => ({
        ...prev,
        x,
        y
      }));
    }
  };

  // Screen warning functions
  const showScreenWarning = (message: string, type: 'age' | 'date' | 'duplicate' | 'general' = 'general') => {
    setScreenWarning({
      message,
      visible: true,
      type
    });

    // Auto-hide after 5 seconds
    setTimeout(() => {
      setScreenWarning(prev => ({ ...prev, visible: false }));
    }, 5000);
  };

  const hideScreenWarning = () => {
    setScreenWarning(prev => ({ ...prev, visible: false }));
  };

  // Validation functions
  const validateDrop = (targetDate: Date, targetUserId: string, item: any): { error: string | null; type?: 'age' | 'date' | 'duplicate' | 'general' } => {
    // Check if date is in the past (but allow today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDateOnly = new Date(targetDate);
    targetDateOnly.setHours(0, 0, 0, 0);
    
    if (targetDateOnly < today) {
      return { 
        error: "❌ Cannot assign chores to past dates!", 
        type: 'date' 
      };
    }

    // If dropping a chore (not an assignment)
    if (draggedChore) {
      const targetUser = familyMembers.find(m => m.id === targetUserId);
      if (!targetUser) {
        return { 
          error: "❌ Invalid family member!", 
          type: 'general' 
        };
      }

      // Check age requirement
      const choreMinAge = (draggedChore as any).minAge;
      if (choreMinAge && targetUser.age < choreMinAge) {
        return { 
          error: `❌ ${targetUser.nickname} is too young!\nRequires age ${choreMinAge}+ (they are ${targetUser.age})`,
          type: 'age'
        };
      }

      // Check for duplicate assignment
      const existingAssignment = assignments.find(a => 
        a.user.id === targetUserId && 
        a.chore.id === draggedChore.id && 
        a.date.split('T')[0] === targetDate.toISOString().split('T')[0]
      );

      if (existingAssignment) {
        return { 
          error: `❌ ${targetUser.nickname} already has this chore on this day!`,
          type: 'duplicate'
        };
      }
    }

    // If moving an assignment
    if (draggedAssignment) {
      const targetUser = familyMembers.find(m => m.id === targetUserId);
      if (!targetUser) {
        return { 
          error: "❌ Invalid family member!", 
          type: 'general' 
        };
      }

      // Check age requirement for the chore being moved
      const choreMinAge = (draggedAssignment.chore as any).minAge;
      if (choreMinAge && targetUser.age < choreMinAge) {
        return { 
          error: `❌ ${targetUser.nickname} is too young!\nRequires age ${choreMinAge}+ (they are ${targetUser.age})`,
          type: 'age'
        };
      }

      // Check for duplicate if moving to different user/date
      if (targetUserId !== draggedAssignment.user.id || 
          targetDate.toISOString().split('T')[0] !== draggedAssignment.date.split('T')[0]) {
        const existingAssignment = assignments.find(a => 
          a.user.id === targetUserId && 
          a.chore.id === draggedAssignment.chore.id && 
          a.date.split('T')[0] === targetDate.toISOString().split('T')[0] &&
          a.id !== draggedAssignment.id
        );

        if (existingAssignment) {
          return { 
            error: `❌ ${targetUser.nickname} already has this chore on this day!`,
            type: 'duplicate'
          };
        }
      }
    }

    return { error: null }; // No error
  };

  const handleDragStart = (e: React.DragEvent, item: any, type: 'chore' | 'assignment') => {
    if (!currentUser.isAdmin) return;
    
    if (type === 'chore') {
      setDraggedChore(item);
      setDraggedAssignment(null);
    } else {
      setDraggedAssignment(item);
      setDraggedChore(null);
    }
    e.dataTransfer.effectAllowed = 'move';
    hideCursorError(); // Hide any existing error
  };

  const handleDragOver = (e: React.DragEvent, targetDate?: Date, targetUserId?: string) => {
    if (!currentUser.isAdmin) return;
    e.preventDefault();
    
    // Update cursor error position
    updateCursorErrorPosition(e);
    
    // Validate drop if we have target info
    if (targetDate && targetUserId && (draggedChore || draggedAssignment)) {
      const validation = validateDrop(targetDate, targetUserId, draggedChore || draggedAssignment);
      if (validation.error) {
        e.dataTransfer.dropEffect = 'none';
        showCursorError(validation.error, e);
      } else {
        e.dataTransfer.dropEffect = 'move';
        hideCursorError();
      }
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Hide error when leaving drop zone
    hideCursorError();
  };

  const handleDragEnd = (e: React.DragEvent) => {
    // Clean up on drag end
    hideCursorError();
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date, targetUserId?: string) => {
    e.preventDefault();
    hideCursorError(); // Hide cursor error message
    
    if (!currentUser.isAdmin || (!draggedChore && !draggedAssignment)) return;

    // Validate the drop
    if (targetUserId) {
      const validation = validateDrop(targetDate, targetUserId, draggedChore || draggedAssignment);
      if (validation.error) {
        // Show screen warning with appropriate message
        const targetUser = familyMembers.find(m => m.id === targetUserId);
        let warningMessage = '';
        
        switch (validation.type) {
          case 'age':
            const minAge = (draggedChore as any)?.minAge || (draggedAssignment?.chore as any)?.minAge;
            warningMessage = `🚫 Age Restriction Violation!\n\n${targetUser?.nickname || 'This family member'} is too young for "${draggedChore?.name || draggedAssignment?.chore.name}".\n\nRequired age: ${minAge}+\nActual age: ${targetUser?.age}\n\nThe chore has been returned to the available chores.`;
            break;
          case 'date':
            warningMessage = `🚫 Invalid Date!\n\nYou cannot assign chores to past dates.\n\nPlease select today or a future date.\n\nThe chore has been returned to the available chores.`;
            break;
          case 'duplicate':
            warningMessage = `🚫 Duplicate Assignment!\n\n${targetUser?.nickname || 'This family member'} already has "${draggedChore?.name || draggedAssignment?.chore.name}" assigned for this day.\n\nPlease choose a different day or family member.\n\nThe chore has been returned to the available chores.`;
            break;
          default:
            warningMessage = `🚫 Invalid Assignment!\n\n${validation.error.replace(/❌\s*/, '')}\n\nThe chore has been returned to the available chores.`;
        }
        
        showScreenWarning(warningMessage, validation.type);
        
        // Reset drag state (this "returns" the chore to available chores)
        setDraggedChore(null);
        setDraggedAssignment(null);
        return;
      }
    }

    try {
      if (draggedChore && targetUserId) {
        // Creating new assignment
        const response = await fetch('/api/assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: targetUserId,
            choreId: draggedChore.id,
            date: targetDate.toISOString().split('T')[0],
            dayOfWeek: targetDate.toLocaleDateString('en-US', { weekday: 'long' })
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Assignment created successfully:', result);
          console.log('Target date:', targetDate.toISOString().split('T')[0]);
          console.log('Day of week:', targetDate.toLocaleDateString('en-US', { weekday: 'long' }));
          
          // Handle both new assignments and existing assignments
          if (result.message && result.message.includes('already exists')) {
            setMessage({ type: 'success', text: 'Chore is already assigned to this user on this date' });
          } else {
            setMessage({ type: 'success', text: 'Chore assigned successfully!' });
          }
          
          await fetchAssignments(); // Wait for assignments to refresh
          console.log('Assignments after refresh:', assignments.length);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Assignment creation failed:', response.status, errorData);
          setMessage({ type: 'error', text: errorData.error || 'Failed to assign chore' });
        }
      } else if (draggedAssignment && targetUserId) {
        // Moving existing assignment
        const response = await fetch(`/api/assignments/${draggedAssignment.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: targetUserId,
            date: targetDate.toISOString().split('T')[0],
            dayOfWeek: targetDate.toLocaleDateString('en-US', { weekday: 'long' })
          })
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Assignment moved successfully:', result);
          setMessage({ type: 'success', text: 'Chore moved successfully!' });
          await fetchAssignments(); // Wait for assignments to refresh
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.error('Assignment move failed:', response.status, errorData);
          setMessage({ type: 'error', text: errorData.error || 'Failed to move chore' });
        }
      }
    } catch (error) {
      console.error('Network or parsing error:', error);
      setMessage({ type: 'error', text: 'Network error occurred. Please try again.' });
    }

    setDraggedChore(null);
    setDraggedAssignment(null);
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    if (!currentUser.isAdmin || !confirm('Are you sure you want to remove this chore assignment?')) return;

    try {
      const response = await fetch(`/api/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Assignment deleted successfully:', result);
        setMessage({ type: 'success', text: 'Chore assignment removed!' });
        await fetchAssignments(); // Wait for assignments to refresh
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Assignment deletion failed:', response.status, errorData);
        setMessage({ type: 'error', text: errorData.error || 'Failed to remove assignment' });
      }
    } catch (error) {
      console.error('Network or parsing error during deletion:', error);
      setMessage({ type: 'error', text: 'Network error occurred. Please try again.' });
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
            <h2 className="text-2xl font-bold text-gray-800">
              {currentUser.isAdmin ? '📅 Family Chore Calendar' : '📅 Your Chore Calendar'}
            </h2>
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

        {/* Available Chores Panel (Admin Only) */}
        {currentUser.isAdmin && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">🧹 Available Chores (Drag to Any Family Member)</h3>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 min-h-[80px]">
              {availableChores.map(chore => (
                <div
                  key={chore.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, chore, 'chore')}
                  onDragEnd={handleDragEnd}
                  className={`px-3 py-2 rounded-lg border-2 cursor-move hover:shadow-md transition-all ${getDifficultyColor(chore.difficulty)}`}
                  title={`${chore.name} - ${chore.points} points - Min age: ${(chore as any).minAge || 'Any'}`}
                >
                  <div className="text-sm font-medium">{chore.name}</div>
                  <div className="text-xs">{chore.points}pts • Age {(chore as any).minAge || 'Any'}+</div>
                </div>
              ))}
              {availableChores.length === 0 && (
                <div className="text-gray-500 text-sm">No chores available. Create some chores first!</div>
              )}
            </div>
            
            {/* Admin Instructions - Right after Available Chores */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📋 Admin Grid Calendar Instructions:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Grid Layout:</strong> Days across the top, family members down the side</li>
                <li>• <strong>Assign Chores:</strong> Drag chores from panel above to any member's day cell</li>
                <li>• <strong>Move Assignments:</strong> Drag existing chores between days or people</li>
                <li>• <strong>Remove Assignments:</strong> Click the ✕ button on any assignment</li>
                <li>• <strong>Age Validation:</strong> System prevents assigning age-inappropriate chores</li>
                <li>• <strong>Visual Overview:</strong> See entire family's week at a glance</li>
              </ul>
            </div>
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
        ) : currentUser.isAdmin ? (
          /* Admin Grid View - Family Members × Days */
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row - Days of Week */}
              <div className="grid grid-cols-8 gap-2 p-4 bg-gray-50 border-b">
                <div className="font-semibold text-center py-2">Family Member</div>
                {weekDates.map((date, index) => {
                  const isCurrentDay = isToday(date);
                  return (
                    <div key={index} className={`font-semibold text-center py-2 rounded ${
                      isCurrentDay ? 'bg-blue-100 text-blue-800' : 'bg-white'
                    }`}>
                      <div className="text-sm">{dayNames[index]}</div>
                      <div className="text-lg">{date.getDate()}</div>
                      {isCurrentDay && <div className="text-xs text-blue-600">Today</div>}
                    </div>
                  );
                })}
              </div>

              {/* Member Rows */}
              {familyMembers.map(member => (
                <div key={member.id} className="grid grid-cols-8 gap-2 p-2 border-b hover:bg-gray-50">
                  {/* Member Info Column */}
                  <div className="flex items-center justify-center py-4 bg-gray-50 rounded font-medium">
                    <div className="text-center">
                      <div className="font-semibold">{member.nickname}</div>
                      <div className="text-xs text-gray-600">Age {member.age}</div>
                      <div className="text-xs text-blue-600">
                        {assignments.filter(a => a.user.id === member.id).length} chores
                      </div>
                    </div>
                  </div>

                  {/* Day Columns */}
                  {weekDates.map((date, dayIndex) => {
                    const dayAssignments = assignments.filter(assignment => 
                      assignment.user.id === member.id && 
                      assignment.date.split('T')[0] === date.toISOString().split('T')[0]
                    );
                    const isCurrentDay = isToday(date);

                    return (
                      <div
                        key={`${member.id}-${dayIndex}`}
                        className={`min-h-[120px] p-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors ${
                          isCurrentDay ? 'bg-blue-25' : ''
                        }`}
                        onDragOver={(e) => handleDragOver(e, date, member.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, date, member.id)}
                      >
                        {/* Day Assignments */}
                        <div className="space-y-1">
                          {dayAssignments.length === 0 ? (
                            <div className="text-xs text-gray-400 italic text-center py-4">
                              Drop chores here
                            </div>
                          ) : (
                            dayAssignments.map((assignment) => (
                              <div
                                key={assignment.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, assignment, 'assignment')}
                                onDragEnd={handleDragEnd}
                                className={`p-2 rounded border text-xs cursor-move hover:shadow-md transition-all ${
                                  assignment.completed 
                                    ? 'bg-green-50 border-green-200 opacity-75' 
                                    : getDifficultyColor(assignment.chore.difficulty)
                                }`}
                              >
                                {/* Chore Header */}
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex-1 min-w-0">
                                    <div className={`font-medium text-xs truncate ${
                                      assignment.completed ? 'line-through text-green-700' : ''
                                    }`}>
                                      {assignment.chore.name}
                                    </div>
                                  </div>
                                  
                                  {/* Points & Delete */}
                                  <div className="flex items-center space-x-1 ml-1">
                                    <div className={`px-1 py-0.5 rounded text-xs font-medium ${
                                      assignment.completed 
                                        ? 'bg-green-200 text-green-800' 
                                        : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {assignment.chore.points}pts
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAssignment(assignment.id);
                                      }}
                                      className="text-red-500 hover:text-red-700 text-xs"
                                      title="Remove assignment"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>

                                {/* Completion Status */}
                                {assignment.completed && (
                                  <div className="text-xs text-green-600">
                                    ✓ Complete
                                  </div>
                                )}

                                {/* Toggle Button */}
                                <button
                                  onClick={() => handleChoreToggle(assignment.id, !assignment.completed)}
                                  className={`w-full py-1 px-1 rounded text-xs font-medium transition-colors mt-1 ${
                                    assignment.completed
                                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                                  }`}
                                >
                                  {assignment.completed ? '↶' : '✓'}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {familyMembers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No family members found.</p>
                  <p className="text-sm">Add family members to start assigning chores!</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Regular User View - Original Calendar */
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {currentUser.isAdmin ? 'Family Weekly Summary' : 'Your Weekly Summary'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-800">
              {currentUser.isAdmin 
                ? assignments.length 
                : assignments.filter(a => a.user.id === currentUser.id).length
              }
            </div>
            <div className="text-sm text-blue-600">
              {currentUser.isAdmin ? 'Total Chores' : 'Your Chores'}
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-800">
              {currentUser.isAdmin 
                ? assignments.filter(a => a.completed).length
                : assignments.filter(a => a.user.id === currentUser.id && a.completed).length
              }
            </div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-800">
              {currentUser.isAdmin 
                ? assignments.filter(a => !a.completed).length
                : assignments.filter(a => a.user.id === currentUser.id && !a.completed).length
              }
            </div>
            <div className="text-sm text-yellow-600">Remaining</div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-800">
              {assignments.filter(a => a.user.id === currentUser.id).length}
            </div>
            <div className="text-sm text-purple-600">
              {currentUser.isAdmin ? 'Your Chores' : 'This Week'}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>
              {currentUser.isAdmin ? 'Family Progress' : 'Your Progress'}
            </span>
            <span>
              {(() => {
                const relevantAssignments = currentUser.isAdmin 
                  ? assignments 
                  : assignments.filter(a => a.user.id === currentUser.id);
                const completedCount = relevantAssignments.filter(a => a.completed).length;
                const totalCount = relevantAssignments.length;
                return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
              })()}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-300"
              style={{
                width: (() => {
                  const relevantAssignments = currentUser.isAdmin 
                    ? assignments 
                    : assignments.filter(a => a.user.id === currentUser.id);
                  const completedCount = relevantAssignments.filter(a => a.completed).length;
                  const totalCount = relevantAssignments.length;
                  return totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%';
                })()
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Cursor Error Message */}
      <CursorErrorMessage error={cursorError} />
      
      {/* Screen Warning Modal */}
      <ScreenWarning warning={screenWarning} onClose={hideScreenWarning} />
    </div>
  );
}

// Cursor Error Message Component
function CursorErrorMessage({ error }: { error: { message: string; x: number; y: number; visible: boolean } }) {
  if (!error.visible) return null;

  // Determine if message is above or below cursor based on y position
  const isAboveCursor = error.y < window.innerHeight / 2;

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${error.x}px`,
        top: `${error.y}px`,
        transform: 'translate(-50%, 0)'
      }}
    >
      <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-2xl border-2 border-red-700 max-w-xs relative">
        <div className="text-sm font-bold whitespace-pre-line text-center">
          {error.message}
        </div>
        
        {/* Arrow pointing to cursor - direction depends on position */}
        {isAboveCursor ? (
          // Arrow pointing down (message is above cursor)
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-red-600"></div>
          </div>
        ) : (
          // Arrow pointing up (message is below cursor)
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-red-600"></div>
          </div>
        )}
      </div>
    </div>
  );
}

// Screen Warning Component
function ScreenWarning({ 
  warning, 
  onClose 
}: { 
  warning: { message: string; visible: boolean; type: 'age' | 'date' | 'duplicate' | 'general' };
  onClose: () => void;
}) {
  if (!warning.visible) return null;

  const getWarningColor = () => {
    switch (warning.type) {
      case 'age': return 'border-orange-500 bg-orange-50';
      case 'date': return 'border-red-500 bg-red-50';
      case 'duplicate': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getWarningIcon = () => {
    switch (warning.type) {
      case 'age': return '👶';
      case 'date': return '📅';
      case 'duplicate': return '🔄';
      default: return '⚠️';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`max-w-md w-full mx-4 p-6 rounded-lg border-4 shadow-2xl ${getWarningColor()}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <span className="text-3xl mr-3">{getWarningIcon()}</span>
            <h3 className="text-xl font-bold text-gray-800">Assignment Blocked</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="text-gray-700 whitespace-pre-line text-sm leading-relaxed mb-6">
          {warning.message}
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
