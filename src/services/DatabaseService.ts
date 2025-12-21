import { Platform } from 'react-native';
import { BibleVerse, Book, Chapter } from '../types/bible';

let SQLite: typeof import('expo-sqlite') | null = null;
let FileSystem: typeof import('expo-file-system/legacy') | null = null;
let Asset: typeof import('expo-asset').Asset | null = null;

if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
  FileSystem = require('expo-file-system/legacy');
  Asset = require('expo-asset').Asset;
}

export interface PromiseEntry {
  id: number;
  text: string;
  image_url: string;
}

export type InitializationStatus = 'pending' | 'initializing' | 'ready' | 'web_fallback' | 'failed';

const EXPECTED_BOOKS_COUNT = 66;
const EXPECTED_VERSES_MIN = 31000;

export class DatabaseService {
  private static instance: DatabaseService;
  private db: any = null;
  private static readonly DB_NAME = 'bible.db';
  private initStatus: InitializationStatus = 'pending';
  private initError: Error | null = null;
  private initPromise: Promise<boolean> | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

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
      
      const copySuccess = await this.copyDatabaseFromAssets();
      if (!copySuccess) {
        throw new Error('Failed to copy database from assets');
      }

      console.log('[DatabaseService] Opening database...');
      this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);
      
      const isValid = await this.validateDatabase();
      if (!isValid) {
        console.log('[DatabaseService] Database validation failed, attempting recovery...');
        await this.forceRecopyDatabase();
        this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);
        const retryValid = await this.validateDatabase();
        if (!retryValid) {
          throw new Error('Database validation failed after recovery attempt');
        }
      }
      
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
      if (fileInfo.exists) {
        const fileSizeMB = ((fileInfo as any).size || 0) / (1024 * 1024);
        console.log(`[DatabaseService] Existing database found: ${fileSizeMB.toFixed(2)} MB`);
        if (fileSizeMB > 15) {
          console.log('[DatabaseService] Database size looks valid, skipping copy');
          return true;
        }
        console.log('[DatabaseService] Database too small, will recopy');
        await FileSystem!.deleteAsync(dbPath, { idempotent: true });
      }

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
      
      if (this.db) {
        console.log('[DatabaseService] Closing database before recopy...');
        try {
          await this.db.closeAsync();
        } catch (e) {
          console.log('[DatabaseService] Could not close database:', e);
        }
        this.db = null;
      }
      
      console.log('[DatabaseService] Force recopy - deleting existing database...');
      await FileSystem!.deleteAsync(dbPath, { idempotent: true });
      
      return await this.copyDatabaseFromAssets();
    } catch (error) {
      console.error('[DatabaseService] Force recopy failed:', error);
      return false;
    }
  }

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

  async getBooks(): Promise<Book[]> {
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
      })) as Book[];
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
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text_spanish as text, v.text_tzotzil, v.book_name
         FROM verses v 
         WHERE v.book_name = ? AND v.chapter = ? 
         ORDER BY v.verse`,
        [bookName, chapter]
      ) as any[];
      
      console.log(`[DatabaseService] Loaded ${result.length} verses for ${bookName} ${chapter}`);
      
      return result.map((row: any) => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text,
        text_tzotzil: row.text_tzotzil,
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
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text_spanish as text, v.text_tzotzil, v.book_name
         FROM verses v 
         WHERE v.text_spanish LIKE ? OR v.text_tzotzil LIKE ?
         ORDER BY v.book_id, v.chapter, v.verse
         LIMIT 100`,
        [searchTerm, searchTerm]
      ) as any[];
      return result.map((row: any) => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text,
        text_tzotzil: row.text_tzotzil,
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
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text_spanish as text, v.text_tzotzil, v.book_name
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
          text: result.text,
          text_tzotzil: result.text_tzotzil,
          book_name: result.book_name
        };
      }
      return null;
    } catch (error) {
      console.error('[DatabaseService] getVerse error:', error);
      return null;
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

export const databaseService = DatabaseService.getInstance();
export default DatabaseService;
