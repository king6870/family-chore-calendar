import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Get streak analytics for the family
export async function GET(request: NextRequest) {
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

    // Get all family streaks
    const allStreaks = await prisma.streak.findMany({
      where: { familyId: user.familyId },
      include: {
        assignee: { select: { id: true, name: true, nickname: true } },
        creator: { select: { name: true, nickname: true } },
        days: {
          include: {
            taskCompletions: {
              include: {
                task: true
              }
            }
          }
        }
      }
    });

    // Calculate overall stats
    const totalStreaks = allStreaks.length;
    const completedStreaks = allStreaks.filter(s => s.status === 'completed').length;
    const failedStreaks = allStreaks.filter(s => s.status === 'failed').length;
    const activeStreaks = allStreaks.filter(s => s.status === 'active').length;
    const pendingStreaks = allStreaks.filter(s => s.status === 'pending').length;

    const completionRate = totalStreaks > 0 ? Math.round((completedStreaks / totalStreaks) * 100) : 0;

    // Calculate points earned from completed streaks
    const totalPointsEarned = allStreaks
      .filter(s => s.status === 'completed')
      .reduce((sum, s) => sum + s.pointsReward, 0);

    // Member statistics
    const memberStats: Record<string, {
      name: string;
      nickname?: string;
      total: number;
      completed: number;
      failed: number;
      active: number;
      pending: number;
      pointsEarned: number;
      averageCompletion: number;
      completionRate?: number;
    }> = {};
    
    for (const streak of allStreaks) {
      const memberId = streak.assignee.id;
      if (!memberStats[memberId]) {
        memberStats[memberId] = {
          name: streak.assignee.name || 'Unknown',
          nickname: streak.assignee.nickname || undefined,
          total: 0,
          completed: 0,
          failed: 0,
          active: 0,
          pending: 0,
          pointsEarned: 0,
          averageCompletion: 0
        };
      }

      memberStats[memberId].total++;
      
      // Increment the appropriate status counter
      switch (streak.status) {
        case 'completed':
          memberStats[memberId].completed++;
          break;
        case 'failed':
          memberStats[memberId].failed++;
          break;
        case 'active':
          memberStats[memberId].active++;
          break;
        case 'pending':
          memberStats[memberId].pending++;
          break;
      }
      
      if (streak.status === 'completed') {
        memberStats[memberId].pointsEarned += streak.pointsReward;
      }

      // Calculate completion percentage for this streak
      if (streak.days.length > 0) {
        const completedDays = streak.days.filter(d => d.completed).length;
        const streakCompletion = (completedDays / streak.duration) * 100;
        memberStats[memberId].averageCompletion += streakCompletion;
      }
    }

    // Calculate average completion rates
    Object.values(memberStats).forEach((stats) => {
      if (stats.total > 0) {
        stats.averageCompletion = Math.round(stats.averageCompletion / stats.total);
        stats.completionRate = Math.round((stats.completed / stats.total) * 100);
      }
    });

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStreaks = allStreaks.filter(s => 
      new Date(s.createdAt) >= thirtyDaysAgo
    );

    const recentCompletions = allStreaks.filter(s => 
      s.completedAt && new Date(s.completedAt) >= thirtyDaysAgo
    );

    // Most popular streak durations
    const durationStats: Record<number, number> = {};
    allStreaks.forEach(s => {
      durationStats[s.duration] = (durationStats[s.duration] || 0) + 1;
    });

    // Average streak length
    const averageDuration = totalStreaks > 0 
      ? Math.round(allStreaks.reduce((sum, s) => sum + s.duration, 0) / totalStreaks)
      : 0;

    // Success rate by duration
    const successByDuration: Record<number, {
      total: number;
      completed: number;
      rate: number;
    }> = {};
    
    Object.keys(durationStats).forEach(durationStr => {
      const duration = parseInt(durationStr);
      const streaksOfDuration = allStreaks.filter(s => s.duration === duration);
      const completedOfDuration = streaksOfDuration.filter(s => s.status === 'completed').length;
      successByDuration[duration] = {
        total: streaksOfDuration.length,
        completed: completedOfDuration,
        rate: streaksOfDuration.length > 0 ? Math.round((completedOfDuration / streaksOfDuration.length) * 100) : 0
      };
    });

    return NextResponse.json({
      overview: {
        totalStreaks,
        completedStreaks,
        failedStreaks,
        activeStreaks,
        pendingStreaks,
        completionRate,
        totalPointsEarned,
        averageDuration
      },
      memberStats: Object.values(memberStats),
      recentActivity: {
        newStreaks: recentStreaks.length,
        completedStreaks: recentCompletions.length,
        streaks: recentStreaks.map(s => ({
          id: s.id,
          title: s.title,
          status: s.status,
          assignee: s.assignee,
          createdAt: s.createdAt,
          completedAt: s.completedAt
        }))
      },
      insights: {
        durationStats,
        successByDuration,
        mostSuccessfulDuration: Object.entries(successByDuration)
          .sort(([,a], [,b]) => b.rate - a.rate)[0]?.[0] || null,
        trends: {
          // Could add more trend analysis here
          averagePointsPerStreak: completedStreaks > 0 
            ? Math.round(totalPointsEarned / completedStreaks) 
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching streak analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
