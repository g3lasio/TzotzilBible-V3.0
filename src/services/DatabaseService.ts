import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';

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

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;
  private initStatus: 'idle' | 'initializing' | 'ready' | 'error' = 'idle';
  private initPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.initStatus === 'ready') {
      console.log('[DatabaseService] Already initialized');
      return;
    }

    if (this.initStatus === 'initializing') {
      console.log('[DatabaseService] Already initializing, waiting...');
      if (this.initPromise) {
        await this.initPromise;
      }
      return;
    }

    this.initStatus = 'initializing';
    console.log('[DatabaseService] Starting initialization...');

    this.initPromise = this.performInitialization();
    await this.initPromise;
  }

  private async performInitialization(): Promise<void> {
    try {
      const dbName = 'bible.db';
      
      if (Platform.OS === 'web') {
        // Web platform: expo-sqlite uses IndexedDB, no file copying needed
        console.log('[DatabaseService] Web platform detected, opening database directly...');
        
        // For web, we need to load the database from the asset
        const asset = Asset.fromModule(require('../../assets/bible.db'));
        await asset.downloadAsync();
        
        if (!asset.localUri) {
          throw new Error('Failed to load database asset');
        }
        
        console.log(`[DatabaseService] Loading database from ${asset.localUri}`);
        
        // Fetch the database file
        const response = await fetch(asset.localUri);
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        // Open database with the binary data
        this.db = await SQLite.openDatabaseAsync(dbName, {
          useNewConnection: true,
        });
        
        // For web, we need to import the database
        // @ts-ignore - web-specific method
        if (this.db.importDatabaseAsync) {
          // @ts-ignore
          await this.db.importDatabaseAsync(uint8Array);
        }
        
      } else {
        // Native platforms (iOS/Android): use file system
        const dbPath = `${FileSystem.documentDirectory}SQLite/${dbName}`;
        
        console.log(`[DatabaseService] Checking database at: ${dbPath}`);
        
        const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`);
        if (!dirInfo.exists) {
          console.log('[DatabaseService] Creating SQLite directory...');
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, { intermediates: true });
        }

        const fileInfo = await FileSystem.getInfoAsync(dbPath);
        
        if (!fileInfo.exists) {
          console.log('[DatabaseService] Database not found, copying from assets...');
          const asset = Asset.fromModule(require('../../assets/bible.db'));
          await asset.downloadAsync();
          
          if (!asset.localUri) {
            throw new Error('Failed to load database asset');
          }
          
          console.log(`[DatabaseService] Copying from ${asset.localUri} to ${dbPath}`);
          await FileSystem.copyAsync({
            from: asset.localUri,
            to: dbPath,
          });
          console.log('[DatabaseService] Database copied successfully');
        } else {
          console.log('[DatabaseService] Database already exists');
        }

        console.log('[DatabaseService] Opening database...');
        this.db = await SQLite.openDatabaseAsync(dbName);
      }
      
      console.log('[DatabaseService] Testing database connection...');
      const testResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM books') as { count: number };
      console.log(`[DatabaseService] Database test successful. Books count: ${testResult.count}`);
      
      this.initStatus = 'ready';
      console.log('[DatabaseService] Initialization complete');
    } catch (error) {
      console.error('[DatabaseService] Initialization failed:', error);
      this.initStatus = 'error';
      throw error;
    }
  }

  async getBooks(): Promise<BibleBook[]> {
    try {
      if (!this.db || this.initStatus !== 'ready') {
        console.log('[DatabaseService] getBooks: Database not ready');
        return [];
      }
      
      const result = await this.db.getAllAsync(
        'SELECT id, name, book_number, testament, chapters_count FROM books ORDER BY book_number'
      ) as BibleBook[];
      
      console.log(`[DatabaseService] Loaded ${result.length} books`);
      return result;
    } catch (error) {
      console.error('[DatabaseService] getBooks error:', error);
      return [];
    }
  }

  async getBookById(bookId: number): Promise<BibleBook | null> {
    try {
      if (!this.db || this.initStatus !== 'ready') return null;
      const result = await this.db.getFirstAsync(
        'SELECT id, name, book_number, testament, chapters_count FROM books WHERE id = ?',
        [bookId]
      ) as BibleBook | null;
      return result;
    } catch (error) {
      console.error('[DatabaseService] getBookById error:', error);
      return null;
    }
  }

  async getBookByName(bookName: string): Promise<BibleBook | null> {
    try {
      if (!this.db || this.initStatus !== 'ready') return null;
      const result = await this.db.getFirstAsync(
        'SELECT id, name, book_number, testament, chapters_count FROM books WHERE name = ?',
        [bookName]
      ) as BibleBook | null;
      return result;
    } catch (error) {
      console.error('[DatabaseService] getBookByName error:', error);
      return null;
    }
  }

  async getChapterCount(bookName: string): Promise<number> {
    try {
      if (!this.db || this.initStatus !== 'ready') return 0;
      const result = await this.db.getFirstAsync(
        'SELECT chapters_count FROM books WHERE name = ?',
        [bookName]
      ) as { chapters_count: number } | null;
      return result?.chapters_count || 0;
    } catch (error) {
      console.error('[DatabaseService] getChapterCount error:', error);
      return 0;
    }
  }

  async getVerseCount(bookName: string, chapter: number): Promise<number> {
    try {
      if (!this.db || this.initStatus !== 'ready') return 0;
      const result = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM verses WHERE book_name = ? AND chapter = ?',
        [bookName, chapter]
      ) as { count: number } | null;
      return result?.count || 0;
    } catch (error) {
      console.error('[DatabaseService] getVerseCount error:', error);
      return 0;
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
      
      return result.map((row: any) => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
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
         WHERE v.text_tzotzil LIKE ?
         ORDER BY v.book_id, v.chapter, v.verse
         LIMIT 100`,
        [searchTerm]
      ) as any[];
      return result.map((row: any) => ({
        id: row.id,
        book_id: row.book_id,
        chapter: row.chapter,
        verse: row.verse,
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

  async close(): Promise<void> {
    if (this.db) {
      await this.db.closeAsync();
      this.db = null;
      this.initStatus = 'idle';
      console.log('[DatabaseService] Database closed');
    }
  }

  getStatus(): 'idle' | 'initializing' | 'ready' | 'error' {
    return this.initStatus;
  }
}

export default new DatabaseService();
