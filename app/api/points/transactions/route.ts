import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user and verify family access
    const user = await prisma.user.findUnique({
      where: { id: user.id },
      include: { family: true }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    // Build where clause
    let whereClause: any = {
      familyId: user.familyId
    };

    // If specific user requested, verify access
    if (userId) {
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser || targetUser.familyId !== user.familyId) {
        return NextResponse.json({ error: 'User not found or not in same family' }, { status: 403 });
      }

      whereClause.userId = userId;
    }

    // Get points transactions
    const pointsEarned = await prisma.pointsEarned.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Get activity logs for points-related actions
    const activityLogs = await prisma.activityLog.findMany({
      where: {
        familyId: user.familyId,
        action: {
          in: ['POINTS_AWARDED', 'POINTS_DEDUCTED', 'POINTS_RESET']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            nickname: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Combine and format transactions
    const transactions = [];

    // Add points earned records
    for (const points of pointsEarned) {
      let choreName = null;
      if (points.choreId) {
        const chore = await prisma.chore.findUnique({
          where: { id: points.choreId },
          select: { name: true }
        });
        choreName = chore?.name;
      }

      transactions.push({
        id: points.id,
        type: 'points_earned',
        userId: points.userId,
        userName: points.user.nickname || points.user.name,
        points: points.points,
        date: points.createdAt.toISOString(),
        choreName: choreName,
        reason: choreName ? `Completed: ${choreName}` : 'Points earned',
        awardedBy: 'System'
      });
    }

    // Add activity log records
    for (const log of activityLogs) {
      transactions.push({
        id: log.id,
        type: 'admin_action',
        userId: log.userId,
        userName: log.user.nickname || log.user.name,
        points: 0, // Points info not available in simplified schema
        date: log.createdAt.toISOString(),
        reason: log.details || log.action,
        awardedBy: log.user.nickname || log.user.name || 'Admin'
      });
    }

    // Sort by date descending and limit
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const limitedTransactions = transactions.slice(0, limit);

    return NextResponse.json({
      transactions: limitedTransactions,
      total: transactions.length
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
