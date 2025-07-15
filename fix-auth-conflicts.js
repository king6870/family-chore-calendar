const { PrismaClient } = require('@prisma/client')

async function fixAuthConflicts() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Fixing authentication conflicts...')
    
    // Delete all existing sessions (forces fresh login)
    const deletedSessions = await prisma.session.deleteMany({})
    console.log(`✅ Cleared ${deletedSessions.count} old sessions`)
    
    // Find and fix duplicate accounts
    const users = await prisma.user.findMany({
      include: { accounts: true }
    })
    
    let fixedAccounts = 0
    for (const user of users) {
      if (user.accounts.length > 1) {
        // Keep the newest account, delete older ones
        const sortedAccounts = user.accounts.sort((a, b) => 
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )
        
        for (let i = 1; i < sortedAccounts.length; i++) {
          await prisma.account.delete({ 
            where: { id: sortedAccounts[i].id } 
          })
          fixedAccounts++
        }
      }
    }
    
    if (fixedAccounts > 0) {
      console.log(`✅ Fixed ${fixedAccounts} duplicate accounts`)
    }
    
    // Clean up any orphaned verification tokens
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })
    console.log(`✅ Cleaned up ${deletedTokens.count} expired tokens`)
    
    console.log('🎉 Authentication conflicts fixed!')
    console.log('')
    console.log('📋 Now try:')
    console.log('1. Start app: npm run dev')
    console.log('2. Go to http://localhost:3000')
    console.log('3. Sign in with Google (should work now!)')
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuthConflicts()
