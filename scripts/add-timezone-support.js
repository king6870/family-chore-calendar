const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTimezoneSupport() {
  try {
    console.log('🕐 Adding timezone support to users...');
    
    // Update all existing users to have Bothell, Washington timezone
    const result = await prisma.user.updateMany({
      where: {
        timezone: null // Only update users who don't have timezone set
      },
      data: {
        location: 'Bothell, Washington, USA',
        timezone: 'America/Los_Angeles' // PST/PDT timezone
      }
    });
    
    console.log(`✅ Updated ${result.count} existing users with Bothell, WA timezone`);
    
    // Verify the update
    const usersWithTimezone = await prisma.user.count({
      where: {
        timezone: {
          not: null
        }
      }
    });
    
    console.log(`📊 Total users with timezone: ${usersWithTimezone}`);
    
    console.log('🎉 Timezone support migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during timezone migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
if (require.main === module) {
  addTimezoneSupport()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { addTimezoneSupport };
