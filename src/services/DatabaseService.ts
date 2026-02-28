import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// CONDITIONAL IMPORTS - Only load native modules on native platforms
// This prevents web crashes from undefined native modules
// ============================================================
let SQLite: typeof import('expo-sqlite') | null = null;
let FileSystem: typeof import('expo-file-system') | null = null;
let Asset: typeof import('expo-asset').Asset | null = null;
let importDatabaseFromAssetAsync: ((databaseName: string, assetSource: { assetId: number; forceOverwrite?: boolean }, directory?: string) => Promise<void>) | null = null;

if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
  FileSystem = require('expo-file-system');
  Asset = require('expo-asset').Asset;
  // Use expo-sqlite's official native function for importing bundled .db assets
  importDatabaseFromAssetAsync = require('expo-sqlite/build/hooks').importDatabaseFromAssetAsync;
}

// NOTE: bible.db is bundled inside the APK/IPA via Metro (assets/bible.db).
// No internet required for initialization. expo-asset handles the copy.

// ============================================================
// DATABASE VERSION - INCREMENT THIS WHEN bible.db CHANGES
// Version 8 = bundled asset DB (no download required)
// ============================================================
const DB_VERSION = 8;
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
  text_spanish_lbla?: string;
  text_spanish_nbla?: string;
  text_spanish_ntv?: string;
  text_spanish_rva2015?: string;
  text_spanish_rvc?: string;
  text_spanish_tlai?: string;
  text_spanish_vbl?: string;
  text_spanish_bes?: string;
  text_spanish_pddpt?: string;
  text_english_nkjv?: string;
  // Allow dynamic version fields
  [key: string]: any;
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

// On-demand version field mapping - all downloadable versions
const ON_DEMAND_VERSION_FIELDS: Record<string, string> = {
  'nvi': 'text_spanish_nvi',
  'dhh': 'text_spanish_dhh',
  'tla': 'text_spanish_tla',
  'lbla': 'text_spanish_lbla',
  'nbla': 'text_spanish_nbla',
  'ntv': 'text_spanish_ntv',
  'rva2015': 'text_spanish_rva2015',
  'rvc': 'text_spanish_rvc',
  'tlai': 'text_spanish_tlai',
  'vbl': 'text_spanish_vbl',
  'bes': 'text_spanish_bes',
  'pddpt': 'text_spanish_pddpt',
  'nkjv': 'text_english_nkjv',
};

export class DatabaseService {
  private static instance: DatabaseService;
  private db: any = null;
  private static readonly DB_NAME = 'bible.db';
  private initStatus: InitializationStatus = 'pending';
  private initError: Error | null = null;
  private initPromise: Promise<boolean> | null = null;
  private recoveryAttempts: number = 0;
  private availableColumns: Set<string> = new Set();
  private versionManager: any = null; // Lazy loaded to avoid circular deps

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
        console.log('[DatabaseService] Web platform - using API fallback');
        this.initStatus = 'web_fallback';
        return true;
      }

      console.log('[DatabaseService] Native platform - copying DB from bundled assets...');

      const copySuccess = await this.copyDatabaseFromBundledAsset();
      if (!copySuccess) {
        throw new Error('No se pudo copiar la base de datos desde los assets del app.');
      }

      console.log('[DatabaseService] Opening database...');
      this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);

      // Detect available columns in the database
      await this.detectColumns();

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
          throw new Error('Re-copia de base de datos fallida durante recuperación.');
        }

        this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);
        await this.detectColumns();
        const retryValid = await this.validateDatabase();
        if (!retryValid) {
          throw new Error('Database validation failed after recovery attempt');
        }

        this.recoveryAttempts = 0;
      }

      // Initialize VersionManager for on-demand versions
      try {
        const { versionManager } = require('./VersionManager');
        this.versionManager = versionManager;
        await this.versionManager.initialize();
        console.log(`[DatabaseService] VersionManager ready`);
      } catch (e) {
        console.log('[DatabaseService] VersionManager not available, on-demand versions disabled');
      }

      this.initStatus = 'ready';
      console.log('[DatabaseService] Database initialized successfully');
      console.log(`[DatabaseService] Available columns: ${Array.from(this.availableColumns).join(', ')}`);
      return true;
    } catch (error) {
      console.error('[DatabaseService] Initialization failed:', error);
      this.initError = error as Error;
      this.initStatus = 'failed';
      return false;
    }
  }

  // ============================================================
  // COLUMN DETECTION - Handles both slim and full databases
  // ============================================================

  private async detectColumns(): Promise<void> {
    try {
      if (!this.db) return;
      const result = await this.db.getAllAsync('PRAGMA table_info(verses)') as any[];
      this.availableColumns = new Set(result.map((r: any) => r.name));
      console.log(`[DatabaseService] Detected ${this.availableColumns.size} columns in verses table`);
    } catch (error) {
      console.error('[DatabaseService] Error detecting columns:', error);
      // Default to base columns
      this.availableColumns = new Set(['id', 'book_id', 'book_name', 'chapter', 'verse', 'text_tzotzil', 'text_spanish_rv1960']);
    }
  }

  /**
   * Build SELECT clause based on available columns
   */
  private getSelectClause(): string {
    const baseColumns = ['v.id', 'v.book_id', 'v.chapter', 'v.verse', 'v.book_name'];
    // Base text columns + all on-demand version columns
    const textColumns = [
      'text_tzotzil', 'text_spanish_rv1960',
      ...Object.values(ON_DEMAND_VERSION_FIELDS)
    ];
    
    for (const col of textColumns) {
      if (this.availableColumns.has(col)) {
        baseColumns.push(`v.${col}`);
      }
    }
    
    return baseColumns.join(', ');
  }

  // ============================================================
  // DATABASE VERSION CHECK
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

  // ============================================================
  // COPY DB FROM BUNDLED ASSET (no internet, no download)
  // bible.db is included inside the APK/IPA via Metro bundler.
  // expo-asset resolves its local URI and FileSystem copies it.
  // This NEVER fails due to network issues.
  // ============================================================

  private async copyDatabaseFromBundledAsset(): Promise<boolean> {
    if (Platform.OS === 'web') return true;
    try {
      // Check if DB already exists and is valid (skip re-copy if version matches)
      const storedVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
      const currentVersion = storedVersion ? parseInt(storedVersion, 10) : 0;
      const needsUpdate = currentVersion < DB_VERSION;

      if (!needsUpdate) {
        // Verify the existing file is large enough
        const dbDir = `${FileSystem!.documentDirectory}SQLite/`;
        const dbPath = `${dbDir}${DatabaseService.DB_NAME}`;
        const fileInfo = await FileSystem!.getInfoAsync(dbPath);
        if (fileInfo.exists) {
          const sizeMB = ((fileInfo as any).size || 0) / (1024 * 1024);
          if (sizeMB > 5) {
            console.log(`[DatabaseService] DB already exists v${currentVersion} (${sizeMB.toFixed(1)} MB), skipping copy`);
            return true;
          }
          console.log('[DatabaseService] Existing DB too small, will re-import');
        }
      } else {
        console.log(`[DatabaseService] DB version update needed (${currentVersion} to ${DB_VERSION})`);
      }

      // Use expo-sqlite's official native importDatabaseFromAssetAsync
      // This is the CORRECT way for Expo SDK 52 - handles Android asset:// URIs natively
      console.log('[DatabaseService] Importing bible.db from bundled assets via expo-sqlite native API...');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const assetId = require('../../assets/bible.db');
      await importDatabaseFromAssetAsync!(
        DatabaseService.DB_NAME,
        { assetId, forceOverwrite: needsUpdate }
      );

      // Verify the import succeeded
      const dbDir2 = `${FileSystem!.documentDirectory}SQLite/`;
      const dbPath2 = `${dbDir2}${DatabaseService.DB_NAME}`;
      const copiedInfo = await FileSystem!.getInfoAsync(dbPath2);
      const copiedSizeMB = ((copiedInfo as any).size || 0) / (1024 * 1024);
      console.log(`[DatabaseService] DB imported successfully: ${copiedSizeMB.toFixed(1)} MB`);

      if (copiedSizeMB < 5) {
        console.error('[DatabaseService] Imported DB too small - asset may be corrupted in bundle');
        return false;
      }

      await AsyncStorage.setItem(DB_VERSION_KEY, DB_VERSION.toString());
      return true;
    } catch (error) {
      console.error('[DatabaseService] Error importing bundled asset:', error);
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

      await AsyncStorage.setItem(DB_VERSION_KEY, '0');

      console.log('[DatabaseService] All database files cleaned up');

      return await this.copyDatabaseFromBundledAsset();
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
  // DATA ACCESS METHODS - Base versions from DB + on-demand from VersionManager
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

      const selectClause = this.getSelectClause();
      const result = await this.db.getAllAsync(
        `SELECT ${selectClause}
         FROM verses v 
         WHERE v.book_name = ? AND v.chapter = ? 
         ORDER BY v.verse`,
        [bookName, chapter]
      ) as any[];

      console.log(`[DatabaseService] Loaded ${result.length} verses for ${bookName} ${chapter}`);

      // Map results into verse objects
      const verses: BibleVerse[] = result.map((row: any) => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text_spanish_rv1960 || '',
        text_tzotzil: row.text_tzotzil || '',
        text_spanish_rv1960: row.text_spanish_rv1960 || '',
        text_spanish_nvi: row.text_spanish_nvi || '',
        text_spanish_dhh: row.text_spanish_dhh || '',
        text_spanish_tla: row.text_spanish_tla || '',
        text_english_nkjv: row.text_english_nkjv || '',
        book_name: row.book_name
      }));

      // Enrich with downloaded on-demand versions using bulk chapter load.
      // Loading an entire chapter at once (getChapterVerses) is far more
      // efficient than the previous per-verse approach and fixes the fallback bug.
      if (this.versionManager && verses.length > 0) {
        for (const [versionId, fieldName] of Object.entries(ON_DEMAND_VERSION_FIELDS)) {
          if (this.versionManager.isVersionDownloaded(versionId)) {
            const chapterMap: Map<number, string> = await this.versionManager.getChapterVerses(
              versionId, bookName, chapter
            );
            if (chapterMap.size > 0) {
              for (const verse of verses) {
                const text = chapterMap.get(verse.verse);
                if (text && text.trim()) {
                  (verse as any)[fieldName] = text;
                }
              }
              console.log(`[DatabaseService] Enriched ${chapterMap.size} verses with version: ${versionId}`);
            }
          }
        }
      }

      // Log version availability for debugging
      if (verses.length > 0) {
        const sample = verses[0];
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

      return verses;
    } catch (error) {
      console.error('[DatabaseService] getVerses error:', error);
      return [];
    }
  }

  async searchVerses(query: string): Promise<BibleVerse[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const searchTerm = `%${query}%`;
      const selectClause = this.getSelectClause();
      const result = await this.db.getAllAsync(
        `SELECT ${selectClause}
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
        text_tzotzil: row.text_tzotzil || '',
        text_spanish_rv1960: row.text_spanish_rv1960 || '',
        text_spanish_nvi: row.text_spanish_nvi || '',
        text_spanish_dhh: row.text_spanish_dhh || '',
        text_spanish_tla: row.text_spanish_tla || '',
        text_english_nkjv: row.text_english_nkjv || '',
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
      const selectClause = this.getSelectClause();
      const result = await this.db.getFirstAsync(
        `SELECT ${selectClause}
         FROM verses v 
         WHERE v.book_name = ? AND v.chapter = ? AND v.verse = ?`,
        [bookName, chapter, verse]
      ) as any | null;
      if (result) {
        const verseObj: BibleVerse = {
          id: result.id,
          book_id: result.book_id,
          chapter: result.chapter,
          verse: result.verse,
          text: result.text_spanish_rv1960 || '',
          text_tzotzil: result.text_tzotzil || '',
          text_spanish_rv1960: result.text_spanish_rv1960 || '',
          text_spanish_nvi: result.text_spanish_nvi || '',
          text_spanish_dhh: result.text_spanish_dhh || '',
          text_spanish_tla: result.text_spanish_tla || '',
          text_english_nkjv: result.text_english_nkjv || '',
          book_name: result.book_name
        };

        // Enrich with downloaded on-demand versions
        if (this.versionManager) {
          for (const [versionId, fieldName] of Object.entries(ON_DEMAND_VERSION_FIELDS)) {
            const currentValue = (verseObj as any)[fieldName];
            if ((!currentValue || !currentValue.trim()) && this.versionManager.isVersionDownloaded(versionId)) {
              const text = await this.versionManager.getVerseText(
                versionId, bookName, chapter, verse
              );
              if (text) {
                (verseObj as any)[fieldName] = text;
              }
            }
          }
        }

        return verseObj;
      }
      return null;
    } catch (error) {
      console.error('[DatabaseService] getVerse error:', error);
      return null;
    }
  }

  /**
   * Force database update - deletes cached database and re-copies from assets
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
      await this.detectColumns();
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
