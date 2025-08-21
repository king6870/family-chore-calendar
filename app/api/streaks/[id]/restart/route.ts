import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Restart a failed streak (Admin only)
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
        tasks: true,
        assignee: { select: { name: true, nickname: true } }
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
    
    // Reset streak to pending status
    const restartedStreak = await prisma.$transaction(async (tx) => {
      // Delete existing days and task completions
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
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'restarted_streak',
        details: `Restarted streak "${streak.title}" for ${streak.assignee.nickname || streak.assignee.name}`
      }
    });

    return NextResponse.json(restartedStreak);
  } catch (error) {
    console.error('Error restarting streak:', error);
    return NextResponse.json({ error: 'Failed to restart streak' }, { status: 500 });
  }
}
