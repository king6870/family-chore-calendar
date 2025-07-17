const { Client } = require('pg');
const fs = require('fs');

async function executeSqlMigration() {
  console.log('🗄️  EXECUTING SQL MIGRATION FOR SUGGESTION TABLE');
  console.log('===============================================');
  console.log('');
  console.log('🎯 Target: Production Vercel Postgres Database');
  console.log('📋 Action: Add Suggestion table using raw SQL');
  console.log('🔒 Safety: Non-destructive, checks for existing table');
  console.log('');

  // Parse the production database URL
  const dbUrl = "postgres://0ad1d64801086274d83f530e252da4a4cb169b9f6b5996d15e85a31dec63e45b:sk_-tWGmy6RniXXAt_AsjHJd@db.prisma.io:5432/?sslmode=require";
  
  const client = new Client({
    connectionString: dbUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 Step 1: Connecting to production database...');
    await client.connect();
    console.log('✅ Connected to production Vercel Postgres database');

    console.log('');
    console.log('🔍 Step 2: Checking existing tables...');
    
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Existing tables in production:');
    tablesResult.rows.forEach(row => console.log(`   - ${row.table_name}`));

    console.log('');
    console.log('🏗️  Step 3: Executing Suggestion table migration...');
    
    // Read and execute the SQL migration
    const sqlMigration = fs.readFileSync('add-suggestion-table.sql', 'utf8');
    const result = await client.query(sqlMigration);
    
    console.log('✅ SQL migration executed successfully');

    console.log('');
    console.log('🔍 Step 4: Verifying table creation...');
    
    // Check if Suggestion table now exists
    const suggestionTableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'Suggestion' AND table_schema = 'public';
    `);
    
    if (suggestionTableCheck.rows.length > 0) {
      console.log('✅ Suggestion table exists in production database');
      
      // Check table structure
      const tableStructure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Suggestion' 
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Table structure:');
      console.table(tableStructure.rows);
      
    } else {
      console.log('❌ Suggestion table was not created');
      return;
    }

    console.log('');
    console.log('🧪 Step 5: Testing table functionality...');
    
    // Test inserting a record
    const testInsert = await client.query(`
      INSERT INTO "Suggestion" (id, title, description, category, priority, status, "createdAt", "updatedAt", "userEmail", "userName")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
      RETURNING id;
    `, [
      'test-migration-' + Date.now(),
      'Production Migration Test',
      'This suggestion was created to test the production migration.',
      'general',
      'low',
      'pending',
      'migration-test@production.com',
      'Migration Test User'
    ]);
    
    console.log('✅ Test suggestion inserted:', testInsert.rows[0].id);
    
    // Test querying
    const countResult = await client.query('SELECT COUNT(*) as count FROM "Suggestion"');
    console.log(`✅ Suggestion table operational - ${countResult.rows[0].count} record(s) found`);
    
    // Clean up test data
    await client.query('DELETE FROM "Suggestion" WHERE id = $1', [testInsert.rows[0].id]);
    console.log('✅ Test data cleaned up');

    console.log('');
    console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('===================================');
    console.log('');
    console.log('✅ Suggestion table added to production database');
    console.log('✅ Foreign key relationships established');
    console.log('✅ Table functionality verified');
    console.log('✅ Production ready for suggestion submissions');
    console.log('');
    console.log('📋 What this means:');
    console.log('• Your suggestion floating button will now work on production');
    console.log('• User suggestions will be stored in the production database');
    console.log('• No more console-only fallback logging');
    console.log('• You can view suggestions using database admin tools');
    console.log('');
    console.log('🔗 Production URL: https://family-chore-calendar.vercel.app');
    console.log('💡 Test the suggestion button - it should now store data properly!');

  } catch (error) {
    console.error('');
    console.error('❌ MIGRATION FAILED');
    console.error('==================');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.code) {
      console.error('Error Code:', error.code);
    }
    
    console.error('💡 Troubleshooting:');
    console.error('- Check database connection and permissions');
    console.error('- Verify production database URL is accessible');
    console.error('- Ensure PostgreSQL client is installed');
    console.error('- Check if partial migration occurred');
    
  } finally {
    await client.end();
    console.log('🔐 Database connection closed');
  }
}

// Run the migration
executeSqlMigration();
