import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Restart a failed/completed streak (Admin only)
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
      where: { email: session.user.email }
    });

    if (!user?.familyId || (!user.isAdmin && !user.isOwner)) {
      return NextResponse.json({ error: 'Admin or Owner access required' }, { status: 403 });
    }

    // Get restart options from request body
    const body = await request.json().catch(() => ({}));
    const { fromDay, resetCompletely } = body;

    const streak = await prisma.streak.findFirst({
      where: { 
        id: params.id,
        familyId: user.familyId
      },
      include: {
        tasks: true,
        assignee: { select: { name: true, nickname: true } },
        days: {
          include: {
            taskCompletions: true
          },
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    if (!streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    // Can only restart failed or completed streaks
    if (streak.status !== 'failed' && streak.status !== 'completed') {
      return NextResponse.json({ 
        error: 'Can only restart failed or completed streaks' 
      }, { status: 400 });
    }

    const now = new Date();
    let restartDay = 1;
    let actionType = 'restarted_streak';
    let actionDetails = `Restarted streak "${streak.title}" for ${streak.assignee.nickname || streak.assignee.name}`;

    // Determine restart strategy
    if (resetCompletely) {
      // Complete reset to day 1
      restartDay = 1;
      actionDetails += ' from day 1';
    } else if (fromDay && fromDay >= 1 && fromDay <= streak.duration) {
      // Restart from specific day
      restartDay = fromDay;
      actionDetails += ` from day ${fromDay}`;
      actionType = 'restarted_streak_from_day';
    } else if (streak.status === 'failed' && streak.currentDay > 1) {
      // Default: restart from the day it failed
      restartDay = streak.currentDay;
      actionDetails += ` from day ${streak.currentDay} (where it failed)`;
      actionType = 'restarted_streak_from_failure_day';
    } else {
      // Fallback to day 1
      restartDay = 1;
      actionDetails += ' from day 1';
    }

    // Restart streak logic
    const restartedStreak = await prisma.$transaction(async (tx) => {
      if (resetCompletely || restartDay === 1) {
        // Complete reset: delete all days and task completions
        await tx.streakTaskCompletion.deleteMany({
          where: {
            day: {
              streakId: params.id
            }
          }
        });

        await tx.streakDay.deleteMany({
          where: { streakId: params.id }
        });

        // Reset streak to pending
        const updated = await tx.streak.update({
          where: { id: params.id },
          data: {
            status: 'pending',
            currentDay: 0,
            startedAt: null,
            completedAt: null,
            failedAt: null
          }
        });

        return updated;
      } else {
        // Partial restart: keep completed days before restart point
        
        // Delete days and completions from restart day onwards
        const daysToDelete = streak.days.filter(d => d.dayNumber >= restartDay);
        const dayIdsToDelete = daysToDelete.map(d => d.id);

        if (dayIdsToDelete.length > 0) {
          await tx.streakTaskCompletion.deleteMany({
            where: {
              dayId: {
                in: dayIdsToDelete
              }
            }
          });

          await tx.streakDay.deleteMany({
            where: {
              id: {
                in: dayIdsToDelete
              }
            }
          });
        }

        // Update streak to active status, set current day to restart point
        const updated = await tx.streak.update({
          where: { id: params.id },
          data: {
            status: 'active',
            currentDay: restartDay,
            startedAt: streak.startedAt || now, // Keep original start time if exists
            completedAt: null,
            failedAt: null
          }
        });

        // Create all remaining days from restart point to end
        const daysToCreate = [];
        for (let dayNum = restartDay; dayNum <= streak.duration; dayNum++) {
          const dayDate = new Date(now);
          if (streak.startedAt) {
            const daysSinceStart = dayNum - 1;
            dayDate.setTime(new Date(streak.startedAt).getTime() + (daysSinceStart * 24 * 60 * 60 * 1000));
          } else {
            dayDate.setDate(now.getDate() + (dayNum - restartDay));
          }
          
          daysToCreate.push({
            dayNumber: dayNum,
            date: dayDate,
            streakId: streak.id,
            userId: streak.assigneeId,
            completed: false
          });
        }

        // Create all remaining days
        await tx.streakDay.createMany({
          data: daysToCreate
        });

        // Create task completions for the restart day only (current day)
        const restartDayRecord = await tx.streakDay.findFirst({
          where: {
            streakId: streak.id,
            dayNumber: restartDay
          }
        });

        if (restartDayRecord) {
          const taskCompletions = streak.tasks.map(task => ({
            taskId: task.id,
            dayId: restartDayRecord.id,
            completed: false
          }));

          await tx.streakTaskCompletion.createMany({
            data: taskCompletions
          });
        }

        return updated;
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: actionType,
        details: actionDetails
      }
    });

    return NextResponse.json({
      ...restartedStreak,
      restartedFromDay: restartDay,
      message: `Streak restarted from day ${restartDay}`
    });
  } catch (error) {
    console.error('Error restarting streak:', error);
    return NextResponse.json({ error: 'Failed to restart streak' }, { status: 500 });
  }
}
