#!/usr/bin/env node

/**
 * Production Environment Validation Script
 * Validates that all production configurations are correct
 */

const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Validation functions
function validatePackageJson() {
  logInfo('Validating package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'build:production', 'start'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      logError(`Missing required scripts: ${missingScripts.join(', ')}`);
      return false;
    }
    
    // Check required dependencies
    const requiredDeps = [
      '@next-auth/prisma-adapter',
      '@prisma/client',
      'next',
      'next-auth',
      'react',
      'react-dom'
    ];
    
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
    );
    
    if (missingDeps.length > 0) {
      logError(`Missing required dependencies: ${missingDeps.join(', ')}`);
      return false;
    }
    
    // Check Next.js version
    const nextVersion = packageJson.dependencies.next || packageJson.devDependencies.next;
    if (nextVersion && !nextVersion.includes('14')) {
      logWarning(`Next.js version ${nextVersion} - ensure compatibility`);
    }
    
    logSuccess('package.json validation passed');
    return true;
  } catch (error) {
    logError(`Failed to validate package.json: ${error.message}`);
    return false;
  }
}

function validatePrismaSchema() {
  logInfo('Validating Prisma schema...');
  
  try {
    const schemaPath = 'prisma/schema.prisma';
    if (!fs.existsSync(schemaPath)) {
      logError('Prisma schema not found');
      return false;
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Check for PostgreSQL provider
    if (!schema.includes('provider = "postgresql"')) {
      logError('Schema must use PostgreSQL provider for production');
      return false;
    }
    
    // Check for required models
    const requiredModels = [
      'User', 'Account', 'Session', 'VerificationToken',
      'Family', 'Chore', 'ChoreAssignment', 'PointsEarned'
    ];
    
    const missingModels = requiredModels.filter(model => 
      !schema.includes(`model ${model}`)
    );
    
    if (missingModels.length > 0) {
      logError(`Missing required models: ${missingModels.join(', ')}`);
      return false;
    }
    
    // Check for SQLite references (should not exist in production)
    if (schema.includes('sqlite') || schema.includes('file:')) {
      logError('Schema contains SQLite references - not suitable for production');
      return false;
    }
    
    logSuccess('Prisma schema validation passed');
    return true;
  } catch (error) {
    logError(`Failed to validate Prisma schema: ${error.message}`);
    return false;
  }
}

function validateProductionEnv() {
  logInfo('Validating production environment configuration...');
  
  const envPath = '.env.production';
  if (!fs.existsSync(envPath)) {
    logWarning('No .env.production file found - ensure Vercel environment variables are set');
    return true; // Not critical as Vercel can handle env vars
  }
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    // Required environment variables
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];
    
    const foundVars = [];
    const placeholderVars = [];
    
    envLines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        foundVars.push(key.trim());
        
        // Check for placeholder values
        if (value.includes('your-') && value.includes('-here')) {
          placeholderVars.push(key.trim());
        }
      }
    });
    
    // Check for missing variables
    const missingVars = requiredVars.filter(varName => !foundVars.includes(varName));
    if (missingVars.length > 0) {
      logWarning(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    // Check for placeholder values
    if (placeholderVars.length > 0) {
      logError(`Placeholder values found: ${placeholderVars.join(', ')}`);
      return false;
    }
    
    // Validate DATABASE_URL format
    const dbUrlLine = envLines.find(line => line.startsWith('DATABASE_URL='));
    if (dbUrlLine) {
      const dbUrl = dbUrlLine.split('=')[1];
      if (!dbUrl.includes('postgresql://') && !dbUrl.includes('postgres://')) {
        logError('DATABASE_URL must be a PostgreSQL connection string');
        return false;
      }
    }
    
    // Validate NEXTAUTH_URL
    const authUrlLine = envLines.find(line => line.startsWith('NEXTAUTH_URL='));
    if (authUrlLine) {
      const authUrl = authUrlLine.split('=')[1];
      if (!authUrl.includes('family-chore-calendar.vercel.app')) {
        logWarning('NEXTAUTH_URL should point to production domain');
      }
    }
    
    logSuccess('Production environment validation passed');
    return true;
  } catch (error) {
    logError(`Failed to validate production environment: ${error.message}`);
    return false;
  }
}

function validateBuildConfiguration() {
  logInfo('Validating build configuration...');
  
  try {
    // Check for build script
    const buildScriptPath = 'scripts/build.js';
    if (!fs.existsSync(buildScriptPath)) {
      logError('Build script not found at scripts/build.js');
      return false;
    }
    
    const buildScript = fs.readFileSync(buildScriptPath, 'utf8');
    
    // Check for production handling
    if (!buildScript.includes('NODE_ENV === \'production\'') && !buildScript.includes('process.env.VERCEL')) {
      logWarning('Build script may not handle production environment correctly');
    }
    
    // Check for schema switching logic
    if (!buildScript.includes('schema.production.prisma')) {
      logWarning('Build script may not switch to production schema');
    }
    
    // Check vercel.json
    if (fs.existsSync('vercel.json')) {
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
      
      // Check for build environment
      if (vercelConfig.build && vercelConfig.build.env) {
        if (vercelConfig.build.env.NODE_ENV !== 'production') {
          logWarning('vercel.json should set NODE_ENV to production');
        }
      }
      
      // Check for function timeout
      if (vercelConfig.functions) {
        const apiTimeout = vercelConfig.functions['app/api/**/*.ts']?.maxDuration;
        if (!apiTimeout || apiTimeout < 10) {
          logWarning('API functions may need longer timeout for database operations');
        }
      }
    }
    
    logSuccess('Build configuration validation passed');
    return true;
  } catch (error) {
    logError(`Failed to validate build configuration: ${error.message}`);
    return false;
  }
}

function validateCodeQuality() {
  logInfo('Validating code quality...');
  
  try {
    // Check for common production issues
    const issues = [];
    
    // Check for console.log statements
    const findConsoleLogsCommand = 'find app lib -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "console\\.log" 2>/dev/null || true';
    const { execSync } = require('child_process');
    
    try {
      const consoleLogFiles = execSync(findConsoleLogsCommand, { encoding: 'utf8' }).trim();
      if (consoleLogFiles) {
        logWarning(`Console.log statements found in: ${consoleLogFiles.split('\n').join(', ')}`);
      }
    } catch (error) {
      // Ignore errors from find command
    }
    
    // Check for localhost references
    try {
      const localhostFiles = execSync('find app lib -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs grep -l "localhost" 2>/dev/null || true', { encoding: 'utf8' }).trim();
      if (localhostFiles) {
        logWarning(`Localhost references found in: ${localhostFiles.split('\n').join(', ')}`);
      }
    } catch (error) {
      // Ignore errors from find command
    }
    
    // Check for development-only imports
    const devImports = ['@types/', 'eslint', 'prettier'];
    // This would require more complex analysis, skipping for now
    
    logSuccess('Code quality validation completed');
    return true;
  } catch (error) {
    logWarning(`Code quality validation had issues: ${error.message}`);
    return true; // Non-critical
  }
}

function validateDependencies() {
  logInfo('Validating dependencies...');
  
  try {
    // Check if node_modules exists
    if (!fs.existsSync('node_modules')) {
      logError('node_modules not found - run npm install first');
      return false;
    }
    
    // Check for critical dependencies
    const criticalDeps = [
      'node_modules/@prisma/client',
      'node_modules/next',
      'node_modules/next-auth',
      'node_modules/react'
    ];
    
    const missingCriticalDeps = criticalDeps.filter(dep => !fs.existsSync(dep));
    if (missingCriticalDeps.length > 0) {
      logError(`Missing critical dependencies: ${missingCriticalDeps.join(', ')}`);
      return false;
    }
    
    // Check package-lock.json
    if (!fs.existsSync('package-lock.json')) {
      logWarning('package-lock.json not found - consider using npm ci for consistent builds');
    }
    
    logSuccess('Dependencies validation passed');
    return true;
  } catch (error) {
    logError(`Failed to validate dependencies: ${error.message}`);
    return false;
  }
}

function generateValidationReport(results) {
  console.log('\n' + '='.repeat(60));
  log('PRODUCTION VALIDATION REPORT', 'bold');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  log(`\nOverall Status: ${passed}/${total} checks passed`, passed === total ? 'green' : 'yellow');
  
  console.log('\nDetailed Results:');
  results.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const color = result.passed ? 'green' : 'red';
    log(`  ${status} - ${result.name}`, color);
  });
  
  if (passed === total) {
    log('\n🎉 All validations passed! Ready for production deployment.', 'green');
    return true;
  } else {
    log('\n⚠️  Some validations failed. Review issues before deploying.', 'yellow');
    return false;
  }
}

// Main validation function
function main() {
  log('🔍 PRODUCTION ENVIRONMENT VALIDATION', 'bold');
  log('━'.repeat(50), 'blue');
  
  const validations = [
    { name: 'Package.json Configuration', fn: validatePackageJson },
    { name: 'Prisma Schema', fn: validatePrismaSchema },
    { name: 'Production Environment', fn: validateProductionEnv },
    { name: 'Build Configuration', fn: validateBuildConfiguration },
    { name: 'Code Quality', fn: validateCodeQuality },
    { name: 'Dependencies', fn: validateDependencies }
  ];
  
  const results = validations.map(validation => {
    try {
      const passed = validation.fn();
      return { name: validation.name, passed };
    } catch (error) {
      logError(`${validation.name} validation threw an error: ${error.message}`);
      return { name: validation.name, passed: false };
    }
  });
  
  const allPassed = generateValidationReport(results);
  
  if (allPassed) {
    log('\n✅ Environment is ready for production deployment!', 'green');
    process.exit(0);
  } else {
    log('\n❌ Environment validation failed. Fix issues before deploying.', 'red');
    process.exit(1);
  }
}

// Run validation if called directly
if (require.main === module) {
  main();
}

module.exports = {
  validatePackageJson,
  validatePrismaSchema,
  validateProductionEnv,
  validateBuildConfiguration,
  validateCodeQuality,
  validateDependencies
};
