import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// Environment check - enable rewards in all environments
const isRewardsEnabled = true;

// GET - Fetch user's reward claims
export async function GET(request: NextRequest) {
  if (!isRewardsEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 });
    }

    const claims = await (prisma as any).rewardClaim?.findMany({
      where: { userId: user.id },
      include: {
        reward: true,
        approver: { select: { name: true, nickname: true } }
      },
      orderBy: { claimedAt: 'desc' }
    }) || [];

    return NextResponse.json({ claims });
  } catch (error) {
    console.error('Error fetching reward claims:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}

// POST - Claim a reward
export async function POST(request: NextRequest) {
  if (!isRewardsEnabled) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 });
    }

    const { rewardId, notes } = await request.json();

    if (!rewardId) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 });
    }

    // Check if reward exists and is active
    const reward = await (prisma as any).reward?.findFirst({
      where: { 
        id: rewardId,
        familyId: user.familyId,
        isActive: true
      }
    });

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found or inactive' }, { status: 404 });
    }

    // Check if user has enough points
    if (user.totalPoints < reward.pointsRequired) {
      return NextResponse.json({ 
        error: `Insufficient points. You need ${reward.pointsRequired} points but only have ${user.totalPoints}.` 
      }, { status: 400 });
    }

    // Check if user already has a pending claim for this reward
    const existingClaim = await (prisma as any).rewardClaim?.findFirst({
      where: {
        rewardId,
        userId: user.id,
        status: 'pending'
      }
    });

    if (existingClaim) {
      return NextResponse.json({ error: 'You already have a pending claim for this reward' }, { status: 400 });
    }

    // Create the claim and deduct points
    const claim = await prisma.$transaction(async (tx) => {
      // Deduct points from user
      await tx.user.update({
        where: { id: user.id },
        data: { totalPoints: user.totalPoints - reward.pointsRequired }
      });

      // Create the claim
      const newClaim = await (tx as any).rewardClaim?.create({
        data: {
          rewardId,
          userId: user.id,
          familyId: user.familyId,
          pointsSpent: reward.pointsRequired,
          notes: notes?.trim() || null
        },
        include: {
          reward: true
        }
      });

      return newClaim;
    });

    return NextResponse.json({ 
      success: true, 
      message: `Reward claimed successfully! ${reward.pointsRequired} points deducted.`,
      claim,
      newPointsBalance: user.totalPoints - reward.pointsRequired
    });
  } catch (error) {
    console.error('Error claiming reward:', error);
    return NextResponse.json({ error: 'Failed to claim reward' }, { status: 500 });
  }
}
