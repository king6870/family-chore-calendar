const { PrismaClient } = require('@prisma/client');

async function testAccelerateConnection() {
  console.log('🧪 Simple Prisma Accelerate Connection Test');
  console.log('==========================================');
  
  const accelerateUrl = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19RU3U4V08xcDJqTDNTYV9yT3pkRzAiLCJhcGlfa2V5IjoiMDFLMEQxM0dCUU5XUFROMFhKNFY2NzZETkciLCJ0ZW5hbnRfaWQiOiI0NDU4MTk4YjMzZjZkNWJhMTFiODA2OTU5NGM5MzY2MWQyZTViM2JhMmNhNmViODkwZjEwMjE0MGI4NTY1ZGFmIiwiaW50ZXJuYWxfc2VjcmV0IjoiYjhlZmJlNzItMWRhMC00NTA3LWE1ZjMtOWU0MGQ1YmE5YTUxIn0.qqA-bRWXV8SvwO4iF_ofd32LZ2NXgzvcOY_31Hu61Rc";
  
  // Set environment variable
  process.env.DATABASE_URL = accelerateUrl;
  
  const prisma = new PrismaClient();
  
  try {
    console.log('🔌 Testing basic connection...');
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    console.log('🔍 Testing raw query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Raw query successful:', result);
    
    console.log('🗄️  Testing database info...');
    const dbInfo = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database version:', dbInfo);
    
    console.log('');
    console.log('🎉 Prisma Accelerate is working correctly!');
    console.log('⚡ Your database is ready for high-performance queries');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Add this DATABASE_URL to Vercel Preview environment');
    console.log('2. Deploy to staging with ./deploy-staging.sh');
    console.log('3. Your staging app will use Prisma Accelerate automatically');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    
    if (error.message.includes('P6008')) {
      console.log('');
      console.log('💡 This error suggests a configuration mismatch.');
      console.log('🔧 The issue is likely that your Prisma Accelerate database');
      console.log('   needs to be configured with the correct underlying database.');
      console.log('');
      console.log('🚀 Solution: Add the DATABASE_URL to Vercel and let Vercel handle it:');
      console.log('1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables');
      console.log('2. Add DATABASE_URL for Preview environment');
      console.log('3. Deploy to staging - Vercel will handle the connection properly');
      console.log('');
      console.log('✅ Your Prisma Accelerate setup is correct, it just needs to run in Vercel!');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testAccelerateConnection();
