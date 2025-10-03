#!/usr/bin/env node

/**
 * Console to Logger Migration Helper Script
 * 
 * This script helps identify files that still use console.* methods
 * and provides guidance on how to migrate them to use the logger utility.
 * 
 * Usage:
 *   node scripts/migrate-to-logger.js
 * 
 * Or to auto-fix (be careful!):
 *   node scripts/migrate-to-logger.js --fix
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

const DIRECTORIES_TO_SKIP = [
  'node_modules',
  '.next',
  'build',
  'dist',
  '.git'
];

const CONSOLE_METHODS = ['log', 'error', 'warn', 'info', 'debug'];
const CONSOLE_REGEX = /console\.(log|error|warn|info|debug)/g;

let totalFiles = 0;
let filesWithConsole = 0;
let totalConsoleStatements = 0;

function shouldSkipDirectory(dirPath) {
  return DIRECTORIES_TO_SKIP.some(skip => dirPath.includes(skip));
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(CONSOLE_REGEX);
  
  if (matches && matches.length > 0) {
    filesWithConsole++;
    totalConsoleStatements += matches.length;
    
    console.log(`\n📁 ${filePath}`);
    console.log(`   Found ${matches.length} console statement(s)`);
    
    // Show line numbers
    const lines = content.split('\n');
    lines.forEach((line, index) => {
      if (CONSOLE_REGEX.test(line)) {
        console.log(`   Line ${index + 1}: ${line.trim()}`);
      }
    });
    
    return true;
  }
  
  return false;
}

function scanDirectory(dir) {
  if (shouldSkipDirectory(dir)) return;
  
  const items = fs.readdirSync(dir);
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (stat.isFile() && /\.(js|jsx|ts|tsx)$/.test(item)) {
      totalFiles++;
      scanFile(fullPath);
    }
  });
}

function autoFix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if logger is already imported
  const hasLoggerImport = /import.*logger.*from.*['"].*logger.*['"]/.test(content);
  
  if (!hasLoggerImport && CONSOLE_REGEX.test(content)) {
    // Add logger import at the top
    const importStatement = `import { logger } from '@/utils/logger';\n`;
    
    // Find the best place to insert the import
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find last import statement
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        insertIndex = i + 1;
      } else if (insertIndex > 0 && lines[i].trim() !== '') {
        break;
      }
    }
    
    lines.splice(insertIndex, 0, importStatement);
    content = lines.join('\n');
  }
  
  // Replace console.* with logger.*
  content = content.replace(/console\.(log|error|warn|info|debug)/g, 'logger.$1');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Fixed: ${filePath}`);
}

function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  console.log('🔍 Scanning for console statements...\n');
  
  DIRECTORIES_TO_SCAN.forEach(dir => {
    if (fs.existsSync(dir)) {
      scanDirectory(dir);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Summary:`);
  console.log(`   Total files scanned: ${totalFiles}`);
  console.log(`   Files with console statements: ${filesWithConsole}`);
  console.log(`   Total console statements: ${totalConsoleStatements}`);
  
  if (shouldFix) {
    console.log('\n⚠️  Auto-fix feature not yet implemented.');
    console.log('   Please manually update files or use find-and-replace in your IDE.');
  } else {
    console.log('\n💡 To see how to fix these:');
    console.log('   1. Import logger: import { logger } from "@/utils/logger"');
    console.log('   2. Replace console.log with logger.log');
    console.log('   3. Replace console.error with logger.error');
    console.log('   4. And so on...');
    console.log('\n   Or run with --fix flag (use with caution!)');
  }
  
  console.log('\n' + '='.repeat(60));
}

main();
