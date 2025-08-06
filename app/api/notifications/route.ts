import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch user's notifications
export async function GET(request: NextRequest) {
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

    // For now, we'll use activity logs as notifications
    // In the future, this could be a separate notifications table
    const notifications = await prisma.activityLog.findMany({
      where: {
        familyId: user.familyId,
        OR: [
          { userId: user.id }, // User's own actions
          { 
            action: 'admin_unchecked_chore',
            details: { contains: user.nickname || user.name || '' }
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit to recent notifications
    });

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST - Create a notification (for system use)
export async function POST(request: NextRequest) {
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

    const { targetUserId, type, message } = await request.json();

    // Create activity log entry as notification
    const notification = await prisma.activityLog.create({
      data: {
        userId: targetUserId,
        familyId: user.familyId,
        action: type,
        details: message
      }
    });

    return NextResponse.json({ notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}
