import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { prisma } from '../../../../lib/prisma'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { location, timezone } = await request.json()

    if (!location || !timezone) {
      return NextResponse.json({ error: 'Location and timezone are required' }, { status: 400 })
    }

    // Validate timezone
    try {
      Intl.DateTimeFormat('en-US', { timeZone: timezone });
    } catch (error) {
      return NextResponse.json({ error: 'Invalid timezone' }, { status: 400 })
    }

    // Update user's timezone information
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        location,
        timezone
      },
      select: {
        id: true,
        location: true,
        timezone: true,
        name: true,
        nickname: true
      }
    })

    console.log(`Updated user timezone: ${session.user.email} -> ${location} (${timezone})`)

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: 'Timezone updated successfully'
    })

  } catch (error) {
    console.error('Error updating user timezone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        location: true,
        timezone: true,
        name: true,
        nickname: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })

  } catch (error) {
    console.error('Error fetching user timezone:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
