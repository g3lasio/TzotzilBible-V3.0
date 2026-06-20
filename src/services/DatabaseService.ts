import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ============================================================
// CONDITIONAL IMPORTS - Only load native modules on native platforms
// This prevents web crashes from undefined native modules
// ============================================================
let SQLite: typeof import('expo-sqlite') | null = null;

if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

// ============================================================
// bible.db is now opened directly by SQLiteProvider in App.tsx
// using assetSource — no manual copy needed.
// DatabaseService.initialize() just calls openDatabaseAsync()
// which connects to the already-prepared database.
// ============================================================

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
  text: string;
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

// All version field mappings — all now bundled in bible.db
const ALL_VERSION_FIELDS: Record<string, string> = {
  'nvi':     'text_spanish_nvi',
  'dhh':     'text_spanish_dhh',
  'tla':     'text_spanish_tla',
  'lbla':    'text_spanish_lbla',
  'nbla':    'text_spanish_nbla',
  'ntv':     'text_spanish_ntv',
  'rva2015': 'text_spanish_rva2015',
  'rvc':     'text_spanish_rvc',
  'tlai':    'text_spanish_tlai',
  'vbl':     'text_spanish_vbl',
  'bes':     'text_spanish_bes',
  'pddpt':   'text_spanish_pddpt',
  'nkjv':    'text_english_nkjv',
};

export class DatabaseService {
  private static instance: DatabaseService;
  private db: any = null;
  private static readonly DB_NAME = 'bible.db';
  private initStatus: InitializationStatus = 'pending';
  private initError: Error | null = null;
  private initPromise: Promise<boolean> | null = null;
  private availableColumns: Set<string> = new Set();

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

      // SQLiteProvider in App.tsx has already copied bible.db from assets
      // via assetSource. We just open the connection here.
      console.log('[DatabaseService] Opening database (prepared by SQLiteProvider)...');
      this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);

      await this.detectColumns();

      const isValid = await this.validateDatabase();
      if (!isValid) {
        throw new Error(
          'La base de datos no pasó la validación. ' +
          'Verifica que bible.db esté correctamente incluido en los assets del APK.'
        );
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
      this.availableColumns = new Set([
        'id', 'book_id', 'book_name', 'chapter', 'verse',
        'text_tzotzil', 'text_spanish_rv1960'
      ]);
    }
  }

  /**
   * Build SELECT clause based on available columns
   */
  private getSelectClause(): string {
    const baseColumns = ['v.id', 'v.book_id', 'v.chapter', 'v.verse', 'v.book_name'];
    const textColumns = [
      'text_tzotzil', 'text_spanish_rv1960',
      ...Object.values(ALL_VERSION_FIELDS)
    ];
    for (const col of textColumns) {
      if (this.availableColumns.has(col)) {
        baseColumns.push(`v.${col}`);
      }
    }
    return baseColumns.join(', ');
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

      const verses: BibleVerse[] = result.map((row: any) => {
        const verse: BibleVerse = {
          id: row.id,
          book_id: row.book_id,
          chapter: row.chapter,
          verse: row.verse,
          text: row.text_spanish_rv1960 || '',
          text_tzotzil: row.text_tzotzil || '',
          text_spanish_rv1960: row.text_spanish_rv1960 || '',
          book_name: row.book_name
        };
        // Add all bundled version fields
        for (const fieldName of Object.values(ALL_VERSION_FIELDS)) {
          if (this.availableColumns.has(fieldName)) {
            verse[fieldName] = row[fieldName] || '';
          }
        }
        return verse;
      });

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
      return result.map((row: any) => {
        const verse: BibleVerse = {
          id: row.id,
          book_id: row.book_id,
          chapter: row.chapter,
          verse: row.verse,
          text: row.text_spanish_rv1960 || '',
          text_tzotzil: row.text_tzotzil || '',
          text_spanish_rv1960: row.text_spanish_rv1960 || '',
          book_name: row.book_name
        };
        for (const fieldName of Object.values(ALL_VERSION_FIELDS)) {
          if (this.availableColumns.has(fieldName)) {
            verse[fieldName] = row[fieldName] || '';
          }
        }
        return verse;
      });
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
          book_name: result.book_name
        };
        for (const fieldName of Object.values(ALL_VERSION_FIELDS)) {
          if (this.availableColumns.has(fieldName)) {
            verseObj[fieldName] = result[fieldName] || '';
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
    // With SQLiteProvider, there is nothing to force-update manually.
    // The database is always the bundled version from the APK.
    console.log('[DatabaseService] forceUpdate: no-op (database is bundled in APK)');
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
