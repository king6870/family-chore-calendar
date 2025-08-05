import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH - Stop auction (change status to stopped)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const auctionId = params.id;

    // Find the auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { Chore: true }
    });

    if (!auction || auction.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.status !== 'active') {
      return NextResponse.json({ error: 'Can only stop active auctions' }, { status: 400 });
    }

    // Update auction status to stopped
    const updatedAuction = await prisma.auction.update({
      where: { id: auctionId },
      data: { status: 'stopped' },
      include: {
        Chore: true,
        bids: {
          include: {
            user: {
              select: { id: true, name: true, nickname: true }
            }
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Auction stopped successfully',
      auction: updatedAuction 
    });

  } catch (error) {
    console.error('Error stopping auction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete auction completely
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const auctionId = params.id;

    // Find the auction
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: { 
        Chore: true,
        bids: true 
      }
    });

    if (!auction || auction.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
    }

    if (auction.status === 'completed') {
      return NextResponse.json({ error: 'Cannot delete completed auctions' }, { status: 400 });
    }

    // Delete all bids first (cascade should handle this, but being explicit)
    await prisma.auctionBid.deleteMany({
      where: { auctionId: auctionId }
    });

    // Delete the auction
    await prisma.auction.delete({
      where: { id: auctionId }
    });

    return NextResponse.json({ 
      message: 'Auction deleted successfully',
      choreName: auction.Chore.name 
    });

  } catch (error) {
    console.error('Error deleting auction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
