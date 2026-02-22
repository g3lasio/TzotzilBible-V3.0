import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// CONDITIONAL IMPORTS - Only load native modules on native platforms
// This prevents web crashes from undefined native modules
// ============================================================
let SQLite: typeof import('expo-sqlite') | null = null;
let FileSystem: typeof import('expo-file-system') | null = null;
let Asset: typeof import('expo-asset').Asset | null = null;

if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
  FileSystem = require('expo-file-system');
  Asset = require('expo-asset').Asset;
}

// ============================================================
// DATABASE VERSION - INCREMENT THIS WHEN bible.db CHANGES
// This forces the app to replace the old cached database
// ============================================================
const DB_VERSION = 6; // Version 6 = all 6 Bible versions (Tzotzil, RV1960, NVI, DHH, TLA, NKJV)
const DB_VERSION_KEY = '@bible_db_version';

export interface BibleBook {
  id: number;
  name: string;
  book_number: number;
  testament: string;
  chapters_count: number;
}

export interface BibleVerse {
  id: number;
  book_id: number;
  book_name: string;
  chapter: number;
  verse: number;
  text?: string;
  text_tzotzil?: string;
  text_spanish_rv1960?: string;
  text_spanish_nvi?: string;
  text_spanish_dhh?: string;
  text_spanish_tla?: string;
  text_english_nkjv?: string;
}

export interface PromiseEntry {
  id: number;
  text: string;
  image_url: string;
}

export type InitializationStatus = 'pending' | 'initializing' | 'ready' | 'web_fallback' | 'failed';

const EXPECTED_BOOKS_COUNT = 66;
const EXPECTED_VERSES_MIN = 31000;
const MAX_RECOVERY_ATTEMPTS = 3;

export class DatabaseService {
  private static instance: DatabaseService;
  private db: any = null;
  private static readonly DB_NAME = 'bible.db';
  private initStatus: InitializationStatus = 'pending';
  private initError: Error | null = null;
  private initPromise: Promise<boolean> | null = null;
  private recoveryAttempts: number = 0;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ============================================================
  // PUBLIC API - These method names MUST match what BibleService.ts expects
  // ============================================================

  async initDatabase(): Promise<boolean> {
    if (this.initStatus === 'ready' || this.initStatus === 'web_fallback') {
      return true;
    }
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this.initialize();
    return this.initPromise;
  }

  async initialize(): Promise<boolean> {
    if (this.initStatus === 'ready' || this.initStatus === 'web_fallback') {
      return true;
    }

    this.initStatus = 'initializing';
    console.log('[DatabaseService] Starting initialization...');

    try {
      if (Platform.OS === 'web') {
        // Web platform: no SQLite available, use WebBibleService via BibleService
        console.log('[DatabaseService] Web platform - using API fallback');
        this.initStatus = 'web_fallback';
        return true;
      }

      console.log('[DatabaseService] Native platform - initializing SQLite...');

      const copySuccess = await this.copyDatabaseFromAssets();
      if (!copySuccess) {
        throw new Error('Failed to copy database from assets');
      }

      console.log('[DatabaseService] Opening database...');
      this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);

      const isValid = await this.validateDatabase();
      if (!isValid) {
        console.log('[DatabaseService] Database validation failed, attempting recovery...');

        if (this.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
          throw new Error(`Database recovery failed after ${MAX_RECOVERY_ATTEMPTS} attempts. Please reinstall the app.`);
        }

        this.recoveryAttempts++;
        console.log(`[DatabaseService] Recovery attempt ${this.recoveryAttempts}/${MAX_RECOVERY_ATTEMPTS}`);

        const recopySuccess = await this.forceRecopyDatabase();
        if (!recopySuccess) {
          throw new Error('Failed to recopy database during recovery');
        }

        this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);
        const retryValid = await this.validateDatabase();
        if (!retryValid) {
          throw new Error('Database validation failed after recovery attempt');
        }

        this.recoveryAttempts = 0;
      }

      // Verify all 6 version columns have data
      await this.verifyVersionData();

      this.initStatus = 'ready';
      console.log('[DatabaseService] Database initialized successfully');
      return true;
    } catch (error) {
      console.error('[DatabaseService] Initialization failed:', error);
      this.initError = error as Error;
      this.initStatus = 'failed';
      return false;
    }
  }

  // ============================================================
  // DATABASE VERSION CHECK - Forces update when DB_VERSION changes
  // ============================================================

  private async needsDatabaseUpdate(): Promise<boolean> {
    try {
      const storedVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
      const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;

      console.log(`[DatabaseService] Stored DB version: ${currentVersion}, Required: ${DB_VERSION}`);

      if (currentVersion < DB_VERSION) {
        console.log('[DatabaseService] DATABASE UPDATE NEEDED - new version available');
        return true;
      }

      return false;
    } catch (error) {
      console.log('[DatabaseService] Error checking DB version, will update:', error);
      return true;
    }
  }

  private async saveDatabaseVersion(): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_VERSION_KEY, DB_VERSION.toString());
      console.log(`[DatabaseService] Saved DB version: ${DB_VERSION}`);
    } catch (error) {
      console.error('[DatabaseService] Error saving DB version:', error);
    }
  }

  // ============================================================
  // DATABASE VALIDATION
  // ============================================================

  private async validateDatabase(): Promise<boolean> {
    try {
      if (!this.db) return false;

      const booksResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM books'
      ) as { count: number } | null;

      const versesResult = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM verses'
      ) as { count: number } | null;

      const booksCount = booksResult?.count || 0;
      const versesCount = versesResult?.count || 0;

      console.log(`[DatabaseService] Validation: ${booksCount} books, ${versesCount} verses`);

      if (booksCount < EXPECTED_BOOKS_COUNT) {
        console.error(`[DatabaseService] Expected ${EXPECTED_BOOKS_COUNT} books, found ${booksCount}`);
        return false;
      }

      if (versesCount < EXPECTED_VERSES_MIN) {
        console.error(`[DatabaseService] Expected ${EXPECTED_VERSES_MIN}+ verses, found ${versesCount}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[DatabaseService] Validation error:', error);
      return false;
    }
  }

  private async verifyVersionData(): Promise<void> {
    try {
      if (!this.db) return;

      const verseTest = await this.db.getFirstAsync(
        `SELECT 
          COUNT(CASE WHEN text_tzotzil IS NOT NULL AND text_tzotzil != '' THEN 1 END) as tzotzil,
          COUNT(CASE WHEN text_spanish_rv1960 IS NOT NULL AND text_spanish_rv1960 != '' THEN 1 END) as rv1960,
          COUNT(CASE WHEN text_spanish_nvi IS NOT NULL AND text_spanish_nvi != '' THEN 1 END) as nvi,
          COUNT(CASE WHEN text_spanish_dhh IS NOT NULL AND text_spanish_dhh != '' THEN 1 END) as dhh,
          COUNT(CASE WHEN text_spanish_tla IS NOT NULL AND text_spanish_tla != '' THEN 1 END) as tla,
          COUNT(CASE WHEN text_english_nkjv IS NOT NULL AND text_english_nkjv != '' THEN 1 END) as nkjv
        FROM verses LIMIT 1000`
      ) as any;

      console.log(`[DatabaseService] Version data check:`, JSON.stringify(verseTest));

      // If NVI/DHH/TLA are all 0, database is outdated
      if (verseTest && verseTest.nvi === 0 && verseTest.dhh === 0 && verseTest.tla === 0) {
        console.error('[DatabaseService] CRITICAL: Database is missing version data! Forcing update...');
        await AsyncStorage.setItem(DB_VERSION_KEY, '0');
        console.error('[DatabaseService] Database will be updated on next app launch');
      }
    } catch (error) {
      // If columns don't exist, that's also a sign of old database
      console.error('[DatabaseService] Version verification error (old schema?):', error);
      await AsyncStorage.setItem(DB_VERSION_KEY, '0');
    }
  }

  // ============================================================
  // DATABASE COPY FROM ASSETS
  // ============================================================

  private async copyDatabaseFromAssets(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    try {
      const dbDir = `${FileSystem!.documentDirectory}SQLite/`;
      const dbPath = `${dbDir}${DatabaseService.DB_NAME}`;

      console.log(`[DatabaseService] Checking database at: ${dbPath}`);

      const dirInfo = await FileSystem!.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        console.log('[DatabaseService] Creating SQLite directory...');
        await FileSystem!.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      const fileInfo = await FileSystem!.getInfoAsync(dbPath);
      const needsUpdate = await this.needsDatabaseUpdate();

      if (fileInfo.exists && needsUpdate) {
        // Database exists but is outdated - replace it
        console.log('[DatabaseService] REPLACING old database with updated version...');
        if (this.db) {
          try {
            await this.db.closeAsync();
            this.db = null;
          } catch (e) {
            console.log('[DatabaseService] Note: could not close old db connection');
          }
        }
        await FileSystem!.deleteAsync(dbPath, { idempotent: true });
        console.log('[DatabaseService] Old database deleted');
      } else if (fileInfo.exists) {
        // Database exists and is current
        const fileSizeMB = ((fileInfo as any).size || 0) / (1024 * 1024);
        console.log(`[DatabaseService] Existing database found: ${fileSizeMB.toFixed(2)} MB`);
        if (fileSizeMB > 15) {
          console.log('[DatabaseService] Database size looks valid, skipping copy');
          return true;
        }
        console.log('[DatabaseService] Database too small, will recopy');
        await FileSystem!.deleteAsync(dbPath, { idempotent: true });
      }

      // Copy fresh database from assets
      console.log('[DatabaseService] Loading database from assets...');
      const asset = Asset!.fromModule(require('../../assets/bible.db'));

      console.log('[DatabaseService] Downloading asset...');
      await asset.downloadAsync();

      if (!asset.localUri) {
        console.error('[DatabaseService] Asset localUri is null after download');
        return false;
      }

      console.log(`[DatabaseService] Asset ready at: ${asset.localUri}`);

      const assetInfo = await FileSystem!.getInfoAsync(asset.localUri);
      const assetSizeMB = ((assetInfo as any).size || 0) / (1024 * 1024);
      console.log(`[DatabaseService] Asset size: ${assetSizeMB.toFixed(2)} MB`);

      console.log('[DatabaseService] Copying database to document directory...');
      await FileSystem!.copyAsync({
        from: asset.localUri,
        to: dbPath
      });

      const copiedInfo = await FileSystem!.getInfoAsync(dbPath);
      const copiedSizeMB = ((copiedInfo as any).size || 0) / (1024 * 1024);
      console.log(`[DatabaseService] Database copied successfully: ${copiedSizeMB.toFixed(2)} MB`);

      // Save version after successful copy
      await this.saveDatabaseVersion();

      return true;
    } catch (error) {
      console.error('[DatabaseService] Error copying database:', error);
      return false;
    }
  }

  private async forceRecopyDatabase(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    try {
      const dbDir = `${FileSystem!.documentDirectory}SQLite/`;
      const dbPath = `${dbDir}${DatabaseService.DB_NAME}`;
      const dbJournalPath = `${dbPath}-journal`;
      const dbWalPath = `${dbPath}-wal`;
      const dbShmPath = `${dbPath}-shm`;

      if (this.db) {
        console.log('[DatabaseService] Closing database before recopy...');
        try {
          await this.db.closeAsync();
        } catch (e) {
          console.log('[DatabaseService] Could not close database:', e);
        }
        this.db = null;
      }

      console.log('[DatabaseService] Force recopy - cleaning up all database files...');

      const filesToDelete = [dbPath, dbJournalPath, dbWalPath, dbShmPath];
      for (const file of filesToDelete) {
        try {
          await FileSystem!.deleteAsync(file, { idempotent: true });
        } catch (e) {
          // Ignore errors on cleanup
        }
      }

      // Reset version to force fresh copy
      await AsyncStorage.setItem(DB_VERSION_KEY, '0');

      console.log('[DatabaseService] All database files cleaned up');

      return await this.copyDatabaseFromAssets();
    } catch (error) {
      console.error('[DatabaseService] Force recopy failed:', error);
      return false;
    }
  }

  // ============================================================
  // STATUS METHODS
  // ============================================================

  isReady(): boolean {
    return this.initStatus === 'ready' && this.db !== null;
  }

  isWebFallback(): boolean {
    return this.initStatus === 'web_fallback';
  }

  getStatus(): InitializationStatus {
    return this.initStatus;
  }

  getInitError(): Error | null {
    return this.initError;
  }

  // ============================================================
  // DATA ACCESS METHODS - All 6 Bible versions
  // ============================================================

  async getBooks(): Promise<any[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') {
        console.log('[DatabaseService] getBooks: Database not ready');
        return [];
      }
      const result = await this.db.getAllAsync(
        'SELECT id, name, book_number, testament, chapters_count FROM books ORDER BY book_number'
      ) as any[];
      return result.map((row: any) => ({
        id: row.id,
        name: row.name,
        book_number: row.book_number,
        testament: row.testament,
        chapters: row.chapters_count
      }));
    } catch (error) {
      console.error('[DatabaseService] getBooks error:', error);
      return [];
    }
  }

  async getChaptersCount(bookName: string): Promise<number[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const result = await this.db.getFirstAsync(
        'SELECT chapters_count FROM books WHERE name = ?',
        [bookName]
      ) as { chapters_count: number } | null;
      if (result) {
        return Array.from({ length: result.chapters_count }, (_, i) => i + 1);
      }
      return [];
    } catch (error) {
      console.error('[DatabaseService] getChaptersCount error:', error);
      return [];
    }
  }

  async getVerses(bookName: string, chapter: number): Promise<BibleVerse[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') {
        console.log('[DatabaseService] getVerses: Database not ready');
        return [];
      }

      console.log(`[DatabaseService] Loading verses for ${bookName} ${chapter}...`);

      const result = await this.db.getAllAsync(
        `SELECT v.id, v.book_id, v.chapter, v.verse, 
                v.text_tzotzil, v.text_spanish_rv1960, v.text_spanish_nvi,
                v.text_spanish_dhh, v.text_spanish_tla, v.text_english_nkjv,
                v.book_name
         FROM verses v 
         WHERE v.book_name = ? AND v.chapter = ? 
         ORDER BY v.verse`,
        [bookName, chapter]
      ) as any[];

      console.log(`[DatabaseService] Loaded ${result.length} verses for ${bookName} ${chapter}`);

      // Log version availability for debugging
      if (result.length > 0) {
        const sample = result[0];
        const versions = {
          tzotzil: !!sample.text_tzotzil,
          rv1960: !!sample.text_spanish_rv1960,
          nvi: !!sample.text_spanish_nvi,
          dhh: !!sample.text_spanish_dhh,
          tla: !!sample.text_spanish_tla,
          nkjv: !!sample.text_english_nkjv,
        };
        console.log(`[DatabaseService] Version availability:`, JSON.stringify(versions));
      }

      return result.map((row: any) => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text_spanish_rv1960 || '', // Default text field for backward compatibility
        text_tzotzil: row.text_tzotzil,
        text_spanish_rv1960: row.text_spanish_rv1960,
        text_spanish_nvi: row.text_spanish_nvi,
        text_spanish_dhh: row.text_spanish_dhh,
        text_spanish_tla: row.text_spanish_tla,
        text_english_nkjv: row.text_english_nkjv,
        book_name: row.book_name
      }));
    } catch (error) {
      console.error('[DatabaseService] getVerses error:', error);
      return [];
    }
  }

  async searchVerses(query: string): Promise<BibleVerse[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const searchTerm = `%${query}%`;
      const result = await this.db.getAllAsync(
        `SELECT v.id, v.book_id, v.chapter, v.verse, 
                v.text_tzotzil, v.text_spanish_rv1960, v.text_spanish_nvi,
                v.text_spanish_dhh, v.text_spanish_tla, v.text_english_nkjv,
                v.book_name
         FROM verses v 
         WHERE v.text_spanish_rv1960 LIKE ? OR v.text_tzotzil LIKE ?
         ORDER BY v.book_id, v.chapter, v.verse
         LIMIT 100`,
        [searchTerm, searchTerm]
      ) as any[];
      return result.map((row: any) => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text_spanish_rv1960 || '',
        text_tzotzil: row.text_tzotzil,
        text_spanish_rv1960: row.text_spanish_rv1960,
        text_spanish_nvi: row.text_spanish_nvi,
        text_spanish_dhh: row.text_spanish_dhh,
        text_spanish_tla: row.text_spanish_tla,
        text_english_nkjv: row.text_english_nkjv,
        book_name: row.book_name
      }));
    } catch (error) {
      console.error('[DatabaseService] searchVerses error:', error);
      return [];
    }
  }

  async getRandomPromise(): Promise<PromiseEntry | null> {
    try {
      if (!this.db || this.initStatus !== 'ready') return null;
      const result = await this.db.getFirstAsync(
        'SELECT id, text, image_url FROM promises ORDER BY RANDOM() LIMIT 1'
      ) as PromiseEntry | null;
      return result;
    } catch (error) {
      console.error('[DatabaseService] getRandomPromise error:', error);
      return null;
    }
  }

  async getAllPromises(): Promise<PromiseEntry[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const result = await this.db.getAllAsync(
        'SELECT id, text, image_url FROM promises'
      ) as PromiseEntry[];
      return result;
    } catch (error) {
      console.error('[DatabaseService] getAllPromises error:', error);
      return [];
    }
  }

  async getVerse(bookName: string, chapter: number, verse: number): Promise<BibleVerse | null> {
    try {
      if (!this.db || this.initStatus !== 'ready') return null;
      const result = await this.db.getFirstAsync(
        `SELECT v.id, v.book_id, v.chapter, v.verse, 
                v.text_tzotzil, v.text_spanish_rv1960, v.text_spanish_nvi,
                v.text_spanish_dhh, v.text_spanish_tla, v.text_english_nkjv,
                v.book_name
         FROM verses v 
         WHERE v.book_name = ? AND v.chapter = ? AND v.verse = ?`,
        [bookName, chapter, verse]
      ) as any | null;
      if (result) {
        return {
          id: result.id,
          book_id: result.book_id,
          chapter: result.chapter,
          verse: result.verse,
          text: result.text_spanish_rv1960 || '',
          text_tzotzil: result.text_tzotzil,
          text_spanish_rv1960: result.text_spanish_rv1960,
          text_spanish_nvi: result.text_spanish_nvi,
          text_spanish_dhh: result.text_spanish_dhh,
          text_spanish_tla: result.text_spanish_tla,
          text_english_nkjv: result.text_english_nkjv,
          book_name: result.book_name
        };
      }
      return null;
    } catch (error) {
      console.error('[DatabaseService] getVerse error:', error);
      return null;
    }
  }

  /**
   * Force database update - deletes cached database and re-copies from assets
   * Use this if user reports missing versions or data issues
   */
  async forceUpdate(): Promise<void> {
    console.log('[DatabaseService] FORCE UPDATE requested');

    if (Platform.OS === 'web') {
      console.log('[DatabaseService] Web platform - re-initializing...');
      this.initStatus = 'pending';
      this.initPromise = null;
      await this.initDatabase();
      return;
    }

    try {
      const recopySuccess = await this.forceRecopyDatabase();
      if (!recopySuccess) {
        throw new Error('Force recopy failed');
      }

      this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);
      this.initStatus = 'ready';
      this.initPromise = null;

      console.log('[DatabaseService] Force update complete');
    } catch (error) {
      console.error('[DatabaseService] Force update failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        this.initStatus = 'pending';
        this.initPromise = null;
      }
    } catch (error) {
      console.error('[DatabaseService] close error:', error);
    }
  }
}

// Named export (required by BibleService.ts)
export const databaseService = DatabaseService.getInstance();

// Default export
export default DatabaseService;
