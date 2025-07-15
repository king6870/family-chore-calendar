import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { completed } = await request.json()
    const assignmentId = params.id

    // Find the assignment and verify ownership
    const assignment = await prisma.choreAssignment.findUnique({
      where: { id: assignmentId },
      include: { chore: true }
    })

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (assignment.userId !== user.id) {
      return NextResponse.json({ error: 'Not authorized to update this assignment' }, { status: 403 })
    }

    // Update assignment
    const updatedAssignment = await prisma.choreAssignment.update({
      where: { id: assignmentId },
      data: {
        completed,
        completedAt: completed ? new Date() : null
      }
    })

    // Handle points with enhanced tracking
    if (completed && !assignment.completed) {
      // Award points
      const weekStart = new Date(assignment.date)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)

      await prisma.pointsEarned.create({
        data: {
          userId: user.id,
          familyId: user.familyId!,
          choreId: assignment.choreId,
          points: assignment.chore.points,
          date: new Date(),
          weekStart
        }
      })

      // Update user's total points
      await prisma.user.update({
        where: { id: user.id },
        data: {
          totalPoints: {
            increment: assignment.chore.points
          }
        }
      })

      // Log the point earning activity
      await prisma.activityLog.create({
        data: {
          id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          action: 'POINTS_EARNED',
          description: `${user.nickname || user.name} earned ${assignment.chore.points} points for completing "${assignment.chore.name}"`,
          metadata: JSON.stringify({
            choreId: assignment.choreId,
            choreName: assignment.chore.name,
            pointsEarned: assignment.chore.points,
            completedAt: new Date(),
            weekStart: weekStart
          }),
          userId: user.id,
          familyId: user.familyId
        }
      })

      // Check if user reached weekly goal
      const currentWeekPoints = await prisma.pointsEarned.aggregate({
        where: {
          userId: user.id,
          familyId: user.familyId!,
          weekStart: weekStart
        },
        _sum: {
          points: true
        }
      })

      const weeklyGoal = await prisma.weeklyGoal.findUnique({
        where: {
          familyId_weekStart: {
            familyId: user.familyId!,
            weekStart: weekStart
          }
        }
      })

      const totalPoints = currentWeekPoints._sum.points || 0
      const goalPoints = weeklyGoal?.pointsGoal || 100

      if (totalPoints >= goalPoints) {
        // Log goal achievement
        await prisma.activityLog.create({
          data: {
            id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            action: 'WEEKLY_GOAL_ACHIEVED',
            description: `🎉 ${user.nickname || user.name} achieved their weekly goal of ${goalPoints} points! Total: ${totalPoints} points`,
            metadata: JSON.stringify({
              goalPoints,
              totalPoints,
              weekStart: weekStart,
              achievedAt: new Date()
            }),
            userId: user.id,
            familyId: user.familyId
          }
        })
      }

    } else if (!completed && assignment.completed) {
      // Remove points
      const pointsToRemove = await prisma.pointsEarned.findMany({
        where: {
          userId: user.id,
          choreId: assignment.choreId,
          date: {
            gte: assignment.completedAt || assignment.date,
            lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // Next day
          }
        }
      })

      const pointsRemoved = pointsToRemove.reduce((sum, p) => sum + p.points, 0)

      await prisma.pointsEarned.deleteMany({
        where: {
          userId: user.id,
          choreId: assignment.choreId,
          date: {
            gte: assignment.completedAt || assignment.date,
            lt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000) // Next day
          }
        }
      })

      // Update user's total points
      if (pointsRemoved > 0) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            totalPoints: {
              decrement: pointsRemoved
            }
          }
        })
      }

      // Log the point removal
      if (pointsRemoved > 0) {
        await prisma.activityLog.create({
          data: {
            id: `remove_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            action: 'POINTS_REMOVED',
            description: `${user.nickname || user.name} lost ${pointsRemoved} points for unmarking "${assignment.chore.name}"`,
            metadata: JSON.stringify({
              choreId: assignment.choreId,
              choreName: assignment.chore.name,
              pointsRemoved: pointsRemoved,
              unmarkedAt: new Date()
            }),
            userId: user.id,
            familyId: user.familyId
          }
        })
      }
    }

    // Get updated user points for response
    const weekStart = new Date(assignment.date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)

    const currentWeekPoints = await prisma.pointsEarned.aggregate({
      where: {
        userId: user.id,
        familyId: user.familyId!,
        weekStart: weekStart
      },
      _sum: {
        points: true
      }
    })

    const weeklyGoal = await prisma.weeklyGoal.findUnique({
      where: {
        familyId_weekStart: {
          familyId: user.familyId!,
          weekStart: weekStart
        }
      }
    })

    const totalWeeklyPoints = currentWeekPoints._sum.points || 0
    const goalPoints = weeklyGoal?.pointsGoal || 100

    return NextResponse.json({
      assignment: updatedAssignment,
      pointsUpdate: {
        chorePoints: assignment.chore.points,
        pointsAwarded: completed && !assignment.completed,
        pointsRemoved: !completed && assignment.completed,
        totalWeeklyPoints,
        goalPoints,
        isAtGoal: totalWeeklyPoints >= goalPoints,
        pointsToGoal: Math.max(0, goalPoints - totalWeeklyPoints),
        progressPercentage: Math.min((totalWeeklyPoints / goalPoints) * 100, 100)
      }
    })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
