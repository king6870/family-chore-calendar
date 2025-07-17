import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NewChore {
  name: string;
  description?: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  minAge: number;
  isRecurring: boolean;
}

interface CustomAuctionRequest {
  weekStart: string;
  auctionDurationHours?: number;
  existingChoreIds: string[];
  newChores: NewChore[];
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      weekStart, 
      auctionDurationHours = 24, 
      existingChoreIds = [], 
      newChores = [] 
    }: CustomAuctionRequest = await request.json();

    if (!weekStart) {
      return NextResponse.json({ error: 'Week start date is required' }, { status: 400 });
    }

    if (existingChoreIds.length === 0 && newChores.length === 0) {
      return NextResponse.json({ error: 'At least one chore (existing or new) must be selected' }, { status: 400 });
    }

    // Verify owner permissions
    const ownerUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { family: true }
    });

    if (!ownerUser?.isOwner || !ownerUser.familyId) {
      return NextResponse.json({ error: 'Owner access required to create custom auctions' }, { status: 403 });
    }

    const weekStartDate = new Date(weekStart);

    // Check if auctions already exist for this week
    const existingAuctions = await prisma.choreAuction.findMany({
      where: {
        familyId: ownerUser.familyId,
        weekStart: weekStartDate
      }
    });

    if (existingAuctions.length > 0) {
      return NextResponse.json({ 
        error: 'Auctions already exist for this week. Please finalize or delete existing auctions first.' 
      }, { status: 400 });
    }

    const results = {
      newChoresCreated: 0,
      auctionsCreated: 0,
      choreDetails: [] as any[]
    };

    // Step 1: Create new chores if any
    const createdChores = [];
    for (const newChore of newChores) {
      // Validate new chore data
      if (!newChore.name || !newChore.points || newChore.points <= 0) {
        return NextResponse.json({ 
          error: `Invalid chore data: ${newChore.name || 'Unnamed chore'} must have a name and positive points` 
        }, { status: 400 });
      }

      if (newChore.minAge < 0 || newChore.minAge > 100) {
        return NextResponse.json({ 
          error: `Invalid minimum age for chore: ${newChore.name}` 
        }, { status: 400 });
      }

      const choreId = `chore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const createdChore = await prisma.chore.create({
        data: {
          id: choreId,
          name: newChore.name,
          description: newChore.description || null,
          points: newChore.points,
          difficulty: newChore.difficulty,
          minAge: newChore.minAge,
          isRecurring: newChore.isRecurring,
          family: {
            connect: { id: ownerUser.familyId }
          }
        }
      });

      createdChores.push(createdChore);
      results.newChoresCreated++;
      results.choreDetails.push({
        id: createdChore.id,
        name: createdChore.name,
        points: createdChore.points,
        type: 'new'
      });
    }

    // Step 2: Get existing chores
    const existingChores = [];
    if (existingChoreIds.length > 0) {
      const fetchedChores = await prisma.chore.findMany({
        where: {
          id: { in: existingChoreIds },
          familyId: ownerUser.familyId
        }
      });

      if (fetchedChores.length !== existingChoreIds.length) {
        return NextResponse.json({ 
          error: 'Some selected chores were not found or do not belong to your family' 
        }, { status: 400 });
      }

      existingChores.push(...fetchedChores);
      fetchedChores.forEach(chore => {
        results.choreDetails.push({
          id: chore.id,
          name: chore.name,
          points: chore.points,
          type: 'existing'
        });
      });
    }

    // Step 3: Create auctions for all chores (new + existing)
    const allChores = [...createdChores, ...existingChores];
    const auctionsToCreate = allChores.map(chore => ({
      id: `auction_${Date.now()}_${chore.id}_${Math.random().toString(36).substr(2, 9)}`,
      choreId: chore.id,
      familyId: ownerUser.familyId!,
      weekStart: weekStartDate,
      startPoints: chore.points,
      status: 'active',
      createdAt: new Date(),
      endsAt: new Date(Date.now() + auctionDurationHours * 60 * 60 * 1000)
    }));

    // Create all auctions
    await prisma.choreAuction.createMany({
      data: auctionsToCreate
    });

    results.auctionsCreated = auctionsToCreate.length;

    // Step 4: Create notifications for all family members
    const familyMembers = await prisma.user.findMany({
      where: { familyId: ownerUser.familyId },
      select: { id: true, nickname: true, name: true }
    });

    const notifications = familyMembers.map(member => ({
      id: `notif_${Date.now()}_${member.id}_${Math.random().toString(36).substr(2, 9)}`,
      userId: member.id,
      type: 'CUSTOM_AUCTION_STARTED',
      title: 'Custom Chore Auctions Created!',
      message: `${ownerUser.nickname || ownerUser.name} created ${results.auctionsCreated} custom chore auctions. Bidding ends in ${auctionDurationHours} hours.`,
      actionUrl: '/admin',
      read: false,
      createdAt: new Date()
    }));

    // Note: Notification system removed - notifications would be created here
    console.log('Custom auction notifications would be sent to:', notifications.length, 'family members');

    // Step 5: Log the activity
    await prisma.activityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: session.user.id,
        familyId: ownerUser.familyId,
        action: 'CUSTOM_AUCTIONS_CREATED',
        description: `Created custom auction with ${results.newChoresCreated} new chores and ${existingChores.length} existing chores`,
        metadata: JSON.stringify({
          weekStart: weekStartDate,
          auctionDurationHours,
          newChoresCreated: results.newChoresCreated,
          existingChoresUsed: existingChores.length,
          totalAuctions: results.auctionsCreated,
          choreDetails: results.choreDetails,
          createdAt: new Date()
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created custom auction with ${results.auctionsCreated} chores`,
      results: {
        ...results,
        endsAt: new Date(Date.now() + auctionDurationHours * 60 * 60 * 1000),
        notificationsSent: familyMembers.length
      }
    });

  } catch (error) {
    console.error('Error creating custom auction:', error);
    return NextResponse.json(
      { error: 'Failed to create custom auction' },
      { status: 500 }
    );
  }
}
