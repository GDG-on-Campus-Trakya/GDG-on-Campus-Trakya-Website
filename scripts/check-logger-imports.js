#!/usr/bin/env node

/**
 * Check which files use logger but don't have the import
 */

const fs = require('fs');
const path = require('path');

const DIRECTORIES_TO_SCAN = [
  'utils',
  'components',
  'app',
  'pages/api',
  'middleware'
];

const SKIP_FILES = [
  'utils/logger.js', // Logger itself
  'node_modules',
  '.next',
  'build',
  'dist'
];

function shouldSkip(filePath) {
  return SKIP_FILES.some(skip => filePath.includes(skip));
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file uses logger
  const usesLogger = /logger\.(log|error|warn|info|debug)/.test(content);
  
  if (!usesLogger) return null;
  
  // Check if file has logger import
  const hasImport = /import.*logger.*from.*['"].*logger.*['"]/.test(content);
  
  if (!hasImport) {
    // Count logger usage
    const matches = content.match(/logger\.(log|error|warn|info|debug)/g);
    return {
      file: filePath,
      usageCount: matches ? matches.length : 0
    };
  }
  
  return null;
}

function scanDirectory(dir, results = []) {
  if (shouldSkip(dir)) return results;
  
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    
    if (shouldSkip(fullPath)) return;
    
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath, results);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
      const result = checkFile(fullPath);
      if (result) {
        results.push(result);
      }
    }
  });
  
  return results;
}

function main() {
  console.log('🔍 Checking for missing logger imports...\n');
  
  const missingImports = [];
  
  DIRECTORIES_TO_SCAN.forEach(dir => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir, missingImports);
    }
  });
  
  if (missingImports.length === 0) {
    console.log('✅ All files that use logger have the import!\n');
    return;
  }
  
  console.log(`❌ Found ${missingImports.length} file(s) missing logger import:\n`);
  
  missingImports.forEach(({ file, usageCount }) => {
    console.log(`📁 ${file}`);
    console.log(`   Used ${usageCount} time(s)\n`);
  });
  
  console.log('\n💡 Add this import to each file:');
  console.log('   For utils/*:        import { logger } from "./logger";');
  console.log('   For components/*:   import { logger } from "@/utils/logger";');
  console.log('   For app/*:          import { logger } from "@/utils/logger";');
  console.log('   For middleware/*:   import { logger } from "../utils/logger";\n');
}

main();
