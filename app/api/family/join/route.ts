import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { inviteCode, nickname, birthdate } = await request.json()

    if (!inviteCode?.trim() || !nickname?.trim() || !birthdate) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Check if user already has a family
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (existingUser?.familyId) {
      return NextResponse.json({ error: 'You are already part of a family' }, { status: 400 })
    }

    // Find family by invite code
    const family = await prisma.family.findUnique({
      where: { inviteCode: inviteCode.trim().toUpperCase() }
    })

    if (!family) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })
    }

    // Check if nickname is already taken in this family
    const existingNickname = await prisma.user.findFirst({
      where: {
        familyId: family.id,
        nickname: nickname.trim()
      }
    })

    if (existingNickname) {
      return NextResponse.json({ error: 'Nickname already taken in this family' }, { status: 400 })
    }

    // Update user to join family
    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        familyId: family.id,
        nickname: nickname.trim(),
        birthdate: new Date(birthdate)
      }
    })

    return NextResponse.json({ 
      success: true,
      family: {
        id: family.id,
        name: family.name,
        inviteCode: family.inviteCode
      }
    })
  } catch (error) {
    console.error('Error joining family:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
