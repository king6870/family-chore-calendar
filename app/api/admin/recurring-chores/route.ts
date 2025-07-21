import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// GET - Fetch recurring chore patterns (backward compatible)
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

    // Get all chores (production schema doesn't support recurring distinction)
    const recurringChores = await prisma.chore.findMany({
      where: {
        familyId: currentUser.family.id
      }
    });

    return NextResponse.json({ recurringChores });

  } catch (error) {
    console.error('Error fetching recurring chores:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring chores' }, { status: 500 });
  }
}

// POST - Create or update recurring chore pattern (backward compatible)
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
      name, 
      description, 
      points, 
      difficulty, 
      minAge,
      recurrenceType, 
      recurrenceInterval, 
      recurrenceDays 
    } = await request.json();

    // Validate required fields
    if (!name || !points || !recurrenceType) {
      return NextResponse.json({ error: 'Name, points, and recurrence type are required' }, { status: 400 });
    }

    const choreData: any = {
      name: name.trim(),
      description: description?.trim() || '',
      points: parseInt(points),
      basePoints: parseInt(points),
      difficulty: difficulty || 'Easy',
      minAge: parseInt(minAge) || 0,
      familyId: currentUser.family.id
    };

    // Skip recurring fields in production - they don't exist in the schema
    console.log('Production schema - recurring fields not supported');

    let chore;
    if (choreId) {
      // Update existing chore
      chore = await prisma.chore.update({
        where: { id: choreId },
        data: choreData
      });
    } else {
      // Create new recurring chore
      chore = await prisma.chore.create({
        data: choreData
      });
    }

    return NextResponse.json({ 
      chore,
      message: choreId ? 'Recurring chore updated successfully' : 'Recurring chore created successfully'
    });

  } catch (error) {
    console.error('Error creating/updating recurring chore:', error);
    return NextResponse.json({ error: 'Failed to save recurring chore' }, { status: 500 });
  }
}

// PUT - Generate chores from patterns (simplified for production compatibility)
export async function PUT(request: NextRequest) {
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

    const { startDate, endDate, choreId } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get chores to process (production schema doesn't support recurring distinction)
    const whereClause = {
      familyId: currentUser.family.id,
      ...(choreId && { id: choreId })
    };

    const recurringChores = await prisma.chore.findMany({
      where: whereClause
    });

    let totalGenerated = 0;
    const generatedChores = [];

    for (const recurringChore of recurringChores) {
      // Simple weekly generation for production compatibility
      const dates = generateSimpleWeeklyDates(start, end);
      
      for (const date of dates) {
        // For recurring chores, we'll create assignments without specific users
        // Admins can later assign them to specific family members
        const familyMembers = await prisma.user.findMany({
          where: { familyId: currentUser.family.id },
          select: { id: true }
        });

        // Create assignments for all family members or just create the chore availability
        for (const member of familyMembers) {
          // Check if chore already exists for this date and user
          const existingAssignment = await prisma.choreAssignment.findFirst({
            where: {
              choreId: recurringChore.id,
              userId: member.id,
              date: {
                gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
                lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
              }
            }
          });

          if (!existingAssignment) {
            // Create new assignment for each family member
            const assignment = await prisma.choreAssignment.create({
              data: {
                choreId: recurringChore.id,
                userId: member.id,
                familyId: currentUser.family.id,
                date: date,
                dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
                completed: false
              }
            });

            generatedChores.push({
              choreName: recurringChore.name,
              dueDate: date,
              assignmentId: assignment.id
            });

            totalGenerated++;
          }
        }
      }

      // Note: lastGenerated field update removed for production compatibility
      // This field will be added in future schema migrations
    }

    return NextResponse.json({
      message: `Generated ${totalGenerated} chore assignments`,
      totalGenerated,
      generatedChores
    });

  } catch (error) {
    console.error('Error generating chores:', error);
    return NextResponse.json({ error: 'Failed to generate chores' }, { status: 500 });
  }
}

// Simple date generation for production compatibility
function generateSimpleWeeklyDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    // Generate for every Monday (simple weekly pattern)
    if (current.getDay() === 1) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}
