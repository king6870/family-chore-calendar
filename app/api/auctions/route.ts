import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch active auctions for a week
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const weekStart = searchParams.get('weekStart');

    if (!weekStart) {
      return NextResponse.json({ error: 'Week start parameter required' }, { status: 400 });
    }

    // Get user and verify family access

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    const weekStartDate = new Date(weekStart);

    // Get all auctions for the week
    const auctions = await prisma.auction.findMany({
      where: {
        familyId: user.familyId,
        weekStart: weekStartDate
      },
      include: {
        Chore: true,
        bids: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                nickname: true
              }
            }
          },
          orderBy: {
            bidPoints: 'asc' // Lowest bid first
          }
        }
      },
      orderBy: {
        endTime: 'asc'
      }
    });

    return NextResponse.json({ auctions });

  } catch (error) {
    console.error('Error fetching auctions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auctions' },
      { status: 500 }
    );
  }
}

// POST - Create auctions for a week
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { weekStart, auctionDurationHours = 24 } = await request.json();

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

    // Check if auctions already exist for this week
    const existingAuctions = await prisma.auction.findMany({
      where: {
        familyId: adminUser.familyId,
        weekStart: weekStartDate
      }
    });

    if (existingAuctions.length > 0) {
      return NextResponse.json({ 
        error: 'Auctions already exist for this week' 
      }, { status: 400 });
    }

    // Get all chores for the family
    const chores = await prisma.chore.findMany({
      where: { familyId: adminUser.familyId }
    });

    if (chores.length === 0) {
      return NextResponse.json({ 
        error: 'No chores found to auction' 
      }, { status: 400 });
    }

    // Create auctions for each chore
    const auctionsToCreate = chores.map(chore => ({
      id: `auction_${Date.now()}_${chore.id}_${Math.random().toString(36).substr(2, 9)}`,
      choreId: chore.id,
      familyId: adminUser.familyId!,
      weekStart: weekStartDate,
      status: 'active',
      createdAt: new Date(),
      endTime: new Date(Date.now() + auctionDurationHours * 60 * 60 * 1000) // Default 24 hours
    }));

    // Create all auctions
    await prisma.auction.createMany({
      data: auctionsToCreate
    });

    // Create notifications for all family members
    const familyMembers = await prisma.user.findMany({
      where: { familyId: adminUser.familyId },
      select: { id: true }
    });

    const notifications = familyMembers.map(member => ({
      id: `notif_${Date.now()}_${member.id}_${Math.random().toString(36).substr(2, 9)}`,
      userId: member.id,
      type: 'AUCTION_STARTED',
      title: 'New Chore Auctions Available!',
      message: `${chores.length} chore auctions are now open for bidding. Auction ends in ${auctionDurationHours} hours.`,
      actionUrl: '/auctions',
      read: false,
      createdAt: new Date()
    }));

    // Note: Notification system removed - notifications would be created here
    console.log('Auction creation notifications would be sent to:', notifications.length, 'family members');

    // Log the activity
    await prisma.activityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        familyId: adminUser.familyId,
        action: 'AUCTIONS_CREATED',
        details: `Created ${chores.length} chore auctions for week of ${weekStartDate.toLocaleDateString()}`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully created ${chores.length} chore auctions`,
      auctionCount: chores.length,
      endTime: new Date(Date.now() + auctionDurationHours * 60 * 60 * 1000)
    });

  } catch (error) {
    console.error('Error creating auctions:', error);
    return NextResponse.json(
      { error: 'Failed to create auctions' },
      { status: 500 }
    );
  }
}
