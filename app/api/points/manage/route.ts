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

    const { userId, points, reason } = await request.json();

    if (!userId || points === undefined || points === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

    // Process the points transaction (simplified - no ActivityLog for now)
    const result = await prisma.$transaction(async (tx) => {
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

      // Update user's total points and return the updated user
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          totalPoints: {
            increment: points
          }
        },
        select: {
          totalPoints: true,
          nickname: true,
          name: true
        }
      });

      return updatedUser;
    });

    const action = points > 0 ? 'awarded' : 'deducted';
    const message = `Successfully ${action} ${Math.abs(points)} points ${points > 0 ? 'to' : 'from'} ${result.nickname || result.name}`;

    // Log to console for debugging (since ActivityLog has schema issues)
    console.log(`Points ${action}: ${Math.abs(points)} points ${points > 0 ? 'to' : 'from'} ${result.nickname || result.name} by ${adminUser.nickname || adminUser.name}`);

    return NextResponse.json({ 
      success: true, 
      message,
      updatedPoints: result.totalPoints,
      targetUser: {
        name: result.nickname || result.name,
        totalPoints: result.totalPoints
      }
    });

  } catch (error) {
    console.error('Error managing points:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('constraint')) {
        return NextResponse.json({ 
          error: 'Database constraint error. Please try again or contact support.',
          details: 'The points transaction failed due to a database constraint violation.'
        }, { status: 500 });
      }
      
      if (error.message.includes('foreign key')) {
        return NextResponse.json({ 
          error: 'Invalid user or family reference. Please refresh and try again.',
          details: 'The user or family ID is invalid.'
        }, { status: 400 });
      }

      if (error.message.includes('Unique constraint')) {
        return NextResponse.json({ 
          error: 'Duplicate transaction detected. Please refresh and try again.',
          details: 'This points transaction may have already been processed.'
        }, { status: 400 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to manage points. Please try again.' },
      { status: 500 }
    );
  }
}
