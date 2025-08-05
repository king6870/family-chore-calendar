import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all claimed rewards for family
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 });
    }

    // Get all rewards that have been claimed (opposite of the store query)
    const claimedRewards = await prisma.reward.findMany({
      where: { 
        familyId: user.familyId!,
        // Only rewards that have been claimed
        claims: {
          some: {}
        }
      },
      include: {
        creator: { select: { name: true, nickname: true } },
        claims: {
          include: {
            user: { select: { name: true, nickname: true } }
          },
          orderBy: { claimedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ claimedRewards });
  } catch (error) {
    console.error('Error fetching claimed rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch claimed rewards' }, { status: 500 });
  }
}
