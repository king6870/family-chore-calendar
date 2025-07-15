import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { family: true }
    })

    if (!user?.familyId || !user.isOwner) {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
    }

    // Check if user is the only member
    const memberCount = await prisma.user.count({
      where: { familyId: user.familyId }
    })

    if (memberCount > 1) {
      return NextResponse.json({ 
        error: 'Cannot delete family with multiple members. Remove all other members first.' 
      }, { status: 400 })
    }

    // Delete family and reset user
    await prisma.$transaction([
      // Delete all family-related data
      prisma.choreAssignment.deleteMany({ where: { familyId: user.familyId } }),
      prisma.pointsEarned.deleteMany({ where: { familyId: user.familyId } }),
      prisma.weeklyGoal.deleteMany({ where: { familyId: user.familyId } }),
      prisma.choreAuction.deleteMany({ where: { familyId: user.familyId } }),
      prisma.reward.deleteMany({ where: { familyId: user.familyId } }),
      prisma.chore.deleteMany({ where: { familyId: user.familyId } }),
      
      // Reset user
      prisma.user.update({
        where: { id: user.id },
        data: {
          familyId: null,
          nickname: null,
          age: null,
          isAdmin: false,
          isOwner: false,
          totalPoints: 0
        }
      }),
      
      // Delete family
      prisma.family.delete({ where: { id: user.familyId } })
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting family:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
