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

    if (!user?.familyId || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { title, description, duration, pointsReward, assigneeId, tasks } = await request.json();

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

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'created_streak',
        details: `Created streak "${title}" for ${assignee.nickname || assignee.name}`
      }
    });

    return NextResponse.json(streak, { status: 201 });
  } catch (error) {
    console.error('Error creating streak:', error);
    return NextResponse.json({ error: 'Failed to create streak' }, { status: 500 });
  }
}
