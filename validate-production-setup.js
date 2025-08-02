#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 PRODUCTION SETUP VALIDATION');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');

let validationPassed = true;
const warnings = [];
const errors = [];

// Function to check file exists
function checkFile(filePath, required = true) {
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${filePath} - Found`);
    return true;
  } else {
    const message = `${filePath} - Missing`;
    if (required) {
      console.log(`❌ ${message}`);
      errors.push(message);
      validationPassed = false;
    } else {
      console.log(`⚠️  ${message}`);
      warnings.push(message);
    }
    return false;
  }
}

// Function to check directory exists
function checkDirectory(dirPath, required = true) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    console.log(`✅ ${dirPath}/ - Found`);
    return true;
  } else {
    const message = `${dirPath}/ - Missing`;
    if (required) {
      console.log(`❌ ${message}`);
      errors.push(message);
      validationPassed = false;
    } else {
      console.log(`⚠️  ${message}`);
      warnings.push(message);
    }
    return false;
  }
}

// Function to check environment file
function checkEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${filePath} - Not found`);
    warnings.push(`${filePath} not found`);
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  console.log(`✅ ${filePath} - Found`);

  // Check for placeholder values
  const placeholders = content.match(/your-.*-here/g);
  if (placeholders) {
    console.log(`⚠️  ${filePath} contains placeholder values:`);
    placeholders.forEach(placeholder => {
      console.log(`    - ${placeholder}`);
    });
    warnings.push(`${filePath} has placeholder values`);
  }

  // Check for required variables
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET'
  ];

  requiredVars.forEach(varName => {
    if (content.includes(`${varName}=`)) {
      console.log(`  ✅ ${varName} - Present`);
    } else {
      console.log(`  ❌ ${varName} - Missing`);
      errors.push(`${varName} missing in ${filePath}`);
      validationPassed = false;
    }
  });

  return true;
}

// Function to check package.json scripts
function checkPackageJson() {
  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json - Missing');
    errors.push('package.json missing');
    validationPassed = false;
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  console.log('✅ package.json - Found');

  // Check for required scripts
  const requiredScripts = ['build', 'start', 'dev'];
  const scripts = packageJson.scripts || {};

  requiredScripts.forEach(script => {
    if (scripts[script]) {
      console.log(`  ✅ ${script} script - Present`);
    } else {
      console.log(`  ❌ ${script} script - Missing`);
      errors.push(`${script} script missing in package.json`);
      validationPassed = false;
    }
  });

  // Check for required dependencies
  const requiredDeps = [
    'next',
    'react',
    'next-auth',
    '@prisma/client',
    'prisma'
  ];

  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`  ✅ ${dep} - Installed`);
    } else {
      console.log(`  ❌ ${dep} - Missing`);
      errors.push(`${dep} dependency missing`);
      validationPassed = false;
    }
  });

  return true;
}

// Function to check Prisma schema
function checkPrismaSchema() {
  if (!fs.existsSync('prisma/schema.prisma')) {
    console.log('❌ prisma/schema.prisma - Missing');
    errors.push('Prisma schema missing');
    validationPassed = false;
    return false;
  }

  const schema = fs.readFileSync('prisma/schema.prisma', 'utf8');
  console.log('✅ prisma/schema.prisma - Found');

  // Check for PostgreSQL provider
  if (schema.includes('provider = "postgresql"')) {
    console.log('  ✅ PostgreSQL provider - Configured');
  } else if (schema.includes('provider = "sqlite"')) {
    console.log('  ❌ SQLite provider - Must be PostgreSQL for production');
    errors.push('Prisma schema uses SQLite instead of PostgreSQL');
    validationPassed = false;
  } else {
    console.log('  ⚠️  Database provider - Unknown');
    warnings.push('Database provider not clearly identified');
  }

  // Check for required models
  const requiredModels = ['User', 'Family', 'Chore', 'ChoreAssignment'];
  requiredModels.forEach(model => {
    if (schema.includes(`model ${model}`)) {
      console.log(`  ✅ ${model} model - Present`);
    } else {
      console.log(`  ❌ ${model} model - Missing`);
      errors.push(`${model} model missing from schema`);
      validationPassed = false;
    }
  });

  return true;
}

// Function to check drag & drop components
function checkDragDropComponents() {
  console.log('\n🎨 DRAG & DROP COMPONENTS CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const dragDropFiles = [
    'app/components/ChoreCalendar.tsx',
    'app/components/DragDropCalendar.tsx',
    'app/admin/page.tsx'
  ];

  let dragDropFound = false;

  dragDropFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file} - Found`);
      dragDropFound = true;

      // Check for drag & drop related code
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('onDragStart') || content.includes('onDrop') || content.includes('draggable')) {
        console.log(`  ✅ Drag & drop functionality - Detected`);
      }
    } else {
      console.log(`⚠️  ${file} - Not found`);
    }
  });

  if (!dragDropFound) {
    console.log('⚠️  No drag & drop components found - functionality may be missing');
    warnings.push('Drag & drop components not found');
  }

  return dragDropFound;
}

// Main validation
console.log('📁 CORE FILES CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Check core files
checkFile('package.json');
checkFile('next.config.js', false);
checkFile('tailwind.config.js', false);
checkFile('tsconfig.json', false);

// Check core directories
checkDirectory('app');
checkDirectory('app/api');
checkDirectory('app/components', false);
checkDirectory('prisma');

console.log('\n📦 PACKAGE.JSON CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
checkPackageJson();

console.log('\n🗄️  DATABASE SCHEMA CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
checkPrismaSchema();

console.log('\n🔐 ENVIRONMENT FILES CHECK');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
checkEnvFile('.env.production');
checkEnvFile('.env.example');

// Check drag & drop components
checkDragDropComponents();

console.log('\n📋 VALIDATION SUMMARY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (errors.length > 0) {
  console.log('\n❌ ERRORS FOUND:');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

if (validationPassed && warnings.length === 0) {
  console.log('\n🎉 ALL CHECKS PASSED!');
  console.log('✅ Your application is ready for production deployment');
  console.log('✅ Drag & drop calendar functionality should work');
  console.log('✅ Run ./deploy-production-bulletproof.sh to deploy');
} else if (validationPassed) {
  console.log('\n✅ VALIDATION PASSED WITH WARNINGS');
  console.log('⚠️  Review warnings above before deploying');
  console.log('✅ You can proceed with deployment if warnings are acceptable');
} else {
  console.log('\n❌ VALIDATION FAILED');
  console.log('🚫 Fix the errors above before attempting deployment');
  process.exit(1);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
