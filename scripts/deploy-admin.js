#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Deploying Admin Panel to Production...');

try {
  // 1. Backup current schema
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  const backupPath = path.join(__dirname, '../prisma/schema.backup.prisma');
  
  if (fs.existsSync(schemaPath)) {
    fs.copyFileSync(schemaPath, backupPath);
    console.log('✅ Schema backed up');
  }

  // 2. Use production schema
  const productionSchemaPath = path.join(__dirname, '../prisma/schema.production.prisma');
  if (fs.existsSync(productionSchemaPath)) {
    fs.copyFileSync(productionSchemaPath, schemaPath);
    console.log('✅ Production schema activated');
  }

  // 3. Generate Prisma client for production
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  // 4. Build the application
  console.log('🔨 Building application...');
  execSync('npx next build', { stdio: 'inherit' });

  console.log('🎉 Admin Panel ready for production deployment!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Deploy to your hosting platform (Vercel, etc.)');
  console.log('2. Set environment variables:');
  console.log('   - DATABASE_URL (PostgreSQL)');
  console.log('   - NEXTAUTH_URL (your production URL)');
  console.log('   - NEXTAUTH_SECRET');
  console.log('   - GOOGLE_CLIENT_ID');
  console.log('   - GOOGLE_CLIENT_SECRET');
  console.log('3. Run database migration: npm run db:push:production');
  console.log('');
  console.log('🛠️ Admin Panel Features:');
  console.log('✅ Member management (promote/demote/kick)');
  console.log('✅ Chore management (create/edit/delete)');
  console.log('✅ Ownership transfer');
  console.log('✅ Family deletion (owner only)');
  console.log('✅ Role-based permissions');

} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
} finally {
  // Restore original schema for local development
  const backupPath = path.join(__dirname, '../prisma/schema.backup.prisma');
  const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
  
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, schemaPath);
    fs.unlinkSync(backupPath);
    console.log('🔄 Local schema restored');
  }
}
