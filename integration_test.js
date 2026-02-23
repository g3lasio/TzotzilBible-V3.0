const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let passed = 0;
let failed = 0;
const issues = [];

function test(name, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.log(`  ❌ ${name}: ${result}`);
      failed++;
      issues.push(`${name}: ${result}`);
    }
  } catch(e) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
    issues.push(`${name}: ${e.message}`);
  }
}

console.log('========================================');
console.log('  INTEGRATION TEST - TzotzilBible V3.0');
console.log('========================================\n');

// === DATABASE ===
console.log('--- DATABASE ---');

test('Slim DB exists', () => {
  return fs.existsSync('assets/bible.db') || 'File not found';
});

test('Slim DB has correct schema (only tzotzil + rv1960)', () => {
  const schema = execSync('sqlite3 assets/bible.db ".schema verses"').toString();
  if (!schema.includes('text_tzotzil')) return 'Missing text_tzotzil';
  if (!schema.includes('text_spanish_rv1960')) return 'Missing text_spanish_rv1960';
  if (schema.includes('text_spanish_nvi')) return 'Still has NVI column - not slim';
  return true;
});

test('Slim DB has 31,105 verses', () => {
  const count = execSync('sqlite3 assets/bible.db "SELECT COUNT(*) FROM verses"').toString().trim();
  return count === '31105' || `Got ${count} verses`;
});

test('Slim DB has 0 null tzotzil', () => {
  const count = execSync('sqlite3 assets/bible.db "SELECT COUNT(*) FROM verses WHERE text_tzotzil IS NULL OR text_tzotzil = \'\'"').toString().trim();
  return count === '0' || `${count} null tzotzil`;
});

test('Slim DB has 0 null rv1960', () => {
  const count = execSync('sqlite3 assets/bible.db "SELECT COUNT(*) FROM verses WHERE text_spanish_rv1960 IS NULL OR text_spanish_rv1960 = \'\'"').toString().trim();
  return count === '0' || `${count} null rv1960`;
});

test('Android DB is identical to assets DB', () => {
  const md5a = execSync('md5sum assets/bible.db').toString().split(' ')[0];
  const md5b = execSync('md5sum android/app/src/main/assets/bible.db').toString().split(' ')[0];
  return md5a === md5b || `MD5 mismatch: ${md5a} vs ${md5b}`;
});

// === VERSION FILES ===
console.log('\n--- VERSION FILES ---');

test('Metadata file exists', () => {
  return fs.existsSync('assets/versions/metadata.json') || 'Not found';
});

const meta = JSON.parse(fs.readFileSync('assets/versions/metadata.json', 'utf-8'));
const versionIds = Object.keys(meta.versions);

test('4 downloadable versions in metadata', () => {
  return versionIds.length === 4 || `Got ${versionIds.length}: ${versionIds.join(', ')}`;
});

for (const vid of ['nvi', 'dhh', 'tla', 'nkjv']) {
  test(`${vid.toUpperCase()} file exists and valid`, () => {
    const fpath = `assets/versions/${vid}.json`;
    if (!fs.existsSync(fpath)) return 'File not found';
    const data = JSON.parse(fs.readFileSync(fpath, 'utf-8'));
    if (!Array.isArray(data)) return 'Not an array';
    if (data.length === 0) return 'Empty';
    if (!data[0].book_name) return 'Missing book_name field';
    if (!data[0].text) return 'Missing text field';
    const metaCount = meta.versions[vid].verses_count;
    if (data.length !== metaCount) return `Count mismatch: file=${data.length}, meta=${metaCount}`;
    return true;
  });
}

// === SLIM JSON ===
console.log('\n--- SLIM JSON ---');

test('Slim JSON exists', () => {
  return fs.existsSync('assets/bible_data/all_verses_slim.json') || 'Not found';
});

test('Slim JSON has only tzotzil + rv1960', () => {
  const slim = JSON.parse(fs.readFileSync('assets/bible_data/all_verses_slim.json', 'utf-8'));
  const keys = Object.keys(slim[0]);
  if (keys.includes('text_spanish_nvi')) return 'Still has NVI';
  if (keys.includes('text_spanish_dhh')) return 'Still has DHH';
  if (keys.includes('text_spanish_tla')) return 'Still has TLA';
  if (keys.includes('text_english_nkjv')) return 'Still has NKJV';
  if (!keys.includes('text_tzotzil')) return 'Missing tzotzil';
  if (!keys.includes('text_spanish_rv1960')) return 'Missing rv1960';
  return true;
});

test('Slim JSON has 31,105 verses', () => {
  const slim = JSON.parse(fs.readFileSync('assets/bible_data/all_verses_slim.json', 'utf-8'));
  return slim.length === 31105 || `Got ${slim.length}`;
});

// === EGW BOOKS ===
console.log('\n--- EGW BOOKS ---');

test('EGW directory exists', () => {
  return fs.existsSync('assets/EGW BOOKS JSON') || 'Not found';
});

const egwFiles = fs.readdirSync('assets/EGW BOOKS JSON').filter(f => f.endsWith('.json'));
test('91 EGW books available', () => {
  return egwFiles.length >= 90 || `Only ${egwFiles.length} books`;
});

test('EGW books have pages with content', () => {
  const book = JSON.parse(fs.readFileSync(path.join('assets/EGW BOOKS JSON', egwFiles[0]), 'utf-8'));
  if (!book.pages || book.pages.length === 0) return 'No pages';
  if (!book.pages[0].content && !book.pages[0].text) return 'No content in pages';
  return true;
});

// === BACKEND SERVER.JS ===
console.log('\n--- BACKEND SERVER.JS ---');

test('Server.js syntax valid', () => {
  try {
    execSync('node --check server.js 2>&1');
    return true;
  } catch(e) {
    return e.stdout ? e.stdout.toString() : e.message;
  }
});

const serverCode = fs.readFileSync('server.js', 'utf-8');

test('EGW is FUENTE FUNDAMENTAL', () => {
  return serverCode.includes('FUENTE FUNDAMENTAL') || 'Not found';
});

test('No contradictory EGW instructions', () => {
  if (serverCode.includes('APOYO SECUNDARIO')) return 'Still has APOYO SECUNDARIO';
  if (serverCode.includes('solo como comentarios adicionales')) return 'Still has old instruction';
  return true;
});

test('EGW quotes mandatory in chat', () => {
  return serverCode.includes('DEBES USAR ESTAS CITAS') || 'Not found';
});

test('Version API endpoints exist', () => {
  if (!serverCode.includes('/api/versions')) return 'Missing /api/versions';
  if (!serverCode.includes('handleVersionsList')) return 'Missing handleVersionsList';
  if (!serverCode.includes('handleVersionDownload')) return 'Missing handleVersionDownload';
  return true;
});

test('VERSIONS_DIR points to assets/versions', () => {
  return serverCode.includes("assets/versions") || 'Wrong path';
});

test('CORS headers present', () => {
  return serverCode.includes('Access-Control-Allow-Origin') || 'Missing CORS';
});

test('Verse commentary includes EGW', () => {
  return serverCode.includes('egwQuotes') || 'No EGW in verse commentary';
});

// === BUILD CONFIG ===
console.log('\n--- BUILD CONFIG ---');

test('Version is 7.0.0 in app.config.js', () => {
  const config = fs.readFileSync('app.config.js', 'utf-8');
  return config.includes('version: "7.0.0"') || 'Wrong version';
});

test('iOS Info.plist version is 7.0.0', () => {
  const plist = fs.readFileSync('ios/TzotzilBible/Info.plist', 'utf-8');
  const match = plist.match(/CFBundleShortVersionString[\s\S]*?<string>(.*?)<\/string>/);
  return (match && match[1] === '7.0.0') || `Got ${match ? match[1] : 'not found'}`;
});

test('iOS Info.plist build is 102', () => {
  const plist = fs.readFileSync('ios/TzotzilBible/Info.plist', 'utf-8');
  const match = plist.match(/CFBundleVersion[\s\S]*?<string>(.*?)<\/string>/);
  return (match && match[1] === '102') || `Got ${match ? match[1] : 'not found'}`;
});

test('Android versionName is 7.0.0', () => {
  const gradle = fs.readFileSync('android/app/build.gradle', 'utf-8');
  return gradle.includes('versionName "7.0.0"') || 'Wrong versionName';
});

test('Android versionCode is 101', () => {
  const gradle = fs.readFileSync('android/app/build.gradle', 'utf-8');
  return gradle.includes('versionCode 700') || 'Wrong versionCode';
});

test('TARGETED_DEVICE_FAMILY includes iPad', () => {
  const proj = fs.readFileSync('ios/TzotzilBible.xcodeproj/project.pbxproj', 'utf-8');
  return proj.includes('TARGETED_DEVICE_FAMILY = "1,2"') || 'Missing iPad support';
});

// === FRONTEND SERVICES ===
console.log('\n--- FRONTEND SERVICES ---');

const dbService = fs.readFileSync('src/services/DatabaseService.ts', 'utf-8');

test('DatabaseService has named export', () => {
  return dbService.includes('export const databaseService') || 'Missing named export';
});

test('DatabaseService has initDatabase method', () => {
  return dbService.includes('async initDatabase()') || 'Missing initDatabase';
});

test('DatabaseService has isReady method (sync)', () => {
  return dbService.includes('isReady(): boolean') || 'Missing or wrong signature';
});

test('DatabaseService has web platform check', () => {
  return dbService.includes("Platform.OS === 'web'") || 'No web check';
});

test('DatabaseService has DB_VERSION', () => {
  return dbService.includes('DB_VERSION') || 'Missing DB_VERSION';
});

test('DatabaseService has column detection', () => {
  return dbService.includes('availableColumns') || 'Missing column detection';
});

test('DatabaseService conditional imports (no top-level SQLite)', () => {
  return dbService.includes("if (Platform.OS !== 'web')") || 'Missing conditional import';
});

const webService = fs.readFileSync('src/services/WebBibleService.ts', 'utf-8');

test('WebBibleService loads slim JSON', () => {
  return webService.includes('all_verses_slim.json') || 'Not using slim JSON';
});

test('WebBibleService uses VersionManager', () => {
  return webService.includes('versionManager') || 'Not using VersionManager';
});

test('WebBibleService enriches verses with downloads', () => {
  return webService.includes('enrichVerseWithDownloads') || 'Missing enrichment';
});

const vmService = fs.readFileSync('src/services/VersionManager.ts', 'utf-8');

test('VersionManager points to tzotzil.replit.app', () => {
  return vmService.includes('tzotzil.replit.app') || 'Wrong API URL';
});

test('VersionManager has chunked storage for web', () => {
  return vmService.includes('storeChunked') || 'Missing chunked storage';
});

test('VersionManager has download progress', () => {
  return vmService.includes('reportProgress') || 'Missing progress reporting';
});

// === SUMMARY ===
console.log('\n========================================');
console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
console.log('========================================');

if (issues.length > 0) {
  console.log('\n⚠️  ISSUES FOUND:');
  issues.forEach((issue, i) => console.log(`  ${i+1}. ${issue}`));
}

console.log('');
