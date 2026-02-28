/**
 * VersionManager - On-demand Bible version download service
 * 
 * Handles downloading, storing, and loading Bible versions on demand.
 * Default build includes only Tzotzil + RV1960.
 * Other versions (NVI, DHH, TLA, NKJV, etc.) are downloaded from the server.
 *
 * Storage strategy:
 *   - Web:    IndexedDB (no quota limit — can store hundreds of MB)
 *   - Native: AsyncStorage (React Native, backed by SQLite on device)
 *
 * The old localStorage/chunked approach caused QuotaExceededError on web
 * because localStorage has a ~5 MB total limit per origin, and each version
 * JSON is 5–8 MB. IndexedDB has no practical limit.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { BACKEND_URL } from '../config';
import { idbSetItem, idbGetItem, idbRemoveItem } from './IndexedDBStorage';

// Storage keys
const VERSION_META_KEY = 'downloaded_versions_meta';
const VERSION_DATA_PREFIX = 'bible_version_data_';

// API URL - same server that serves the web app
const getVersionsApiUrl = (): string => {
  if (Platform.OS === 'web') {
    return ''; // relative URL (same origin)
  }
  return BACKEND_URL;
};

export interface VersionInfo {
  id: string;
  name: string;
  language: string;
  verses_count: number;
  file_size: number;
  file_size_mb: number;
}

export interface DownloadedVersionMeta {
  id: string;
  name: string;
  downloadedAt: string;
  verses_count: number;
  file_size_mb: number;
}

export interface VersionDownloadProgress {
  versionId: string;
  progress: number; // 0-100
  status: 'idle' | 'downloading' | 'processing' | 'complete' | 'error';
  error?: string;
}

// In-memory cache for downloaded version data (avoids repeated IDB reads)
const versionDataCache: Map<string, Map<string, string>> = new Map();

class VersionManagerService {
  private downloadedVersions: Map<string, DownloadedVersionMeta> = new Map();
  private initialized = false;
  private progressCallbacks: Map<string, (progress: VersionDownloadProgress) => void> = new Map();

  // ===== STORAGE HELPERS =====

  /** Store large string — IndexedDB on web, AsyncStorage on native */
  private async storeLarge(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      await idbSetItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  /** Load large string — IndexedDB on web, AsyncStorage on native */
  private async loadLarge(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await idbGetItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
  }

  /** Remove large string — IndexedDB on web, AsyncStorage on native */
  private async removeLarge(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      await idbRemoveItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }

  // ===== PUBLIC API =====

  /**
   * Initialize the version manager — load metadata of downloaded versions.
   * Metadata (small JSON) always uses AsyncStorage on both platforms.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      const metaJson = await AsyncStorage.getItem(VERSION_META_KEY);
      if (metaJson) {
        const meta = JSON.parse(metaJson) as Record<string, DownloadedVersionMeta>;
        for (const [id, info] of Object.entries(meta)) {
          this.downloadedVersions.set(id, info);
        }
      }
      this.initialized = true;
      console.log(`[VersionManager] Initialized with ${this.downloadedVersions.size} downloaded versions`);
    } catch (error) {
      console.error('[VersionManager] Error initializing:', error);
      this.initialized = true;
    }
  }

  /**
   * Get list of available versions from the server
   */
  async getAvailableVersions(): Promise<VersionInfo[]> {
    try {
      const baseUrl = getVersionsApiUrl();
      const response = await fetch(`${baseUrl}/api/versions`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data.versions || [];
    } catch (error) {
      console.error('[VersionManager] Error fetching available versions:', error);
      return [];
    }
  }

  /**
   * Check if a version is downloaded and available locally
   */
  isVersionDownloaded(versionId: string): boolean {
    return this.downloadedVersions.has(versionId);
  }

  /**
   * Get metadata of all downloaded versions
   */
  getDownloadedVersions(): DownloadedVersionMeta[] {
    return Array.from(this.downloadedVersions.values());
  }

  /**
   * Download a Bible version from the server and persist it.
   * Uses IndexedDB on web (no quota limit) and AsyncStorage on native.
   */
  async downloadVersion(
    versionId: string,
    onProgress?: (progress: VersionDownloadProgress) => void
  ): Promise<boolean> {
    if (onProgress) {
      this.progressCallbacks.set(versionId, onProgress);
    }

    try {
      this.reportProgress(versionId, { versionId, progress: 0, status: 'downloading' });

      const baseUrl = getVersionsApiUrl();
      const response = await fetch(`${baseUrl}/api/versions/${versionId}/download`);
      
      if (!response.ok) {
        throw new Error(`Download failed: HTTP ${response.status}`);
      }

      this.reportProgress(versionId, { versionId, progress: 50, status: 'downloading' });

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid version data received');
      }

      this.reportProgress(versionId, { versionId, progress: 70, status: 'processing' });

      // Build lookup map: "book_name|chapter|verse" -> text
      const lookupMap: Record<string, string> = {};
      for (const entry of data) {
        const key = `${entry.book_name}|${entry.chapter}|${entry.verse}`;
        lookupMap[key] = entry.text;
      }

      this.reportProgress(versionId, { versionId, progress: 85, status: 'processing' });

      // Persist to storage (IndexedDB on web, AsyncStorage on native)
      const jsonStr = JSON.stringify(lookupMap);
      await this.storeLarge(`${VERSION_DATA_PREFIX}${versionId}`, jsonStr);

      // Save metadata (small JSON — always AsyncStorage)
      const versionName = response.headers.get('X-Version-Name') || versionId;
      const versesCount = parseInt(response.headers.get('X-Verses-Count') || String(data.length));
      
      const meta: DownloadedVersionMeta = {
        id: versionId,
        name: versionName,
        downloadedAt: new Date().toISOString(),
        verses_count: versesCount,
        file_size_mb: Math.round(jsonStr.length / 1024 / 1024 * 10) / 10,
      };
      
      this.downloadedVersions.set(versionId, meta);
      await this.saveMetadata();

      // Cache in memory for fast access
      const memoryMap = new Map<string, string>();
      for (const [key, value] of Object.entries(lookupMap)) {
        memoryMap.set(key, value);
      }
      versionDataCache.set(versionId, memoryMap);

      this.reportProgress(versionId, { versionId, progress: 100, status: 'complete' });
      console.log(`[VersionManager] Downloaded ${versionId}: ${data.length} verses`);
      return true;

    } catch (error: any) {
      console.error(`[VersionManager] Error downloading ${versionId}:`, error);
      this.reportProgress(versionId, { versionId, progress: 0, status: 'error', error: error.message });
      return false;
    } finally {
      this.progressCallbacks.delete(versionId);
    }
  }

  /**
   * Get verse text from a downloaded version
   */
  async getVerseText(versionId: string, bookName: string, chapter: number, verse: number): Promise<string | null> {
    const key = `${bookName}|${chapter}|${verse}`;
    
    if (versionDataCache.has(versionId)) {
      return versionDataCache.get(versionId)!.get(key) || null;
    }

    try {
      await this.loadVersionIntoCache(versionId);
      if (versionDataCache.has(versionId)) {
        return versionDataCache.get(versionId)!.get(key) || null;
      }
    } catch (error) {
      console.error(`[VersionManager] Error loading ${versionId}:`, error);
    }

    return null;
  }

  /**
   * Get all verses for a chapter from a downloaded version
   */
  async getChapterVerses(
    versionId: string, 
    bookName: string, 
    chapter: number
  ): Promise<Map<number, string>> {
    const result = new Map<number, string>();
    
    if (!versionDataCache.has(versionId)) {
      await this.loadVersionIntoCache(versionId);
    }

    const cache = versionDataCache.get(versionId);
    if (!cache) return result;

    const prefix = `${bookName}|${chapter}|`;
    for (const [key, text] of cache.entries()) {
      if (key.startsWith(prefix)) {
        const verseNum = parseInt(key.split('|')[2]);
        result.set(verseNum, text);
      }
    }

    return result;
  }

  /**
   * Delete a downloaded version from storage and memory
   */
  async deleteVersion(versionId: string): Promise<boolean> {
    try {
      await this.removeLarge(`${VERSION_DATA_PREFIX}${versionId}`);

      this.downloadedVersions.delete(versionId);
      await this.saveMetadata();

      versionDataCache.delete(versionId);
      console.log(`[VersionManager] Deleted version ${versionId}`);
      return true;
    } catch (error) {
      console.error(`[VersionManager] Error deleting ${versionId}:`, error);
      return false;
    }
  }

  /**
   * Get total storage used by downloaded versions (in MB)
   */
  getTotalStorageMB(): number {
    let total = 0;
    for (const meta of this.downloadedVersions.values()) {
      total += meta.file_size_mb;
    }
    return Math.round(total * 10) / 10;
  }

  // ===== PRIVATE METHODS =====

  private async loadVersionIntoCache(versionId: string): Promise<void> {
    try {
      const jsonStr = await this.loadLarge(`${VERSION_DATA_PREFIX}${versionId}`);
      if (!jsonStr) return;

      const lookupMap = JSON.parse(jsonStr) as Record<string, string>;
      const memoryMap = new Map<string, string>();
      for (const [key, value] of Object.entries(lookupMap)) {
        memoryMap.set(key, value);
      }
      versionDataCache.set(versionId, memoryMap);
      console.log(`[VersionManager] Loaded ${versionId} into cache: ${memoryMap.size} verses`);
    } catch (error) {
      console.error(`[VersionManager] Error loading ${versionId} into cache:`, error);
    }
  }

  private async saveMetadata(): Promise<void> {
    const meta: Record<string, DownloadedVersionMeta> = {};
    for (const [id, info] of this.downloadedVersions.entries()) {
      meta[id] = info;
    }
    // Metadata is small (<1 KB) — safe to use AsyncStorage on all platforms
    await AsyncStorage.setItem(VERSION_META_KEY, JSON.stringify(meta));
  }

  private reportProgress(versionId: string, progress: VersionDownloadProgress): void {
    const callback = this.progressCallbacks.get(versionId);
    if (callback) {
      callback(progress);
    }
  }
}

// Singleton instance
export const versionManager = new VersionManagerService();
export default versionManager;
