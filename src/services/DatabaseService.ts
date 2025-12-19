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

export class DatabaseService {
  private static instance: DatabaseService;
  private db: any = null;
  private static readonly DB_NAME = 'bible.db';
  private initStatus: InitializationStatus = 'pending';
  private initError: Error | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initDatabase(): Promise<boolean> {
    const currentStatus = this.initStatus;
    if (currentStatus === 'ready' || currentStatus === 'web_fallback') {
      return true;
    }
    if (currentStatus === 'initializing') {
      await this.waitForInitialization();
      const finalStatus = this.initStatus;
      return finalStatus === 'ready' || finalStatus === 'web_fallback';
    }
    return this.initialize();
  }

  private async waitForInitialization(): Promise<void> {
    while (this.initStatus === 'initializing') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async initialize(): Promise<boolean> {
    const currentStatus = this.initStatus;
    if (currentStatus === 'initializing') {
      await this.waitForInitialization();
      const finalStatus = this.initStatus;
      return finalStatus === 'ready' || finalStatus === 'web_fallback';
    }

    this.initStatus = 'initializing';
    
    try {
      if (Platform.OS === 'web') {
        console.log('SQLite not available on web, using API fallback');
        this.initStatus = 'web_fallback';
        return true;
      }

      await this.copyDatabaseFromAssets();
      this.db = await SQLite!.openDatabaseAsync(DatabaseService.DB_NAME);
      
      const testResult = await this.db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM books'
      );
      
      if (!testResult || testResult.count === 0) {
        throw new Error('Database validation failed: no books found');
      }
      
      this.initStatus = 'ready';
      console.log(`Database initialized successfully with ${testResult.count} books`);
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      this.initError = error as Error;
      this.initStatus = 'failed';
      return false;
    }
  }

  private async copyDatabaseFromAssets(): Promise<void> {
    if (Platform.OS === 'web') return;

    const dbDir = `${FileSystem!.documentDirectory}SQLite/`;
    const dbPath = `${dbDir}${DatabaseService.DB_NAME}`;
    
    const dirInfo = await FileSystem!.getInfoAsync(dbDir);
    if (!dirInfo.exists) {
      await FileSystem!.makeDirectoryAsync(dbDir, { intermediates: true });
    }

    const fileInfo = await FileSystem!.getInfoAsync(dbPath);
    if (!fileInfo.exists) {
      try {
        const asset = Asset!.fromModule(require('../../assets/bible.db'));
        await asset.downloadAsync();
        
        if (asset.localUri) {
          await FileSystem!.copyAsync({
            from: asset.localUri,
            to: dbPath
          });
          console.log('Database copied from assets successfully');
        } else {
          throw new Error('Asset localUri is null after download');
        }
      } catch (error) {
        console.error('Error copying database from assets:', error);
        throw error;
      }
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
        console.log('Database not ready for getBooks');
        return [];
      }
      const result = await this.db.getAllAsync<any>(
        'SELECT id, name, book_number, testament, chapters_count FROM books ORDER BY book_number'
      );
      return result.map(row => ({
        id: row.id,
        name: row.name,
        book_number: row.book_number,
        testament: row.testament,
        chapters: row.chapters_count
      })) as Book[];
    } catch (error) {
      console.error('Error getting books:', error);
      return [];
    }
  }

  async getChaptersCount(bookName: string): Promise<number[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const result = await this.db.getFirstAsync<{ chapters_count: number }>(
        'SELECT chapters_count FROM books WHERE name = ?',
        [bookName]
      );
      if (result) {
        return Array.from({ length: result.chapters_count }, (_, i) => i + 1);
      }
      return [];
    } catch (error) {
      console.error('Error getting chapters count:', error);
      return [];
    }
  }

  async getVerses(bookName: string, chapter: number): Promise<BibleVerse[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const result = await this.db.getAllAsync<any>(
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text_spanish as text, v.text_tzotzil, v.book_name
         FROM verses v 
         WHERE v.book_name = ? AND v.chapter = ? 
         ORDER BY v.verse`,
        [bookName, chapter]
      );
      return result.map(row => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text,
        text_tzotzil: row.text_tzotzil,
        book_name: row.book_name
      }));
    } catch (error) {
      console.error('Error getting verses:', error);
      return [];
    }
  }

  async searchVerses(query: string): Promise<BibleVerse[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const searchTerm = `%${query}%`;
      const result = await this.db.getAllAsync<any>(
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text_spanish as text, v.text_tzotzil, v.book_name
         FROM verses v 
         WHERE v.text_spanish LIKE ? OR v.text_tzotzil LIKE ?
         ORDER BY v.book_id, v.chapter, v.verse
         LIMIT 100`,
        [searchTerm, searchTerm]
      );
      return result.map(row => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
        text: row.text,
        text_tzotzil: row.text_tzotzil,
        book_name: row.book_name
      }));
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  async getRandomPromise(): Promise<PromiseEntry | null> {
    try {
      if (!this.db || this.initStatus !== 'ready') return null;
      const result = await this.db.getFirstAsync<PromiseEntry>(
        'SELECT id, text, image_url FROM promises ORDER BY RANDOM() LIMIT 1'
      );
      return result;
    } catch (error) {
      console.error('Error getting random promise:', error);
      return null;
    }
  }

  async getAllPromises(): Promise<PromiseEntry[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') return [];
      const result = await this.db.getAllAsync<PromiseEntry>(
        'SELECT id, text, image_url FROM promises'
      );
      return result;
    } catch (error) {
      console.error('Error getting all promises:', error);
      return [];
    }
  }

  async getVerse(bookName: string, chapter: number, verse: number): Promise<BibleVerse | null> {
    try {
      if (!this.db || this.initStatus !== 'ready') return null;
      const result = await this.db.getFirstAsync<any>(
        `SELECT v.id, v.book_id, v.chapter, v.verse, v.text_spanish as text, v.text_tzotzil, v.book_name
         FROM verses v 
         WHERE v.book_name = ? AND v.chapter = ? AND v.verse = ?`,
        [bookName, chapter, verse]
      );
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
      console.error('Error getting verse:', error);
      return null;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
        this.initStatus = 'pending';
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export default DatabaseService;
