import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const defaultChores = [
  // Easy chores (suitable for younger kids)
  { name: 'Make bed', description: 'Make your bed every morning', points: 5, minAge: 5, difficulty: 'Easy' },
  { name: 'Put toys away', description: 'Clean up toys and put them in their place', points: 5, minAge: 3, difficulty: 'Easy' },
  { name: 'Feed pets', description: 'Give food and water to pets', points: 10, minAge: 6, difficulty: 'Easy' },
  { name: 'Set the table', description: 'Put plates, cups, and utensils on the table', points: 8, minAge: 5, difficulty: 'Easy' },
  { name: 'Water plants', description: 'Water indoor and outdoor plants', points: 8, minAge: 6, difficulty: 'Easy' },
  
  // Medium chores
  { name: 'Load dishwasher', description: 'Put dirty dishes in the dishwasher', points: 15, minAge: 8, difficulty: 'Medium' },
  { name: 'Vacuum living room', description: 'Vacuum the living room carpet and furniture', points: 20, minAge: 10, difficulty: 'Medium' },
  { name: 'Take out trash', description: 'Empty trash cans and take bags to curb', points: 15, minAge: 8, difficulty: 'Medium' },
  { name: 'Fold laundry', description: 'Fold clean clothes and put them away', points: 20, minAge: 9, difficulty: 'Medium' },
  { name: 'Clean bathroom sink', description: 'Wipe down bathroom sink and mirror', points: 15, minAge: 8, difficulty: 'Medium' },
  
  // Hard chores (suitable for older kids and adults)
  { name: 'Cook dinner', description: 'Prepare a full meal for the family', points: 35, minAge: 12, difficulty: 'Hard' },
  { name: 'Mow the lawn', description: 'Cut grass in front and back yard', points: 30, minAge: 14, difficulty: 'Hard' },
  { name: 'Deep clean kitchen', description: 'Clean counters, appliances, and floors thoroughly', points: 40, minAge: 12, difficulty: 'Hard' },
  { name: 'Wash and fold all laundry', description: 'Complete laundry process from start to finish', points: 35, minAge: 12, difficulty: 'Hard' },
  { name: 'Grocery shopping', description: 'Shop for weekly groceries with list', points: 25, minAge: 16, difficulty: 'Hard' },
  { name: 'Clean entire bathroom', description: 'Deep clean toilet, shower, sink, and floors', points: 30, minAge: 10, difficulty: 'Hard' },
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { familyName, nickname, age } = await request.json()

    if (!familyName?.trim() || !nickname?.trim() || !age) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Check if user already has a family
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (existingUser?.familyId) {
      return NextResponse.json({ error: 'You are already part of a family' }, { status: 400 })
    }

    // Generate unique invite code
    let inviteCode = generateInviteCode()
    let codeExists = await prisma.family.findUnique({ where: { inviteCode } })
    
    while (codeExists) {
      inviteCode = generateInviteCode()
      codeExists = await prisma.family.findUnique({ where: { inviteCode } })
    }

    // Create family and update user
    const family = await prisma.family.create({
      data: {
        name: familyName.trim(),
        inviteCode
      }
    })

    await prisma.user.update({
      where: { email: session.user.email },
      data: {
        familyId: family.id,
        nickname: nickname.trim(),
        age: parseInt(age),
        isAdmin: true, // First member becomes admin
        isOwner: true  // First member becomes owner
      }
    })

    // Create default chores for the family
    await prisma.chore.createMany({
      data: defaultChores.map(chore => ({
        ...chore,
        familyId: family.id
      }))
    })

    // Create default weekly goal
    const now = new Date()
    const weekStart = new Date(now)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    weekStart.setHours(0, 0, 0, 0)

    await prisma.weeklyGoal.create({
      data: {
        familyId: family.id,
        weekStart,
        pointsGoal: 100
      }
    })

    return NextResponse.json({ 
      success: true, 
      inviteCode: family.inviteCode,
      family: {
        id: family.id,
        name: family.name,
        inviteCode: family.inviteCode
      }
    })
  } catch (error) {
    console.error('Error creating family:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
