import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Start a streak (User can start their own streak)
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

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 });
    }

    const streak = await prisma.streak.findFirst({
      where: { 
        id: params.id,
        familyId: user.familyId
      },
      include: {
        tasks: true
      }
    });

    if (!streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    // Only the assignee can start their streak
    if (streak.assigneeId !== user.id) {
      return NextResponse.json({ error: 'You can only start your own streaks' }, { status: 403 });
    }

    // Check if streak is already started or completed
    if (streak.status !== 'pending') {
      return NextResponse.json({ error: 'Streak is already started or completed' }, { status: 400 });
    }

    const now = new Date();
    
    // Create all the days for the streak
    const days: Array<{
      dayNumber: number;
      date: Date;
      streakId: string;
      userId: string;
    }> = [];
    
    for (let i = 1; i <= streak.duration; i++) {
      const dayDate = new Date(now);
      dayDate.setDate(now.getDate() + (i - 1));
      
      days.push({
        dayNumber: i,
        date: dayDate,
        streakId: streak.id,
        userId: user.id
      });
    }

    // Update streak status and create days
    const updatedStreak = await prisma.$transaction(async (tx) => {
      // Update streak
      const updated = await tx.streak.update({
        where: { id: params.id },
        data: {
          status: 'active',
          startedAt: now,
          currentDay: 1
        }
      });

      // Create all days
      await tx.streakDay.createMany({
        data: days
      });

      // Create task completions for day 1
      const createdDays = await tx.streakDay.findMany({
        where: { streakId: streak.id }
      });

      const day1 = createdDays.find(d => d.dayNumber === 1);
      if (day1) {
        const taskCompletions = streak.tasks.map(task => ({
          taskId: task.id,
          dayId: day1.id,
          completed: false
        }));

        await tx.streakTaskCompletion.createMany({
          data: taskCompletions
        });
      }

      return updated;
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'started_streak',
        details: `Started streak "${streak.title}"`
      }
    });

    return NextResponse.json(updatedStreak);
  } catch (error) {
    console.error('Error starting streak:', error);
    return NextResponse.json({ error: 'Failed to start streak' }, { status: 500 });
  }
}
