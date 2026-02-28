/**
 * IndexedDBStorage — Web-only storage for large Bible version data.
 *
 * localStorage (used by AsyncStorage on web) has a ~5 MB total quota.
 * Bible version JSON files are 5–8 MB each, causing QuotaExceededError.
 * IndexedDB has no practical limit (browsers allow hundreds of MB).
 *
 * This module provides a simple key-value interface backed by IndexedDB
 * for web, and falls back to a no-op on native (native uses AsyncStorage).
 */

const DB_NAME = 'TzotzilBibleVersions';
const DB_VERSION = 1;
const STORE_NAME = 'version_data';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      console.error('[IndexedDB] Failed to open:', (event.target as IDBOpenDBRequest).error);
      dbPromise = null; // allow retry
      reject((event.target as IDBOpenDBRequest).error);
    };
  });

  return dbPromise;
}

export async function idbSetItem(key: string, value: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbGetItem(key: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function idbRemoveItem(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function idbGetAllKeys(): Promise<string[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result as string[]);
    request.onerror = () => reject(request.error);
  });
}
