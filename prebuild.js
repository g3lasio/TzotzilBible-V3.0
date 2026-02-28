#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DIST_DIR = path.join(__dirname, 'dist');

console.log('📦 Building web bundle (always rebuild for fresh deployment)...');
try {
  // Remove old dist to force clean build
  if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
    console.log('🗑️  Removed old dist/');
  }
  execSync('npx expo export --platform web', {
    stdio: 'inherit',
    cwd: __dirname
  });
  console.log('✅ Web bundle built successfully!');
} catch (error) {
  console.error('❌ Failed to build web bundle:', error.message);
  process.exit(1);
}
console.log('🚀 Ready to start server!');
