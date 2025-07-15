#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;

console.log(`🔨 Building for ${isProduction ? 'production' : 'development'}...`);

// Backup current schema
const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
const backupPath = path.join(__dirname, '../prisma/schema.backup.prisma');

if (fs.existsSync(schemaPath)) {
  fs.copyFileSync(schemaPath, backupPath);
}

try {
  if (isProduction) {
    // Use production schema (PostgreSQL)
    const productionSchemaPath = path.join(__dirname, '../prisma/schema.production.prisma');
    if (fs.existsSync(productionSchemaPath)) {
      fs.copyFileSync(productionSchemaPath, schemaPath);
      console.log('✅ Using PostgreSQL schema for production');
      console.log('🛠️ Admin Panel features enabled for production');
    }
  } else {
    // Ensure we're using the SQLite schema for development
    console.log('✅ Using SQLite schema for development');
    console.log('🛠️ Admin Panel features enabled for development');
  }

  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Build Next.js
  console.log('🏗️ Building Next.js application...');
  execSync('npx next build', { stdio: 'inherit' });

  console.log('🎉 Build completed successfully!');
  
  if (isProduction) {
    console.log('');
    console.log('🚀 Production build ready with Admin Panel:');
    console.log('   ✅ Member management (promote/demote/kick)');
    console.log('   ✅ Chore management (create/edit/delete)');
    console.log('   ✅ Ownership transfer system');
    console.log('   ✅ Family deletion controls');
    console.log('   ✅ Role-based permissions');
    console.log('');
    console.log('📋 Next: Set environment variables and deploy!');
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
} finally {
  // Restore original schema if we're not in production
  if (!isProduction && fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, schemaPath);
    fs.unlinkSync(backupPath);
    console.log('🔄 Local schema restored');
  }
}
