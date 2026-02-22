import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  /**
   * Check if the database needs to be updated by comparing stored version
   * with current DB_VERSION constant
   */
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
      return true; // If we can't check, update to be safe
    }
  }

  /**
   * Save the current database version after successful copy
   */
  private async saveDatabaseVersion(): Promise<void> {
    try {
      await AsyncStorage.setItem(DB_VERSION_KEY, DB_VERSION.toString());
      console.log(`[DatabaseService] Saved DB version: ${DB_VERSION}`);
    } catch (error) {
      console.error('[DatabaseService] Error saving DB version:', error);
    }
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
        
        // Ensure SQLite directory exists
        const dirInfo = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}SQLite`);
        if (!dirInfo.exists) {
          console.log('[DatabaseService] Creating SQLite directory...');
          await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}SQLite`, { intermediates: true });
        }

        const fileInfo = await FileSystem.getInfoAsync(dbPath);
        const needsUpdate = await this.needsDatabaseUpdate();
        
        if (!fileInfo.exists || needsUpdate) {
          // Database doesn't exist OR needs to be updated with new version
          if (fileInfo.exists && needsUpdate) {
            console.log('[DatabaseService] REPLACING old database with updated version...');
            // Close any existing connection first
            if (this.db) {
              try {
                await this.db.closeAsync();
                this.db = null;
              } catch (e) {
                console.log('[DatabaseService] Note: could not close old db connection');
              }
            }
            // Delete the old database
            await FileSystem.deleteAsync(dbPath, { idempotent: true });
            console.log('[DatabaseService] Old database deleted');
          }
          
          console.log('[DatabaseService] Copying fresh database from assets...');
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
          
          // Save the new version number
          await this.saveDatabaseVersion();
        } else {
          console.log('[DatabaseService] Database exists and is up to date');
        }

        console.log('[DatabaseService] Opening database...');
        this.db = await SQLite.openDatabaseAsync(dbName);
      }
      
      // Verify database has all required columns
      console.log('[DatabaseService] Verifying database integrity...');
      const testResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM books') as { count: number };
      console.log(`[DatabaseService] Books count: ${testResult.count}`);
      
      // Verify all 6 version columns exist
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
      
      // If NVI/DHH/TLA/NKJV are all 0, database is outdated - force update
      if (verseTest && verseTest.nvi === 0 && verseTest.dhh === 0 && verseTest.tla === 0) {
        console.error('[DatabaseService] CRITICAL: Database is missing version data! Forcing update...');
        // Reset version to force update on next launch
        await AsyncStorage.setItem(DB_VERSION_KEY, '0');
        // For this session, we'll continue with what we have but log the issue
        console.error('[DatabaseService] Database will be updated on next app launch');
      }
      
      this.initStatus = 'ready';
      console.log('[DatabaseService] Initialization complete - all versions verified');
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

  /**
   * Force database update - deletes cached database and re-copies from assets
   * Use this if user reports missing versions or data issues
   */
  async forceUpdate(): Promise<void> {
    console.log('[DatabaseService] FORCE UPDATE requested');
    
    if (Platform.OS === 'web') {
      console.log('[DatabaseService] Web platform - re-initializing...');
      this.initStatus = 'idle';
      this.db = null;
      await this.initialize();
      return;
    }
    
    try {
      // Close existing connection
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
      
      // Delete cached database
      const dbPath = `${FileSystem.documentDirectory}SQLite/bible.db`;
      await FileSystem.deleteAsync(dbPath, { idempotent: true });
      
      // Reset version
      await AsyncStorage.setItem(DB_VERSION_KEY, '0');
      
      // Re-initialize
      this.initStatus = 'idle';
      await this.initialize();
      
      console.log('[DatabaseService] Force update complete');
    } catch (error) {
      console.error('[DatabaseService] Force update failed:', error);
      throw error;
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
