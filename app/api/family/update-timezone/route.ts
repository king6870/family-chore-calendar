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

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
    }

    const { location, timezone } = await request.json()

    if (!location?.trim()) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 })
    }

    if (!timezone?.trim()) {
      return NextResponse.json({ error: 'Timezone is required' }, { status: 400 })
    }

    // Update family location and timezone
    await prisma.family.update({
      where: { id: user.familyId },
      data: { 
        location: location.trim(),
        timezone: timezone.trim()
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Family timezone updated successfully' 
    })
  } catch (error) {
    console.error('Error updating family timezone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
