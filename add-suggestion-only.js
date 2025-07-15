const { execSync } = require('child_process');
const fs = require('fs');

async function addSuggestionTableOnly() {
  console.log('🗄️ Adding only Suggestion table to production database...');
  
  try {
    // Check if production environment file exists
    if (!fs.existsSync('.env.production')) {
      console.log('📥 Getting production environment variables...');
      execSync('vercel env pull .env.production', { stdio: 'inherit' });
    }

    // Get database URL
    const envContent = fs.readFileSync('.env.production', 'utf8');
    const databaseUrl = envContent.match(/DATABASE_URL="?([^"\n]+)"?/)?.[1];
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in .env.production');
    }

    console.log('🔗 Connecting to production database...');

    // Use raw SQL to add only the Suggestion table
    const { Client } = require('pg');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected to production database');

    // Check if Suggestion table already exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Suggestion'
      );
    `);

    if (tableExists.rows[0].exists) {
      console.log('✅ Suggestion table already exists!');
      
      // Count existing suggestions
      const count = await client.query('SELECT COUNT(*) as count FROM "Suggestion"');
      console.log(`📊 Current suggestions in database: ${count.rows[0].count}`);
      
    } else {
      console.log('➕ Creating Suggestion table...');
      
      // Create only the Suggestion table
      await client.query(`
        CREATE TABLE "Suggestion" (
          "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
          "userName" TEXT
        );
      `);

      console.log('✅ Suggestion table created successfully!');

      // Add foreign key constraints if the referenced tables exist
      try {
        await client.query(`
          ALTER TABLE "Suggestion" 
          ADD CONSTRAINT "Suggestion_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);
        console.log('✅ Added User foreign key constraint');
      } catch (e) {
        console.log('⚠️ Could not add User foreign key (table may not exist)');
      }

      try {
        await client.query(`
          ALTER TABLE "Suggestion" 
          ADD CONSTRAINT "Suggestion_familyId_fkey" 
          FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE;
        `);
        console.log('✅ Added Family foreign key constraint');
      } catch (e) {
        console.log('⚠️ Could not add Family foreign key (table may not exist)');
      }
    }

    // Test the table
    console.log('🧪 Testing Suggestion table...');
    const testResult = await client.query(`
      INSERT INTO "Suggestion" ("title", "description", "category", "priority", "userEmail", "userName")
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "id";
    `, [
      'Test Suggestion',
      'This is a test to verify the table works',
      'general',
      'low',
      'test@example.com',
      'Test User'
    ]);
    
    const testId = testResult.rows[0].id;
    console.log('✅ Test suggestion created:', testId);
    
    // Clean up test
    await client.query('DELETE FROM "Suggestion" WHERE "id" = $1', [testId]);
    console.log('✅ Test suggestion cleaned up');

    await client.end();
    console.log('🎉 Suggestion table is ready for use!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

addSuggestionTableOnly().catch(console.error);
