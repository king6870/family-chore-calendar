import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// POST - Bulk operations on auctions
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.isAdmin || !user.familyId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { action, weekStart } = await request.json();

    if (!action || !weekStart) {
      return NextResponse.json({ error: 'Action and weekStart are required' }, { status: 400 });
    }

    const weekStartDate = new Date(weekStart);

    if (action === 'stopAll') {
      // Stop all active auctions for the week
      const activeAuctions = await prisma.auction.findMany({
        where: {
          familyId: user.familyId,
          weekStart: weekStartDate,
          status: 'active'
        },
        include: { Chore: true }
      });

      if (activeAuctions.length === 0) {
        return NextResponse.json({ 
          message: 'No active auctions found to stop',
          count: 0 
        });
      }

      // Update all active auctions to stopped
      const result = await prisma.auction.updateMany({
        where: {
          familyId: user.familyId,
          weekStart: weekStartDate,
          status: 'active'
        },
        data: { status: 'stopped' }
      });

      return NextResponse.json({
        message: `Successfully stopped ${result.count} auctions`,
        count: result.count,
        auctions: activeAuctions.map(a => a.Chore.name)
      });

    } else if (action === 'deleteAll') {
      // Delete all non-completed auctions for the week
      const deletableAuctions = await prisma.auction.findMany({
        where: {
          familyId: user.familyId,
          weekStart: weekStartDate,
          status: { not: 'completed' }
        },
        include: { Chore: true }
      });

      if (deletableAuctions.length === 0) {
        return NextResponse.json({ 
          message: 'No auctions found to delete (completed auctions cannot be deleted)',
          count: 0 
        });
      }

      // Delete all bids for these auctions first
      await prisma.auctionBid.deleteMany({
        where: {
          auctionId: { in: deletableAuctions.map(a => a.id) }
        }
      });

      // Delete the auctions
      const result = await prisma.auction.deleteMany({
        where: {
          familyId: user.familyId,
          weekStart: weekStartDate,
          status: { not: 'completed' }
        }
      });

      return NextResponse.json({
        message: `Successfully deleted ${result.count} auctions`,
        count: result.count,
        auctions: deletableAuctions.map(a => a.Chore.name)
      });

    } else {
      return NextResponse.json({ error: 'Invalid action. Use "stopAll" or "deleteAll"' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in bulk auction operation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
