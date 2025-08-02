import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔧 Adding missing pointsGoal column...')
    
    // Add the missing pointsGoal column
    await prisma.$executeRaw`
      ALTER TABLE "WeeklyGoal" ADD COLUMN IF NOT EXISTS "pointsGoal" INTEGER;
    `
    
    console.log('✅ pointsGoal column added')
    
    // Set default values for existing rows
    await prisma.$executeRaw`
      UPDATE "WeeklyGoal" SET "pointsGoal" = 100 WHERE "pointsGoal" IS NULL;
    `
    
    console.log('✅ Default values set')
    
    // Also add ActivityLog.details while we're at it
    await prisma.$executeRaw`
      ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "details" TEXT;
    `
    
    console.log('✅ ActivityLog.details column added')
    
    // Test that we can query the table
    const count = await prisma.weeklyGoal.count()
    
    return NextResponse.json({ 
      success: true, 
      message: 'Missing columns added successfully',
      weeklyGoalCount: count,
      columnsAdded: ['WeeklyGoal.pointsGoal', 'ActivityLog.details']
    })
    
  } catch (error) {
    console.error('❌ Column addition failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
