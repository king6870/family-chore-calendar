import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    if (!user?.familyId) {
      return NextResponse.json({ error: 'No family found' }, { status: 400 })
    }

    // Get all family members - any family member can see other members
    const members = await prisma.user.findMany({
      where: { familyId: user.familyId },
      select: {
        id: true,
        name: true,
        nickname: true,
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

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching family members:', error)
    return NextResponse.json({ error: 'Failed to fetch family members' }, { status: 500 })
  }
}
