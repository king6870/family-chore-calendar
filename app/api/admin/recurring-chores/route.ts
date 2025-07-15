import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { 
  generateChoresForDateRange, 
  parseRecurrencePattern, 
  validateRecurrencePattern,
  RecurrencePattern 
} from '../../../../lib/recurringChores';

// GET - Fetch all recurring chores for the family
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

    const recurringChores = await prisma.chore.findMany({
      where: {
        familyId: currentUser.family.id,
        isRecurring: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ recurringChores });

  } catch (error) {
    console.error('Error fetching recurring chores:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring chores' }, { status: 500 });
  }
}

// POST - Create or update a recurring chore
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
      id,
      name,
      description,
      points,
      minAge,
      difficulty,
      recurrenceType,
      recurrenceInterval,
      recurrenceDays,
      recurrenceEndDate,
      isActive
    } = await request.json();

    // Validate required fields
    if (!name || !points || points < 1) {
      return NextResponse.json({ error: 'Name and points are required' }, { status: 400 });
    }

    // Validate recurrence pattern if provided
    if (recurrenceType) {
      const pattern: Partial<RecurrencePattern> = {
        type: recurrenceType,
        interval: recurrenceInterval,
        days: recurrenceDays,
        endDate: recurrenceEndDate ? new Date(recurrenceEndDate) : undefined
      };

      const validation = validateRecurrencePattern(pattern);
      if (!validation.isValid) {
        return NextResponse.json({ 
          error: 'Invalid recurrence pattern', 
          details: validation.errors 
        }, { status: 400 });
      }
    }

    const choreData = {
      name,
      description: description || null,
      points: parseInt(points),
      minAge: parseInt(minAge) || 0,
      difficulty: difficulty || 'Easy',
      basePoints: parseInt(points),
      isRecurring: !!recurrenceType,
      recurrenceType: recurrenceType || null,
      recurrenceInterval: recurrenceInterval ? parseInt(recurrenceInterval) : null,
      recurrenceDays: recurrenceDays ? JSON.stringify(recurrenceDays) : null,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
      isActive: isActive !== false, // Default to true
      familyId: currentUser.family.id
    };

    let chore;
    if (id) {
      // Update existing chore
      chore = await prisma.chore.update({
        where: { id },
        data: choreData
      });
    } else {
      // Create new chore
      chore = await prisma.chore.create({
        data: choreData
      });
    }

    return NextResponse.json({ 
      chore,
      message: id ? 'Recurring chore updated successfully' : 'Recurring chore created successfully'
    });

  } catch (error) {
    console.error('Error creating/updating recurring chore:', error);
    return NextResponse.json({ error: 'Failed to save recurring chore' }, { status: 500 });
  }
}

// PUT - Generate chores from recurring patterns
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
      return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get recurring chores to process
    const whereClause = {
      familyId: currentUser.family.id,
      isRecurring: true,
      // Only filter by isActive if the field exists in the schema
      ...(choreId && { id: choreId })
    };

    const recurringChores = await prisma.chore.findMany({
      where: whereClause
    });

    let totalGenerated = 0;
    const generatedChores = [];

    for (const recurringChore of recurringChores) {
      const pattern = parseRecurrencePattern(recurringChore);
      if (!pattern) continue;

      const dates = generateChoresForDateRange(recurringChore, start, end);
      
      for (const date of dates) {
        // Check if chore already exists for this date
        const existingAssignment = await prisma.choreAssignment.findFirst({
          where: {
            choreId: recurringChore.id,
            date: {
              gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
              lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
            }
          }
        });

        if (!existingAssignment) {
          // Create new chore assignment
          const assignment = await prisma.choreAssignment.create({
            data: {
              choreId: recurringChore.id,
              date: date,
              dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
              completed: false,
              familyId: currentUser.family.id,
              userId: '' // Will be assigned later through auction or manual assignment
            }
          });

          generatedChores.push({
            choreName: recurringChore.name,
            date: date,
            assignmentId: assignment.id
          });

          totalGenerated++;
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
    console.error('Error generating recurring chores:', error);
    return NextResponse.json({ error: 'Failed to generate recurring chores' }, { status: 500 });
  }
}
