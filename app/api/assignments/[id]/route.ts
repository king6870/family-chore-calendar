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

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 })
    }

    const assignmentId = params.id
    const { completed } = await request.json()

    if (typeof completed !== 'boolean') {
      return NextResponse.json({ error: 'completed must be a boolean' }, { status: 400 })
    }

    // Find the assignment
    const assignment = await prisma.choreAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        chore: true,
        user: true
      }
    })

    if (!assignment || assignment.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if user can toggle this assignment (own chore or admin)
    const canToggle = assignment.userId === user.id || user.isAdmin
    if (!canToggle) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Update the assignment
    const updatedAssignment = await prisma.choreAssignment.update({
      where: { id: assignmentId },
      data: {
        completed,
        completedAt: completed ? new Date() : null
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            age: true
          }
        },
        chore: {
          select: {
            id: true,
            name: true,
            points: true,
            difficulty: true,
            minAge: true
          }
        }
      }
    })

    // If marking as completed, award points
    if (completed && !assignment.completed) {
      // Get the week start for this assignment
      const assignmentDate = new Date(assignment.date)
      const weekStart = new Date(assignmentDate)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)

      // Award points
      await prisma.pointsEarned.create({
        data: {
          userId: assignment.userId,
          familyId: assignment.familyId,
          choreId: assignment.choreId,
          points: assignment.chore.points,
          date: new Date(),
          weekStart: weekStart
        }
      })

      // Update user's total points
      await prisma.user.update({
        where: { id: assignment.userId },
        data: {
          totalPoints: {
            increment: assignment.chore.points
          }
        }
      })

      // Log the activity
      await prisma.activityLog.create({
        data: {
          userId: assignment.userId,
          familyId: assignment.familyId,
          action: 'completed_chore',
          details: `Completed "${assignment.chore.name}" and earned ${assignment.chore.points} points`
        }
      })
    } else if (!completed && assignment.completed) {
      // If marking as incomplete, remove points
      // Find and delete the points record
      const pointsRecord = await prisma.pointsEarned.findFirst({
        where: {
          userId: assignment.userId,
          choreId: assignment.choreId,
          date: {
            gte: new Date(assignment.completedAt || assignment.date),
            lt: new Date(new Date(assignment.completedAt || assignment.date).getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      if (pointsRecord) {
        await prisma.pointsEarned.delete({
          where: { id: pointsRecord.id }
        })

        // Update user's total points
        await prisma.user.update({
          where: { id: assignment.userId },
          data: {
            totalPoints: {
              decrement: assignment.chore.points
            }
          }
        })
      }

      // Log the activity
      await prisma.activityLog.create({
        data: {
          userId: assignment.userId,
          familyId: assignment.familyId,
          action: 'uncompleted_chore',
          details: `Marked "${assignment.chore.name}" as incomplete and removed ${assignment.chore.points} points`
        }
      })
    }

    return NextResponse.json({ assignment: updatedAssignment })
  } catch (error) {
    console.error('Error updating assignment completion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
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

    if (!user?.familyId || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const assignmentId = params.id
    const { userId, date, dayOfWeek } = await request.json()

    if (!userId || !date || !dayOfWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find the existing assignment
    const existingAssignment = await prisma.choreAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        chore: true,
        user: true
      }
    })

    if (!existingAssignment || existingAssignment.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Verify target user belongs to same family
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser || targetUser.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }

    // Check age requirement
    if (existingAssignment.chore.minAge && targetUser.age && targetUser.age < existingAssignment.chore.minAge) {
      return NextResponse.json({ 
        error: `User is too young for this chore (requires age ${existingAssignment.chore.minAge}+)` 
      }, { status: 400 })
    }

    // Check if moving to a different user/date would create a duplicate
    if (userId !== existingAssignment.userId || date !== existingAssignment.date.toISOString().split('T')[0]) {
      const duplicateCheck = await prisma.choreAssignment.findUnique({
        where: {
          userId_choreId_date: {
            userId,
            choreId: existingAssignment.choreId,
            date: new Date(date)
          }
        }
      })

      if (duplicateCheck && duplicateCheck.id !== assignmentId) {
        return NextResponse.json({ error: 'Assignment already exists for this user and date' }, { status: 400 })
      }
    }

    const updatedAssignment = await prisma.choreAssignment.update({
      where: { id: assignmentId },
      data: {
        userId,
        date: new Date(date),
        dayOfWeek
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            age: true
          }
        },
        chore: {
          select: {
            id: true,
            name: true,
            points: true,
            difficulty: true,
            minAge: true
          }
        }
      }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'moved_chore',
        details: `Moved "${existingAssignment.chore.name}" to ${targetUser.nickname} for ${dayOfWeek}`
      }
    })

    return NextResponse.json({ assignment: updatedAssignment })
  } catch (error) {
    console.error('Error updating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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

    if (!user?.familyId || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const assignmentId = params.id

    // Find the assignment to delete
    const assignment = await prisma.choreAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        chore: true,
        user: true
      }
    })

    if (!assignment || assignment.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    await prisma.choreAssignment.delete({
      where: { id: assignmentId }
    })

    // Log the activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        familyId: user.familyId,
        action: 'removed_chore_assignment',
        details: `Removed "${assignment.chore.name}" from ${assignment.user.nickname}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
