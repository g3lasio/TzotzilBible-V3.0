#!/usr/bin/env node
/**
 * set-build-number.js
 *
 * Stamps a fresh timestamp-based build number into:
 *   - ios/TzotzilBible/Info.plist  (CFBundleVersion)
 *
 * Run this ONCE before every Xcode Archive:
 *   node scripts/set-build-number.js
 *
 * Format: YYMMDDHHMM  (e.g. 2602280035)
 * - Always increasing → Apple never rejects it as a duplicate.
 * - No manual editing required.
 */

const { execSync } = require('child_process');
const path = require('path');

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const BUILD_NUMBER = [
  String(now.getFullYear()).slice(-2),
  pad(now.getMonth() + 1),
  pad(now.getDate()),
  pad(now.getHours()),
  pad(now.getMinutes()),
].join('');

const INFO_PLIST = path.resolve(__dirname, '../ios/TzotzilBible/Info.plist');

try {
  execSync(
    `/usr/libexec/PlistBuddy -c "Set :CFBundleVersion ${BUILD_NUMBER}" "${INFO_PLIST}"`,
    { stdio: 'inherit' }
  );
  console.log(`✅ Build number set to: ${BUILD_NUMBER}`);
} catch (err) {
  console.error('❌ Failed to set build number:', err.message);
  process.exit(1);
}
