-- Add Suggestion table to production database
-- This script safely adds only the Suggestion table without affecting existing data

-- Check if table already exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Suggestion') THEN
        -- Create Suggestion table
        CREATE TABLE "Suggestion" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT NOT NULL,
            "category" TEXT NOT NULL DEFAULT 'general',
            "priority" TEXT NOT NULL DEFAULT 'medium',
            "status" TEXT NOT NULL DEFAULT 'pending',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "userId" TEXT,
            "familyId" TEXT,
            "userEmail" TEXT,
            "userName" TEXT,

            CONSTRAINT "Suggestion_pkey" PRIMARY KEY ("id")
        );

        -- Add foreign key constraints (if User and Family tables exist)
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User') THEN
            ALTER TABLE "Suggestion" 
            ADD CONSTRAINT "Suggestion_userId_fkey" 
            FOREIGN KEY ("userId") REFERENCES "User"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;

        IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Family') THEN
            ALTER TABLE "Suggestion" 
            ADD CONSTRAINT "Suggestion_familyId_fkey" 
            FOREIGN KEY ("familyId") REFERENCES "Family"("id") 
            ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;

        RAISE NOTICE 'Suggestion table created successfully';
    ELSE
        RAISE NOTICE 'Suggestion table already exists';
    END IF;
END $$;
