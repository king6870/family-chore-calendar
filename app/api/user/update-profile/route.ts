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

    const { name, nickname, birthdate } = await request.json()

    if (!nickname?.trim()) {
      return NextResponse.json({ error: 'Nickname is required' }, { status: 400 })
    }

    if (!birthdate) {
      return NextResponse.json({ error: 'Birthdate is required' }, { status: 400 })
    }

    // Validate birthdate is not in the future
    const birthdateObj = new Date(birthdate)
    const today = new Date()
    
    if (birthdateObj > today) {
      return NextResponse.json({ error: 'Birthdate cannot be in the future' }, { status: 400 })
    }

    // Update user's profile
    await prisma.user.update({
      where: { email: session.user.email },
      data: { 
        name: name?.trim() || null,
        nickname: nickname.trim(),
        birthdate: birthdateObj 
      }
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
