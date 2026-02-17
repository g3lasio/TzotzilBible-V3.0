#!/usr/bin/env node

/**
 * Auto-increment build numbers before EAS build
 * This script generates app.json from app.config.js with updated version codes
 */

const fs = require('fs');
const path = require('path');

// Generate timestamp-based build numbers
const now = new Date();
const year = now.getFullYear();
const month = String(now.getMonth() + 1).padStart(2, '0');
const day = String(now.getDate()).padStart(2, '0');
const hour = String(now.getHours()).padStart(2, '0');
const minute = String(now.getMinutes()).padStart(2, '0');

// Format: YYYYMMDDHHMM (e.g., 202602170420 for Feb 17, 2026 04:20)
const BUILD_NUMBER = `${year}${month}${day}${hour}${minute}`;

// Android versionCode must be an integer (max 2100000000)
// Using format: YYMMDDHHMM (e.g., 2602170420)
const VERSION_CODE = parseInt(`${String(year).slice(2)}${month}${day}${hour}${minute}`);

console.log('🔨 Updating build numbers...');
console.log(`   iOS buildNumber: ${BUILD_NUMBER}`);
console.log(`   Android versionCode: ${VERSION_CODE}`);
console.log(`   Generated at: ${now.toISOString()}`);

// Import app.config.js
const configPath = path.join(__dirname, '..', 'app.config.js');
delete require.cache[require.resolve(configPath)];
const appConfig = require(configPath).default;

// Update version codes
appConfig.expo.ios.buildNumber = BUILD_NUMBER;
appConfig.expo.android.versionCode = VERSION_CODE;

// Write to app.json (EAS reads this)
const appJsonPath = path.join(__dirname, '..', 'app.json');
fs.writeFileSync(appJsonPath, JSON.stringify(appConfig, null, 2), 'utf8');

console.log('✅ app.json updated with new build numbers!');
console.log(`   File: ${appJsonPath}`);
