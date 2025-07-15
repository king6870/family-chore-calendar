import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// GET - Fetch available chores and family members for assignment
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (!currentUser?.family || (!currentUser.isAdmin && !currentUser.isOwner)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all chores for the family
    const chores = await prisma.chore.findMany({
      where: {
        familyId: currentUser.family.id
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get all family members
    const familyMembers = await prisma.user.findMany({
      where: {
        familyId: currentUser.family.id
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        email: true,
        age: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ 
      chores,
      familyMembers
    });

  } catch (error) {
    console.error('Error fetching assignment data:', error);
    return NextResponse.json({ error: 'Failed to fetch assignment data' }, { status: 500 });
  }
}

// POST - Assign chore to family member(s)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (!currentUser?.family || (!currentUser.isAdmin && !currentUser.isOwner)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { 
      choreId, 
      assignedUserIds, 
      dueDate, 
      notes 
    } = await request.json();

    // Validate required fields
    if (!choreId || !assignedUserIds || assignedUserIds.length === 0) {
      return NextResponse.json({ error: 'Chore and at least one assignee are required' }, { status: 400 });
    }

    // Validate chore belongs to family
    const chore = await prisma.chore.findFirst({
      where: {
        id: choreId,
        familyId: currentUser.family.id
      }
    });

    if (!chore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 });
    }

    // Validate all assigned users belong to family
    const validUsers = await prisma.user.findMany({
      where: {
        id: { in: assignedUserIds },
        familyId: currentUser.family.id
      }
    });

    if (validUsers.length !== assignedUserIds.length) {
      return NextResponse.json({ error: 'Some assigned users are not family members' }, { status: 400 });
    }

    // Check age restrictions
    const restrictedUsers = validUsers.filter(user => 
      user.age && user.age < chore.minAge
    );

    if (restrictedUsers.length > 0) {
      const names = restrictedUsers.map(u => u.name || u.nickname || 'Unknown').join(', ');
      return NextResponse.json({ 
        error: `Age restriction: ${names} ${restrictedUsers.length === 1 ? 'is' : 'are'} too young for this chore (minimum age: ${chore.minAge})` 
      }, { status: 400 });
    }

    const assignments = [];
    const assignmentDate = dueDate ? new Date(dueDate) : new Date();

    // Create assignments for each user
    for (const userId of assignedUserIds) {
      // Check if assignment already exists for this user and date
      const existingAssignment = await prisma.choreAssignment.findFirst({
        where: {
          choreId: choreId,
          userId: userId,
          date: {
            gte: new Date(assignmentDate.getFullYear(), assignmentDate.getMonth(), assignmentDate.getDate()),
            lt: new Date(assignmentDate.getFullYear(), assignmentDate.getMonth(), assignmentDate.getDate() + 1)
          }
        }
      });

      if (!existingAssignment) {
        const assignment = await prisma.choreAssignment.create({
          data: {
            choreId: choreId,
            userId: userId,
            familyId: currentUser.family.id,
            date: assignmentDate,
            dayOfWeek: assignmentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
            completed: false
          },
          include: {
            chore: {
              select: {
                name: true,
                points: true,
                difficulty: true
              }
            },
            user: {
              select: {
                name: true,
                nickname: true
              }
            }
          }
        });

        assignments.push(assignment);
      }
    }

    if (assignments.length === 0) {
      return NextResponse.json({ 
        error: 'All selected users already have this chore assigned for the selected date' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      assignments,
      message: `Successfully assigned "${chore.name}" to ${assignments.length} family member${assignments.length === 1 ? '' : 's'}`
    });

  } catch (error) {
    console.error('Error assigning chore:', error);
    return NextResponse.json({ error: 'Failed to assign chore' }, { status: 500 });
  }
}

// DELETE - Remove chore assignment
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (!currentUser?.family || (!currentUser.isAdmin && !currentUser.isOwner)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { assignmentId } = await request.json();

    if (!assignmentId) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 });
    }

    // Verify assignment belongs to family
    const assignment = await prisma.choreAssignment.findFirst({
      where: {
        id: assignmentId,
        familyId: currentUser.family.id
      },
      include: {
        chore: { select: { name: true } },
        user: { select: { name: true, nickname: true } }
      }
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    // Delete the assignment
    await prisma.choreAssignment.delete({
      where: { id: assignmentId }
    });

    return NextResponse.json({ 
      message: `Removed "${assignment.chore.name}" assignment from ${assignment.user.name || assignment.user.nickname || 'Unknown'}`
    });

  } catch (error) {
    console.error('Error removing assignment:', error);
    return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
  }
}
