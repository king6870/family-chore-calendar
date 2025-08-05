import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Generate a random invite code
function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
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

    if (!user?.familyId) {
      return NextResponse.json({ error: 'User not in a family' }, { status: 400 })
    }

    if (!user.isOwner) {
      return NextResponse.json({ error: 'Owner access required' }, { status: 403 })
    }

    // Generate new invite code and ensure it's unique
    let newInviteCode: string
    let attempts = 0
    const maxAttempts = 10

    do {
      newInviteCode = generateInviteCode()
      attempts++
      
      const existingFamily = await prisma.family.findUnique({
        where: { inviteCode: newInviteCode }
      })
      
      if (!existingFamily) break
      
      if (attempts >= maxAttempts) {
        return NextResponse.json({ error: 'Failed to generate unique invite code' }, { status: 500 })
      }
    } while (true)

    // Update family with new invite code
    await prisma.family.update({
      where: { id: user.familyId },
      data: { inviteCode: newInviteCode }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'New invite code generated successfully',
      inviteCode: newInviteCode
    })
  } catch (error) {
    console.error('Error regenerating invite code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
