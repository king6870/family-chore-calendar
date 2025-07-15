import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST() {
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

    // Get family members and chores
    const [members, chores, weeklyGoal] = await Promise.all([
      prisma.user.findMany({
        where: { familyId: user.familyId },
        select: { id: true, nickname: true, age: true }
      }),
      prisma.chore.findMany({
        where: { familyId: user.familyId },
        orderBy: { points: 'desc' }
      }),
      prisma.weeklyGoal.findUnique({
        where: {
          familyId_weekStart: {
            familyId: user.familyId,
            weekStart: weekStart
          }
        }
      })
    ])

    if (members.length === 0 || chores.length === 0) {
      return NextResponse.json({ error: 'Need at least one member and one chore' }, { status: 400 })
    }

    const targetPoints = weeklyGoal?.pointsGoal || 100
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    // Clear existing assignments for this week
    await prisma.choreAssignment.deleteMany({
      where: {
        familyId: user.familyId,
        date: {
          gte: weekStart,
          lt: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
        }
      }
    })

    // Enhanced equal distribution algorithm
    const memberPoints = members.reduce((acc, member) => {
      acc[member.id] = { 
        points: 0, 
        choreCount: 0, 
        nickname: member.nickname || 'Unknown',
        age: member.age || 0
      }
      return acc
    }, {} as Record<string, { points: number, choreCount: number, nickname: string, age: number }>)

    const assignments = []

    // Phase 1: Distribute chores evenly across days and members
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const currentDate = new Date(weekStart)
      currentDate.setDate(weekStart.getDate() + dayIndex)
      const dayOfWeek = daysOfWeek[dayIndex]

      // Calculate chores per day to ensure even distribution
      const choresPerDay = Math.ceil(chores.length / 7)
      const startChoreIndex = (dayIndex * choresPerDay) % chores.length

      for (let i = 0; i < choresPerDay && (startChoreIndex + i) < chores.length; i++) {
        const chore = chores[startChoreIndex + i]
        
        // Find eligible members (age requirement)
        const eligibleMembers = members.filter(member => 
          (member.age || 0) >= chore.minAge
        )

        if (eligibleMembers.length === 0) continue

        // Enhanced selection: prioritize member with lowest points AND lowest chore count
        const sortedMembers = eligibleMembers.sort((a, b) => {
          const pointsDiff = memberPoints[a.id].points - memberPoints[b.id].points
          if (pointsDiff !== 0) return pointsDiff
          return memberPoints[a.id].choreCount - memberPoints[b.id].choreCount
        })

        const assignedMember = sortedMembers[0]
        memberPoints[assignedMember.id].points += chore.points
        memberPoints[assignedMember.id].choreCount += 1

        assignments.push({
          choreId: chore.id,
          userId: assignedMember.id,
          familyId: user.familyId,
          date: currentDate,
          dayOfWeek: dayOfWeek
        })
      }
    }

    // Phase 2: Perfect balance - ensure all members reach target points equally
    const targetPointsPerMember = targetPoints
    const maxIterations = 50 // Prevent infinite loops
    let iteration = 0

    while (iteration < maxIterations) {
      // Find member with lowest points
      const memberEntries = Object.entries(memberPoints)
      const lowestMember = memberEntries.reduce((min, current) => 
        current[1].points < min[1].points ? current : min
      )
      
      // Find member with highest points
      const highestMember = memberEntries.reduce((max, current) => 
        current[1].points > max[1].points ? current : max
      )

      const pointsDifference = highestMember[1].points - lowestMember[1].points

      // If difference is acceptable (within 10 points), we're balanced
      if (pointsDifference <= 10) break

      // Find suitable chore to assign to lowest member
      const eligibleChores = chores.filter(c => 
        (lowestMember[1].age || 0) >= c.minAge && 
        c.points <= pointsDifference / 2 // Don't over-assign
      )

      if (eligibleChores.length === 0) break

      // Select chore that brings balance closest to perfect
      const idealPoints = (lowestMember[1].points + highestMember[1].points) / 2
      const bestChore = eligibleChores.reduce((best, chore) => {
        const newPoints = lowestMember[1].points + chore.points
        const currentDiff = Math.abs(newPoints - idealPoints)
        const bestDiff = Math.abs(lowestMember[1].points + best.points - idealPoints)
        return currentDiff < bestDiff ? chore : best
      })

      // Assign to random day
      const randomDay = Math.floor(Math.random() * 7)
      const assignDate = new Date(weekStart)
      assignDate.setDate(weekStart.getDate() + randomDay)

      assignments.push({
        choreId: bestChore.id,
        userId: lowestMember[0],
        familyId: user.familyId,
        date: assignDate,
        dayOfWeek: daysOfWeek[randomDay]
      })

      memberPoints[lowestMember[0]].points += bestChore.points
      memberPoints[lowestMember[0]].choreCount += 1
      iteration++
    }

    // Phase 3: Final equalization - ensure everyone meets minimum target
    for (const [memberId, memberData] of Object.entries(memberPoints)) {
      const member = members.find(m => m.id === memberId)
      if (!member) continue

      while (memberData.points < targetPointsPerMember) {
        const eligibleChores = chores.filter(c => 
          (member.age || 0) >= c.minAge && 
          c.points <= (targetPointsPerMember - memberData.points + 5) // Allow slight overage
        )

        if (eligibleChores.length === 0) break

        // Prefer easier chores for final balancing
        const sortedChores = eligibleChores.sort((a, b) => a.points - b.points)
        const chore = sortedChores[0]

        const randomDay = Math.floor(Math.random() * 7)
        const assignDate = new Date(weekStart)
        assignDate.setDate(weekStart.getDate() + randomDay)

        assignments.push({
          choreId: chore.id,
          userId: memberId,
          familyId: user.familyId,
          date: assignDate,
          dayOfWeek: daysOfWeek[randomDay]
        })

        memberData.points += chore.points
        memberData.choreCount += 1
      }
    }

    // Create all assignments
    if (assignments.length > 0) {
      await prisma.choreAssignment.createMany({
        data: assignments
      })
    }

    // Calculate final balance statistics
    const balanceStats = Object.entries(memberPoints).map(([memberId, data]) => ({
      memberId,
      nickname: data.nickname,
      points: data.points,
      choreCount: data.choreCount,
      targetPoints: targetPointsPerMember,
      difference: data.points - targetPointsPerMember
    }))

    const totalPoints = balanceStats.reduce((sum, member) => sum + member.points, 0)
    const averagePoints = totalPoints / balanceStats.length
    const maxDifference = Math.max(...balanceStats.map(m => Math.abs(m.difference)))

    return NextResponse.json({ 
      success: true, 
      assignmentsCreated: assignments.length,
      balanceStats,
      summary: {
        totalMembers: members.length,
        totalPoints,
        averagePoints: Math.round(averagePoints),
        maxPointDifference: maxDifference,
        isBalanced: maxDifference <= 10,
        targetPointsPerMember
      }
    })
  } catch (error) {
    console.error('Error generating assignments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
