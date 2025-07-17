const { PrismaClient } = require('@prisma/client');

// Test Prisma Accelerate connection
async function testStagingDatabase() {
  console.log('🧪 Testing Staging Database Connection...');
  console.log('=====================================');
  
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19RU3U4V08xcDJqTDNTYV9yT3pkRzAiLCJhcGlfa2V5IjoiMDFLMEQxM0dCUU5XUFROMFhKNFY2NzZETkciLCJ0ZW5hbnRfaWQiOiI0NDU4MTk4YjMzZjZkNWJhMTFiODA2OTU5NGM5MzY2MWQyZTViM2JhMmNhNmViODkwZjEwMjE0MGI4NTY1ZGFmIiwiaW50ZXJuYWxfc2VjcmV0IjoiYjhlZmJlNzItMWRhMC00NTA3LWE1ZjMtOWU0MGQ1YmE5YTUxIn0.qqA-bRWXV8SvwO4iF_ofd32LZ2NXgzvcOY_31Hu61Rc"
      }
    }
  });

  try {
    // Test basic connection
    console.log('🔌 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test query execution
    console.log('📊 Testing query execution...');
    const userCount = await prisma.user.count();
    console.log(`✅ Query successful! Found ${userCount} users in staging database`);
    
    // Test family data
    console.log('👨‍👩‍👧‍👦 Testing family data...');
    const families = await prisma.family.findMany({
      select: {
        id: true,
        name: true,
        members: {
          select: {
            name: true,
            totalPoints: true
          }
        }
      }
    });
    
    console.log(`✅ Found ${families.length} families in staging database:`);
    families.forEach(family => {
      console.log(`  📋 ${family.name} (${family.members.length} members)`);
      family.members.forEach(member => {
        console.log(`    👤 ${member.name}: ${member.totalPoints} points`);
      });
    });
    
    // Test rewards system (if available)
    try {
      const rewardCount = await prisma.reward?.count() || 0;
      console.log(`🎁 Found ${rewardCount} rewards in staging database`);
    } catch (error) {
      console.log('🎁 Rewards table not available (expected for staging)');
    }
    
    console.log('');
    console.log('🎉 Staging database is ready for use!');
    console.log('🌐 Staging URL: https://family-chore-calendar-git-staging-duckys-projects-22b2b673.vercel.app');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error.message);
    
    if (error.message.includes('api_key')) {
      console.log('💡 Check your Prisma Accelerate API key');
    }
    if (error.message.includes('timeout')) {
      console.log('💡 Check your internet connection');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testStagingDatabase();
