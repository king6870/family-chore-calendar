import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get streak notifications for current user
export async function GET(request: NextRequest) {
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
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get user's active streaks
    const activeStreaks = await prisma.streak.findMany({
      where: {
        assigneeId: user.id,
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
            taskCompletions: {
              include: {
                task: true,
                option: true
              }
            }
          },
          orderBy: { dayNumber: 'asc' }
        }
      }
    });

    const notifications = [];

    for (const streak of activeStreaks) {
      const currentDay = streak.days.find(d => d.dayNumber === streak.currentDay);
      
      if (currentDay) {
        const dayDate = new Date(currentDay.date);
        const isToday = dayDate.getTime() === today.getTime();
        const isPastDue = dayDate < today;
        
        // Check task completion status
        const requiredTasks = currentDay.taskCompletions.filter(tc => tc.task.isRequired);
        const completedRequiredTasks = requiredTasks.filter(tc => tc.completed);
        const allRequiredCompleted = requiredTasks.length === completedRequiredTasks.length;
        
        if (isToday && !allRequiredCompleted) {
          notifications.push({
            type: 'streak_reminder',
            priority: 'medium',
            title: `🔥 Streak Reminder: ${streak.title}`,
            message: `You have ${requiredTasks.length - completedRequiredTasks.length} required tasks left for today (Day ${streak.currentDay})`,
            streakId: streak.id,
            dayNumber: streak.currentDay,
            tasksRemaining: requiredTasks.length - completedRequiredTasks.length
          });
        } else if (isPastDue && !allRequiredCompleted) {
          notifications.push({
            type: 'streak_overdue',
            priority: 'high',
            title: `⚠️ Streak Overdue: ${streak.title}`,
            message: `Day ${streak.currentDay} was due ${Math.ceil((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24))} day(s) ago. Complete it now or your streak will fail!`,
            streakId: streak.id,
            dayNumber: streak.currentDay,
            daysOverdue: Math.ceil((today.getTime() - dayDate.getTime()) / (1000 * 60 * 60 * 24))
          });
        } else if (isToday && allRequiredCompleted) {
          // Check if there are optional tasks
          const optionalTasks = currentDay.taskCompletions.filter(tc => !tc.task.isRequired);
          const completedOptionalTasks = optionalTasks.filter(tc => tc.completed);
          
          if (optionalTasks.length > completedOptionalTasks.length) {
            notifications.push({
              type: 'streak_optional',
              priority: 'low',
              title: `✨ Optional Tasks Available: ${streak.title}`,
              message: `Great job completing today's required tasks! You have ${optionalTasks.length - completedOptionalTasks.length} optional tasks available for extra credit.`,
              streakId: streak.id,
              dayNumber: streak.currentDay,
              optionalTasksRemaining: optionalTasks.length - completedOptionalTasks.length
            });
          }
        }
      }
    }

    // Check for recently completed streaks (last 7 days)
    const recentlyCompleted = await prisma.streak.findMany({
      where: {
        assigneeId: user.id,
        status: 'completed',
        completedAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    });

    for (const streak of recentlyCompleted) {
      notifications.push({
        type: 'streak_completed',
        priority: 'low',
        title: `🎉 Streak Completed: ${streak.title}`,
        message: `Congratulations! You earned ${streak.pointsReward} points for completing this ${streak.duration}-day streak.`,
        streakId: streak.id,
        pointsEarned: streak.pointsReward,
        completedAt: streak.completedAt
      });
    }

    // Sort by priority (high, medium, low)
    const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
    notifications.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);

    return NextResponse.json({
      notifications,
      summary: {
        total: notifications.length,
        overdue: notifications.filter(n => n.type === 'streak_overdue').length,
        reminders: notifications.filter(n => n.type === 'streak_reminder').length,
        completed: notifications.filter(n => n.type === 'streak_completed').length
      }
    });
  } catch (error) {
    console.error('Error fetching streak notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
