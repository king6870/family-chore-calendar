import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auctionId, bidPoints } = await request.json();

    if (!auctionId || !bidPoints || bidPoints <= 0) {
      return NextResponse.json({ error: 'Auction ID and valid bid points are required' }, { status: 400 });
    }

    // Get user and verify family access
    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    // Get the auction and verify it's active
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        Chore: true,
        bids: {
          orderBy: { bidPoints: 'asc' }
        }
      }
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Not authorized to bid on this auction' }, { status: 403 });
    }

    if (auction.status !== 'active') {
      return NextResponse.json({ error: 'Auction is not active' }, { status: 400 });
    }

    if (new Date() > auction.endTime) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 });
    }

    // Check if user meets age requirement for the chore
    if (user.age && auction.Chore.minAge && user.age < auction.Chore.minAge) {
      return NextResponse.json({ 
        error: `You must be at least ${auction.Chore.minAge} years old to bid on this chore` 
      }, { status: 400 });
    }

    // Validate bid amount (must be less than or equal to starting points)
    if (bidPoints > auction.Chore.points) {
      return NextResponse.json({ 
        error: `Bid cannot exceed starting points of ${auction.Chore.points}` 
      }, { status: 400 });
    }

    // Check if this bid is better than current lowest bid
    const currentLowestBid = auction.bids[0];
    if (currentLowestBid && bidPoints >= currentLowestBid.bidPoints) {
      return NextResponse.json({ 
        error: `Your bid must be lower than the current lowest bid of ${currentLowestBid.bidPoints} points` 
      }, { status: 400 });
    }

    // Create or update the user's bid
    const bidId = `bid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await prisma.auctionBid.upsert({
      where: {
        auctionId_userId: {
          auctionId: auctionId,
          userId: user.id
        }
      },
      update: {
        bidPoints: bidPoints,
        createdAt: new Date()
      },
      create: {
        id: bidId,
        auctionId: auctionId,
        userId: user.id,
        familyId: user.familyId!,
        bidPoints: bidPoints,
        createdAt: new Date()
      }
    });

    // Get updated auction with all bids
    const updatedAuction = await prisma.auction.findUnique({
      where: { id: auctionId },
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
          orderBy: { bidPoints: 'asc' }
        }
      }
    });

    // Create notification for other family members about the new bid
    const otherFamilyMembers = await prisma.user.findMany({
      where: { 
        familyId: user.familyId,
        id: { not: user.id }
      },
      select: { id: true }
    });

    if (otherFamilyMembers.length > 0) {
      const notifications = otherFamilyMembers.map(member => ({
        id: `notif_${Date.now()}_${member.id}_${Math.random().toString(36).substr(2, 9)}`,
        userId: member.id,
        type: 'NEW_BID',
        title: 'New Bid Placed!',
        message: `${user.nickname || user.name} bid ${bidPoints} points on "${auction.Chore.name}"`,
        actionUrl: '/auctions',
        read: false,
        createdAt: new Date()
      }));

      // Note: Notification system removed - notifications would be created here
      console.log('Bid notifications would be sent to:', notifications.length, 'family members');
    }

    return NextResponse.json({
      success: true,
      message: `Successfully placed bid of ${bidPoints} points`,
      auction: updatedAuction,
      isLowestBid: updatedAuction?.bids[0]?.userId === user.id
    });

  } catch (error) {
    console.error('Error placing bid:', error);
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    );
  }
}
