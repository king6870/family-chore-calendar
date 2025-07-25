const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugPointsIssue() {
  try {
    console.log('🔍 Debugging Points Awarding Issue...\n');

    // 1. Check if database connection works
    console.log('1. Testing database connection...');
    const userCount = await prisma.user.count();
    console.log(`✅ Database connected. Found ${userCount} users.\n`);

    // 2. Check recent points transactions
    console.log('2. Checking recent PointsEarned records...');
    const recentPoints = await prisma.pointsEarned.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { nickname: true, name: true, totalPoints: true }
        }
      }
    });

    console.log('Recent points transactions:');
    recentPoints.forEach(point => {
      console.log(`- ${point.user.nickname || point.user.name}: ${point.points} points on ${point.date.toISOString()}`);
    });
    console.log('');

    // 3. Check user totalPoints vs actual earned points
    console.log('3. Checking totalPoints consistency...');
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

    console.log('User points comparison:');
    users.forEach(user => {
      const actualPoints = user.pointsEarned.reduce((sum, p) => sum + p.points, 0);
      const storedPoints = user.totalPoints;
      const isConsistent = actualPoints === storedPoints;
      
      console.log(`- ${user.nickname || user.name}:`);
      console.log(`  Stored totalPoints: ${storedPoints}`);
      console.log(`  Calculated from PointsEarned: ${actualPoints}`);
      console.log(`  Consistent: ${isConsistent ? '✅' : '❌'}`);
      
      if (!isConsistent) {
        console.log(`  ⚠️  MISMATCH: Difference of ${actualPoints - storedPoints} points`);
      }
    });
    console.log('');

    // 4. Check for any database transaction issues
    console.log('4. Checking for potential transaction issues...');
    
    // Look for orphaned PointsEarned records (points awarded but user totalPoints not updated)
    const orphanedPoints = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.nickname,
        u.name,
        u."totalPoints" as stored_points,
        COALESCE(SUM(pe.points), 0) as calculated_points,
        (COALESCE(SUM(pe.points), 0) - u."totalPoints") as difference
      FROM "User" u
      LEFT JOIN "PointsEarned" pe ON u.id = pe."userId"
      WHERE u."familyId" IS NOT NULL
      GROUP BY u.id, u.nickname, u.name, u."totalPoints"
      HAVING (COALESCE(SUM(pe.points), 0) - u."totalPoints") != 0
    `;

    if (orphanedPoints.length > 0) {
      console.log('❌ Found inconsistent points data:');
      orphanedPoints.forEach(user => {
        console.log(`- ${user.nickname || user.name}: ${user.difference} point difference`);
      });
    } else {
      console.log('✅ All user points are consistent');
    }
    console.log('');

    // 5. Check recent activity logs for points awarding
    console.log('5. Checking recent activity logs...');
    const recentActivity = await prisma.activityLog.findMany({
      where: {
        OR: [
          { action: 'POINTS_AWARDED' },
          { action: 'POINTS_DEDUCTED' }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { nickname: true, name: true }
        }
      }
    });

    console.log('Recent points activity:');
    recentActivity.forEach(log => {
      console.log(`- ${log.createdAt.toISOString()}: ${log.action} by ${log.user.nickname || log.user.name}`);
      console.log(`  Details: ${log.details}`);
    });

    // 6. Provide fix recommendations
    console.log('\n🔧 RECOMMENDATIONS:');
    
    if (orphanedPoints.length > 0) {
      console.log('❌ ISSUE FOUND: Points inconsistency detected');
      console.log('💡 SOLUTION: Run the fix script to sync totalPoints with PointsEarned records');
      console.log('   Command: node fix-points-sync.js');
    } else {
      console.log('✅ Points data appears consistent');
      console.log('💡 If admin still sees success but points not awarded, check:');
      console.log('   1. Browser cache/refresh the page');
      console.log('   2. Check if using correct user ID in admin interface');
      console.log('   3. Verify admin permissions are working');
      console.log('   4. Check network requests in browser dev tools');
    }

  } catch (error) {
    console.error('❌ Error during diagnosis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the diagnosis
debugPointsIssue();
