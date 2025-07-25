const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking Database Schema...\n');

    // Check ActivityLog table structure
    console.log('1. Checking ActivityLog table structure...');
    const activityLogColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'ActivityLog'
      ORDER BY ordinal_position;
    `;

    console.log('ActivityLog columns:');
    activityLogColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Check User table structure (for totalPoints)
    console.log('2. Checking User table structure...');
    const userColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'User' AND column_name IN ('totalPoints', 'id', 'familyId')
      ORDER BY ordinal_position;
    `;

    console.log('User table relevant columns:');
    userColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Check PointsEarned table structure
    console.log('3. Checking PointsEarned table structure...');
    const pointsEarnedColumns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'PointsEarned'
      ORDER BY ordinal_position;
    `;

    console.log('PointsEarned columns:');
    pointsEarnedColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    console.log('');

    // Try to create a test ActivityLog entry to see what fails
    console.log('4. Testing ActivityLog creation...');
    try {
      const testLog = await prisma.activityLog.create({
        data: {
          id: `test_${Date.now()}`,
          userId: 'test-user-id',
          familyId: 'test-family-id',
          action: 'TEST_ACTION',
          details: 'Test log entry'
        }
      });
      console.log('✅ ActivityLog creation successful');
      
      // Clean up test entry
      await prisma.activityLog.delete({
        where: { id: testLog.id }
      });
    } catch (error) {
      console.log('❌ ActivityLog creation failed:');
      console.log(`   Error: ${error.message}`);
      
      // Try with different field names
      console.log('   Trying alternative field names...');
      try {
        const testLog2 = await prisma.$executeRaw`
          INSERT INTO "ActivityLog" (id, "userId", "familyId", action, description, "createdAt")
          VALUES ('test_alt_' || extract(epoch from now()), 'test-user-id', 'test-family-id', 'TEST_ACTION', 'Test description', now())
        `;
        console.log('✅ ActivityLog creation with "description" field successful');
        
        // Clean up
        await prisma.$executeRaw`DELETE FROM "ActivityLog" WHERE id LIKE 'test_alt_%'`;
      } catch (error2) {
        console.log(`❌ Alternative creation also failed: ${error2.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkDatabaseSchema();
