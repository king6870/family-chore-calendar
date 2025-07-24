import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔧 Adding remaining missing columns...')
    
    // Add missing columns to WeeklyGoal and ActivityLog tables
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Add pointsGoal to WeeklyGoal table if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'WeeklyGoal' AND column_name = 'pointsGoal') THEN
              ALTER TABLE "WeeklyGoal" ADD COLUMN "pointsGoal" INTEGER;
              -- Update existing rows with a default value
              UPDATE "WeeklyGoal" SET "pointsGoal" = 100 WHERE "pointsGoal" IS NULL;
          END IF;
          
          -- Add details to ActivityLog table if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ActivityLog' AND column_name = 'details') THEN
              ALTER TABLE "ActivityLog" ADD COLUMN "details" TEXT;
          END IF;
          
          -- Also add description to ActivityLog if missing (backup field)
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ActivityLog' AND column_name = 'description') THEN
              ALTER TABLE "ActivityLog" ADD COLUMN "description" TEXT;
          END IF;
      END $$;
    `
    
    console.log('✅ Missing columns added successfully')
    
    // Test that we can now query both tables
    const weeklyGoalCount = await prisma.weeklyGoal.count()
    const activityLogCount = await prisma.activityLog.count()
    
    console.log(`✅ WeeklyGoal table accessible - found ${weeklyGoalCount} goals`)
    console.log(`✅ ActivityLog table accessible - found ${activityLogCount} logs`)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Remaining database columns added successfully',
      weeklyGoalCount,
      activityLogCount,
      columnsAdded: [
        'WeeklyGoal.pointsGoal',
        'ActivityLog.details',
        'ActivityLog.description (backup)'
      ]
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
