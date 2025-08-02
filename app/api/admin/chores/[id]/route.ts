import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const choreId = params.id
    const { name, description, points, difficulty, minAge } = await request.json()

    // Validate required fields
    if (!name || points === undefined || !difficulty || minAge === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate field values
    if (typeof points !== 'number' || points < 0) {
      return NextResponse.json({ error: 'Points must be a non-negative number' }, { status: 400 })
    }

    if (typeof minAge !== 'number' || minAge < 0 || minAge > 18) {
      return NextResponse.json({ error: 'Minimum age must be between 0 and 18' }, { status: 400 })
    }

    const validDifficulties = ['Easy', 'Medium', 'Hard']
    if (!validDifficulties.includes(difficulty)) {
      return NextResponse.json({ error: 'Invalid difficulty level' }, { status: 400 })
    }

    // Verify chore belongs to user's family
    const existingChore = await prisma.chore.findUnique({
      where: { id: choreId }
    })

    if (!existingChore || existingChore.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
    }

    // Update chore
    const updatedChore = await prisma.chore.update({
      where: { id: choreId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        points: parseInt(points),
        difficulty,
        minAge: parseInt(minAge)
      }
    })

    console.log(`Chore updated: ${updatedChore.name} by ${session.user.email}`)

    return NextResponse.json({ 
      success: true, 
      chore: updatedChore,
      message: 'Chore updated successfully'
    })

  } catch (error) {
    console.error('Error updating chore:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const choreId = params.id

    // Verify chore belongs to user's family
    const chore = await prisma.chore.findUnique({
      where: { id: choreId }
    })

    if (!chore || chore.familyId !== user.familyId) {
      return NextResponse.json({ error: 'Chore not found' }, { status: 404 })
    }

    // Delete chore (this will cascade delete assignments and points)
    await prisma.chore.delete({
      where: { id: choreId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chore:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
