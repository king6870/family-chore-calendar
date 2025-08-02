const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPointsSync() {
  try {
    console.log('🔧 Fixing Points Synchronization...\n');

    // Get all users with their points data
    const users = await prisma.user.findMany({
      where: { familyId: { not: null } },
      select: {
        id: true,
        nickname: true,
        name: true,
        totalPoints: true,
        pointsEarned: {
          select: { points: true }
        }
      }
    });

    console.log(`Found ${users.length} family members to check...\n`);

    let fixedCount = 0;
    let alreadyCorrect = 0;

    for (const user of users) {
      const calculatedPoints = user.pointsEarned.reduce((sum, p) => sum + p.points, 0);
      const storedPoints = user.totalPoints;
      const userName = user.nickname || user.name;

      if (calculatedPoints !== storedPoints) {
        console.log(`🔄 Fixing ${userName}:`);
        console.log(`   Current totalPoints: ${storedPoints}`);
        console.log(`   Should be: ${calculatedPoints}`);
        console.log(`   Difference: ${calculatedPoints - storedPoints}`);

        // Update the user's totalPoints to match calculated points
        await prisma.user.update({
          where: { id: user.id },
          data: { totalPoints: calculatedPoints }
        });

        console.log(`   ✅ Fixed! Updated to ${calculatedPoints} points\n`);
        fixedCount++;
      } else {
        console.log(`✅ ${userName}: Already correct (${storedPoints} points)`);
        alreadyCorrect++;
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`✅ Users already correct: ${alreadyCorrect}`);
    console.log(`🔧 Users fixed: ${fixedCount}`);
    console.log(`📝 Total users processed: ${users.length}`);

    if (fixedCount > 0) {
      console.log('\n🎉 Points synchronization complete!');
      console.log('💡 Users should now see their correct point totals.');
      console.log('🔄 Refresh the admin panel to see updated points.');
    } else {
      console.log('\n✅ All points were already synchronized correctly.');
      console.log('💡 If admin still shows success but no points awarded, the issue might be:');
      console.log('   1. Frontend not refreshing after API call');
      console.log('   2. Using wrong user ID in admin interface');
      console.log('   3. Browser caching old data');
    }

    // Verify the fix worked
    console.log('\n🔍 Verification check...');
    const verification = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as inconsistent_count
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", SUM(points) as total_earned
        FROM "PointsEarned"
        GROUP BY "userId"
      ) pe ON u.id = pe."userId"
      WHERE u."familyId" IS NOT NULL
      AND (COALESCE(pe.total_earned, 0) != u."totalPoints")
    `;

    const inconsistentCount = parseInt(verification[0].inconsistent_count);
    if (inconsistentCount === 0) {
      console.log('✅ Verification passed: All points are now consistent!');
    } else {
      console.log(`❌ Verification failed: ${inconsistentCount} users still have inconsistent points`);
    }

  } catch (error) {
    console.error('❌ Error fixing points sync:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPointsSync();
