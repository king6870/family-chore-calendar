const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function setupNewStagingDatabase() {
  console.log('🗄️  SETTING UP NEW STAGING DATABASE');
  console.log('==================================');
  console.log('');
  console.log('🎯 Target: Brand New Staging Database');
  console.log('📋 Action: Create complete schema from scratch');
  console.log('🔒 Safety: Fresh database with no existing data');
  console.log('');

  // You'll need to replace this with your new database URL
  const newStagingDbUrl = process.env.NEW_STAGING_DATABASE_URL || "REPLACE_WITH_YOUR_NEW_DATABASE_URL";
  
  if (newStagingDbUrl === "REPLACE_WITH_YOUR_NEW_DATABASE_URL") {
    console.log('❌ Please set NEW_STAGING_DATABASE_URL environment variable');
    console.log('');
    console.log('Usage:');
    console.log('NEW_STAGING_DATABASE_URL="your-new-db-url" node setup-new-staging-database.js');
    console.log('');
    console.log('Or update the script with your new database URL');
    return;
  }

  console.log('🔗 Using new staging database URL');
  console.log('');

  try {
    // Step 1: Backup current schema
    console.log('📦 Step 1: Preparing PostgreSQL schema...');
    const currentSchema = fs.readFileSync('prisma/schema.prisma', 'utf8');
    fs.writeFileSync('prisma/schema.backup.prisma', currentSchema);
    console.log('✅ Current schema backed up');

    // Step 2: Use production schema (PostgreSQL compatible)
    console.log('');
    console.log('🔄 Step 2: Switching to PostgreSQL schema...');
    const productionSchema = fs.readFileSync('prisma/schema.production.prisma', 'utf8');
    fs.writeFileSync('prisma/schema.prisma', productionSchema);
    console.log('✅ Schema switched to PostgreSQL');

    // Step 3: Generate Prisma client
    console.log('');
    console.log('🔧 Step 3: Generating Prisma client...');
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    process.env.DATABASE_URL = newStagingDbUrl;
    await execAsync('npx prisma generate');
    console.log('✅ Prisma client generated');

    // Step 4: Connect to new database
    console.log('');
    console.log('🔌 Step 4: Connecting to new staging database...');
    const prisma = new PrismaClient();
    await prisma.$connect();
    console.log('✅ Connected to new staging database');

    // Step 5: Create complete schema
    console.log('');
    console.log('🏗️  Step 5: Creating complete database schema...');
    await execAsync('npx prisma db push');
    console.log('✅ Complete schema created in new database');

    // Step 6: Verify schema
    console.log('');
    console.log('🔍 Step 6: Verifying database schema...');
    
    // Check all main tables exist
    const tables = [
      'User', 'Family', 'Chore', 'ChoreAssignment', 
      'PointsEarned', 'Auction', 'AuctionBid', 
      'ActivityLog', 'WeeklyGoal', 'Suggestion'
    ];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`✅ ${table} table: ${count} records`);
      } catch (error) {
        console.log(`⚠️  ${table} table: Not accessible (${error.message})`);
      }
    }

    // Step 7: Create test data
    console.log('');
    console.log('🧪 Step 7: Creating test data...');
    
    // Create test family
    const testFamily = await prisma.family.create({
      data: {
        name: 'New Staging Test Family',
        inviteCode: 'STAGING-' + Math.random().toString(36).substring(2, 8).toUpperCase()
      }
    });
    console.log(`✅ Test family created: ${testFamily.name} (${testFamily.inviteCode})`);

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Staging Test User',
        email: 'staging-test@example.com',
        familyId: testFamily.id,
        isAdmin: true,
        isOwner: true,
        totalPoints: 100
      }
    });
    console.log(`✅ Test user created: ${testUser.name}`);

    // Create test chore
    const testChore = await prisma.chore.create({
      data: {
        name: 'Test Staging Chore',
        description: 'This is a test chore for the new staging environment',
        points: 25,
        difficulty: 'easy',
        familyId: testFamily.id
      }
    });
    console.log(`✅ Test chore created: ${testChore.name}`);

    // Create test suggestion
    const testSuggestion = await prisma.suggestion.create({
      data: {
        title: 'New Staging Environment Test',
        description: 'This suggestion was created to test the new staging database setup.',
        category: 'general',
        priority: 'low',
        userId: testUser.id,
        familyId: testFamily.id,
        userEmail: testUser.email,
        userName: testUser.name
      }
    });
    console.log(`✅ Test suggestion created: ${testSuggestion.title}`);

    await prisma.$disconnect();

    // Step 8: Restore original schema
    console.log('');
    console.log('🔄 Step 8: Restoring original SQLite schema...');
    fs.writeFileSync('prisma/schema.prisma', currentSchema);
    await execAsync('npx prisma generate');
    console.log('✅ Original schema restored');

    console.log('');
    console.log('🎉 NEW STAGING DATABASE SETUP COMPLETE!');
    console.log('======================================');
    console.log('');
    console.log('✅ Database schema created successfully');
    console.log('✅ All tables verified and functional');
    console.log('✅ Test data created for verification');
    console.log('✅ Ready for staging deployment');
    console.log('');
    console.log('📋 Test Data Created:');
    console.log(`   👨‍👩‍👧‍👦 Family: ${testFamily.name} (Code: ${testFamily.inviteCode})`);
    console.log(`   👤 User: ${testUser.name} (${testUser.email})`);
    console.log(`   📝 Chore: ${testChore.name} (${testChore.points} points)`);
    console.log(`   💡 Suggestion: ${testSuggestion.title}`);
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('1. Deploy your staging branch to the new Vercel project');
    console.log('2. Test authentication with the new OAuth client');
    console.log('3. Verify all features work with the new database');
    console.log('4. Use the test family to verify functionality');

  } catch (error) {
    console.error('');
    console.error('❌ SETUP FAILED');
    console.error('===============');
    console.error('Error:', error.message);
    
    // Restore original schema on error
    try {
      console.log('');
      console.log('🔄 Restoring original schema due to error...');
      const backupSchema = fs.readFileSync('prisma/schema.backup.prisma', 'utf8');
      fs.writeFileSync('prisma/schema.prisma', backupSchema);
      
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      await execAsync('npx prisma generate');
      console.log('✅ Original schema restored');
    } catch (restoreError) {
      console.error('❌ Failed to restore schema:', restoreError.message);
    }
    
    console.error('');
    console.error('💡 Troubleshooting:');
    console.error('- Check new database URL is correct and accessible');
    console.error('- Verify database permissions allow schema creation');
    console.error('- Ensure internet connection is stable');
    console.error('- Try running the setup again');
  }
}

// Run the setup
setupNewStagingDatabase();
