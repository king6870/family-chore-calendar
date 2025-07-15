#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Migrating Production Database...');

// Your production database URL
const PRODUCTION_DATABASE_URL = "postgresql://postgres:[YOUR-PASSWORD]@db.qciwiasvbbsbwqrenwxk.supabase.co:5432/postgres";

// Backup current schema
const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
const backupPath = path.join(__dirname, 'prisma/schema.backup.prisma');

if (fs.existsSync(schemaPath)) {
  fs.copyFileSync(schemaPath, backupPath);
  console.log('✅ Schema backed up');
}

try {
  // Use production schema
  const productionSchemaPath = path.join(__dirname, 'prisma/schema.production.prisma');
  if (fs.existsSync(productionSchemaPath)) {
    fs.copyFileSync(productionSchemaPath, schemaPath);
    console.log('✅ Using production schema (PostgreSQL)');
  }

  // Set production database URL temporarily
  process.env.DATABASE_URL = PRODUCTION_DATABASE_URL;
  
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('🗄️ Pushing schema to production database...');
  execSync('npx prisma db push', { 
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: PRODUCTION_DATABASE_URL }
  });
  
  console.log('🎉 Production database updated successfully!');
  console.log('✅ isOwner column added to User table');
  console.log('✅ Admin panel should work now!');
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.log('');
  console.log('🔧 Manual fix needed:');
  console.log('1. Replace [YOUR-PASSWORD] with your actual Supabase password');
  console.log('2. Or run this SQL directly in Supabase:');
  console.log('   ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;');
} finally {
  // Restore original schema
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, schemaPath);
    fs.unlinkSync(backupPath);
    console.log('🔄 Local schema restored');
  }
}
