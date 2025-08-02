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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { weekStart } = await request.json();

    if (!weekStart) {
      return NextResponse.json({ error: 'Week start date is required' }, { status: 400 });
    }

    // Verify admin permissions
    const adminUser = await prisma.user.findUnique({
      where: { id: user.id }
    });

    if (!adminUser?.isAdmin || !adminUser.familyId) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const weekStartDate = new Date(weekStart);

    // Get all active auctions for the week
    const auctions = await prisma.auction.findMany({
      where: {
        familyId: adminUser.familyId,
        weekStart: weekStartDate,
        status: 'active'
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
          orderBy: { bidPoints: 'asc' }
        }
      }
    });

    if (auctions.length === 0) {
      return NextResponse.json({ 
        error: 'No active auctions found for this week' 
      }, { status: 400 });
    }

    const results = {
      finalized: 0,
      assigned: 0,
      increased: 0,
      failed: 0,
      details: [] as any[]
    };

    // Process each auction
    for (const auction of auctions) {
      try {
        const lowestBid = auction.bids[0];
        
        if (lowestBid) {
          // Auction has bids - assign to lowest bidder
          const weekEndDate = new Date(weekStartDate);
          weekEndDate.setDate(weekStartDate.getDate() + 6);
          weekEndDate.setHours(23, 59, 59, 999);

          // Update auction with winner
          await prisma.auction.update({
            where: { id: auction.id },
            data: {
              status: 'completed'
            }
          });

          // Create chore assignment for the week (spread across 7 days)
          const assignments = [];
          for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
            const assignmentDate = new Date(weekStartDate);
            assignmentDate.setDate(weekStartDate.getDate() + dayOffset);
            
            const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            assignments.push({
              id: `assign_${Date.now()}_${dayOffset}_${Math.random().toString(36).substr(2, 9)}`,
              userId: lowestBid.userId,
              choreId: auction.choreId,
              familyId: adminUser.familyId!,
              date: assignmentDate,
              dayOfWeek: dayNames[assignmentDate.getDay()],
              completed: false,
              createdAt: new Date()
            });
          }

          await prisma.choreAssignment.createMany({
            data: assignments
          });

          // Note: Notification system removed - winner notification would be created here
          console.log('Winner notification would be sent to user:', lowestBid.userId);

          results.assigned++;
          results.details.push({
            choreName: auction.Chore.name,
            winner: lowestBid.user.nickname || lowestBid.user.name,
            winningBid: lowestBid.bidPoints,
            originalPoints: auction.Chore.points,
            status: 'assigned'
          });

        } else {
          // No bids - increase points by 10% and keep auction active
          const newPoints = Math.round(auction.Chore.points * 1.1);
          
          await prisma.auction.update({
            where: { id: auction.id },
            data: {
              endTime: new Date(Date.now() + 24 * 60 * 60 * 1000) // Extend by 24 hours
            }
          });

          // Update the chore's base points as well
          await prisma.chore.update({
            where: { id: auction.choreId },
            data: {
              points: newPoints
            }
          });

          // Notify family members about point increase
          const familyMembers = await prisma.user.findMany({
            where: { familyId: adminUser.familyId },
            select: { id: true }
          });

          const notifications = familyMembers.map(member => ({
            id: `notif_${Date.now()}_${member.id}_${Math.random().toString(36).substr(2, 9)}`,
            userId: member.id,
            type: 'AUCTION_EXTENDED',
            title: 'Chore Points Increased!',
            message: `"${auction.Chore.name}" had no bids. Points increased to ${newPoints} (+10%). Auction extended 24 hours.`,
            actionUrl: '/auctions',
            read: false,
            createdAt: new Date()
          }));

          // Note: Notification system removed - notifications would be created here
          console.log('Auction finalization notifications would be sent to:', notifications.length, 'family members');

          results.increased++;
          results.details.push({
            choreName: auction.Chore.name,
            originalPoints: auction.Chore.points,
            newPoints: newPoints,
            status: 'increased'
          });
        }

        results.finalized++;

      } catch (error) {
        console.error(`Error processing auction ${auction.id}:`, error);
        results.failed++;
        results.details.push({
          choreName: auction.Chore.name,
          error: 'Processing failed',
          status: 'failed'
        });
      }
    }

    // Log the finalization activity
    await prisma.activityLog.create({
      data: {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        familyId: adminUser.familyId,
        action: 'AUCTIONS_FINALIZED',
        details: `Finalized ${results.finalized} auctions for week of ${weekStartDate.toLocaleDateString()}`,
        description: `Auctions finalized by ${user.nickname} on ${new Date().toLocaleDateString()}`
      }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${results.finalized} auctions`,
      results
    });

  } catch (error) {
    console.error('Error finalizing auctions:', error);
    return NextResponse.json(
      { error: 'Failed to finalize auctions' },
      { status: 500 }
    );
  }
}
