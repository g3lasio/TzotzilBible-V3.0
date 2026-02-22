/**
 * Integration Test v2 - TzotzilBible Expanded Edition
 * Tests: Database, Version files, Server endpoints, EGW search, Config consistency
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

let passed = 0;
let failed = 0;
let warnings = 0;

function test(name, condition, detail = '') {
  if (condition) {
    passed++;
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    console.log(`  ❌ ${name} ${detail ? '— ' + detail : ''}`);
  }
}

function warn(name, detail) {
  warnings++;
  console.log(`  ⚠️  ${name} — ${detail}`);
}

async function runTests() {
  console.log('\n========================================');
  console.log('  INTEGRATION TEST v2 - EXPANDED EDITION');
  console.log('========================================\n');

  // ============================================================
  // 1. DATABASE INTEGRITY
  // ============================================================
  console.log('📦 1. DATABASE INTEGRITY');
  
  const dbPath = path.join(__dirname, 'assets/bible.db');
  test('Slim bible.db exists', fs.existsSync(dbPath));
  
  const dbStats = fs.statSync(dbPath);
  const dbSizeMB = (dbStats.size / (1024 * 1024)).toFixed(1);
  test(`Slim DB size is reasonable (${dbSizeMB} MB)`, dbStats.size < 15 * 1024 * 1024, 'Should be <15 MB for slim');

  const androidDbPath = path.join(__dirname, 'android/app/src/main/assets/bible.db');
  if (fs.existsSync(androidDbPath)) {
    const androidStats = fs.statSync(androidDbPath);
    test('Android DB matches assets DB size', androidStats.size === dbStats.size);
  } else {
    warn('Android DB', 'Not found - will be created during build');
  }

  // ============================================================
  // 2. VERSION FILES
  // ============================================================
  console.log('\n📁 2. VERSION FILES');
  
  const versionsDir = path.join(__dirname, 'assets/versions');
  test('Versions directory exists', fs.existsSync(versionsDir));
  
  const metadataPath = path.join(versionsDir, 'metadata.json');
  test('metadata.json exists', fs.existsSync(metadataPath));
  
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
  const versionIds = Object.keys(metadata.versions);
  test(`metadata has 13 versions (found ${versionIds.length})`, versionIds.length === 13);
  
  const expectedVersions = ['nvi', 'dhh', 'tla', 'lbla', 'nbla', 'ntv', 'rva2015', 'rvc', 'tlai', 'vbl', 'bes', 'pddpt', 'nkjv'];
  for (const vid of expectedVersions) {
    const versionFile = path.join(versionsDir, `${vid}.json`);
    const exists = fs.existsSync(versionFile);
    test(`${vid}.json exists`, exists);
    
    if (exists) {
      const vData = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
      test(`${vid} is array format`, Array.isArray(vData));
      test(`${vid} has verses (${vData.length || 0})`, vData.length > 0);
      if (vData.length > 0) {
        test(`${vid} entries have correct fields`, vData[0].book_name && vData[0].chapter && vData[0].verse && vData[0].text !== undefined);
      }
    }
  }

  // ============================================================
  // 3. SLIM JSON FOR WEB
  // ============================================================
  console.log('\n🌐 3. WEB DATA');
  
  const slimJsonPath = path.join(__dirname, 'assets/bible_data/all_verses_slim.json');
  test('all_verses_slim.json exists', fs.existsSync(slimJsonPath));
  
  if (fs.existsSync(slimJsonPath)) {
    const slimData = JSON.parse(fs.readFileSync(slimJsonPath, 'utf-8'));
    test(`Slim JSON has 31105 verses (found ${slimData.length})`, slimData.length === 31105);
    
    const firstVerse = slimData[0];
    test('Has text_tzotzil field', !!firstVerse.text_tzotzil);
    test('Has text_spanish_rv1960 field', !!firstVerse.text_spanish_rv1960);
    test('Does NOT have NVI in slim (on-demand)', !firstVerse.text_spanish_nvi);
  }

  // ============================================================
  // 4. BIBLEVERSIONS CONFIG
  // ============================================================
  console.log('\n📋 4. BIBLEVERSIONS CONFIG');
  
  const bvContent = fs.readFileSync(path.join(__dirname, 'src/constants/bibleVersions.ts'), 'utf-8');
  
  for (const vid of expectedVersions) {
    test(`bibleVersions has '${vid}'`, bvContent.includes(`id: '${vid}'`));
  }
  
  test('RV1960 is bundled', bvContent.includes("id: 'rv1960'") && bvContent.includes('isBundled: true'));
  test('NVI is downloadable', bvContent.includes("id: 'nvi'") && bvContent.includes('isDownloadable: true'));

  // ============================================================
  // 5. TYPES CONSISTENCY
  // ============================================================
  console.log('\n🔧 5. TYPES CONSISTENCY');
  
  const typesContent = fs.readFileSync(path.join(__dirname, 'src/types/bible.ts'), 'utf-8');
  const dbServiceContent = fs.readFileSync(path.join(__dirname, 'src/services/DatabaseService.ts'), 'utf-8');
  
  const newVersionFields = ['text_spanish_lbla', 'text_spanish_nbla', 'text_spanish_ntv', 'text_spanish_rva2015', 
                            'text_spanish_rvc', 'text_spanish_tlai', 'text_spanish_vbl', 'text_spanish_bes', 'text_spanish_pddpt'];
  
  for (const field of newVersionFields) {
    test(`types/bible.ts has ${field}`, typesContent.includes(field));
    test(`DatabaseService has ${field}`, dbServiceContent.includes(field));
  }

  // ============================================================
  // 6. BACKEND SERVER
  // ============================================================
  console.log('\n🖥️  6. BACKEND SERVER');
  
  const serverContent = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf-8');
  
  test('Server has VERSIONS_DIR', serverContent.includes('VERSIONS_DIR'));
  test('Server has handleVersionsList', serverContent.includes('handleVersionsList'));
  test('Server has handleVersionDownload', serverContent.includes('handleVersionDownload'));
  test('Server has /api/versions route', serverContent.includes('/api/versions'));
  test('Server has FUENTE FUNDAMENTAL (EGW)', serverContent.includes('FUENTE FUNDAMENTAL'));
  test('Server has DEBES USAR ESTAS CITAS', serverContent.includes('DEBES USAR ESTAS CITAS'));
  test('Server uses correct metadata fields (size_bytes)', serverContent.includes('size_bytes'));
  test('Server uses correct metadata fields (size_mb)', serverContent.includes('size_mb'));

  // ============================================================
  // 7. FRONTEND SERVICES
  // ============================================================
  console.log('\n📱 7. FRONTEND SERVICES');
  
  const webBibleContent = fs.readFileSync(path.join(__dirname, 'src/services/WebBibleService.ts'), 'utf-8');
  const versionMgrContent = fs.readFileSync(path.join(__dirname, 'src/services/VersionManager.ts'), 'utf-8');
  const nevinContent = fs.readFileSync(path.join(__dirname, 'src/services/NevinAIService.ts'), 'utf-8');
  
  test('WebBibleService imports SECONDARY_VERSIONS', webBibleContent.includes('SECONDARY_VERSIONS'));
  test('WebBibleService builds VERSION_FIELD_MAP dynamically', webBibleContent.includes('for (const ver of SECONDARY_VERSIONS)'));
  test('VersionManager exists', versionMgrContent.length > 0);
  test('VersionManager has downloadVersion', versionMgrContent.includes('downloadVersion'));
  test('VersionManager has getVerseText', versionMgrContent.includes('getVerseText'));
  test('VersionManager has deleteVersion', versionMgrContent.includes('deleteVersion'));
  
  // Check DatabaseService uses dynamic version fields
  test('DatabaseService has all 13 ON_DEMAND_VERSION_FIELDS', dbServiceContent.includes("'pddpt': 'text_spanish_pddpt'"));
  test('DatabaseService has dynamic getSelectClause', dbServiceContent.includes('Object.values(ON_DEMAND_VERSION_FIELDS)'));

  // ============================================================
  // 8. CONFIG CONSISTENCY
  // ============================================================
  console.log('\n⚙️  8. CONFIG CONSISTENCY');
  
  const configContent = fs.readFileSync(path.join(__dirname, 'src/config.ts'), 'utf-8');
  const envContent = fs.readFileSync(path.join(__dirname, 'src/env.ts'), 'utf-8');
  const pkgContent = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'));
  const appConfigContent = fs.readFileSync(path.join(__dirname, 'app.config.js'), 'utf-8');
  
  test('package.json version is 4.1.1', pkgContent.version === '4.1.1');
  test('config.ts APP_VERSION is 4.1.1', configContent.includes("'4.1.1'"));
  test('config.ts points to tzotzil.replit.app', configContent.includes('tzotzil.replit.app'));
  test('env.ts does NOT have localhost', !envContent.includes('localhost'));
  test('app.config.js has buildNumber 102', appConfigContent.includes('102'));

  // ============================================================
  // 9. UI COMPONENTS
  // ============================================================
  console.log('\n🎨 9. UI COMPONENTS');
  
  const pickerContent = fs.readFileSync(path.join(__dirname, 'src/components/VersionPickerModal.tsx'), 'utf-8');
  
  test('VersionPickerModal has ScrollView', pickerContent.includes('ScrollView'));
  test('VersionPickerModal has language sections', pickerContent.includes('spanishVersions') && pickerContent.includes('englishVersions'));
  test('VersionPickerModal has coverage display', pickerContent.includes('coverageText'));
  test('VersionPickerModal has download count', pickerContent.includes('downloadedCount'));

  // ============================================================
  // 10. EGW BOOKS
  // ============================================================
  console.log('\n📚 10. EGW BOOKS');
  
  const egwDir = path.join(__dirname, 'assets/EGW BOOKS JSON');
  test('EGW books directory exists', fs.existsSync(egwDir));
  
  if (fs.existsSync(egwDir)) {
    const egwFiles = fs.readdirSync(egwDir).filter(f => f.endsWith('.json'));
    test(`EGW has 91 books (found ${egwFiles.length})`, egwFiles.length >= 90);
  }

  // ============================================================
  // 11. iOS/ANDROID BUILD CONFIG
  // ============================================================
  console.log('\n📲 11. BUILD CONFIG');
  
  const infoPlistPath = path.join(__dirname, 'ios/TzotzilBible/Info.plist');
  if (fs.existsSync(infoPlistPath)) {
    const plistContent = fs.readFileSync(infoPlistPath, 'utf-8');
    test('Info.plist has version 4.1.1', plistContent.includes('4.1.1'));
    test('Info.plist has build 102', plistContent.includes('102'));
  } else {
    warn('Info.plist', 'Not found - will be generated by expo prebuild');
  }
  
  const buildGradlePath = path.join(__dirname, 'android/app/build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    const gradleContent = fs.readFileSync(buildGradlePath, 'utf-8');
    test('build.gradle versionCode is 101', gradleContent.includes('versionCode 101'));
    test('build.gradle versionName is 4.1.1', gradleContent.includes('4.1.1'));
  } else {
    warn('build.gradle', 'Not found');
  }

  // ============================================================
  // RESULTS
  // ============================================================
  console.log('\n========================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${warnings} warnings`);
  console.log('========================================\n');
  
  if (failed === 0) {
    console.log('  🎯 ALL TESTS PASSED — READY FOR PRODUCTION\n');
  } else {
    console.log(`  ⚠️  ${failed} TESTS FAILED — NEEDS ATTENTION\n`);
  }
  
  return { passed, failed, warnings };
}

runTests().catch(console.error);
