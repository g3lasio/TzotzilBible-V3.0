import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { BibleVerse, Book, Chapter } from '../types/bible';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;
  private static readonly DB_NAME = 'bible.db';

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initDatabase(): Promise<boolean> {
    return this.initialize();
  }

  async initialize(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        console.log('SQLite not available on web, using API only');
        return true;
      }
      await this.copyDatabaseFile();
      this.db = await SQLite.openDatabaseAsync(DatabaseService.DB_NAME);
      return true;
    } catch (error) {
      console.error('Error initializing database:', error);
      return false;
    }
  }

  private async copyDatabaseFile(): Promise<void> {
    if (Platform.OS === 'web') return;

    const dbPath = `${FileSystem.documentDirectory}SQLite/${DatabaseService.DB_NAME}`;
    const fileExists = await FileSystem.getInfoAsync(dbPath);

    if (!fileExists.exists) {
      try {
        await FileSystem.makeDirectoryAsync(
          `${FileSystem.documentDirectory}SQLite`,
          { intermediates: true }
        );
        console.log('Creando base de datos SQLite local para caché...');
      } catch (error) {
        console.error('Error copying database:', error);
        throw error;
      }
    }
  }

  async getBooks(): Promise<Book[]> {
    try {
      if (!this.db) return [];
      const resultSet = await this.db.getAllAsync(
        'SELECT * FROM books ORDER BY book_number'
      );
      return resultSet as Book[];
    } catch (error) {
      console.error('Error getting books:', error);
      return [];
    }
  }

  async getChapters(bookId: number): Promise<Chapter[]> {
    try {
      if (!this.db) return [];
      const resultSet = await this.db.getAllAsync(
        'SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number',
        [bookId]
      );
      return resultSet as Chapter[];
    } catch (error) {
      console.error('Error getting chapters:', error);
      return [];
    }
  }

  async getVerses(bookId: number, chapterNumber: number): Promise<BibleVerse[]> {
    try {
      if (!this.db) return [];
      const resultSet = await this.db.getAllAsync(
        'SELECT * FROM verses WHERE book_id = ? AND chapter = ? ORDER BY verse',
        [bookId, chapterNumber]
      );
      return resultSet as BibleVerse[];
    } catch (error) {
      console.error('Error getting verses:', error);
      return [];
    }
  }

  async searchVerses(query: string): Promise<BibleVerse[]> {
    try {
      if (!this.db) return [];
      const resultSet = await this.db.getAllAsync(
        `SELECT v.*, b.name as book_name 
         FROM verses v 
         JOIN books b ON v.book_id = b.id 
         WHERE v.text LIKE ? OR v.text_tzotzil LIKE ?
         LIMIT 100`,
        [`%${query}%`, `%${query}%`]
      );
      return resultSet as BibleVerse[];
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  async close(): Promise<void> {
    try {
      if (this.db) {
        await this.db.closeAsync();
        this.db = null;
      }
    } catch (error) {
      console.error('Error closing database:', error);
    }
  }
}

export const databaseService = DatabaseService.getInstance();
export default DatabaseService;
