import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 })
    }

    if (!user.isAdmin && !user.isOwner) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { familyName } = await request.json()

    if (!familyName?.trim()) {
      return NextResponse.json({ error: 'Family name is required' }, { status: 400 })
    }

    // Update family name
    await prisma.family.update({
      where: { id: user.familyId },
      data: { name: familyName.trim() }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Family name updated successfully' 
    })
  } catch (error) {
    console.error('Error updating family:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
