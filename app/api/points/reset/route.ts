import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify admin permissions
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { family: true }
    });

    if (!adminUser?.isAdmin || !adminUser.familyId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Verify target user is in same family
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser || targetUser.familyId !== adminUser.familyId) {
      return NextResponse.json({ error: 'User not found or not in same family' }, { status: 404 });
    }

    // Calculate week start for tracking
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Reset points
    await prisma.$transaction(async (tx) => {
      // Create a negative points record to zero out the total
      if (targetUser.totalPoints !== 0) {
        await tx.pointsEarned.create({
          data: {
            userId: userId,
            familyId: adminUser.familyId!,
            points: -targetUser.totalPoints,
            date: now,
            weekStart: weekStart
          }
        });
      }

      // Reset user's total points to 0
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: 0
        }
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: user.id,
          familyId: adminUser.familyId!,
          action: 'POINTS_RESET',
          description: `Reset all points for ${targetUser.nickname || targetUser.name}`
        }
      });
    });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully reset all points for ${targetUser.nickname || targetUser.name}` 
    });

  } catch (error) {
    console.error('Error resetting points:', error);
    return NextResponse.json(
      { error: 'Failed to reset points' },
      { status: 500 }
    );
  }
}
