import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch a specific streak
export async function GET(
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
      }
    });

    if (!streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    return NextResponse.json(streak);
  } catch (error) {
    console.error('Error fetching streak:', error);
    return NextResponse.json({ error: 'Failed to fetch streak' }, { status: 500 });
  }
}

// PUT - Update a streak (Admin only, can edit any status)
export async function PUT(
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

    if (!user.isAdmin && !user.isOwner) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if streak exists and belongs to family
    const existingStreak = await prisma.streak.findFirst({
      where: { 
        id: params.id,
        familyId: user.familyId
      }
    });

    if (!existingStreak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    // Admins can now edit streaks in any status

    const body = await request.json();
    const { title, description, duration, pointsReward, assigneeId, tasks } = body;

    // Validate required fields
    if (!title || !assigneeId || !tasks || tasks.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate assignee belongs to family
    const assignee = await prisma.user.findFirst({
      where: { 
        id: assigneeId,
        familyId: user.familyId
      }
    });

    if (!assignee) {
      return NextResponse.json({ error: 'Invalid assignee' }, { status: 400 });
    }

    // Update streak in transaction
    const updatedStreak = await prisma.$transaction(async (tx) => {
      // Delete existing tasks and their options
      await tx.streakTaskOption.deleteMany({
        where: {
          task: {
            streakId: params.id
          }
        }
      });

      await tx.streakTask.deleteMany({
        where: { streakId: params.id }
      });

      // Update the streak
      const streak = await tx.streak.update({
        where: { id: params.id },
        data: {
          title,
          description,
          duration,
          pointsReward,
          assigneeId
        }
      });

      // Create new tasks
      for (const task of tasks) {
        const createdTask = await tx.streakTask.create({
          data: {
            streakId: streak.id,
            title: task.title,
            description: task.description,
            isRequired: task.isRequired
          }
        });

        // Create task options if any
        if (task.options && task.options.length > 0) {
          for (const option of task.options) {
            await tx.streakTaskOption.create({
              data: {
                taskId: createdTask.id,
                title: option.title,
                description: option.description
              }
            });
          }
        }
      }

      return streak;
    });

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'STREAK_UPDATED',
        details: `Updated streak "${title}"`
      }
    });

    return NextResponse.json(updatedStreak);
  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json({ error: 'Failed to update streak' }, { status: 500 });
  }
}

// DELETE - Delete a streak (Admin only)
export async function DELETE(
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

    const streak = await prisma.streak.findFirst({
      where: { 
        id: params.id,
        familyId: user.familyId
      }
    });

    if (!streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    await prisma.streak.delete({
      where: { id: params.id }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'deleted_streak',
        details: `Deleted streak "${streak.title}"`
      }
    });

    return NextResponse.json({ message: 'Streak deleted successfully' });
  } catch (error) {
    console.error('Error deleting streak:', error);
    return NextResponse.json({ error: 'Failed to delete streak' }, { status: 500 });
  }
}
