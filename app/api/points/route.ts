import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const weekStartParam = searchParams.get('weekStart')
    
    if (!weekStartParam) {
      return NextResponse.json({ error: 'weekStart parameter required' }, { status: 400 })
    }

    const weekStart = new Date(weekStartParam)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    // Get all family members
    const familyMembers = await prisma.user.findMany({
      where: { familyId: user.familyId },
      select: {
        id: true,
        nickname: true,
        age: true
      }
    })

    // Get points earned for each member this week
    const pointsData = await prisma.pointsEarned.findMany({
      where: {
        familyId: user.familyId,
        weekStart: weekStart
      },
      select: {
        userId: true,
        points: true
      }
    })

    // Get chore assignments for completion tracking
    const assignments = await prisma.choreAssignment.findMany({
      where: {
        familyId: user.familyId,
        date: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      select: {
        userId: true,
        completed: true
      }
    })

    // Get weekly goal
    const weeklyGoal = await prisma.weeklyGoal.findUnique({
      where: {
        familyId_weekStart: {
          familyId: user.familyId,
          weekStart: weekStart
        }
      }
    })

    // Calculate member stats with enhanced tracking
    const members = familyMembers.map(member => {
      const memberPoints = pointsData
        .filter(p => p.userId === member.id)
        .reduce((sum, p) => sum + p.points, 0)
      
      const memberAssignments = assignments.filter(a => a.userId === member.id)
      const completedChores = memberAssignments.filter(a => a.completed).length
      const totalChores = memberAssignments.length

      return {
        id: member.id,
        nickname: member.nickname || 'Unknown',
        age: member.age || 0,
        weeklyPoints: memberPoints,
        completedChores,
        totalChores,
        completionRate: totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0,
        isAtGoal: weeklyGoal ? memberPoints >= weeklyGoal.pointsGoal : false,
        pointsToGoal: weeklyGoal ? Math.max(0, weeklyGoal.pointsGoal - memberPoints) : 0
      }
    })

    // Calculate family analytics
    const totalFamilyPoints = members.reduce((sum, m) => sum + m.weeklyPoints, 0)
    const averageFamilyPoints = members.length > 0 ? Math.round(totalFamilyPoints / members.length) : 0
    const membersAtGoal = members.filter(m => m.isAtGoal).length
    const totalChoresCompleted = members.reduce((sum, m) => sum + m.completedChores, 0)
    const totalChoresAssigned = members.reduce((sum, m) => sum + m.totalChores, 0)
    const familyCompletionRate = totalChoresAssigned > 0 ? Math.round((totalChoresCompleted / totalChoresAssigned) * 100) : 0

    // Get historical data for trends (last 4 weeks)
    const historicalWeeks = []
    for (let i = 1; i <= 4; i++) {
      const pastWeek = new Date(weekStart)
      pastWeek.setDate(weekStart.getDate() - (i * 7))
      
      const pastPoints = await prisma.pointsEarned.findMany({
        where: {
          familyId: user.familyId,
          weekStart: pastWeek
        },
        select: {
          userId: true,
          points: true
        }
      })

      const weekTotal = pastPoints.reduce((sum, p) => sum + p.points, 0)
      historicalWeeks.unshift({
        weekStart: pastWeek,
        totalPoints: weekTotal,
        averagePoints: pastPoints.length > 0 ? Math.round(weekTotal / members.length) : 0
      })
    }

    return NextResponse.json({
      members,
      weeklyGoal: weeklyGoal ? { 
        pointsGoal: weeklyGoal.pointsGoal,
        familyTarget: weeklyGoal.pointsGoal * members.length
      } : null,
      analytics: {
        totalFamilyPoints,
        averageFamilyPoints,
        membersAtGoal,
        totalMembers: members.length,
        totalChoresCompleted,
        totalChoresAssigned,
        familyCompletionRate,
        weekRange: {
          start: weekStart,
          end: weekEnd
        }
      },
      trends: {
        historical: historicalWeeks,
        currentWeekProgress: Math.round((totalFamilyPoints / (weeklyGoal ? weeklyGoal.pointsGoal * members.length : 100)) * 100)
      }
    })
  } catch (error) {
    console.error('Error fetching points data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
