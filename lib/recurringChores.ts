// Recurring Chores Management System
// Handles automatic chore generation based on recurrence patterns

export interface RecurrencePattern {
  type: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  interval?: number; // For custom intervals (every N days/weeks)
  days?: string[]; // Days of week for weekly/biweekly patterns
  endDate?: Date; // Optional end date
}

export interface RecurringChore {
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
  isActive?: boolean; // Make optional to handle missing field
  createdAt?: Date;
  updatedAt?: Date;
}

// Get next occurrence date based on recurrence pattern
export function getNextOccurrence(
  lastDate: Date,
  pattern: RecurrencePattern
): Date | null {
  const next = new Date(lastDate);
  
  switch (pattern.type) {
    case 'daily':
      next.setDate(next.getDate() + (pattern.interval || 1));
      break;
      
    case 'weekly':
      // Find next occurrence of specified days
      return getNextWeeklyOccurrence(lastDate, pattern.days || []);
      
    case 'biweekly':
      // Same as weekly but add 14 days to the base
      const weeklyNext = getNextWeeklyOccurrence(lastDate, pattern.days || []);
      if (weeklyNext) {
        weeklyNext.setDate(weeklyNext.getDate() + 14);
        return weeklyNext;
      }
      return null;
      
    case 'monthly':
      next.setMonth(next.getMonth() + (pattern.interval || 1));
      break;
      
    case 'custom':
      if (pattern.interval) {
        next.setDate(next.getDate() + pattern.interval);
      }
      break;
      
    default:
      return null;
  }
  
  // Check if we've passed the end date
  if (pattern.endDate && next > pattern.endDate) {
    return null;
  }
  
  return next;
}

// Get next weekly occurrence for specific days
function getNextWeeklyOccurrence(fromDate: Date, days: string[]): Date | null {
  if (days.length === 0) return null;
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNumbers = days.map(day => dayNames.indexOf(day.toLowerCase())).filter(d => d !== -1);
  
  if (dayNumbers.length === 0) return null;
  
  const current = new Date(fromDate);
  const currentDay = current.getDay();
  
  // Find the next occurrence within the next 7 days
  for (let i = 1; i <= 7; i++) {
    const checkDay = (currentDay + i) % 7;
    if (dayNumbers.includes(checkDay)) {
      const nextDate = new Date(current);
      nextDate.setDate(nextDate.getDate() + i);
      return nextDate;
    }
  }
  
  return null;
}

// Generate chores for a specific date range
export function generateChoresForDateRange(
  recurringChore: RecurringChore,
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  const pattern = parseRecurrencePattern(recurringChore);
  
  if (!pattern || recurringChore.isActive === false) return dates;
  
  let currentDate = new Date(recurringChore.lastGenerated || startDate);
  
  while (currentDate <= endDate) {
    const nextDate = getNextOccurrence(currentDate, pattern);
    if (!nextDate || nextDate > endDate) break;
    
    if (nextDate >= startDate) {
      dates.push(new Date(nextDate));
    }
    
    currentDate = nextDate;
  }
  
  return dates;
}

// Parse database fields into RecurrencePattern
export function parseRecurrencePattern(chore: RecurringChore): RecurrencePattern | null {
  if (!chore.isRecurring || !chore.recurrenceType) return null;
  
  const pattern: RecurrencePattern = {
    type: chore.recurrenceType as RecurrencePattern['type'],
    interval: chore.recurrenceInterval || undefined,
    endDate: chore.recurrenceEndDate || undefined
  };
  
  if (chore.recurrenceDays) {
    try {
      pattern.days = JSON.parse(chore.recurrenceDays);
    } catch (e) {
      console.error('Failed to parse recurrence days:', e);
    }
  }
  
  return pattern;
}

// Format recurrence pattern for display
export function formatRecurrenceDescription(pattern: RecurrencePattern): string {
  switch (pattern.type) {
    case 'daily':
      return pattern.interval === 1 
        ? 'Daily' 
        : `Every ${pattern.interval} days`;
        
    case 'weekly':
      if (!pattern.days || pattern.days.length === 0) return 'Weekly';
      if (pattern.days.length === 1) return `Every ${pattern.days[0]}`;
      return `Weekly on ${pattern.days.join(', ')}`;
      
    case 'biweekly':
      if (!pattern.days || pattern.days.length === 0) return 'Biweekly';
      return `Biweekly on ${pattern.days.join(', ')}`;
      
    case 'monthly':
      return pattern.interval === 1 
        ? 'Monthly' 
        : `Every ${pattern.interval} months`;
        
    case 'custom':
      return pattern.interval 
        ? `Every ${pattern.interval} days`
        : 'Custom schedule';
        
    default:
      return 'Unknown pattern';
  }
}

// Validate recurrence pattern
export function validateRecurrencePattern(pattern: Partial<RecurrencePattern>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!pattern.type) {
    errors.push('Recurrence type is required');
  }
  
  if (pattern.type === 'custom' && (!pattern.interval || pattern.interval < 1)) {
    errors.push('Custom interval must be at least 1 day');
  }
  
  if ((pattern.type === 'weekly' || pattern.type === 'biweekly') && 
      (!pattern.days || pattern.days.length === 0)) {
    errors.push('At least one day must be selected for weekly/biweekly patterns');
  }
  
  if (pattern.endDate && pattern.endDate <= new Date()) {
    errors.push('End date must be in the future');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Get available recurrence options for UI
export function getRecurrenceOptions() {
  return [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Biweekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'custom', label: 'Custom Interval' }
  ];
}

export function getDayOptions() {
  return [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];
}
