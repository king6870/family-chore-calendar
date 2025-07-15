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
      where: { email: session.user.email }
    })

    if (!user?.familyId || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get current week start
    const now = new Date()
    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)

    const weeklyGoal = await prisma.weeklyGoal.findUnique({
      where: {
        familyId_weekStart: {
          familyId: user.familyId,
          weekStart: weekStart
        }
      }
    })

    return NextResponse.json(weeklyGoal || { pointsGoal: 100 })
  } catch (error) {
    console.error('Error fetching weekly goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user?.familyId || !user.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { pointsGoal } = await request.json()

    if (!pointsGoal || pointsGoal < 1) {
      return NextResponse.json({ error: 'Valid points goal required' }, { status: 400 })
    }

    // Get current week start
    const now = new Date()
    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)

    const weeklyGoal = await prisma.weeklyGoal.upsert({
      where: {
        familyId_weekStart: {
          familyId: user.familyId,
          weekStart: weekStart
        }
      },
      update: {
        pointsGoal: parseInt(pointsGoal)
      },
      create: {
        familyId: user.familyId,
        weekStart: weekStart,
        pointsGoal: parseInt(pointsGoal)
      }
    })

    return NextResponse.json(weeklyGoal)
  } catch (error) {
    console.error('Error updating weekly goal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
