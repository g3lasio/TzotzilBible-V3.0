import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  value: string;
  expiry: number;
}

export class CacheService {
  private static readonly CACHE_PREFIX = 'cache_';

  static async get(key: string): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(this.CACHE_PREFIX + key);
      if (!data) return null;

      const entry: CacheEntry = JSON.parse(data);
      
      if (entry.expiry && entry.expiry < Date.now()) {
        await this.remove(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.error('CacheService.get error:', error);
      return null;
    }
  }

  static async set(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
    try {
      const entry: CacheEntry = {
        value,
        expiry: Date.now() + (ttlSeconds * 1000)
      };
      await AsyncStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(entry));
    } catch (error) {
      console.error('CacheService.set error:', error);
    }
  }

  static async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.CACHE_PREFIX + key);
    } catch (error) {
      console.error('CacheService.remove error:', error);
    }
  }

  static async clear(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
      console.error('CacheService.clear error:', error);
    }
  }

  static async initializeCache(): Promise<void> {
    console.log('CacheService initialized');
  }

  static async updateCache(verses: any[]): Promise<void> {
    for (const verse of verses) {
      const key = `verse_${verse.book}_${verse.chapter}_${verse.verse}`;
      await this.set(key, JSON.stringify(verse), 86400);
    }
  }

  static async getCachedVerses(book: string, chapter: number): Promise<any[]> {
    const cacheKey = `verses_${book}_${chapter}`;
    const cached = await this.get(cacheKey);
    return cached ? JSON.parse(cached) : [];
  }
}
