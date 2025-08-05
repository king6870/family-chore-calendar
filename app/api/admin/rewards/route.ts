import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../../lib/auth';
import { prisma } from '../../../../lib/prisma';

// Environment check - enable rewards in all environments
const isRewardsEnabled = true;

// GET - Fetch all rewards for family
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
      where: { email: session.user.email },
      include: { family: true }
    });

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 });
    }

    const rewards = await prisma.reward.findMany({
      where: { 
        familyId: user.familyId!,
        // Exclude rewards that have been claimed (one-time rewards)
        claims: {
          none: {}
        }
      },
      include: {
        creator: { select: { name: true, nickname: true } },
        claims: {
          include: {
            user: { select: { name: true, nickname: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json({ error: 'Failed to fetch rewards' }, { status: 500 });
  }
}

// POST - Create new reward
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

    if (!user?.familyId || (!user.isAdmin && !user.isOwner)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { title, description, pointsRequired, category, imageUrl } = await request.json();

    if (!title || !pointsRequired || pointsRequired < 1) {
      return NextResponse.json({ error: 'Title and valid points required' }, { status: 400 });
    }

    const reward = await prisma.reward.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        pointsRequired: parseInt(pointsRequired),
        category: category || 'general',
        imageUrl: imageUrl?.trim() || null,
        familyId: user.familyId!,
        creatorId: user.id
      },
      include: {
        creator: { select: { name: true, nickname: true } }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Reward created successfully!',
      reward 
    });
  } catch (error) {
    console.error('Error creating reward:', error);
    return NextResponse.json({ error: 'Failed to create reward' }, { status: 500 });
  }
}

// PUT - Update reward
export async function PUT(request: NextRequest) {
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

    if (!user?.familyId || (!user.isAdmin && !user.isOwner)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, title, description, pointsRequired, category, imageUrl, isActive } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 });
    }

    const reward = await prisma.reward.update({
      where: { 
        id,
        familyId: user.familyId! // Ensure user can only update their family's rewards
      },
      data: {
        title: title?.trim(),
        description: description?.trim() || null,
        pointsRequired: pointsRequired ? parseInt(pointsRequired) : undefined,
        category: category || undefined,
        imageUrl: imageUrl?.trim() || null,
        isActive: isActive !== undefined ? isActive : undefined
      },
      include: {
        creator: { select: { name: true, nickname: true } }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Reward updated successfully!',
      reward 
    });
  } catch (error) {
    console.error('Error updating reward:', error);
    return NextResponse.json({ error: 'Failed to update reward' }, { status: 500 });
  }
}

// DELETE - Delete reward
export async function DELETE(request: NextRequest) {
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

    if (!user?.familyId || (!user.isAdmin && !user.isOwner)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rewardId = searchParams.get('id');

    if (!rewardId) {
      return NextResponse.json({ error: 'Reward ID required' }, { status: 400 });
    }

    await prisma.reward.delete({
      where: { 
        id: rewardId,
        familyId: user.familyId! // Ensure user can only delete their family's rewards
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Reward deleted successfully!' 
    });
  } catch (error) {
    console.error('Error deleting reward:', error);
    return NextResponse.json({ error: 'Failed to delete reward' }, { status: 500 });
  }
}
