#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

async function migrateVercelPostgres() {
  // Use your Vercel Postgres connection string
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_URL || process.env.DATABASE_URL
      }
    }
  })

  try {
    console.log('🔧 Checking Vercel Postgres database...')
    
    // Check if isOwner column exists
    const result = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'isOwner'
    `
    
    if (result.length === 0) {
      console.log('➕ Adding isOwner column...')
      
      // Add the isOwner column
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false
      `
      
      // Update existing admins to be owners
      await prisma.$executeRaw`
        UPDATE "User" SET "isOwner" = true WHERE "isAdmin" = true
      `
      
      console.log('✅ isOwner column added successfully!')
      console.log('✅ Existing admins are now owners!')
      
    } else {
      console.log('✅ isOwner column already exists!')
    }
    
    // Verify the fix
    const userCount = await prisma.user.count()
    const ownerCount = await prisma.user.count({ where: { isOwner: true } })
    
    console.log(`📊 Database status:`)
    console.log(`   Total users: ${userCount}`)
    console.log(`   Owners: ${ownerCount}`)
    console.log('🎉 Production database is ready!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('')
    console.log('🔧 Manual fix needed:')
    console.log('1. Go to Vercel Dashboard → Storage → Your Postgres DB')
    console.log('2. Run this SQL in the Query tab:')
    console.log('   ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;')
    console.log('   UPDATE "User" SET "isOwner" = true WHERE "isAdmin" = true;')
  } finally {
    await prisma.$disconnect()
  }
}

migrateVercelPostgres()
