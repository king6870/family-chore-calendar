import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, points, reason } = await request.json();

    if (!userId || points === undefined || points === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify admin permissions
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
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

    // Process the points transaction
    await prisma.$transaction(async (tx) => {
      // Create points earned record
      await tx.pointsEarned.create({
        data: {
          userId: userId,
          familyId: adminUser.familyId!,
          points: points,
          date: now,
          weekStart: weekStart
        }
      });

      // Update user's total points
      await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: points
          }
        }
      });

      // Create activity log
      await tx.activityLog.create({
        data: {
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: session.user.id,
          familyId: adminUser.familyId!,
          action: points > 0 ? 'POINTS_AWARDED' : 'POINTS_DEDUCTED',
          description: `${points > 0 ? 'Awarded' : 'Deducted'} ${Math.abs(points)} points ${points > 0 ? 'to' : 'from'} ${targetUser.nickname || targetUser.name}`,
          metadata: JSON.stringify({
            targetUserId: userId,
            points: points,
            reason: reason || 'Manual adjustment by admin'
          })
        }
      });
    });

    const action = points > 0 ? 'awarded' : 'deducted';
    const message = `Successfully ${action} ${Math.abs(points)} points ${points > 0 ? 'to' : 'from'} ${targetUser.nickname || targetUser.name}`;

    return NextResponse.json({ 
      success: true, 
      message 
    });

  } catch (error) {
    console.error('Error managing points:', error);
    return NextResponse.json(
      { error: 'Failed to manage points' },
      { status: 500 }
    );
  }
}
