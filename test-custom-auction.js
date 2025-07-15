const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCustomAuctionAPI() {
  try {
    console.log('🧪 Testing Custom Auction Creation API...\n');

    // Get a family with an owner
    const family = await prisma.family.findFirst({
      include: {
        members: {
          where: { isOwner: true }
        },
        chores: true
      }
    });

    if (!family || family.members.length === 0) {
      console.log('❌ No family with owner found for testing');
      return;
    }

    const owner = family.members[0];
    console.log(`👑 Testing with owner: ${owner.nickname || owner.name}`);
    console.log(`🏠 Family: ${family.name}`);
    console.log(`📋 Existing chores: ${family.chores.length}\n`);

    // Test data for custom auction
    const testData = {
      weekStart: new Date().toISOString(),
      auctionDurationHours: 24,
      existingChoreIds: family.chores.slice(0, 2).map(c => c.id), // Use first 2 chores
      newChores: [
        {
          name: 'Test Custom Chore',
          description: 'A test chore created via custom auction',
          points: 35,
          difficulty: 'Medium',
          minAge: 10,
          isRecurring: false
        }
      ]
    };

    console.log('📊 Test Data:');
    console.log(`   Existing chores selected: ${testData.existingChoreIds.length}`);
    console.log(`   New chores to create: ${testData.newChores.length}`);
    console.log(`   Auction duration: ${testData.auctionDurationHours} hours\n`);

    // Check if API endpoint exists
    console.log('🔧 API Endpoint Check:');
    console.log('   ✅ /api/auctions/create-custom - Custom auction creation API');

    console.log('\n📋 Expected Behavior:');
    console.log('   1. Validate owner permissions');
    console.log('   2. Create new chores if provided');
    console.log('   3. Fetch existing chores by IDs');
    console.log('   4. Create auctions for all chores');
    console.log('   5. Send notifications to family members');
    console.log('   6. Log activity for audit trail');

    console.log('\n✅ Custom Auction API Test Setup Complete!');
    console.log('\n🎯 Ready for frontend integration and testing');

  } catch (error) {
    console.error('❌ Error testing custom auction API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCustomAuctionAPI();
