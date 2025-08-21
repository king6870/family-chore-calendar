import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Stop an active streak (Admin only)
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

    const streak = await prisma.streak.findFirst({
      where: { 
        id: params.id,
        familyId: user.familyId
      },
      include: {
        assignee: { select: { name: true, nickname: true } }
      }
    });

    if (!streak) {
      return NextResponse.json({ error: 'Streak not found' }, { status: 404 });
    }

    // Can only stop active streaks
    if (streak.status !== 'active') {
      return NextResponse.json({ 
        error: 'Can only stop active streaks' 
      }, { status: 400 });
    }

    // Stop the streak by setting it to failed status
    const stoppedStreak = await prisma.streak.update({
      where: { id: params.id },
      data: {
        status: 'failed',
        failedAt: new Date()
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'stopped_streak',
        details: `Stopped streak "${streak.title}" for ${streak.assignee.nickname || streak.assignee.name}`
      }
    });

    return NextResponse.json(stoppedStreak);
  } catch (error) {
    console.error('Error stopping streak:', error);
    return NextResponse.json({ error: 'Failed to stop streak' }, { status: 500 });
  }
}
