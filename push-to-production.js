const { execSync } = require('child_process');
const fs = require('fs');

async function pushSchemaToProduction() {
  console.log('🗄️ Pushing schema to production database...');
  
  try {
    // Check if production environment file exists
    if (!fs.existsSync('.env.production')) {
      console.log('📥 Getting production environment variables...');
      execSync('vercel env pull .env.production', { stdio: 'inherit' });
    }

    // Backup original schema
    if (fs.existsSync('prisma/schema.prisma')) {
      fs.copyFileSync('prisma/schema.prisma', 'prisma/schema.prisma.backup');
      console.log('💾 Backed up original schema');
    }

    // Copy production schema
    fs.copyFileSync('schema-production.prisma', 'prisma/schema.prisma');
    console.log('📋 Using production PostgreSQL schema');

    // Set environment to production
    const envContent = fs.readFileSync('.env.production', 'utf8');
    const databaseUrl = envContent.match(/DATABASE_URL="?([^"\n]+)"?/)?.[1];
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in .env.production');
    }

    // Set environment variable
    process.env.DATABASE_URL = databaseUrl;

    console.log('🔄 Generating Prisma client for PostgreSQL...');
    execSync('npx prisma generate', { stdio: 'inherit' });

    console.log('📤 Pushing schema to production database...');
    execSync('npx prisma db push', { stdio: 'inherit', env: { ...process.env, DATABASE_URL: databaseUrl } });

    console.log('✅ Schema pushed successfully!');
    console.log('🎉 Suggestion table is now available in production!');

  } catch (error) {
    console.error('❌ Error pushing schema:', error.message);
    throw error;
  } finally {
    // Restore original schema
    if (fs.existsSync('prisma/schema.prisma.backup')) {
      fs.copyFileSync('prisma/schema.prisma.backup', 'prisma/schema.prisma');
      fs.unlinkSync('prisma/schema.prisma.backup');
      console.log('🔄 Restored original SQLite schema');
      
      // Regenerate client for local development
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('🔄 Regenerated local Prisma client');
    }
  }
}

pushSchemaToProduction().catch(console.error);
