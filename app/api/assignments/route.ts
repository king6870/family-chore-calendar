import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const weekStart = searchParams.get('weekStart')
    
    if (!weekStart) {
      return NextResponse.json({ error: 'weekStart parameter required' }, { status: 400 })
    }

    const startDate = new Date(weekStart)
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)

    const assignments = await prisma.choreAssignment.findMany({
      where: {
        familyId: user.familyId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            age: true
          }
        },
        chore: {
          select: {
            id: true,
            name: true,
            points: true,
            difficulty: true,
            minAge: true
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { user: { nickname: 'asc' } }
      ]
    })

    return NextResponse.json({ assignments })
  } catch (error) {
    console.error('Error fetching assignments:', error)
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

    const { userId, choreId, date, dayOfWeek } = await request.json()

    if (!userId || !choreId || !date || !dayOfWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.choreAssignment.findUnique({
      where: {
        userId_choreId_date: {
          userId,
          choreId,
          date: new Date(date)
        }
      },
      include: {
        chore: true,
        user: true
      }
    })

    if (existingAssignment) {
      // If assignment already exists, return it instead of creating a new one
      console.log('Assignment already exists, returning existing assignment:', existingAssignment.id)
      return NextResponse.json({ 
        assignment: existingAssignment,
        message: 'Assignment already exists for this user and date'
      })
    }

    // Verify user belongs to same family
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!targetUser || targetUser.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
    }

    // Verify chore belongs to same family
    const chore = await prisma.chore.findUnique({
      where: { id: choreId }
    })

    if (!chore || chore.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Invalid chore' }, { status: 400 })
    }

    // Check age requirement
    if (chore.minAge && targetUser.age && targetUser.age < chore.minAge) {
      return NextResponse.json({ 
        error: `User is too young for this chore (requires age ${chore.minAge}+)` 
      }, { status: 400 })
    }

    const assignment = await prisma.choreAssignment.create({
      data: {
        userId,
        choreId,
        familyId: user.familyId,
        date: new Date(date),
        dayOfWeek,
        completed: false
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            age: true
          }
        },
        chore: {
          select: {
            id: true,
            name: true,
            points: true,
            difficulty: true,
            minAge: true
          }
        }
      }
    })

    // Log the activity (non-blocking)
    try {
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          familyId: user.familyId,
          action: 'assigned_chore',
          details: `Assigned "${chore.name}" to ${targetUser.nickname} for ${dayOfWeek}. Chore assigned by ${user.nickname} on ${new Date().toLocaleDateString()}`
        }
      });
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
      // Continue with the main operation even if logging fails
    }

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error creating assignment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
