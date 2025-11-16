#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 * 
 * Run this to verify all required environment variables are set correctly
 * Usage: node scripts/verify-env.js
 */

const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function verifyEnv() {
  log('\n🔍 Verifying Environment Variables Setup...\n', 'blue');

  // Check .env.local exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    log('❌ .env.local file not found', 'red');
    log(`   Create it from .env.example: cp .env.example .env.local\n`, 'yellow');
    return false;
  }
  log('✅ .env.local found', 'green');

  // Check .env.example exists
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (!fs.existsSync(envExamplePath)) {
    log('⚠️  .env.example not found (recommended to have this)', 'yellow');
  } else {
    log('✅ .env.example found', 'green');
  }

  // Check lib/env.ts exists
  const envConfigPath = path.join(process.cwd(), 'lib', 'env.ts');
  if (!fs.existsSync(envConfigPath)) {
    log('⚠️  lib/env.ts not found (create for centralized config)', 'yellow');
  } else {
    log('✅ lib/env.ts found', 'green');
  }

  // Load and check required variables
  require('dotenv').config({ path: envLocalPath });

  const requiredVars = [
    'MYSQL_HOST',
    'MYSQL_USER',
    'MYSQL_PASSWORD',
    'MYSQL_DATABASE',
  ];

  log('\n📋 Checking Required Variables:\n', 'blue');

  let allPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value) {
      log(`  ❌ ${varName}: NOT SET`, 'red');
      allPresent = false;
    } else {
      const masked = value.length > 3 ? `${value.substring(0, 3)}${'*'.repeat(value.length - 3)}` : '***';
      log(`  ✅ ${varName}: ${masked}`, 'green');
    }
  }

  // Check optional variables
  log('\n📋 Optional Variables:\n', 'blue');

  const optionalVars = [
    'MYSQL_CONNECTION_LIMIT',
    'NEXT_PUBLIC_API_URL',
  ];

  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      log(`  ✅ ${varName}: ${value}`, 'green');
    } else {
      log(`  ⓘ  ${varName}: not set (will use default)`, 'yellow');
    }
  }

  // Check .gitignore
  log('\n📋 Checking .gitignore:\n', 'blue');
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    if (gitignoreContent.includes('.env')) {
      log('  ✅ .env* is in .gitignore (safe)', 'green');
    } else {
      log('  ⚠️  .env* is NOT in .gitignore (ADD IT!)', 'red');
    }
  }

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  if (allPresent) {
    log('✅ All required variables are set!', 'green');
    log('You can start development with: npm run dev\n', 'green');
  } else {
    log('❌ Some required variables are missing!', 'red');
    log('Update .env.local and try again\n', 'red');
  }
  log('='.repeat(50) + '\n', 'blue');

  return allPresent;
}

// Run verification
verifyEnv();
