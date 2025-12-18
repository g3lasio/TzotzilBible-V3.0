import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { databaseService } from './DatabaseService';
import { WebBibleService } from './WebBibleService';
import { BibleVerse, Book } from '../types/bible';
import bibleBooks from '../../assets/bible_books.json';

const OFFLINE_PROMISES = [
  "Juan 3:16 - Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
  "Salmos 23:1 - El Señor es mi pastor; nada me faltará.",
  "Isaías 41:10 - No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.",
  "Filipenses 4:13 - Todo lo puedo en Cristo que me fortalece.",
  "Jeremías 29:11 - Porque yo sé los planes que tengo para vosotros, planes de bienestar y no de calamidad.",
  "Romanos 8:28 - Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien.",
  "Mateo 11:28 - Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
  "Josué 1:9 - Mira que te mando que te esfuerces y seas valiente; no temas ni desmayes.",
  "Proverbios 3:5-6 - Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia.",
  "Juan 14:27 - La paz os dejo, mi paz os doy; yo no os la doy como el mundo la da."
];

const isWeb = Platform.OS === 'web';

export class BibleService {
  static async initialize(): Promise<boolean> {
    if (isWeb) {
      return WebBibleService.initialize();
    }
    return databaseService.initDatabase();
  }

  static async getBooks(): Promise<Book[]> {
    try {
      if (isWeb) {
        const books = await WebBibleService.getBooks();
        if (books.length > 0) {
          return books;
        }
      } else if (databaseService.isReady()) {
        const books = await databaseService.getBooks();
        if (books.length > 0) {
          return books;
        }
      }

      return bibleBooks as Book[];
    } catch (error) {
      console.error('Error fetching books:', error);
      return bibleBooks as Book[];
    }
  }

  static async getChapters(book: string): Promise<number[]> {
    try {
      if (isWeb) {
        const chapters = await WebBibleService.getChaptersCount(book);
        if (chapters.length > 0) {
          return chapters;
        }
      } else if (databaseService.isReady()) {
        const chapters = await databaseService.getChaptersCount(book);
        if (chapters.length > 0) {
          return chapters;
        }
      }

      const bookData = bibleBooks.find(b => b.name === book);
      if (bookData) {
        return Array.from({ length: bookData.chapters }, (_, i) => i + 1);
      }

      return [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      return [];
    }
  }

  static async getVerses(book: string, chapter: number): Promise<BibleVerse[]> {
    try {
      if (isWeb) {
        const verses = await WebBibleService.getVerses(book, chapter);
        if (verses.length > 0) {
          return verses;
        }
      } else if (databaseService.isReady()) {
        const verses = await databaseService.getVerses(book, chapter);
        if (verses.length > 0) {
          return verses;
        }
      }

      const cacheKey = `verses_${book}_${chapter}`;
      const cachedVerses = await AsyncStorage.getItem(cacheKey);
      if (cachedVerses) {
        return JSON.parse(cachedVerses);
      }

      return [{
        id: 1,
        book_id: 1,
        chapter: chapter,
        verse: 1,
        text: 'Cargando versículos...',
        text_tzotzil: 'Ta xjatav li k\'opetike...',
        book_name: book
      }];
    } catch (error) {
      console.error('Error fetching verses:', error);
      return [];
    }
  }

  static async getRandomPromise(): Promise<string> {
    try {
      if (!isWeb && databaseService.isReady()) {
        const promise = await databaseService.getRandomPromise();
        if (promise) {
          return promise.text;
        }
      }
      
      return OFFLINE_PROMISES[Math.floor(Math.random() * OFFLINE_PROMISES.length)];
    } catch (error) {
      console.error('Error fetching random promise:', error);
      return OFFLINE_PROMISES[Math.floor(Math.random() * OFFLINE_PROMISES.length)];
    }
  }

  static async searchVerses(query: string): Promise<BibleVerse[]> {
    try {
      if (isWeb) {
        return WebBibleService.searchVerses(query);
      } else if (databaseService.isReady()) {
        return databaseService.searchVerses(query);
      }

      return [];
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  static async getVerse(book: string, chapter: number, verse: number): Promise<BibleVerse | null> {
    try {
      if (isWeb) {
        return WebBibleService.getVerse(book, chapter, verse);
      } else if (databaseService.isReady()) {
        return databaseService.getVerse(book, chapter, verse);
      }

      return null;
    } catch (error) {
      console.error('Error fetching verse:', error);
      return null;
    }
  }

  static async clearCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const bibleKeys = keys.filter(key => 
        key.startsWith('bible_') || 
        key.startsWith('chapters_') || 
        key.startsWith('verses_')
      );
      await AsyncStorage.multiRemove(bibleKeys);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
