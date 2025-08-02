import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    console.log('🔧 Starting comprehensive database migration...')
    
    // Step 1: Add missing columns to existing tables
    console.log('📊 Step 1: Adding missing columns...')
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Add pointsGoal to WeeklyGoal table if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'WeeklyGoal' AND column_name = 'pointsGoal') THEN
              ALTER TABLE "WeeklyGoal" ADD COLUMN "pointsGoal" INTEGER;
              -- Update existing rows with a default value
              UPDATE "WeeklyGoal" SET "pointsGoal" = 100 WHERE "pointsGoal" IS NULL;
              RAISE NOTICE 'Added pointsGoal column to WeeklyGoal';
          END IF;
          
          -- Add details to ActivityLog table if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ActivityLog' AND column_name = 'details') THEN
              ALTER TABLE "ActivityLog" ADD COLUMN "details" TEXT;
              RAISE NOTICE 'Added details column to ActivityLog';
          END IF;
          
          -- Add description to ActivityLog table if missing (backup field)
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'ActivityLog' AND column_name = 'description') THEN
              ALTER TABLE "ActivityLog" ADD COLUMN "description" TEXT;
              RAISE NOTICE 'Added description column to ActivityLog';
          END IF;
      END $$;
    `
    
    // Step 2: Create missing Auction table
    console.log('🏗️ Step 2: Creating missing Auction table...')
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Create Auction table if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                         WHERE table_name = 'Auction') THEN
              CREATE TABLE "Auction" (
                  "id" TEXT NOT NULL PRIMARY KEY,
                  "choreId" TEXT NOT NULL,
                  "familyId" TEXT NOT NULL,
                  "weekStart" TIMESTAMP(3) NOT NULL,
                  "endTime" TIMESTAMP(3) NOT NULL,
                  "status" TEXT NOT NULL DEFAULT 'active',
                  "title" TEXT,
                  "description" TEXT,
                  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
              );
              
              -- Add foreign key constraints
              ALTER TABLE "Auction" ADD CONSTRAINT "Auction_choreId_fkey" 
                  FOREIGN KEY ("choreId") REFERENCES "Chore"("id") ON DELETE CASCADE ON UPDATE CASCADE;
              ALTER TABLE "Auction" ADD CONSTRAINT "Auction_familyId_fkey" 
                  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
              
              -- Add unique constraint
              ALTER TABLE "Auction" ADD CONSTRAINT "Auction_choreId_weekStart_key" 
                  UNIQUE ("choreId", "weekStart");
              
              RAISE NOTICE 'Created Auction table with constraints';
          END IF;
      END $$;
    `
    
    // Step 3: Create missing AuctionBid table if needed
    console.log('🏗️ Step 3: Creating missing AuctionBid table...')
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Create AuctionBid table if it doesn't exist
          IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                         WHERE table_name = 'AuctionBid') THEN
              CREATE TABLE "AuctionBid" (
                  "id" TEXT NOT NULL PRIMARY KEY,
                  "auctionId" TEXT NOT NULL,
                  "userId" TEXT NOT NULL,
                  "familyId" TEXT NOT NULL,
                  "bidPoints" INTEGER NOT NULL,
                  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
              );
              
              -- Add foreign key constraints
              ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_auctionId_fkey" 
                  FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
              ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_userId_fkey" 
                  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
              ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_familyId_fkey" 
                  FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
              
              -- Add unique constraint
              ALTER TABLE "AuctionBid" ADD CONSTRAINT "AuctionBid_auctionId_userId_key" 
                  UNIQUE ("auctionId", "userId");
              
              RAISE NOTICE 'Created AuctionBid table with constraints';
          END IF;
      END $$;
    `
    
    // Step 4: Add missing columns to other tables that might be needed
    console.log('🔧 Step 4: Adding other potentially missing columns...')
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Add basePoints to Chore table if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'Chore' AND column_name = 'basePoints') THEN
              ALTER TABLE "Chore" ADD COLUMN "basePoints" INTEGER;
              RAISE NOTICE 'Added basePoints column to Chore';
          END IF;
          
          -- Add minAge to Chore table if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'Chore' AND column_name = 'minAge') THEN
              ALTER TABLE "Chore" ADD COLUMN "minAge" INTEGER;
              RAISE NOTICE 'Added minAge column to Chore';
          END IF;
          
          -- Add date to PointsEarned table if missing
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name = 'PointsEarned' AND column_name = 'date') THEN
              ALTER TABLE "PointsEarned" ADD COLUMN "date" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP;
              -- Update existing rows to use createdAt as date
              UPDATE "PointsEarned" SET "date" = "createdAt" WHERE "date" IS NULL;
              RAISE NOTICE 'Added date column to PointsEarned';
          END IF;
      END $$;
    `
    
    // Step 5: Create triggers for automatic updatedAt updates
    console.log('⚙️ Step 5: Creating update triggers...')
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW."updatedAt" = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';
    `
    
    await prisma.$executeRaw`
      DO $$ 
      BEGIN
          -- Create triggers for tables that have updatedAt
          DROP TRIGGER IF EXISTS update_auction_updated_at ON "Auction";
          CREATE TRIGGER update_auction_updated_at 
              BEFORE UPDATE ON "Auction" 
              FOR EACH ROW 
              EXECUTE FUNCTION update_updated_at_column();
      END $$;
    `
    
    console.log('✅ All database migrations completed successfully')
    
    // Step 6: Test that we can now query all tables
    const testResults = {
      userCount: await prisma.user.count(),
      familyCount: await prisma.family.count(),
      choreCount: await prisma.chore.count(),
      weeklyGoalCount: await prisma.weeklyGoal.count(),
      activityLogCount: await prisma.activityLog.count(),
      auctionCount: await prisma.auction.count(),
      auctionBidCount: await prisma.auctionBid.count(),
      pointsEarnedCount: await prisma.pointsEarned.count(),
    }
    
    console.log('✅ All tables accessible:', testResults)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Comprehensive database migration completed successfully',
      tablesFixed: [
        'WeeklyGoal.pointsGoal column added',
        'ActivityLog.details column added', 
        'ActivityLog.description column added',
        'Auction table created',
        'AuctionBid table created',
        'Chore.basePoints column added',
        'Chore.minAge column added',
        'PointsEarned.date column added'
      ],
      testResults
    })
    
  } catch (error) {
    console.error('❌ Comprehensive migration failed:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server logs for full error details'
    }, { status: 500 })
  }
}
