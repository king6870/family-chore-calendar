import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all streaks for the family
export async function GET(request: NextRequest) {
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

    const streaks = await prisma.streak.findMany({
      where: { familyId: user.familyId },
      include: {
        creator: { select: { name: true, nickname: true } },
        assignee: { select: { name: true, nickname: true } },
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
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(streaks);
  } catch (error) {
    console.error('Error fetching streaks:', error);
    return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500 });
  }
}

// POST - Create a new streak (Admin only)
export async function POST(request: NextRequest) {
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

    const { title, description, duration, pointsReward, assigneeId, tasks, autoStart, startDelay } = await request.json();

    if (!title || !duration || !pointsReward || !assigneeId || !tasks || !Array.isArray(tasks)) {
      return NextResponse.json({ 
        error: 'Title, duration, points reward, assignee, and tasks are required' 
      }, { status: 400 });
    }

    // Validate that the assignee is in the same family
    const assignee = await prisma.user.findUnique({
      where: { id: assigneeId }
    });

    if (!assignee || assignee.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 });
    }

    // Create streak with tasks
    const streak = await prisma.streak.create({
      data: {
        title,
        description,
        duration,
        pointsReward,
        creatorId: user.id,
        assigneeId,
        familyId: user.familyId,
        tasks: {
          create: tasks.map((task: any) => ({
            title: task.title,
            description: task.description,
            isRequired: task.isRequired ?? true,
            options: task.options && task.options.length > 0 ? {
              create: task.options.map((option: any) => ({
                title: option.title,
                description: option.description
              }))
            } : undefined
          }))
        }
      },
      include: {
        creator: { select: { name: true, nickname: true } },
        assignee: { select: { name: true, nickname: true } },
        tasks: {
          include: {
            options: true
          }
        }
      }
    });

    // Auto-start streak if requested
    if (autoStart) {
      const startDate = new Date();
      if (startDelay && startDelay > 0) {
        startDate.setDate(startDate.getDate() + startDelay);
      }

      // Create all the days for the streak
      const days: Array<{
        dayNumber: number;
        date: Date;
        streakId: string;
        userId: string;
      }> = [];
      
      for (let i = 1; i <= streak.duration; i++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + (i - 1));
        
        days.push({
          dayNumber: i,
          date: dayDate,
          streakId: streak.id,
          userId: assigneeId
        });
      }

      // Update streak to active and create days
      await prisma.$transaction(async (tx) => {
        // Update streak status
        await tx.streak.update({
          where: { id: streak.id },
          data: {
            status: 'active',
            startedAt: startDate,
            currentDay: 1
          }
        });

        // Create all days
        await tx.streakDay.createMany({
          data: days
        });

        // Create task completions for day 1
        const day1 = days.find(d => d.dayNumber === 1);
        if (day1) {
          const taskCompletions = streak.tasks.map(task => ({
            taskId: task.id,
            dayId: '', // Will be set after day creation
            completed: false
          }));

          // Get the created day 1 record
          const createdDay1 = await tx.streakDay.findFirst({
            where: {
              streakId: streak.id,
              dayNumber: 1
            }
          });

          if (createdDay1) {
            const completionsWithDayId = taskCompletions.map(tc => ({
              ...tc,
              dayId: createdDay1.id
            }));

            await tx.streakTaskCompletion.createMany({
              data: completionsWithDayId
            });
          }
        }
      });
    }

    // Log activity
    const actionDetails = autoStart 
      ? `Created and auto-started streak "${title}" for ${assignee.nickname || assignee.name}${startDelay > 0 ? ` (starts in ${startDelay} days)` : ''}`
      : `Created streak "${title}" for ${assignee.nickname || assignee.name}`;
      
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: autoStart ? 'created_and_started_streak' : 'created_streak',
        details: actionDetails
      }
    });

    return NextResponse.json(streak, { status: 201 });
  } catch (error) {
    console.error('Error creating streak:', error);
    return NextResponse.json({ error: 'Failed to create streak' }, { status: 500 });
  }
}
