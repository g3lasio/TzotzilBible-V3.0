import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// CONDITIONAL IMPORTS - Only load native modules on native platforms
// This prevents web crashes from undefined native modules
// ============================================================
let SQLite: typeof import('expo-sqlite') | null = null;
let FileSystem: typeof import('expo-file-system') | null = null;

if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
  FileSystem = require('expo-file-system');
}

// Remote URL for initial bible data (JSON) — served from Replit backend.
// This endpoint returns a JSON object with { books: [...], verses: [...] }
// which is used to create and populate the SQLite database on the device.
// This approach is 100% reliable on iOS because it avoids all file-copy/asset
// bundling issues: we create the DB schema ourselves and insert data via SQL.
const INITIAL_DATA_URL = 'https://tzotzil.replit.app/api/database/initial-data';

// ============================================================
// DATABASE VERSION - INCREMENT THIS WHEN bible.db DATA CHANGES
// ============================================================
const DB_VERSION = 8; // Bumped to 8 for new on-device generation strategy
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
  private static readonly DB_NAME = 'bible_v8.db'; // New name to avoid conflicts with old file
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
  // PUBLIC API
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

      console.log('[DatabaseService] Native platform - initializing SQLite...');

      // Step 1: Ensure the database file exists and is up to date.
      // This creates the DB schema and populates it from JSON if needed.
      const dbReady = await this.ensureDatabaseReady();
      if (!dbReady) {
        throw new Error('Database initialization failed: Could not create or verify database.');
      }

      // Step 2: Open the database connection.
      console.log('[DatabaseService] Opening database connection...');
      this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);

      // Step 3: Detect available columns.
      await this.detectColumns();

      // Step 4: Validate the database has the expected data.
      const isValid = await this.validateDatabase();
      if (!isValid) {
        console.log('[DatabaseService] Database validation failed, attempting recovery...');

        if (this.recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
          throw new Error(`Database recovery failed after ${MAX_RECOVERY_ATTEMPTS} attempts. Please reinstall the app.`);
        }

        this.recoveryAttempts++;
        console.log(`[DatabaseService] Recovery attempt ${this.recoveryAttempts}/${MAX_RECOVERY_ATTEMPTS}`);

        const recoverSuccess = await this.forceRecreateDatabase();
        if (!recoverSuccess) {
          throw new Error('Failed to recreate database during recovery');
        }

        this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);
        await this.detectColumns();
        const retryValid = await this.validateDatabase();
        if (!retryValid) {
          throw new Error('Database validation failed after recovery attempt');
        }

        this.recoveryAttempts = 0;
      }

      // Step 5: Initialize VersionManager for on-demand versions.
      try {
        const { versionManager } = require('./VersionManager');
        this.versionManager = versionManager;
        await this.versionManager.initialize();
        console.log('[DatabaseService] VersionManager ready');
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
  // CORE: ON-DEVICE DATABASE CREATION
  // Creates the SQLite DB schema and populates it from a JSON
  // endpoint. No binary file copy or asset bundling required.
  // ============================================================

  /**
   * Ensures the database file exists and is populated.
   * If the DB is missing or outdated, it is created from scratch.
   */
  private async ensureDatabaseReady(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    try {
      const dbDir = `${FileSystem!.documentDirectory}SQLite/`;
      const dbPath = `${dbDir}${DatabaseService.DB_NAME}`;

      console.log(`[DatabaseService] Checking for database at: ${dbPath}`);

      // Ensure the SQLite directory exists.
      const dirInfo = await FileSystem!.getInfoAsync(dbDir);
      if (!dirInfo.exists) {
        console.log('[DatabaseService] Creating SQLite directory...');
        await FileSystem!.makeDirectoryAsync(dbDir, { intermediates: true });
      }

      const fileInfo = await FileSystem!.getInfoAsync(dbPath);
      const needsUpdate = await this.needsDatabaseUpdate();

      // If the file exists and is up to date, we are done.
      if (fileInfo.exists && !needsUpdate) {
        console.log('[DatabaseService] Database exists and is up to date. Skipping creation.');
        return true;
      }

      // If the file exists but is outdated, delete it.
      if (fileInfo.exists) {
        console.log('[DatabaseService] Database is outdated. Deleting for recreation.');
        if (this.db) {
          try { await this.db.closeAsync(); } catch (e) {}
          this.db = null;
        }
        await FileSystem!.deleteAsync(dbPath, { idempotent: true });
      }

      // Create a new empty database and populate it from the server.
      return await this.createAndPopulateDatabase();

    } catch (error) {
      console.error('[DatabaseService] ensureDatabaseReady failed:', error);
      return false;
    }
  }

  /**
   * Creates a new SQLite database, creates the schema, downloads
   * the initial data from the server, and populates the tables.
   */
  private async createAndPopulateDatabase(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    let tempDb: any = null;
    try {
      console.log('[DatabaseService] Creating new empty SQLite database...');
      tempDb = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);

      console.log('[DatabaseService] Creating database schema...');
      await this.createSchema(tempDb);

      console.log('[DatabaseService] Downloading initial data from server...');
      const initialData = await this.fetchInitialData();
      if (!initialData || !initialData.books || !initialData.verses) {
        throw new Error('Invalid or missing initial data from server.');
      }
      console.log(`[DatabaseService] Received ${initialData.books.length} books and ${initialData.verses.length} verses.`);

      console.log('[DatabaseService] Populating database...');
      await this.populateDatabase(tempDb, initialData);

      await tempDb.closeAsync();
      tempDb = null;

      await this.saveDatabaseVersion();
      console.log('[DatabaseService] Database created and populated successfully.');
      return true;

    } catch (error) {
      console.error('[DatabaseService] createAndPopulateDatabase failed:', error);
      if (tempDb) {
        try { await tempDb.closeAsync(); } catch (e) {}
      }
      // Clean up the partially created database file.
      try {
        const dbPath = `${FileSystem!.documentDirectory}SQLite/${DatabaseService.DB_NAME}`;
        await FileSystem!.deleteAsync(dbPath, { idempotent: true });
        console.log('[DatabaseService] Cleaned up partially created database.');
      } catch (cleanupError) {
        console.error('[DatabaseService] Failed to clean up partial database:', cleanupError);
      }
      return false;
    }
  }

  /**
   * Creates the database schema (tables and indexes).
   */
  private async createSchema(db: any): Promise<void> {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        book_number INTEGER NOT NULL,
        testament TEXT NOT NULL,
        chapters_count INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        book_id INTEGER NOT NULL,
        book_name TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        text_tzotzil TEXT,
        text_spanish_rv1960 TEXT,
        FOREIGN KEY (book_id) REFERENCES books (id)
      );

      CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses (book_name, chapter);
    `);
    console.log('[DatabaseService] Schema created successfully.');
  }

  /**
   * Downloads the initial data JSON from the server.
   */
  private async fetchInitialData(): Promise<{ books: any[]; verses: any[] } | null> {
    try {
      console.log(`[DatabaseService] Fetching initial data from: ${INITIAL_DATA_URL}`);
      const response = await fetch(INITIAL_DATA_URL);
      if (!response.ok) {
        throw new Error(`Server responded with HTTP ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[DatabaseService] fetchInitialData failed:', error);
      return null;
    }
  }

  /**
   * Inserts books and verses into the database using batch transactions.
   */
  private async populateDatabase(db: any, data: { books: any[]; verses: any[] }): Promise<void> {
    // Insert books
    console.log(`[DatabaseService] Inserting ${data.books.length} books...`);
    await db.withTransactionAsync(async () => {
      for (const book of data.books) {
        await db.runAsync(
          'INSERT INTO books (id, name, book_number, testament, chapters_count) VALUES (?, ?, ?, ?, ?)',
          [book.id, book.name, book.book_number, book.testament, book.chapters_count]
        );
      }
    });

    // Insert verses in batches to avoid memory issues
    const BATCH_SIZE = 1000;
    const totalVerses = data.verses.length;
    console.log(`[DatabaseService] Inserting ${totalVerses} verses in batches of ${BATCH_SIZE}...`);

    for (let i = 0; i < totalVerses; i += BATCH_SIZE) {
      const batch = data.verses.slice(i, i + BATCH_SIZE);
      await db.withTransactionAsync(async () => {
        for (const verse of batch) {
          await db.runAsync(
            'INSERT INTO verses (book_id, book_name, chapter, verse, text_tzotzil, text_spanish_rv1960) VALUES (?, ?, ?, ?, ?, ?)',
            [verse.book_id, verse.book_name, verse.chapter, verse.verse, verse.text_tzotzil ?? null, verse.text_spanish_rv1960 ?? null]
          );
        }
      });
      console.log(`[DatabaseService] Inserted verses ${i + 1} - ${Math.min(i + BATCH_SIZE, totalVerses)} / ${totalVerses}`);
    }

    console.log('[DatabaseService] Database population complete.');
  }

  /**
   * Deletes the database file and re-creates it from scratch.
   */
  private async forceRecreateDatabase(): Promise<boolean> {
    if (Platform.OS === 'web') return true;

    try {
      const dbPath = `${FileSystem!.documentDirectory}SQLite/${DatabaseService.DB_NAME}`;
      console.log('[DatabaseService] Force recreation - deleting database file...');

      if (this.db) {
        try { await this.db.closeAsync(); } catch (e) {}
        this.db = null;
      }

      await FileSystem!.deleteAsync(dbPath, { idempotent: true });
      await AsyncStorage.setItem(DB_VERSION_KEY, '0');

      console.log('[DatabaseService] Database deleted. Re-creating from source...');
      return await this.createAndPopulateDatabase();
    } catch (error) {
      console.error('[DatabaseService] forceRecreateDatabase failed:', error);
      return false;
    }
  }

  // ============================================================
  // COLUMN DETECTION
  // ============================================================

  private async detectColumns(): Promise<void> {
    try {
      if (!this.db) return;
      const result = await this.db.getAllAsync('PRAGMA table_info(verses)') as any[];
      this.availableColumns = new Set(result.map((r: any) => r.name));
      console.log(`[DatabaseService] Detected ${this.availableColumns.size} columns in verses table`);
    } catch (error) {
      console.error('[DatabaseService] Error detecting columns:', error);
      this.availableColumns = new Set(['id', 'book_id', 'book_name', 'chapter', 'verse', 'text_tzotzil', 'text_spanish_rv1960']);
    }
  }

  private getSelectClause(): string {
    const baseColumns = ['v.id', 'v.book_id', 'v.chapter', 'v.verse', 'v.book_name'];
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
      return currentVersion < DB_VERSION;
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
  // DATA ACCESS METHODS
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

      // Enrich with downloaded on-demand versions
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
            }
          }
        }
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

        if (this.versionManager) {
          for (const [versionId, fieldName] of Object.entries(ON_DEMAND_VERSION_FIELDS)) {
            const currentValue = (verseObj as any)[fieldName];
            if ((!currentValue || !currentValue.trim()) && this.versionManager.isVersionDownloaded(versionId)) {
              const text = await this.versionManager.getVerseText(versionId, bookName, chapter, verse);
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

  async forceUpdate(): Promise<void> {
    console.log('[DatabaseService] FORCE UPDATE requested');

    if (Platform.OS === 'web') {
      this.initStatus = 'pending';
      this.initPromise = null;
      await this.initDatabase();
      return;
    }

    try {
      const success = await this.forceRecreateDatabase();
      if (!success) {
        throw new Error('Force recreation failed');
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
