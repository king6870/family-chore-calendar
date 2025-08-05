import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateAge } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    })

    if (!user?.familyId || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const members = await prisma.user.findMany({
      where: { familyId: user.familyId },
      select: {
        id: true,
        name: true,
        nickname: true,
        birthdate: true, // Changed from age to birthdate
        isAdmin: true,
        isOwner: true,
        totalPoints: true,
        email: true
      },
      orderBy: [
        { isOwner: 'desc' },
        { isAdmin: 'desc' },
        { nickname: 'asc' }
      ]
    })

    // Transform members to include calculated age
    const membersWithAge = members.map(member => ({
      ...member,
      age: calculateAge(member.birthdate)
    }))

    return NextResponse.json({ members: membersWithAge })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, targetUserId, newOwnerId } = await request.json()

    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    })

    if (!currentUser?.familyId || !currentUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId }
    })

    if (!targetUser || targetUser.familyId !== currentUser.familyId) {
      return NextResponse.json({ error: 'User not found in family' }, { status: 404 })
    }

    switch (action) {
      case 'promote_admin':
        if (!currentUser.isOwner) {
          return NextResponse.json({ error: 'Only owners can promote admins' }, { status: 403 })
        }
        await prisma.user.update({
          where: { id: targetUserId },
          data: { isAdmin: true }
        })
        break

      case 'demote_admin':
        if (!currentUser.isOwner) {
          return NextResponse.json({ error: 'Only owners can demote admins' }, { status: 403 })
        }
        if (targetUser.isOwner) {
          return NextResponse.json({ error: 'Cannot demote owner' }, { status: 400 })
        }
        await prisma.user.update({
          where: { id: targetUserId },
          data: { isAdmin: false }
        })
        break

      case 'kick_member':
        if (!currentUser.isOwner) {
          return NextResponse.json({ error: 'Only owners can kick members' }, { status: 403 })
        }
        if (targetUser.isOwner) {
          return NextResponse.json({ error: 'Cannot kick owner' }, { status: 400 })
        }
        
        await prisma.user.update({
          where: { id: targetUserId },
          data: {
            familyId: null,
            nickname: null,
            birthdate: null, // Changed from age to birthdate
            isAdmin: false,
            isOwner: false,
            totalPoints: 0
          }
        })
        break

      case 'leave_family':
        if (currentUser.isOwner) {
          return NextResponse.json({ 
            error: 'Family owners cannot leave the family. Only delete the family if you are the only member.' 
          }, { status: 403 })
        }
        
        // Regular member leaving
        await prisma.user.update({
          where: { id: currentUser.id },
          data: {
            familyId: null,
            nickname: null,
            birthdate: null, // Changed from age to birthdate
            isAdmin: false,
            isOwner: false,
            totalPoints: 0
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error managing member:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
