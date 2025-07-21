import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';
import { calculateSmartBiddingLimits } from '../../../../lib/smartBidding';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auctionId } = await request.json();

    if (!auctionId) {
      return NextResponse.json({ error: 'Auction ID required' }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        family: {
          include: {
            members: true,
            weeklyGoals: {
              orderBy: { weekStart: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!currentUser?.family) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 });
    }

    // Get the specific auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        Chore: true,
        bids: {
          include: { user: true },
          orderBy: { bidPoints: 'asc' }
        }
      }
    });

    if (!auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    // Get all active auctions for this week to calculate total chores
    const weekStart = new Date(auction.weekStart);
    const allAuctions = await prisma.auction.findMany({
      where: {
        weekStart: weekStart,
        status: 'ACTIVE'
      },
      include: {
        bids: {
          where: { userId: currentUser.id }
        }
      }
    });

    // Get current weekly goal
    const currentWeeklyGoal = currentUser.family.weeklyGoals[0]?.target || 100; // Default to 100 if no goal set

    // Calculate user's existing bids count
    const userExistingBids = allAuctions.reduce((count, auc) => {
      return count + (auc.bids.length > 0 ? 1 : 0);
    }, 0);

    // Calculate time remaining
    const timeRemainingMs = new Date(auction.endTime).getTime() - new Date().getTime();
    const timeRemainingHours = Math.max(0, timeRemainingMs / (1000 * 60 * 60));

    // Get current lowest bid
    const currentLowestBid = auction.bids.length > 0 ? auction.bids[0].bidPoints : undefined;

    // Calculate smart bidding limits
    const biddingLimits = calculateSmartBiddingLimits({
      weeklyGoal: currentWeeklyGoal,
      totalChores: allAuctions.length,
      familyMemberCount: currentUser.family.members.length,
      userCurrentPoints: currentUser.totalPoints,
      choreOriginalPoints: auction.Chore.points,
      currentLowestBid,
      userExistingBids,
      timeRemainingHours
    });

    // Get user's current bid on this auction
    const userCurrentBid = auction.bids.find(bid => bid.user.id === currentUser.id);

    return NextResponse.json({
      biddingLimits,
      auctionInfo: {
        choreId: auction.Chore.id,
        choreName: auction.Chore.name,
        originalPoints: auction.Chore.points,
        currentLowestBid,
        timeRemainingHours: Math.round(timeRemainingHours * 10) / 10,
        userCurrentBid: userCurrentBid?.bidPoints
      },
      userInfo: {
        currentPoints: currentUser.totalPoints,
        weeklyGoal: currentWeeklyGoal,
        existingBidsCount: userExistingBids,
        familyMemberCount: currentUser.family.members.length
      },
      weeklyContext: {
        totalChores: allAuctions.length,
        averageChoresPerPerson: Math.ceil(allAuctions.length / currentUser.family.members.length)
      }
    });

  } catch (error) {
    console.error('Smart bidding calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate smart bidding limits' }, { status: 500 });
  }
}
