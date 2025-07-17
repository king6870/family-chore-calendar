const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function migrateToAccelerate() {
  console.log('🚀 Migrating Schema to Prisma Accelerate...');
  console.log('==========================================');
  
  // Use the Prisma Accelerate URL directly
  const accelerateUrl = "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19RU3U4V08xcDJqTDNTYV9yT3pkRzAiLCJhcGlfa2V5IjoiMDFLMEQxM0dCUU5XUFROMFhKNFY2NzZETkciLCJ0ZW5hbnRfaWQiOiI0NDU4MTk4YjMzZjZkNWJhMTFiODA2OTU5NGM5MzY2MWQyZTViM2JhMmNhNmViODkwZjEwMjE0MGI4NTY1ZGFmIiwiaW50ZXJuYWxfc2VjcmV0IjoiYjhlZmJlNzItMWRhMC00NTA3LWE1ZjMtOWU0MGQ1YmE5YTUxIn0.qqA-bRWXV8SvwO4iF_ofd32LZ2NXgzvcOY_31Hu61Rc";
  
  console.log('📋 Migration Steps:');
  console.log('1. Backup current schema');
  console.log('2. Switch to PostgreSQL schema');
  console.log('3. Push schema to Prisma Accelerate');
  console.log('4. Verify migration');
  console.log('');
  
  try {
    // Step 1: Backup current schema
    console.log('📦 Step 1: Backing up current schema...');
    const currentSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
    fs.writeFileSync('prisma/schema.backup.prisma', currentSchema);
    console.log('✅ Schema backed up to prisma/schema.backup.prisma');
    
    // Step 2: Switch to PostgreSQL schema
    console.log('🔄 Step 2: Switching to PostgreSQL schema...');
    const accelerateSchema = fs.readFileSync('prisma/schema.accelerate.prisma', 'utf8');
    fs.writeFileSync('prisma/schema.prisma', accelerateSchema);
    console.log('✅ Schema switched to PostgreSQL for Prisma Accelerate');
    
    // Step 3: Set environment variable and push schema
    console.log('📤 Step 3: Pushing schema to Prisma Accelerate...');
    process.env.DATABASE_URL = accelerateUrl;
    
    // Import exec to run prisma commands
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Generate Prisma client
    console.log('🔧 Generating Prisma client...');
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');
    
    // Push schema to database
    console.log('🗄️  Pushing schema to database...');
    await execAsync('npx prisma db push --force-reset');
    console.log('✅ Schema pushed to Prisma Accelerate database');
    
    // Step 4: Verify migration
    console.log('🔍 Step 4: Verifying migration...');
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: accelerateUrl
        }
      }
    });
    
    await prisma.$connect();
    console.log('✅ Connected to Prisma Accelerate database');
    
    // Test basic operations
    const userCount = await prisma.user.count();
    console.log(`✅ Database operational - Found ${userCount} users`);
    
    await prisma.$disconnect();
    
    console.log('');
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('===================================');
    console.log('');
    console.log('✅ Your database is now ready for Prisma Accelerate');
    console.log('⚡ High-performance queries with global caching enabled');
    console.log('🌍 Global edge network for reduced latency');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Add DATABASE_URL to Vercel Preview environment');
    console.log('2. Deploy to staging: ./deploy-staging.sh');
    console.log('3. Test your app on staging environment');
    console.log('');
    console.log('📋 Important notes:');
    console.log('- Your original schema is backed up as schema.backup.prisma');
    console.log('- Local development will now use PostgreSQL schema');
    console.log('- Run this migration script again if you need to reset the database');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    // Restore original schema on error
    console.log('🔄 Restoring original schema...');
    try {
      const backupSchema = fs.readFileSync('prisma/schema.backup.prisma', 'utf8');
      fs.writeFileSync('prisma/schema.prisma', backupSchema);
      console.log('✅ Original schema restored');
    } catch (restoreError) {
      console.error('❌ Failed to restore schema:', restoreError.message);
    }
    
    console.log('');
    console.log('💡 Troubleshooting tips:');
    console.log('- Check your internet connection');
    console.log('- Verify your Prisma Accelerate API key is correct');
    console.log('- Make sure you have the latest Prisma CLI installed');
    console.log('- Try running: npm install @prisma/client@latest prisma@latest');
  }
}

migrateToAccelerate();
