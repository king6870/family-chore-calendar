#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

async function fixProductionDatabase() {
  console.log('🔧 Fixing Vercel Postgres database schema...')
  
  // Connect to production database
  const prisma = new PrismaClient()
  
  try {
    // Check if isOwner column exists
    console.log('🔍 Checking for isOwner column...')
    
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name = 'isOwner'
    `
    
    if (columnCheck.length === 0) {
      console.log('➕ Adding missing isOwner column...')
      
      // Add the isOwner column
      await prisma.$executeRaw`
        ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false
      `
      
      console.log('✅ isOwner column added!')
      
      // Update existing admins to be owners
      const updatedUsers = await prisma.$executeRaw`
        UPDATE "User" SET "isOwner" = true WHERE "isAdmin" = true
      `
      
      console.log(`✅ Updated ${updatedUsers} existing admins to owners`)
      
    } else {
      console.log('✅ isOwner column already exists!')
    }
    
    // Verify the database state
    const totalUsers = await prisma.user.count()
    const totalOwners = await prisma.user.count({ where: { isOwner: true } })
    const totalAdmins = await prisma.user.count({ where: { isAdmin: true } })
    
    console.log('')
    console.log('📊 Database Status:')
    console.log(`   Total Users: ${totalUsers}`)
    console.log(`   Total Admins: ${totalAdmins}`)
    console.log(`   Total Owners: ${totalOwners}`)
    console.log('')
    console.log('🎉 Production database schema is now fixed!')
    console.log('✅ Admin panel should work correctly now')
    
  } catch (error) {
    console.error('❌ Database fix failed:', error.message)
    console.log('')
    console.log('🔧 Manual Fix Required:')
    console.log('1. Go to Vercel Dashboard → Your Project → Storage')
    console.log('2. Select your Postgres database')
    console.log('3. Go to Query/SQL tab')
    console.log('4. Run this SQL:')
    console.log('   ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;')
    console.log('   UPDATE "User" SET "isOwner" = true WHERE "isAdmin" = true;')
  } finally {
    await prisma.$disconnect()
  }
}

// Run with production environment
process.env.NODE_ENV = 'production'
fixProductionDatabase()
