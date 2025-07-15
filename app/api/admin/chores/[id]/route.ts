import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
