const { PrismaClient } = require('@prisma/client')

async function testAuth() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Testing database connection...')
    
    // Test database connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Check if tables exist
    const userCount = await prisma.user.count()
    console.log(`✅ User table exists (${userCount} users)`)
    
    const accountCount = await prisma.account.count()
    console.log(`✅ Account table exists (${accountCount} accounts)`)
    
    const sessionCount = await prisma.session.count()
    console.log(`✅ Session table exists (${sessionCount} sessions)`)
    
    console.log('🎉 Database is ready for authentication!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Start the app: npm run dev')
    console.log('2. Open http://localhost:3000')
    console.log('3. Clear browser data (F12 > Application > Clear storage)')
    console.log('4. Sign in with Google')
    console.log('5. Admin panel will work!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
