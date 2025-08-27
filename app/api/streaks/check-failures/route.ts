import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Check for failed streaks (missed days)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 });
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    // Find active streaks where yesterday's tasks weren't completed
    const activeStreaks = await prisma.streak.findMany({
      where: {
        familyId: user.familyId,
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

    const failedStreaks = [];

    for (const streak of activeStreaks) {
      // Check if current day should have been completed by now
      const currentDay = streak.days.find(d => d.dayNumber === streak.currentDay);
      
      if (currentDay && new Date(currentDay.date) < yesterday) {
        // This day should have been completed by now
        const requiredTasks = currentDay.taskCompletions.filter(tc => tc.task.isRequired);
        const completedRequiredTasks = requiredTasks.filter(tc => tc.completed);
        
        if (requiredTasks.length > completedRequiredTasks.length) {
          // Fail the streak
          await prisma.streak.update({
            where: { id: streak.id },
            data: {
              status: 'failed',
              failedAt: now
            }
          });

          // Log the failure
          await prisma.activityLog.create({
            data: {
              userId: streak.assigneeId,
              familyId: user.familyId,
              action: 'streak_auto_failed',
              details: `Streak "${streak.title}" automatically failed due to missed day ${streak.currentDay}`
            }
          });

          failedStreaks.push({
            id: streak.id,
            title: streak.title,
            assignee: streak.assignee,
            dayMissed: streak.currentDay
          });
        }
      }
    }

    return NextResponse.json({
      message: `Checked ${activeStreaks.length} active streaks`,
      failedStreaks: failedStreaks.length,
      details: failedStreaks
    });
  } catch (error) {
    console.error('Error checking streak failures:', error);
    return NextResponse.json({ error: 'Failed to check streak failures' }, { status: 500 });
  }
}
