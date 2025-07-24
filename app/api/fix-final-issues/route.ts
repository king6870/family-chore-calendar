import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔧 Fixing final family creation and points issues...')
    
    // Step 1: Add ALL potentially missing columns with proper error handling
    console.log('🔧 Step 1: Adding all missing columns...')
    
    const fixes: string[] = []
    
    // Fix WeeklyGoal table
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            -- Add pointsGoal to WeeklyGoal
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'WeeklyGoal' AND column_name = 'pointsGoal') THEN
                ALTER TABLE "WeeklyGoal" ADD COLUMN "pointsGoal" INTEGER;
                UPDATE "WeeklyGoal" SET "pointsGoal" = 100 WHERE "pointsGoal" IS NULL;
                RAISE NOTICE 'Added pointsGoal to WeeklyGoal';
            END IF;
            
            -- Ensure target column exists
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'WeeklyGoal' AND column_name = 'target') THEN
                ALTER TABLE "WeeklyGoal" ADD COLUMN "target" INTEGER NOT NULL DEFAULT 100;
                RAISE NOTICE 'Added target to WeeklyGoal';
            END IF;
        END $$;
      `
      fixes.push('WeeklyGoal table updated')
    } catch (error) {
      console.log('WeeklyGoal fix error:', error)
      fixes.push('WeeklyGoal table - error occurred')
    }
    
    // Fix ActivityLog table
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            -- Add details to ActivityLog
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'ActivityLog' AND column_name = 'details') THEN
                ALTER TABLE "ActivityLog" ADD COLUMN "details" TEXT;
                RAISE NOTICE 'Added details to ActivityLog';
            END IF;
            
            -- Add description as backup
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'ActivityLog' AND column_name = 'description') THEN
                ALTER TABLE "ActivityLog" ADD COLUMN "description" TEXT;
                RAISE NOTICE 'Added description to ActivityLog';
            END IF;
        END $$;
      `
      fixes.push('ActivityLog table updated')
    } catch (error) {
      console.log('ActivityLog fix error:', error)
      fixes.push('ActivityLog table - error occurred')
    }
    
    // Fix PointsEarned table
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            -- Add date to PointsEarned
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'PointsEarned' AND column_name = 'date') THEN
                ALTER TABLE "PointsEarned" ADD COLUMN "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
                UPDATE "PointsEarned" SET "date" = "createdAt" WHERE "date" IS NULL;
                RAISE NOTICE 'Added date to PointsEarned';
            END IF;
            
            -- Ensure reason column exists and is not null
            IF EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'PointsEarned' AND column_name = 'reason' AND is_nullable = 'YES') THEN
                UPDATE "PointsEarned" SET "reason" = 'Points awarded' WHERE "reason" IS NULL;
                ALTER TABLE "PointsEarned" ALTER COLUMN "reason" SET NOT NULL;
                RAISE NOTICE 'Fixed reason column in PointsEarned';
            END IF;
        END $$;
      `
      fixes.push('PointsEarned table updated')
    } catch (error) {
      console.log('PointsEarned fix error:', error)
      fixes.push('PointsEarned table - error occurred')
    }
    
    // Fix Chore table
    try {
      await prisma.$executeRaw`
        DO $$ 
        BEGIN
            -- Add minAge to Chore
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'Chore' AND column_name = 'minAge') THEN
                ALTER TABLE "Chore" ADD COLUMN "minAge" INTEGER;
                RAISE NOTICE 'Added minAge to Chore';
            END IF;
            
            -- Add basePoints to Chore
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                           WHERE table_name = 'Chore' AND column_name = 'basePoints') THEN
                ALTER TABLE "Chore" ADD COLUMN "basePoints" INTEGER;
                RAISE NOTICE 'Added basePoints to Chore';
            END IF;
        END $$;
      `
      fixes.push('Chore table updated')
    } catch (error) {
      console.log('Chore fix error:', error)
      fixes.push('Chore table - error occurred')
    }
    
    // Step 2: Test actual functionality
    console.log('🧪 Step 2: Testing functionality...')
    
    const testResults = {
      canQueryWeeklyGoal: false,
      canQueryActivityLog: false,
      canQueryPointsEarned: false,
      canQueryChore: false,
      counts: {} as Record<string, number>
    }
    
    try {
      await prisma.weeklyGoal.findFirst()
      testResults.canQueryWeeklyGoal = true
      testResults.counts.weeklyGoals = await prisma.weeklyGoal.count()
    } catch (error) {
      console.log('WeeklyGoal query error:', error)
    }
    
    try {
      await prisma.activityLog.findFirst()
      testResults.canQueryActivityLog = true
      testResults.counts.activityLogs = await prisma.activityLog.count()
    } catch (error) {
      console.log('ActivityLog query error:', error)
    }
    
    try {
      await prisma.pointsEarned.findFirst()
      testResults.canQueryPointsEarned = true
      testResults.counts.pointsEarned = await prisma.pointsEarned.count()
    } catch (error) {
      console.log('PointsEarned query error:', error)
    }
    
    try {
      await prisma.chore.findFirst()
      testResults.canQueryChore = true
      testResults.counts.chores = await prisma.chore.count()
    } catch (error) {
      console.log('Chore query error:', error)
    }
    
    console.log('✅ Final database fix completed')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Final database issues fixed',
      fixes,
      testResults,
      recommendation: testResults.canQueryWeeklyGoal && testResults.canQueryActivityLog ? 
        'All tables should now work correctly' : 
        'Some tables may still have issues - check logs'
    })
    
  } catch (error) {
    console.error('❌ Final fix failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server logs for full error details'
    }, { status: 500 })
  }
}
