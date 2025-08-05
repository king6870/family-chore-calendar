-- Production Migration: Add location and timezone to Family table
-- Run this on your PostgreSQL production database

BEGIN;

-- Add location and timezone columns to Family table
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "Family" ADD COLUMN IF NOT EXISTS "timezone" TEXT;

-- Optional: Set default timezone for existing families (you can customize this)
-- UPDATE "Family" SET "timezone" = 'UTC' WHERE "timezone" IS NULL;

COMMIT;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'Family' 
AND column_name IN ('location', 'timezone');
