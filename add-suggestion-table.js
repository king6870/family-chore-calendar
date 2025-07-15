const { PrismaClient } = require('@prisma/client');

async function addSuggestionTable() {
  console.log('🗄️ Adding Suggestion table to production database...');
  
  // Get production database URL from environment
  const productionUrl = process.env.DATABASE_URL;
  
  if (!productionUrl) {
    console.error('❌ DATABASE_URL not found. Run: vercel env pull .env.production');
    process.exit(1);
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: productionUrl
      }
    }
  });

  try {
    // Create Suggestion table with raw SQL
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Suggestion" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL DEFAULT 'general',
        "priority" TEXT NOT NULL DEFAULT 'medium',
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        "familyId" TEXT,
        "userEmail" TEXT,
        "userName" TEXT,
        CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Suggestion_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;

    console.log('✅ Suggestion table created successfully!');
    
    // Test the table by checking if it exists
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Suggestion';
    `;
    
    if (tableCheck.length > 0) {
      console.log('✅ Table verification: Suggestion table exists in database');
      
      // Test inserting a sample suggestion
      try {
        const testSuggestion = await prisma.suggestion.create({
          data: {
            title: 'Test Suggestion',
            description: 'This is a test suggestion to verify the table works',
            category: 'general',
            priority: 'low',
            status: 'pending',
            userEmail: 'test@example.com',
            userName: 'Test User'
          }
        });
        
        console.log('✅ Test suggestion created:', testSuggestion.id);
        
        // Clean up test suggestion
        await prisma.suggestion.delete({
          where: { id: testSuggestion.id }
        });
        
        console.log('✅ Test suggestion cleaned up');
        console.log('🎉 Suggestion table is fully functional!');
        
      } catch (testError) {
        console.log('⚠️ Table exists but Prisma client needs regeneration');
        console.log('Run: npx prisma generate');
      }
      
    } else {
      console.log('❌ Table verification failed');
    }

  } catch (error) {
    console.error('❌ Error creating Suggestion table:', error);
    
    if (error.message.includes('already exists')) {
      console.log('✅ Table already exists! Checking functionality...');
      
      try {
        const count = await prisma.suggestion.count();
        console.log(`✅ Suggestion table functional with ${count} existing suggestions`);
      } catch (countError) {
        console.log('⚠️ Table exists but Prisma client needs regeneration');
        console.log('Run: npx prisma generate');
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
addSuggestionTable().catch(console.error);
