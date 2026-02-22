import { BibleVerse, Book } from '../types/bible';

let allVerses: any[] | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

async function loadVerses(): Promise<void> {
  if (allVerses !== null) return;
  if (loadPromise) return loadPromise;
  
  isLoading = true;
  loadPromise = (async () => {
    try {
      const versesData = require('../../assets/bible_data/all_verses.json');
      allVerses = versesData;
      console.log(`Loaded ${allVerses?.length || 0} verses for web fallback`);
    } catch (error) {
      console.error('Error loading verses JSON:', error);
      allVerses = [];
    } finally {
      isLoading = false;
    }
  })();
  
  return loadPromise;
}

export class WebBibleService {
  static async initialize(): Promise<boolean> {
    await loadVerses();
    return allVerses !== null && allVerses.length > 0;
  }

  static isReady(): boolean {
    return allVerses !== null && allVerses.length > 0;
  }

  static async getBooks(): Promise<Book[]> {
    await loadVerses();
    if (!allVerses) return [];
    
    const bookMap = new Map<string, { book_id: number; chapters: Set<number> }>();
    
    for (const verse of allVerses) {
      if (!bookMap.has(verse.book_name)) {
        bookMap.set(verse.book_name, { book_id: verse.book_id, chapters: new Set() });
      }
      bookMap.get(verse.book_name)!.chapters.add(verse.chapter);
    }
    
    const books: Book[] = [];
    bookMap.forEach((data, name) => {
      books.push({
        id: data.book_id,
        name: name,
        book_number: data.book_id,
        testament: data.book_id <= 39 ? 'old' : 'new',
        chapters: data.chapters.size
      });
    });
    
    return books.sort((a, b) => a.book_number - b.book_number);
  }

  static async getChaptersCount(bookName: string): Promise<number[]> {
    await loadVerses();
    if (!allVerses) return [];
    
    const chapters = new Set<number>();
    for (const verse of allVerses) {
      if (verse.book_name === bookName) {
        chapters.add(verse.chapter);
      }
    }
    
    return Array.from(chapters).sort((a, b) => a - b);
  }

  static async getVerses(bookName: string, chapter: number): Promise<BibleVerse[]> {
    await loadVerses();
    if (!allVerses) return [];
    
    const verses = allVerses
      .filter(v => v.book_name === bookName && v.chapter === chapter)
      .map(v => ({
        id: v.id,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text_spanish_rv1960 || v.text_spanish || '', // Default to RV1960
        text_tzotzil: v.text_tzotzil,
        book_name: v.book_name,
        // Include all Spanish version fields
        text_spanish_rv1960: v.text_spanish_rv1960,
        text_spanish_nvi: v.text_spanish_nvi,
        text_spanish_tla: v.text_spanish_tla,
        text_spanish_dhh: v.text_spanish_dhh,
        text_english_nkjv: v.text_english_nkjv,
      }))
      .sort((a, b) => a.verse - b.verse);
    
    return verses;
  }

  static async searchVerses(query: string): Promise<BibleVerse[]> {
    await loadVerses();
    if (!allVerses) return [];
    
    const lowerQuery = query.toLowerCase();
    const results = allVerses
      .filter(v => 
        v.text_spanish_rv1960?.toLowerCase().includes(lowerQuery) ||
        v.text_spanish_nvi?.toLowerCase().includes(lowerQuery) ||
        v.text_spanish_tla?.toLowerCase().includes(lowerQuery) ||
        v.text_spanish_dhh?.toLowerCase().includes(lowerQuery) ||
        v.text_english_nkjv?.toLowerCase().includes(lowerQuery) ||
        v.text_tzotzil?.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 100)
      .map(v => ({
        id: v.id,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text_spanish_rv1960 || v.text_spanish || '',
        text_tzotzil: v.text_tzotzil,
        book_name: v.book_name,
        text_spanish_rv1960: v.text_spanish_rv1960,
        text_spanish_nvi: v.text_spanish_nvi,
        text_spanish_tla: v.text_spanish_tla,
        text_spanish_dhh: v.text_spanish_dhh,
        text_english_nkjv: v.text_english_nkjv,
      }));
    
    return results;
  }

  static async getVerse(bookName: string, chapter: number, verse: number): Promise<BibleVerse | null> {
    await loadVerses();
    if (!allVerses) return null;
    
    const found = allVerses.find(v => 
      v.book_name === bookName && 
      v.chapter === chapter && 
      v.verse === verse
    );
    
    if (found) {
      return {
        id: found.id,
        book_id: found.book_id,
        chapter: found.chapter,
        verse: found.verse,
        text: found.text_spanish_rv1960 || found.text_spanish || '',
        text_tzotzil: found.text_tzotzil,
        book_name: found.book_name,
        text_spanish_rv1960: found.text_spanish_rv1960,
        text_spanish_nvi: found.text_spanish_nvi,
        text_spanish_tla: found.text_spanish_tla,
        text_spanish_dhh: found.text_spanish_dhh,
        text_english_nkjv: found.text_english_nkjv,
      };
    }
    
    return null;
  }
}
