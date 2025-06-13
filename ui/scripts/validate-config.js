#!/usr/bin/env node

/**
 * Configuration Validation Script
 * Validates environment variables and configuration for production deployment
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Load environment variables
config({ path: join(projectRoot, '.env.production') });

const requiredEnvVars = [
  'VITE_API_BASE_URL',
  'VITE_APP_TITLE',
  'VITE_APP_DESCRIPTION',
];

const optionalEnvVars = [
  'VITE_ENABLE_PERFORMANCE_MONITORING',
  'VITE_ENABLE_ERROR_REPORTING',
  'VITE_ERROR_REPORTING_ENDPOINT',
  'VITE_ENABLE_CSP',
  'VITE_SECURE_COOKIES',
  'VITE_ENABLE_ANALYTICS',
  'VITE_ENABLE_ACCESSIBILITY_FEATURES',
  'VITE_ENABLE_PWA',
  'VITE_LOG_LEVEL',
];

const validationRules = {
  'VITE_API_BASE_URL': (value) => {
    if (!value) return 'API base URL is required';
    try {
      new URL(value);
      if (!value.startsWith('https://') && process.env.NODE_ENV === 'production') {
        return 'Production API URL must use HTTPS';
      }
      return null;
    } catch {
      return 'Invalid URL format';
    }
  },
  'VITE_LOG_LEVEL': (value) => {
    const validLevels = ['error', 'warn', 'info', 'debug'];
    if (value && !validLevels.includes(value)) {
      return `Log level must be one of: ${validLevels.join(', ')}`;
    }
    return null;
  },
};

function validateEnvironment() {
  console.log('🔍 Validating production configuration...\n');
  
  let hasErrors = false;
  const warnings = [];

  // Check required variables
  console.log('📋 Required Environment Variables:');
  for (const varName of requiredEnvVars) {
    const value = process.env[varName];
    const validation = validationRules[varName];
    
    if (!value) {
      console.log(`❌ ${varName}: Missing (required)`);
      hasErrors = true;
    } else if (validation) {
      const error = validation(value);
      if (error) {
        console.log(`❌ ${varName}: ${error}`);
        hasErrors = true;
      } else {
        console.log(`✅ ${varName}: Valid`);
      }
    } else {
      console.log(`✅ ${varName}: Present`);
    }
  }

  // Check optional variables
  console.log('\n🔧 Optional Environment Variables:');
  for (const varName of optionalEnvVars) {
    const value = process.env[varName];
    const validation = validationRules[varName];
    
    if (!value) {
      console.log(`⚠️  ${varName}: Not set (using default)`);
      warnings.push(`${varName} not set, using default value`);
    } else if (validation) {
      const error = validation(value);
      if (error) {
        console.log(`❌ ${varName}: ${error}`);
        hasErrors = true;
      } else {
        console.log(`✅ ${varName}: ${value}`);
      }
    } else {
      console.log(`✅ ${varName}: ${value}`);
    }
  }

  return { hasErrors, warnings };
}

function validateFiles() {
  console.log('\n📁 File Validation:');
  
  const requiredFiles = [
    'package.json',
    'vite.config.js',
    'src/main.jsx',
    'src/App.jsx',
    'src/config/production.js',
    'src/components/ErrorBoundary.jsx',
  ];

  let hasErrors = false;

  for (const file of requiredFiles) {
    const filePath = join(projectRoot, file);
    if (existsSync(filePath)) {
      console.log(`✅ ${file}: Found`);
    } else {
      console.log(`❌ ${file}: Missing`);
      hasErrors = true;
    }
  }

  return hasErrors;
}

function validatePackageJson() {
  console.log('\n📦 Package.json Validation:');
  
  try {
    const packagePath = join(projectRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
    
    const requiredScripts = [
      'build',
      'build:production',
      'preview',
      'test:unit',
      'test:e2e',
      'lint',
    ];

    let hasErrors = false;

    for (const script of requiredScripts) {
      if (packageJson.scripts && packageJson.scripts[script]) {
        console.log(`✅ Script "${script}": Found`);
      } else {
        console.log(`❌ Script "${script}": Missing`);
        hasErrors = true;
      }
    }

    // Check for production dependencies
    const productionDeps = [
      'react',
      'react-dom',
      '@mui/material',
      'react-router-dom',
    ];

    for (const dep of productionDeps) {
      if (packageJson.dependencies && packageJson.dependencies[dep]) {
        console.log(`✅ Dependency "${dep}": Found`);
      } else {
        console.log(`❌ Dependency "${dep}": Missing`);
        hasErrors = true;
      }
    }

    return hasErrors;
  } catch (error) {
    console.log(`❌ Error reading package.json: ${error.message}`);
    return true;
  }
}

function main() {
  console.log('🚀 Taskmaster Production Configuration Validator\n');
  console.log('='.repeat(50));
  
  const envValidation = validateEnvironment();
  const fileErrors = validateFiles();
  const packageErrors = validatePackageJson();
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Validation Summary:');
  
  if (envValidation.hasErrors || fileErrors || packageErrors) {
    console.log('\n❌ Validation FAILED - Please fix the errors above before deploying');
    process.exit(1);
  } else {
    console.log('\n✅ All validations PASSED');
    
    if (envValidation.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      envValidation.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }
    
    console.log('\n🎉 Configuration is ready for production deployment!');
    process.exit(0);
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
} 