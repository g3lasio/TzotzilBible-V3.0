import axios from 'axios';
import { API_URL } from '../config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './DatabaseService';
import { BibleVerse, Book } from '../types/bible';

function useOfflineDatabase(): boolean {
  return databaseService.isReady();
}

function useNetworkFallback(): boolean {
  return databaseService.isWebFallback() || !databaseService.isReady();
}

const OFFLINE_PROMISES = [
  "Juan 3:16 - Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito...",
  "Salmos 23:1 - El Señor es mi pastor; nada me faltará...",
  "Isaías 41:10 - No temas, porque yo estoy contigo...",
  "Filipenses 4:13 - Todo lo puedo en Cristo que me fortalece...",
  "Jeremías 29:11 - Porque yo sé los planes que tengo para vosotros...",
  "Romanos 8:28 - Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien...",
  "Mateo 11:28 - Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar...",
  "Josué 1:9 - Mira que te mando que te esfuerces y seas valiente..."
];

export class BibleService {
  static async getBooks(): Promise<Book[]> {
    try {
      if (databaseService.isReady()) {
        const books = await databaseService.getBooks();
        if (books.length > 0) {
          return books;
        }
      }

      const cachedBooks = await AsyncStorage.getItem('bible_books');
      if (cachedBooks) {
        return JSON.parse(cachedBooks);
      }

      const response = await axios.get(`${API_URL}/api/bible/books`);
      await AsyncStorage.setItem('bible_books', JSON.stringify(response.data));
      return response.data;
    } catch (error) {
      console.error('Error fetching books:', error);
      const cachedBooks = await AsyncStorage.getItem('bible_books');
      if (cachedBooks) {
        return JSON.parse(cachedBooks);
      }
      return [];
    }
  }

  static async getChapters(book: string): Promise<number[]> {
    try {
      if (databaseService.isReady()) {
        const chapters = await databaseService.getChaptersCount(book);
        if (chapters.length > 0) {
          return chapters;
        }
      }

      const cacheKey = `chapters_${book}`;
      const cachedChapters = await AsyncStorage.getItem(cacheKey);
      if (cachedChapters) {
        return JSON.parse(cachedChapters);
      }

      const response = await axios.get(`${API_URL}/api/bible/chapters/${encodeURIComponent(book)}`);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data.chapters));
      return response.data.chapters;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      const cacheKey = `chapters_${book}`;
      const cachedChapters = await AsyncStorage.getItem(cacheKey);
      if (cachedChapters) {
        return JSON.parse(cachedChapters);
      }
      return [];
    }
  }

  static async getVerses(book: string, chapter: number): Promise<BibleVerse[]> {
    try {
      if (databaseService.isReady()) {
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

      const response = await axios.get(`${API_URL}/api/bible/verses/${encodeURIComponent(book)}/${chapter}`);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(response.data.verses));
      return response.data.verses;
    } catch (error) {
      console.error('Error fetching verses:', error);
      const cacheKey = `verses_${book}_${chapter}`;
      const cachedVerses = await AsyncStorage.getItem(cacheKey);
      if (cachedVerses) {
        return JSON.parse(cachedVerses);
      }
      return [];
    }
  }

  static async getRandomPromise(): Promise<string> {
    try {
      if (databaseService.isReady()) {
        const promise = await databaseService.getRandomPromise();
        if (promise) {
          return promise.text;
        }
      }

      const response = await axios.get(`${API_URL}/random_promise`);
      if (response.data && response.data.text) {
        return response.data.text;
      }
      
      return OFFLINE_PROMISES[Math.floor(Math.random() * OFFLINE_PROMISES.length)];
    } catch (error) {
      console.error('Error fetching random promise:', error);
      return OFFLINE_PROMISES[Math.floor(Math.random() * OFFLINE_PROMISES.length)];
    }
  }

  static async searchVerses(query: string): Promise<BibleVerse[]> {
    try {
      if (databaseService.isReady()) {
        const results = await databaseService.searchVerses(query);
        if (results.length > 0) {
          return results;
        }
      }

      const response = await axios.get(`${API_URL}/api/search?q=${encodeURIComponent(query)}`);
      return response.data.verses || [];
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  static async getVerse(book: string, chapter: number, verse: number): Promise<BibleVerse | null> {
    try {
      if (databaseService.isReady()) {
        const result = await databaseService.getVerse(book, chapter, verse);
        if (result) {
          return result;
        }
      }

      const response = await axios.get(
        `${API_URL}/api/verse/${encodeURIComponent(book)}/${chapter}/${verse}`
      );
      return response.data;
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
