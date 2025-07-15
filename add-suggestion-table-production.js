const { Client } = require('pg');

async function addSuggestionTable() {
  console.log('🗄️ Adding Suggestion table to production PostgreSQL database...');
  
  // Get production database URL from environment
  const productionUrl = process.env.DATABASE_URL;
  
  if (!productionUrl) {
    console.error('❌ DATABASE_URL not found. Run: vercel env pull .env.production');
    process.exit(1);
  }

  console.log('🔗 Connecting to production database...');
  
  // Use pg client directly for PostgreSQL
  const client = new Client({
    connectionString: productionUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to production database');

    // Create Suggestion table with PostgreSQL syntax
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS "Suggestion" (
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
        "userName" TEXT,
        CONSTRAINT "Suggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "Suggestion_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE SET NULL ON UPDATE CASCADE
      );
    `;

    await client.query(createTableSQL);
    console.log('✅ Suggestion table created successfully!');
    
    // Test the table by checking if it exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'Suggestion';
    `);
    
    if (tableCheck.rows.length > 0) {
      console.log('✅ Table verification: Suggestion table exists in database');
      
      // Test inserting a sample suggestion
      try {
        const testResult = await client.query(`
          INSERT INTO "Suggestion" ("title", "description", "category", "priority", "status", "userEmail", "userName")
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING "id";
        `, [
          'Test Suggestion',
          'This is a test suggestion to verify the table works',
          'general',
          'low',
          'pending',
          'test@example.com',
          'Test User'
        ]);
        
        const testId = testResult.rows[0].id;
        console.log('✅ Test suggestion created:', testId);
        
        // Clean up test suggestion
        await client.query('DELETE FROM "Suggestion" WHERE "id" = $1', [testId]);
        console.log('✅ Test suggestion cleaned up');
        console.log('🎉 Suggestion table is fully functional!');
        
      } catch (testError) {
        console.log('⚠️ Table created but test insert failed:', testError.message);
      }
      
    } else {
      console.log('❌ Table verification failed');
    }

    // Check existing suggestions count
    try {
      const countResult = await client.query('SELECT COUNT(*) as count FROM "Suggestion"');
      const count = countResult.rows[0].count;
      console.log(`📊 Current suggestions in database: ${count}`);
    } catch (countError) {
      console.log('⚠️ Could not count existing suggestions');
    }

  } catch (error) {
    console.error('❌ Error creating Suggestion table:', error.message);
    
    if (error.message.includes('already exists')) {
      console.log('✅ Table already exists! Checking functionality...');
      
      try {
        const countResult = await client.query('SELECT COUNT(*) as count FROM "Suggestion"');
        const count = countResult.rows[0].count;
        console.log(`✅ Suggestion table functional with ${count} existing suggestions`);
      } catch (countError) {
        console.log('⚠️ Table exists but has issues:', countError.message);
      }
    }
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

// Run the function
addSuggestionTable().catch(console.error);
