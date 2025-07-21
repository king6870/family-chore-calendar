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

    const chores = await prisma.chore.findMany({
      where: { familyId: user.familyId },
      orderBy: [
        { difficulty: 'asc' },
        { points: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({ chores })
  } catch (error) {
    console.error('Error fetching chores:', error)
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

    const { name, description, points, minAge, difficulty, isRecurring } = await request.json()

    if (!name?.trim() || !points || points < 1) {
      return NextResponse.json({ error: 'Name and valid points are required' }, { status: 400 })
    }

    const chore = await prisma.chore.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        points: parseInt(points),
        minAge: parseInt(minAge) || 0,
        difficulty: difficulty || 'Easy',
        basePoints: parseInt(points), // For auction system
        familyId: user.familyId
      }
    })

    return NextResponse.json({ chore })
  } catch (error) {
    console.error('Error creating chore:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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

    const { id, name, description, points, minAge, difficulty, isRecurring } = await request.json()

    if (!id || !name?.trim() || !points || points < 1) {
      return NextResponse.json({ error: 'ID, name and valid points are required' }, { status: 400 })
    }

    // Verify chore belongs to user's family
    const existingChore = await prisma.chore.findFirst({
      where: { id, familyId: user.familyId }
    })

    if (!existingChore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
    }

    const chore = await prisma.chore.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        points: parseInt(points),
        minAge: parseInt(minAge) || 0,
        difficulty: difficulty || 'Easy',
        basePoints: parseInt(points)
      }
    })

    return NextResponse.json({ chore })
  } catch (error) {
    console.error('Error updating chore:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const choreId = searchParams.get('id')

    if (!choreId) {
      return NextResponse.json({ error: 'Chore ID required' }, { status: 400 })
    }

    // Verify chore belongs to user's family
    const existingChore = await prisma.chore.findFirst({
      where: { id: choreId, familyId: user.familyId }
    })

    if (!existingChore) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
    }

    await prisma.chore.delete({
      where: { id: choreId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chore:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
