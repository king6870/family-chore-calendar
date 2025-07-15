const { Client } = require('pg');
const fs = require('fs');

async function checkProductionSuggestions() {
  console.log('🔍 Checking Production Suggestions...');
  
  try {
    // Get production database URL
    if (!fs.existsSync('.env.production')) {
      console.log('📥 Getting production environment variables...');
      const { execSync } = require('child_process');
      execSync('vercel env pull .env.production', { stdio: 'inherit' });
    }

    const envContent = fs.readFileSync('.env.production', 'utf8');
    const databaseUrl = envContent.match(/DATABASE_URL="?([^"\n]+)"?/)?.[1];
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in .env.production');
    }

    console.log('🔗 Connecting to production database...');
    const client = new Client({
      connectionString: databaseUrl,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ Connected to production database');

    // Check if Suggestion table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Suggestion'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.log('❌ Suggestion table does not exist in production database!');
      console.log('🔧 Run: node add-suggestion-only.js to create it');
      return;
    }

    console.log('✅ Suggestion table exists in production database');

    // Check table structure
    const columns = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Suggestion'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 Table structure:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(required)' : '(optional)'}`);
    });

    // Count suggestions
    const count = await client.query('SELECT COUNT(*) as count FROM "Suggestion"');
    console.log(`\n📊 Current suggestions in database: ${count.rows[0].count}`);

    // Show recent suggestions if any
    if (parseInt(count.rows[0].count) > 0) {
      const recent = await client.query(`
        SELECT "id", "title", "category", "priority", "createdAt", "userEmail", "userName"
        FROM "Suggestion" 
        ORDER BY "createdAt" DESC 
        LIMIT 5
      `);

      console.log('\n📝 Recent suggestions:');
      recent.rows.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. "${suggestion.title}" (${suggestion.category}/${suggestion.priority})`);
        console.log(`     By: ${suggestion.userName || 'Unknown'} (${suggestion.userEmail || 'No email'})`);
        console.log(`     Date: ${suggestion.createdAt}`);
        console.log('');
      });
    } else {
      console.log('\n💡 No suggestions found in database');
      console.log('This means either:');
      console.log('  1. No suggestions have been submitted yet');
      console.log('  2. The API is not saving to database (check function logs)');
      console.log('  3. There\'s an error in the suggestion submission process');
    }

    await client.end();

  } catch (error) {
    console.error('❌ Error checking production suggestions:', error.message);
  }

  console.log('\n🎯 Next Steps:');
  console.log('1. If table exists but no suggestions: Check Vercel function logs');
  console.log('2. If table missing: Run add-suggestion-only.js');
  console.log('3. If API errors: Run fix-production-suggestions.sh');
  console.log('4. Test locally first: node test-suggestions.js');
}

checkProductionSuggestions().catch(console.error);
