'use client';

import React from 'react';

interface StreakDay {
  id: string;
  dayNumber: number;
  date: string;
  completed: boolean;
}

interface StreakProgressProps {
  streak: {
    id: string;
    title: string;
    duration: number;
    currentDay: number;
    status: string;
    days: StreakDay[];
  };
  showDetails?: boolean;
}

export default function StreakProgress({ streak, showDetails = false }: StreakProgressProps) {
  const getProgressPercentage = () => {
    if (streak.status === 'completed') return 100;
    if (streak.status === 'pending') return 0;
    
    const completedDays = streak.days.filter(d => d.completed).length;
    return Math.round((completedDays / streak.duration) * 100);
  };

  const getDayStatus = (dayNumber: number) => {
    const day = streak.days.find(d => d.dayNumber === dayNumber);
    
    if (!day) {
      if (dayNumber <= streak.currentDay && streak.status === 'active') {
        return 'current'; // Current day
      }
      return 'future'; // Future day
    }
    
    if (day.completed) return 'completed';
    if (dayNumber === streak.currentDay && streak.status === 'active') return 'current';
    if (dayNumber < streak.currentDay) return 'missed';
    return 'future';
  };

  const getDayColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'current': return 'bg-blue-500 text-white animate-pulse';
      case 'missed': return 'bg-red-500 text-white';
      case 'future': return 'bg-gray-200 text-gray-600';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'current': return '●';
      case 'missed': return '✗';
      case 'future': return '○';
      default: return '○';
    }
  };

  const progressPercentage = getProgressPercentage();

  return (
    <div className="bg-white rounded-lg border p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">{streak.title}</h3>
        <div className="text-sm text-gray-600">
          {streak.status === 'completed' ? (
            <span className="text-green-600 font-medium">🎉 Completed!</span>
          ) : streak.status === 'failed' ? (
            <span className="text-red-600 font-medium">💔 Failed</span>
          ) : streak.status === 'active' ? (
            <span className="text-blue-600 font-medium">
              Day {streak.currentDay} of {streak.duration}
            </span>
          ) : (
            <span className="text-yellow-600 font-medium">⏳ Pending</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{progressPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              streak.status === 'completed' ? 'bg-green-500' :
              streak.status === 'failed' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {Array.from({ length: streak.duration }, (_, i) => {
          const dayNumber = i + 1;
          const status = getDayStatus(dayNumber);
          const day = streak.days.find(d => d.dayNumber === dayNumber);
          
          return (
            <div
              key={dayNumber}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
                ${getDayColor(status)}
                transition-all duration-200 hover:scale-110
              `}
              title={
                day ? 
                  `Day ${dayNumber}: ${new Date(day.date).toLocaleDateString()} - ${status}` :
                  `Day ${dayNumber} - ${status}`
              }
            >
              {showDetails ? getStatusIcon(status) : dayNumber}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showDetails && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Current</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
            <span>Future</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-green-600">
                {streak.days.filter(d => d.completed).length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div>
              <div className="font-semibold text-red-600">
                {streak.days.filter(d => !d.completed && d.dayNumber < streak.currentDay).length}
              </div>
              <div className="text-gray-600">Missed</div>
            </div>
            <div>
              <div className="font-semibold text-gray-600">
                {streak.duration - streak.days.length}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
