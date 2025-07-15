#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')

async function fixAuthIssues() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔧 Fixing authentication issues...')
    
    // Clean up orphaned sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        expires: {
          lt: new Date()
        }
      }
    })
    
    console.log(`✅ Cleaned up ${deletedSessions.count} expired sessions`)
    
    // Clean up orphaned accounts without users
    const accounts = await prisma.account.findMany({
      include: {
        user: true
      }
    })
    
    let orphanedAccounts = 0
    for (const account of accounts) {
      if (!account.user) {
        await prisma.account.delete({
          where: { id: account.id }
        })
        orphanedAccounts++
      }
    }
    
    console.log(`✅ Cleaned up ${orphanedAccounts} orphaned accounts`)
    
    // Fix users without proper admin/owner status
    const users = await prisma.user.findMany({
      where: {
        familyId: {
          not: null
        }
      },
      include: {
        family: true
      }
    })
    
    let fixedUsers = 0
    for (const user of users) {
      if (user.family) {
        // Check if this user is the only member and should be owner
        const memberCount = await prisma.user.count({
          where: { familyId: user.familyId }
        })
        
        if (memberCount === 1 && !user.isOwner) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isAdmin: true,
              isOwner: true
            }
          })
          fixedUsers++
          console.log(`✅ Fixed user ${user.nickname || user.name} - made owner of solo family`)
        }
      }
    }
    
    console.log(`✅ Fixed ${fixedUsers} user permissions`)
    console.log('🎉 Authentication issues resolved!')
    console.log('')
    console.log('💡 If you still have issues:')
    console.log('1. Clear browser cookies')
    console.log('2. Try incognito/private mode')
    console.log('3. Check Google OAuth settings')
    
  } catch (error) {
    console.error('❌ Error fixing auth issues:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixAuthIssues()
