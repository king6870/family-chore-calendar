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

    if (!user?.familyId || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
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
