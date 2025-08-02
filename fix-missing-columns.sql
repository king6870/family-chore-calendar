-- Fix missing columns in production database
-- This script adds missing columns with proper defaults to avoid data loss

-- 1. Add missing User columns if they don't exist
DO $$ 
BEGIN
    -- Add createdAt to User table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'createdAt') THEN
        ALTER TABLE "User" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add updatedAt to User table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'User' AND column_name = 'updatedAt') THEN
        ALTER TABLE "User" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 2. Add missing ChoreAssignment columns if they don't exist
DO $$ 
BEGIN
    -- Add updatedAt to ChoreAssignment table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'ChoreAssignment' AND column_name = 'updatedAt') THEN
        ALTER TABLE "ChoreAssignment" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 3. Add missing WeeklyGoal columns if they don't exist
DO $$ 
BEGIN
    -- Add target to WeeklyGoal table with default value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WeeklyGoal' AND column_name = 'target') THEN
        ALTER TABLE "WeeklyGoal" ADD COLUMN "target" INTEGER NOT NULL DEFAULT 100;
    END IF;
    
    -- Add updatedAt to WeeklyGoal table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'WeeklyGoal' AND column_name = 'updatedAt') THEN
        ALTER TABLE "WeeklyGoal" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- 4. Create triggers for automatic updatedAt updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
DROP TRIGGER IF EXISTS update_chore_assignment_updated_at ON "ChoreAssignment";
DROP TRIGGER IF EXISTS update_weekly_goal_updated_at ON "WeeklyGoal";

-- Create new triggers
CREATE TRIGGER update_user_updated_at 
    BEFORE UPDATE ON "User" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chore_assignment_updated_at 
    BEFORE UPDATE ON "ChoreAssignment" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_goal_updated_at 
    BEFORE UPDATE ON "WeeklyGoal" 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Update existing rows to have proper timestamps
UPDATE "User" SET "updatedAt" = "createdAt" WHERE "updatedAt" = "createdAt";
UPDATE "ChoreAssignment" SET "updatedAt" = "createdAt" WHERE "updatedAt" = "createdAt";
UPDATE "WeeklyGoal" SET "updatedAt" = "createdAt" WHERE "updatedAt" = "createdAt";
