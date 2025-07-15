import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')
  
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }
  
  try {
    // Clean up any conflicting auth data for this email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { accounts: true, sessions: true }
    })
    
    if (user) {
      // Delete old sessions
      await prisma.session.deleteMany({
        where: { userId: user.id }
      })
      
      // Keep only one account
      if (user.accounts.length > 1) {
        const accountsToDelete = user.accounts.slice(1)
        for (const account of accountsToDelete) {
          await prisma.account.delete({ where: { id: account.id } })
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Auth conflicts cleared. Try signing in now.' 
    })
    
  } catch (error) {
    console.error('Force signin error:', error)
    return NextResponse.json({ error: 'Failed to clear conflicts' }, { status: 500 })
  }
}
