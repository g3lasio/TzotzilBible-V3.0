#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, 'dist');
const INDEX_PATH = path.join(DIST_DIR, 'index.html');

console.log('🔍 Checking if web bundle exists...');

if (!fs.existsSync(INDEX_PATH)) {
  console.log('📦 Building web bundle...');
  try {
    execSync('npx expo export --platform web', {
      stdio: 'inherit',
      cwd: __dirname
    });
    console.log('✅ Web bundle built successfully!');
  } catch (error) {
    console.error('❌ Failed to build web bundle:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Web bundle already exists, skipping build');
}

console.log('🚀 Ready to start server!');
