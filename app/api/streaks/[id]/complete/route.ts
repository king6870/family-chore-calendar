import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to get current date in family timezone
function getCurrentDateInTimezone(timezone: string): Date {
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  const formatter = new Intl.DateTimeFormat('en-CA', options); // en-CA gives YYYY-MM-DD format
  const dateString = formatter.format(now);
  return new Date(dateString + 'T00:00:00.000Z');
}

// Helper function to check if it's the correct day to complete tasks
function canCompleteTasksToday(streakDay: any, familyTimezone: string): boolean {
  const currentDate = getCurrentDateInTimezone(familyTimezone);
  const streakDate = new Date(streakDay.date);
  streakDate.setUTCHours(0, 0, 0, 0);
  
  return currentDate.getTime() >= streakDate.getTime();
}

// POST - Complete a task for today's streak day
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 });
    }

    const { taskId, optionId, completed } = await request.json();

    if (!taskId || typeof completed !== 'boolean') {
      return NextResponse.json({ 
        error: 'Task ID and completed status are required' 
      }, { status: 400 });
    }

    const streak = await prisma.streak.findFirst({
      where: { 
        id: params.id,
        familyId: user.familyId,
        status: 'active'
      },
      include: {
        tasks: {
          include: {
            options: true
          }
        },
        days: {
          include: {
            taskCompletions: true
          },
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    if (!streak) {
      return NextResponse.json({ error: 'Active streak not found' }, { status: 404 });
    }

    // Only the assignee or admins/owners can complete tasks
    if (streak.assigneeId !== user.id && !user.isAdmin && !user.isOwner) {
      return NextResponse.json({ error: 'You can only complete your own streak tasks' }, { status: 403 });
    }

    // Find current day
    const currentDay = streak.days.find(d => d.dayNumber === streak.currentDay);
    if (!currentDay) {
      return NextResponse.json({ error: 'Current day not found' }, { status: 400 });
    }

    // Check if user can complete tasks today (timezone-aware)
    const familyTimezone = user.family?.timezone || 'UTC';
    if (!canCompleteTasksToday(currentDay, familyTimezone)) {
      const streakDate = new Date(currentDay.date);
      return NextResponse.json({ 
        error: `You can only complete tasks on or after ${streakDate.toLocaleDateString()}. Check back tomorrow!` 
      }, { status: 400 });
    }

    // Find the task completion
    const taskCompletion = currentDay.taskCompletions.find(tc => tc.taskId === taskId);
    if (!taskCompletion) {
      return NextResponse.json({ error: 'Task completion not found' }, { status: 400 });
    }

    // Update task completion
    const updatedCompletion = await prisma.streakTaskCompletion.update({
      where: { id: taskCompletion.id },
      data: {
        completed,
        completedAt: completed ? new Date() : null,
        optionId: optionId || null,
        // If admin/owner is unchecking, record who did it
        uncheckedBy: (!completed && (user.isAdmin || user.isOwner) && streak.assigneeId !== user.id) ? user.id : null,
        uncheckedAt: (!completed && (user.isAdmin || user.isOwner) && streak.assigneeId !== user.id) ? new Date() : null
      }
    });

    // Check if all required tasks for today are completed
    const updatedDay = await prisma.streakDay.findUnique({
      where: { id: currentDay.id },
      include: {
        taskCompletions: {
          include: {
            task: true
          }
        }
      }
    });

    if (updatedDay) {
      const requiredTasks = updatedDay.taskCompletions.filter(tc => tc.task.isRequired);
      const completedRequiredTasks = requiredTasks.filter(tc => tc.completed);
      const dayCompleted = requiredTasks.length === completedRequiredTasks.length;

      // Update day completion status
      await prisma.streakDay.update({
        where: { id: currentDay.id },
        data: { completed: dayCompleted }
      });

      // Only advance to next day if all tasks are completed AND it's the right time
      if (dayCompleted && streak.currentDay < streak.duration) {
        // Check if we should advance to next day (timezone-aware)
        const currentDateInTimezone = getCurrentDateInTimezone(familyTimezone);
        const nextDayDate = new Date(currentDay.date);
        nextDayDate.setDate(nextDayDate.getDate() + 1);
        nextDayDate.setUTCHours(0, 0, 0, 0);

        // Only advance if the next day has arrived in family timezone
        if (currentDateInTimezone.getTime() >= nextDayDate.getTime()) {
          const nextDay = streak.currentDay + 1;
          await prisma.streak.update({
            where: { id: params.id },
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
        }
      } else if (dayCompleted && streak.currentDay === streak.duration) {
        // Streak completed!
        await prisma.streak.update({
          where: { id: params.id },
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
            familyId: user.familyId,
            action: 'completed_streak',
            details: `Completed streak "${streak.title}" and earned ${streak.pointsReward} points!`
          }
        });
      }
    }

    return NextResponse.json({
      ...updatedCompletion,
      canAdvanceToNextDay: false, // Will be determined by timezone
      familyTimezone: familyTimezone,
      currentTimeInTimezone: getCurrentDateInTimezone(familyTimezone).toISOString()
    });
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}
