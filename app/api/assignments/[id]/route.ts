import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateAge } from '@/lib/utils'

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
    const canToggle = assignment.userId === user.id || user.isAdmin || user.isOwner
    if (!canToggle) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Allow admins/owners to uncheck completed chores (for quality control)
    // Regular users cannot uncheck their own completed chores (one-time redemption rule)
    if (assignment.completed && !completed) {
      const isAdminUnchecking = (user.isAdmin || user.isOwner) && assignment.userId !== user.id
      if (!isAdminUnchecking) {
        return NextResponse.json({ 
          error: 'Cannot mark completed chores as incomplete. Each chore can only be redeemed once.' 
        }, { status: 400 })
      }
    }

    // Prevent completing already completed chores
    if (assignment.completed && completed) {
      return NextResponse.json({ 
        error: 'This chore has already been completed and redeemed.' 
      }, { status: 400 })
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
            birthdate: true
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

    // If marking as completed, award points (only possible if not already completed)
    if (completed) {
      // Get the week start for this assignment
      const assignmentDate = new Date(assignment.date)
      const weekStart = new Date(assignmentDate)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
      weekStart.setDate(diff)
      weekStart.setHours(0, 0, 0, 0)

      // Award points (use bid points if from auction, otherwise use chore points)
      const pointsToAward = assignment.bidPoints || assignment.chore.points;
      
      await prisma.pointsEarned.create({
        data: {
          userId: assignment.userId,
          familyId: assignment.familyId,
          choreId: assignment.choreId,
          points: pointsToAward,
          date: new Date(),
          weekStart: weekStart
        }
      })

      // Update user's total points
      await prisma.user.update({
        where: { id: assignment.userId },
        data: {
          totalPoints: {
            increment: pointsToAward
          }
        }
      })

      // Log the activity (non-blocking)
      try {
        await prisma.activityLog.create({
          data: {
            userId: assignment.userId,
            familyId: assignment.familyId,
            action: 'completed_chore',
            details: `Completed "${assignment.chore.name}" and earned ${pointsToAward} points. Chore completed by ${assignment.user.nickname} on ${new Date().toLocaleDateString()}`
          }
        });
      } catch (logError) {
        console.error('Failed to create activity log:', logError);
      }
    }

    // If admin is unchecking a completed chore, reverse the points
    if (!completed && assignment.completed && (user.isAdmin || user.isOwner) && assignment.userId !== user.id) {
      const pointsToReverse = assignment.bidPoints || assignment.chore.points;
      
      // Find and delete the points earned record for this chore completion
      try {
        await prisma.pointsEarned.deleteMany({
          where: {
            userId: assignment.userId,
            familyId: assignment.familyId,
            choreId: assignment.choreId,
            points: pointsToReverse,
            // Find the most recent points earned for this chore (in case of multiple completions)
            date: {
              gte: new Date(assignment.completedAt || assignment.date)
            }
          }
        });

        // Update user's total points (subtract the points)
        await prisma.user.update({
          where: { id: assignment.userId },
          data: {
            totalPoints: {
              decrement: pointsToReverse
            }
          }
        });

        // Log the admin action (non-blocking)
        try {
          const adminName = user.nickname || user.name || 'Admin';
          const memberName = assignment.user.nickname || 'Member';
          
          await prisma.activityLog.create({
            data: {
              userId: user.id, // Log under admin's ID
              familyId: assignment.familyId,
              action: 'admin_unchecked_chore',
              details: `${adminName} marked "${assignment.chore.name}" as incomplete for ${memberName}. ${pointsToReverse} points reversed due to poor quality.`
            }
          });
        } catch (logError) {
          console.error('Failed to create admin action log:', logError);
        }
      } catch (pointsError) {
        console.error('Failed to reverse points:', pointsError);
        // Continue with the assignment update even if points reversal fails
      }
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
    if (existingAssignment.chore.minAge && calculateAge(targetUser.birthdate) && calculateAge(targetUser.birthdate) < existingAssignment.chore.minAge) {
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
            birthdate: true
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

    // Log the activity (non-blocking)
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          familyId: user.familyId,
          action: 'moved_chore',
          details: `Moved "${existingAssignment.chore.name}" to ${targetUser.nickname} for ${dayOfWeek}. Chore moved by ${user.nickname} on ${new Date().toLocaleDateString()}`
        }
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

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

    // Log the activity (non-blocking)
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          familyId: user.familyId,
          action: 'removed_chore_assignment',
          details: `Removed "${assignment.chore.name}" from ${assignment.user.nickname}. Chore assignment removed by ${user.nickname} on ${new Date().toLocaleDateString()}`
        }
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
