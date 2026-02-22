/**
 * WebBibleService - Web-specific Bible data service
 * 
 * Loads base data (Tzotzil + RV1960) from bundled slim JSON.
 * On-demand versions (NVI, DHH, TLA, NKJV) loaded via VersionManager.
 */

import { BibleVerse, Book } from '../types/bible';
import { versionManager } from './VersionManager';

let allVerses: any[] | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

async function loadVerses(): Promise<void> {
  if (allVerses !== null) return;
  if (loadPromise) return loadPromise;
  
  isLoading = true;
  loadPromise = (async () => {
    try {
      // Try slim version first (Tzotzil + RV1960 only, ~12 MB)
      let versesData;
      try {
        versesData = require('../../assets/bible_data/all_verses_slim.json');
      } catch {
        // Fallback to full version if slim doesn't exist
        versesData = require('../../assets/bible_data/all_verses.json');
      }
      allVerses = versesData;
      console.log(`[WebBible] Loaded ${allVerses?.length || 0} base verses`);
      
      // Initialize VersionManager for on-demand versions
      await versionManager.initialize();
      console.log(`[WebBible] VersionManager ready, ${versionManager.getDownloadedVersions().length} versions downloaded`);
    } catch (error) {
      console.error('[WebBible] Error loading verses JSON:', error);
      allVerses = [];
    } finally {
      isLoading = false;
    }
  })();
  
  return loadPromise;
}

// Map version IDs to their text field names
const VERSION_FIELD_MAP: Record<string, string> = {
  'nvi': 'text_spanish_nvi',
  'dhh': 'text_spanish_dhh',
  'tla': 'text_spanish_tla',
  'nkjv': 'text_english_nkjv',
};

// On-demand version IDs
const ON_DEMAND_VERSIONS = ['nvi', 'dhh', 'tla', 'nkjv'];

/**
 * Merge downloaded version data into a verse object
 */
async function enrichVerseWithDownloads(verse: any): Promise<any> {
  const enriched = { ...verse };
  
  for (const versionId of ON_DEMAND_VERSIONS) {
    const fieldName = VERSION_FIELD_MAP[versionId];
    
    // If already has data from base JSON, skip
    if (enriched[fieldName] && enriched[fieldName].trim()) continue;
    
    // Check if version is downloaded
    if (versionManager.isVersionDownloaded(versionId)) {
      const text = await versionManager.getVerseText(
        versionId, 
        verse.book_name, 
        verse.chapter, 
        verse.verse
      );
      if (text) {
        enriched[fieldName] = text;
      }
    }
  }
  
  return enriched;
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
    
    const filtered = allVerses.filter(v => v.book_name === bookName && v.chapter === chapter);
    
    // Enrich with downloaded version data
    const enrichedPromises = filtered.map(v => enrichVerseWithDownloads(v));
    const enriched = await Promise.all(enrichedPromises);
    
    const verses = enriched
      .map(v => ({
        id: v.id,
        book_id: v.book_id,
        chapter: v.chapter,
        verse: v.verse,
        text: v.text_spanish_rv1960 || v.text_spanish || '',
        text_tzotzil: v.text_tzotzil,
        book_name: v.book_name,
        text_spanish_rv1960: v.text_spanish_rv1960,
        text_spanish_nvi: v.text_spanish_nvi || '',
        text_spanish_tla: v.text_spanish_tla || '',
        text_spanish_dhh: v.text_spanish_dhh || '',
        text_english_nkjv: v.text_english_nkjv || '',
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
        text_spanish_nvi: v.text_spanish_nvi || '',
        text_spanish_tla: v.text_spanish_tla || '',
        text_spanish_dhh: v.text_spanish_dhh || '',
        text_english_nkjv: v.text_english_nkjv || '',
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
      const enriched = await enrichVerseWithDownloads(found);
      return {
        id: enriched.id,
        book_id: enriched.book_id,
        chapter: enriched.chapter,
        verse: enriched.verse,
        text: enriched.text_spanish_rv1960 || enriched.text_spanish || '',
        text_tzotzil: enriched.text_tzotzil,
        book_name: enriched.book_name,
        text_spanish_rv1960: enriched.text_spanish_rv1960,
        text_spanish_nvi: enriched.text_spanish_nvi || '',
        text_spanish_tla: enriched.text_spanish_tla || '',
        text_spanish_dhh: enriched.text_spanish_dhh || '',
        text_english_nkjv: enriched.text_english_nkjv || '',
      };
    }
    
    return null;
  }
}
