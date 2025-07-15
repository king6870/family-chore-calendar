import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;
    const timeframe = searchParams.get('timeframe') || 'week';
    const includeRanking = searchParams.get('includeRanking') === 'true';

    // Get user and verify family access
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { family: true }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    // Verify target user is in same family
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser || targetUser.familyId !== user.familyId) {
      return NextResponse.json({ error: 'User not found or not in same family' }, { status: 403 });
    }

    // Calculate date ranges
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Get total points
    const totalPoints = targetUser.totalPoints;

    // Get weekly points
    const weeklyPointsData = await prisma.pointsEarned.aggregate({
      where: {
        userId: userId,
        date: { gte: startOfWeek }
      },
      _sum: { points: true }
    });
    const weeklyPoints = weeklyPointsData._sum.points || 0;

    // Get monthly points
    const monthlyPointsData = await prisma.pointsEarned.aggregate({
      where: {
        userId: userId,
        date: { gte: startOfMonth }
      },
      _sum: { points: true }
    });
    const monthlyPoints = monthlyPointsData._sum.points || 0;

    // Get daily points for current week
    const dailyPoints = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayPoints = await prisma.pointsEarned.aggregate({
        where: {
          userId: userId,
          date: {
            gte: date,
            lte: endOfDay
          }
        },
        _sum: { points: true }
      });

      dailyPoints.push({
        date: date.toISOString(),
        points: dayPoints._sum.points || 0
      });
    }

    // Get weekly history for current month
    const weeklyHistory = [];
    const weeksInMonth = Math.ceil((now.getDate() + startOfMonth.getDay()) / 7);
    
    for (let week = 0; week < weeksInMonth; week++) {
      const weekStart = new Date(startOfMonth);
      weekStart.setDate(1 + (week * 7) - startOfMonth.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      if (weekStart <= now) {
        const weekPoints = await prisma.pointsEarned.aggregate({
          where: {
            userId: userId,
            date: {
              gte: weekStart,
              lte: weekEnd
            }
          },
          _sum: { points: true }
        });

        weeklyHistory.push({
          weekStart: weekStart.toISOString(),
          points: weekPoints._sum.points || 0
        });
      }
    }

    // Get monthly history for current year
    const monthlyHistory = [];
    for (let month = 0; month <= now.getMonth(); month++) {
      const monthStart = new Date(now.getFullYear(), month, 1);
      const monthEnd = new Date(now.getFullYear(), month + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthPoints = await prisma.pointsEarned.aggregate({
        where: {
          userId: userId,
          date: {
            gte: monthStart,
            lte: monthEnd
          }
        },
        _sum: { points: true }
      });

      monthlyHistory.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        points: monthPoints._sum.points || 0
      });
    }

    // Get chore breakdown
    let dateFilter = {};
    if (timeframe === 'week') {
      dateFilter = { gte: startOfWeek };
    } else if (timeframe === 'month') {
      dateFilter = { gte: startOfMonth };
    } else if (timeframe === 'all') {
      dateFilter = { gte: startOfYear };
    }

    const choreBreakdown = await prisma.pointsEarned.groupBy({
      by: ['choreId'],
      where: {
        userId: userId,
        choreId: { not: null },
        date: dateFilter
      },
      _sum: { points: true },
      _count: { choreId: true }
    });

    // Get chore names for breakdown
    const choreBreakdownWithNames = await Promise.all(
      choreBreakdown.map(async (item) => {
        const chore = await prisma.chore.findUnique({
          where: { id: item.choreId! },
          select: { name: true }
        });
        
        return {
          choreName: chore?.name || 'Unknown Chore',
          points: item._sum.points || 0,
          count: item._count.choreId
        };
      })
    );

    // Sort by points descending
    choreBreakdownWithNames.sort((a, b) => b.points - a.points);

    // Get family ranking if requested
    let ranking: Array<{
      userId: string;
      name: string;
      nickname: string;
      points: number;
      rank: number;
    }> = [];
    
    if (includeRanking) {
      const familyMembers = await prisma.user.findMany({
        where: { familyId: user.familyId },
        select: {
          id: true,
          name: true,
          nickname: true,
          totalPoints: true
        },
        orderBy: { totalPoints: 'desc' }
      });

      ranking = familyMembers.map((member, index) => ({
        userId: member.id,
        name: member.name || 'Unknown',
        nickname: member.nickname || '',
        points: member.totalPoints,
        rank: index + 1
      }));
    }

    // Get weekly goal
    const weeklyGoal = await prisma.weeklyGoal.findUnique({
      where: {
        familyId_weekStart: {
          familyId: user.familyId,
          weekStart: startOfWeek
        }
      }
    });

    const weeklyGoalPoints = weeklyGoal?.pointsGoal || 0;
    const weeklyProgress = weeklyGoalPoints > 0 ? (weeklyPoints / weeklyGoalPoints) * 100 : 0;

    const response = {
      totalPoints,
      weeklyPoints,
      monthlyPoints,
      dailyPoints,
      weeklyHistory,
      monthlyHistory,
      choreBreakdown: choreBreakdownWithNames,
      ranking,
      weeklyGoal: weeklyGoalPoints,
      weeklyProgress
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching points data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points data' },
      { status: 500 }
    );
  }
}

// API route to award points when chores are completed
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { choreAssignmentId, points, choreId } = await request.json();

    if (!choreAssignmentId || !points) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the chore assignment to verify ownership and get details
    const choreAssignment = await prisma.choreAssignment.findUnique({
      where: { id: choreAssignmentId },
      include: { 
        user: true,
        chore: true,
        family: true
      }
    });

    if (!choreAssignment) {
      return NextResponse.json({ error: 'Chore assignment not found' }, { status: 404 });
    }

    // Verify user has access (either the assigned user or an admin in the family)
    const requestingUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    const canAwardPoints = 
      choreAssignment.userId === session.user.id || // User completing their own chore
      (requestingUser?.familyId === choreAssignment.familyId && requestingUser?.isAdmin); // Admin in same family

    if (!canAwardPoints) {
      return NextResponse.json({ error: 'Not authorized to award points for this chore' }, { status: 403 });
    }

    // Calculate week start for tracking
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Award points
    await prisma.$transaction(async (tx) => {
      // Create points earned record
      await tx.pointsEarned.create({
        data: {
          userId: choreAssignment.userId,
          familyId: choreAssignment.familyId,
          choreId: choreId || choreAssignment.choreId,
          points: points,
          date: now,
          weekStart: weekStart
        }
      });

      // Update user's total points
      await tx.user.update({
        where: { id: choreAssignment.userId },
        data: {
          totalPoints: {
            increment: points
          }
        }
      });

      // Mark chore as completed if not already
      if (!choreAssignment.completed) {
        await tx.choreAssignment.update({
          where: { id: choreAssignmentId },
          data: {
            completed: true,
            completedAt: now
          }
        });
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Awarded ${points} points successfully!` 
    });

  } catch (error) {
    console.error('Error awarding points:', error);
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }
}
