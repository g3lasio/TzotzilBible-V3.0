/**
 * WebBibleService - Web-specific Bible data service
 * 
 * Loads base data (Tzotzil + RV1960) from bundled slim JSON.
 * On-demand versions loaded via VersionManager when downloaded.
 * 
 * FIX: Changed from per-verse enrichment to batch chapter loading
 * to avoid race conditions when loading large JSON from localStorage.
 */

import { BibleVerse, Book } from '../types/bible';
import { versionManager } from './VersionManager';
import { SECONDARY_VERSIONS } from '../constants/bibleVersions';

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

// Build version field map dynamically from SECONDARY_VERSIONS
const VERSION_FIELD_MAP: Record<string, string> = {};
const ON_DEMAND_VERSIONS: string[] = [];

for (const ver of SECONDARY_VERSIONS) {
  if (ver.isDownloadable) {
    VERSION_FIELD_MAP[ver.id] = ver.textField;
    ON_DEMAND_VERSIONS.push(ver.id);
  }
}

/**
 * Build a BibleVerse object from raw verse data, including all version fields
 */
function buildBibleVerse(v: any): BibleVerse {
  const result: any = {
    id: v.id,
    book_id: v.book_id,
    chapter: v.chapter,
    verse: v.verse,
    text: v.text_spanish_rv1960 || '',
    text_tzotzil: v.text_tzotzil || '',
    book_name: v.book_name,
    text_spanish_rv1960: v.text_spanish_rv1960 || '',
  };

  // Add all version-specific text fields
  for (const ver of SECONDARY_VERSIONS) {
    const field = ver.textField;
    result[field] = v[field] || '';
  }

  return result as BibleVerse;
}

export class WebBibleService {
  static async getBooks(): Promise<Book[]> {
    await loadVerses();
    if (!allVerses) return [];
    
    const bookMap = new Map<number, { book_name: string; chapters: Set<number> }>();
    
    for (const verse of allVerses) {
      if (!bookMap.has(verse.book_id)) {
        bookMap.set(verse.book_id, {
          book_name: verse.book_name,
          chapters: new Set()
        });
      }
      bookMap.get(verse.book_id)!.chapters.add(verse.chapter);
    }
    
    const books: Book[] = [];
    bookMap.forEach((data, book_id) => {
      books.push({
        book_number: book_id,
        book_name: data.book_name,
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

  /**
   * Get verses for a specific book and chapter
   * 
   * FIX: Changed to batch-load chapter data from downloaded versions
   * instead of enriching each verse individually to avoid race conditions.
   */
  static async getVerses(bookName: string, chapter: number): Promise<BibleVerse[]> {
    await loadVerses();
    if (!allVerses) return [];
    
    // Get base verses (Tzotzil + RV1960)
    const filtered = allVerses.filter(v => v.book_name === bookName && v.chapter === chapter);
    
    // Create a mutable copy of each verse for enrichment
    const enrichedVerses = filtered.map(v => ({ ...v }));
    
    // Batch-load chapter data for each downloaded version
    for (const versionId of ON_DEMAND_VERSIONS) {
      if (versionManager.isVersionDownloaded(versionId)) {
        try {
          console.log(`[WebBible] Loading ${versionId} for ${bookName} ${chapter}`);
          
          // Load entire chapter at once (single call to loadVersionIntoCache)
          const chapterVerses = await versionManager.getChapterVerses(versionId, bookName, chapter);
          const fieldName = VERSION_FIELD_MAP[versionId];
          
          console.log(`[WebBible] Loaded ${chapterVerses.size} verses from ${versionId}`);
          
          // Merge into enriched verses
          for (const verse of enrichedVerses) {
            const text = chapterVerses.get(verse.verse);
            if (text && text.trim()) {
              verse[fieldName] = text;
            }
          }
        } catch (error) {
          console.error(`[WebBible] Error loading ${versionId} for ${bookName} ${chapter}:`, error);
        }
      }
    }
    
    return enrichedVerses.map(v => buildBibleVerse(v)).sort((a, b) => a.verse - b.verse);
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
      .map(v => buildBibleVerse(v));
    
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
    
    if (!found) return null;
    return buildBibleVerse(found);
  }
}
