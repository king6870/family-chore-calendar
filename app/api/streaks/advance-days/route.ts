import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to get current date in timezone
function getCurrentDateInTimezone(timezone: string): Date {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const dateString = formatter.format(now);
  return new Date(dateString + 'T00:00:00.000Z');
}

// Helper function to check if it's midnight in timezone (within last hour)
function isMidnightInTimezone(timezone: string): boolean {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const timeString = formatter.format(now);
  const [hour, minute] = timeString.split(':').map(Number);
  
  // Check if it's between 00:00 and 01:00 (within the midnight hour)
  return hour === 0;
}

// POST - Advance streak days for families where it's midnight
export async function POST(request: NextRequest) {
  try {
    // Get all families with their timezones
    const families = await prisma.family.findMany({
      select: {
        id: true,
        timezone: true,
        name: true
      }
    });

    const results = [];

    for (const family of families) {
      const timezone = family.timezone || 'UTC';
      
      // Only process families where it's currently midnight (within the hour)
      if (!isMidnightInTimezone(timezone)) {
        continue;
      }

      const currentDate = getCurrentDateInTimezone(timezone);
      
      // Get all active streaks for this family
      const activeStreaks = await prisma.streak.findMany({
        where: {
          familyId: family.id,
          status: 'active'
        },
        include: {
          tasks: true,
          days: {
            include: {
              taskCompletions: {
                include: {
                  task: true
                }
              }
            },
            orderBy: { dayNumber: 'asc' }
          },
          assignee: { select: { name: true, nickname: true } }
        }
      });

      for (const streak of activeStreaks) {
        const currentDay = streak.days.find(d => d.dayNumber === streak.currentDay);
        
        if (!currentDay) continue;

        // Check if current day is completed
        const requiredTasks = currentDay.taskCompletions.filter(tc => tc.task.isRequired);
        const completedRequiredTasks = requiredTasks.filter(tc => tc.completed);
        const dayCompleted = requiredTasks.length === completedRequiredTasks.length;

        // Check if we should advance to next day
        const currentDayDate = new Date(currentDay.date);
        currentDayDate.setUTCHours(0, 0, 0, 0);
        
        const nextDayDate = new Date(currentDayDate);
        nextDayDate.setDate(currentDayDate.getDate() + 1);

        // If it's time for the next day and current day is completed
        if (dayCompleted && currentDate.getTime() >= nextDayDate.getTime()) {
          if (streak.currentDay < streak.duration) {
            // Advance to next day
            const nextDay = streak.currentDay + 1;
            await prisma.streak.update({
              where: { id: streak.id },
              data: { currentDay: nextDay }
            });

            // Create task completions for next day
            const nextDayRecord = streak.days.find(d => d.dayNumber === nextDay);
            if (nextDayRecord) {
              const existingCompletions = await prisma.streakTaskCompletion.findMany({
                where: { dayId: nextDayRecord.id }
              });

              if (existingCompletions.length === 0) {
                const taskCompletions = streak.tasks.map(task => ({
                  taskId: task.id,
                  dayId: nextDayRecord.id,
                  completed: false
                }));

                await prisma.streakTaskCompletion.createMany({
                  data: taskCompletions
                });
              }
            }

            results.push({
              streakId: streak.id,
              title: streak.title,
              assignee: streak.assignee.nickname || streak.assignee.name,
              action: 'advanced_to_day',
              newDay: nextDay,
              timezone: timezone
            });
          } else if (streak.currentDay === streak.duration) {
            // Complete the streak
            await prisma.streak.update({
              where: { id: streak.id },
              data: { 
                status: 'completed',
                completedAt: new Date()
              }
            });

            // Award points
            await prisma.user.update({
              where: { id: streak.assigneeId },
              data: {
                totalPoints: {
                  increment: streak.pointsReward
                }
              }
            });

            // Log completion
            await prisma.activityLog.create({
              data: {
                userId: streak.assigneeId,
                familyId: family.id,
                action: 'completed_streak',
                details: `Completed streak "${streak.title}" and earned ${streak.pointsReward} points!`
              }
            });

            results.push({
              streakId: streak.id,
              title: streak.title,
              assignee: streak.assignee.nickname || streak.assignee.name,
              action: 'completed_streak',
              pointsAwarded: streak.pointsReward,
              timezone: timezone
            });
          }
        }
        // If current day is not completed and the day has passed, fail the streak
        else if (!dayCompleted && currentDate.getTime() > nextDayDate.getTime()) {
          await prisma.streak.update({
            where: { id: streak.id },
            data: { 
              status: 'failed',
              failedAt: new Date()
            }
          });

          // Log failure
          await prisma.activityLog.create({
            data: {
              userId: streak.assigneeId,
              familyId: family.id,
              action: 'failed_streak',
              details: `Streak "${streak.title}" failed due to missed day ${streak.currentDay}`
            }
          });

          results.push({
            streakId: streak.id,
            title: streak.title,
            assignee: streak.assignee.nickname || streak.assignee.name,
            action: 'failed_streak',
            missedDay: streak.currentDay,
            timezone: timezone
          });
        }
      }
    }

    return NextResponse.json({
      message: 'Streak advancement check completed',
      processedFamilies: families.filter(f => isMidnightInTimezone(f.timezone || 'UTC')).length,
      totalFamilies: families.length,
      results: results
    });
  } catch (error) {
    console.error('Error advancing streak days:', error);
    return NextResponse.json({ error: 'Failed to advance streak days' }, { status: 500 });
  }
}

// GET - Manual trigger for testing
export async function GET(request: NextRequest) {
  return POST(request);
}
