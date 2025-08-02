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

    const { weekStart } = await request.json();

    if (!weekStart) {
      return NextResponse.json({ error: 'Week start date is required' }, { status: 400 });
    }

    // Verify admin permissions
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { family: true }
    });

    if (!adminUser?.isAdmin || !adminUser.familyId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Get all family members
    const familyMembers = await prisma.user.findMany({
      where: { familyId: adminUser.familyId },
      select: {
        id: true,
        name: true,
        nickname: true,
        age: true
      }
    });

    if (familyMembers.length === 0) {
      return NextResponse.json({ error: 'No family members found' }, { status: 400 });
    }

    // Get all chores for the family
    const allChores = await prisma.chore.findMany({
      where: { familyId: adminUser.familyId },
      orderBy: { points: 'desc' }
    });

    if (allChores.length === 0) {
      return NextResponse.json({ error: 'No chores found to distribute' }, { status: 400 });
    }

    // Filter chores by age appropriateness for each member
    const memberEligibleChores = familyMembers.map(member => ({
      member,
      eligibleChores: allChores.filter(chore => 
        !member.age || !chore.minAge || member.age >= chore.minAge
      )
    }));

    // Check if all members have eligible chores
    const membersWithoutChores = memberEligibleChores.filter(m => m.eligibleChores.length === 0);
    if (membersWithoutChores.length > 0) {
      return NextResponse.json({ 
        error: `Some members have no age-appropriate chores: ${membersWithoutChores.map(m => m.member.nickname || m.member.name).join(', ')}` 
      }, { status: 400 });
    }

    // Clear existing assignments for the week
    await prisma.choreAssignment.deleteMany({
      where: {
        familyId: adminUser.familyId,
        date: {
          gte: weekStartDate,
          lte: weekEndDate
        }
      }
    });

    // Calculate target points per member
    const totalPoints = allChores.reduce((sum, chore) => sum + chore.points, 0);
    const targetPointsPerMember = Math.floor(totalPoints / familyMembers.length);

    // Distribution algorithm
    const memberAssignments = familyMembers.map(member => ({
      memberId: member.id,
      memberName: member.nickname || member.name,
      assignments: [] as any[],
      totalPoints: 0,
      choreCount: 0
    }));

    // Sort chores by points (highest first) for better distribution
    const sortedChores = [...allChores].sort((a, b) => b.points - a.points);

    // Distribute chores across the week (7 days)
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(weekStartDate);
      currentDate.setDate(weekStartDate.getDate() + dayOffset);
      
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOffset];

      // For each chore, assign to the member with the lowest current points who can do it
      for (const chore of sortedChores) {
        // Find eligible members for this chore
        const eligibleMembers = memberAssignments.filter(assignment => {
          const member = familyMembers.find(m => m.id === assignment.memberId);
          return member && (!member.age || !chore.minAge || member.age >= chore.minAge);
        });

        if (eligibleMembers.length === 0) continue;

        // Sort by current points (lowest first) to balance distribution
        eligibleMembers.sort((a, b) => a.totalPoints - b.totalPoints);
        
        // Assign to member with lowest points
        const selectedMember = eligibleMembers[0];
        
        selectedMember.assignments.push({
          choreId: chore.id,
          choreName: chore.name,
          chorePoints: chore.points,
          date: currentDate,
          dayOfWeek: dayName
        });
        
        selectedMember.totalPoints += chore.points;
        selectedMember.choreCount += 1;
      }
    }

    // Create database assignments
    const assignmentsToCreate = [];
    for (const memberAssignment of memberAssignments) {
      for (const assignment of memberAssignment.assignments) {
        assignmentsToCreate.push({
          userId: memberAssignment.memberId,
          choreId: assignment.choreId,
          familyId: adminUser.familyId,
          date: assignment.date,
          dayOfWeek: assignment.dayOfWeek,
          completed: false
        });
      }
    }

    // Batch create assignments
    if (assignmentsToCreate.length > 0) {
      await prisma.choreAssignment.createMany({
        data: assignmentsToCreate
      });
    }

    // Calculate distribution statistics
    const distributionStats = {
      totalChoresDistributed: assignmentsToCreate.length,
      totalPointsDistributed: memberAssignments.reduce((sum, m) => sum + m.totalPoints, 0),
      memberBreakdown: memberAssignments.map(m => ({
        memberName: m.memberName,
        choreCount: m.choreCount,
        totalPoints: m.totalPoints,
        averagePointsPerChore: m.choreCount > 0 ? Math.round(m.totalPoints / m.choreCount) : 0
      })),
      balanceScore: calculateBalanceScore(memberAssignments)
    };

    // Log the distribution activity
    await prisma.activityLog.create({
      data: {
        id: `balance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        familyId: adminUser.familyId,
        action: 'CHORES_BALANCED',
        details: `Balanced chore distribution for week of ${weekStartDate.toLocaleDateString()}`,
        createdAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully balanced ${assignmentsToCreate.length} chore assignments for ${familyMembers.length} family members`,
      distributionStats
    });

  } catch (error) {
    console.error('Error balancing chores:', error);
    return NextResponse.json(
      { error: 'Failed to balance chore distribution' },
      { status: 500 }
    );
  }
}

// Calculate how balanced the distribution is (0-100, higher is better)
function calculateBalanceScore(memberAssignments: any[]): number {
  if (memberAssignments.length <= 1) return 100;

  const points = memberAssignments.map(m => m.totalPoints);
  const avgPoints = points.reduce((sum, p) => sum + p, 0) / points.length;
  
  // Calculate standard deviation
  const variance = points.reduce((sum, p) => sum + Math.pow(p - avgPoints, 2), 0) / points.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to balance score (lower std dev = higher balance)
  const maxStdDev = avgPoints; // Worst case scenario
  const balanceScore = Math.max(0, Math.round(100 - (stdDev / maxStdDev) * 100));
  
  return balanceScore;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');

    if (!weekStart) {
      return NextResponse.json({ error: 'Week start parameter required' }, { status: 400 });
    }

    // Get user and verify family access
    const user = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);

    // Get current distribution for the week
    const assignments = await prisma.choreAssignment.findMany({
      where: {
        familyId: user.familyId,
        date: {
          gte: weekStartDate,
          lte: weekEndDate
        }
      },
      include: {
        chore: true,
        user: {
          select: {
            id: true,
            name: true,
            nickname: true
          }
        }
      }
    });

    // Calculate current distribution stats
    const memberStats = new Map();
    
    assignments.forEach(assignment => {
      const userId = assignment.userId;
      const userName = assignment.user.nickname || assignment.user.name;
      
      if (!memberStats.has(userId)) {
        memberStats.set(userId, {
          memberName: userName,
          choreCount: 0,
          totalPoints: 0,
          chores: []
        });
      }
      
      const stats = memberStats.get(userId);
      stats.choreCount += 1;
      stats.totalPoints += assignment.chore.points;
      stats.chores.push({
        name: assignment.chore.name,
        points: assignment.chore.points,
        date: assignment.date,
        completed: assignment.completed
      });
    });

    const distributionAnalysis = {
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      totalAssignments: assignments.length,
      memberBreakdown: Array.from(memberStats.values()),
      balanceScore: calculateBalanceScore(Array.from(memberStats.values())),
      isBalanced: Array.from(memberStats.values()).length > 0 ? 
        Math.max(...Array.from(memberStats.values()).map(m => m.totalPoints)) - 
        Math.min(...Array.from(memberStats.values()).map(m => m.totalPoints)) <= 20 : true
    };

    return NextResponse.json(distributionAnalysis);

  } catch (error) {
    console.error('Error analyzing chore distribution:', error);
    return NextResponse.json(
      { error: 'Failed to analyze chore distribution' },
      { status: 500 }
    );
  }
}
