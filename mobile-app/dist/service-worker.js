/**
 * Service Worker avanzado para Tzotzil Bible App
 * Soporte completo offline con IndexedDB + Cache API
 */

const CACHE_VERSION = 'v3';
const CACHE_NAME = `tzotzil-bible-${CACHE_VERSION}`;
const STATIC_CACHE = `static-assets-${CACHE_VERSION}`;
const BIBLE_CACHE = `bible-content-${CACHE_VERSION}`;
const API_CACHE = `api-responses-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/static/css/style.css',
  '/static/css/nevin.css',
  '/static/css/study_mode.css',
  '/static/css/chat_mode.css',
  '/static/css/custom.css',
  '/static/js/bible.js',
  '/static/js/offline_manager.js',
  '/static/js/nevin.js',
  '/static/js/auth.js',
  '/static/js/script.js',
  '/static/images/Designer.png',
  '/static/images/bible-icon.svg',
  '/static/images/nevin-icon.svg',
  '/static/manifest.json'
];

const DB_NAME = 'TzotzilBibleDB';
const DB_VERSION = 1;

let db = null;

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }
    
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      if (!database.objectStoreNames.contains('verses')) {
        const versesStore = database.createObjectStore('verses', { keyPath: 'id' });
        versesStore.createIndex('book', 'book', { unique: false });
        versesStore.createIndex('chapter', ['book', 'chapter'], { unique: false });
      }
      
      if (!database.objectStoreNames.contains('books')) {
        database.createObjectStore('books', { keyPath: 'name' });
      }
      
      if (!database.objectStoreNames.contains('promises')) {
        database.createObjectStore('promises', { keyPath: 'id' });
      }
      
      if (!database.objectStoreNames.contains('nevinHistory')) {
        const nevinStore = database.createObjectStore('nevinHistory', { keyPath: 'id', autoIncrement: true });
        nevinStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!database.objectStoreNames.contains('userSettings')) {
        database.createObjectStore('userSettings', { keyPath: 'key' });
      }
      
      if (!database.objectStoreNames.contains('pendingSync')) {
        const syncStore = database.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
        syncStore.createIndex('type', 'type', { unique: false });
      }
    };
  });
}

async function saveToIndexedDB(storeName, data) {
  try {
    const database = await openDatabase();
    const tx = database.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    
    if (Array.isArray(data)) {
      for (const item of data) {
        store.put(item);
      }
    } else {
      store.put(data);
    }
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
    return false;
  }
}

async function getFromIndexedDB(storeName, key) {
  try {
    const database = await openDatabase();
    const tx = database.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = key ? store.get(key) : store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error reading from IndexedDB:', error);
    return null;
  }
}

async function getVersesByChapter(book, chapter) {
  try {
    const database = await openDatabase();
    const tx = database.transaction('verses', 'readonly');
    const store = tx.objectStore('verses');
    const index = store.index('chapter');
    const request = index.getAll([book, chapter]);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting verses:', error);
    return [];
  }
}

self.addEventListener('install', (event) => {
  console.log('[SW] Installing Tzotzil Bible Service Worker...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('undefined')));
      }).catch(err => console.warn('[SW] Static cache error:', err)),
      
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Main cache ready');
      }),
      
      openDatabase().then(() => {
        console.log('[SW] IndexedDB ready');
      })
    ])
  );
  
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (request.method !== 'GET') {
    if (request.method === 'POST' && url.pathname.includes('/api/nevin')) {
      event.respondWith(handleNevinRequest(request));
    }
    return;
  }
  
  if (url.pathname.includes('/api/bible/verses/')) {
    event.respondWith(handleBibleVersesRequest(request, url));
    return;
  }
  
  if (url.pathname.includes('/api/bible/books')) {
    event.respondWith(handleBibleBooksRequest(request));
    return;
  }
  
  if (url.pathname.includes('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  if (url.pathname.startsWith('/static/') || 
      url.pathname === '/' || 
      url.pathname.endsWith('.html')) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
      .then(response => response || new Response('Offline', { status: 503 }))
  );
});

async function handleBibleVersesRequest(request, url) {
  const pathParts = url.pathname.split('/');
  const book = decodeURIComponent(pathParts[pathParts.length - 2]);
  const chapter = parseInt(pathParts[pathParts.length - 1]);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const data = await networkResponse.clone().json();
      
      if (data.verses) {
        const versesToSave = data.verses.map((v, i) => ({
          id: `${book}-${chapter}-${v.verse || i + 1}`,
          book,
          chapter,
          verse: v.verse || i + 1,
          tzotzil_text: v.tzotzil_text,
          spanish_text: v.spanish_text
        }));
        await saveToIndexedDB('verses', versesToSave);
      }
      
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed, trying IndexedDB');
  }
  
  const cachedVerses = await getVersesByChapter(book, chapter);
  if (cachedVerses && cachedVerses.length > 0) {
    return new Response(JSON.stringify({ 
      verses: cachedVerses,
      offline: true 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  return new Response(JSON.stringify({ 
    error: 'No hay datos disponibles offline',
    offline: true 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleBibleBooksRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const data = await networkResponse.clone().json();
      
      if (data.books) {
        const booksToSave = data.books.map(b => ({
          name: b.name || b,
          chapters: b.chapters || 0
        }));
        await saveToIndexedDB('books', booksToSave);
      }
      
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for books');
  }
  
  const cachedBooks = await getFromIndexedDB('books');
  if (cachedBooks && cachedBooks.length > 0) {
    return new Response(JSON.stringify({ 
      books: cachedBooks,
      offline: true 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  const cachedResponse = await caches.match(request);
  return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), { 
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] API request failed, checking cache');
  }
  
  const cachedResponse = await caches.match(request);
  return cachedResponse || new Response(JSON.stringify({ 
    error: 'No hay conexión',
    offline: true 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    fetch(request).then(response => {
      if (response.ok) {
        caches.open(STATIC_CACHE).then(cache => {
          cache.put(request, response);
        });
      }
    }).catch(() => {});
    
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Static request failed');
  }
  
  if (request.url.includes('.html') || request.mode === 'navigate') {
    return caches.match('/') || caches.match('/index.html');
  }
  
  return new Response('Offline', { status: 503 });
}

async function handleNevinRequest(request) {
  try {
    const networkResponse = await fetch(request.clone());
    if (networkResponse.ok) {
      const data = await networkResponse.clone().json();
      
      await saveToIndexedDB('nevinHistory', {
        timestamp: Date.now(),
        question: data.question,
        response: data.response
      });
      
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Nevin request failed, saving for later');
    
    try {
      const body = await request.clone().json();
      await saveToIndexedDB('pendingSync', {
        type: 'nevin',
        data: body,
        timestamp: Date.now()
      });
    } catch (e) {}
    
    return new Response(JSON.stringify({
      response: 'No hay conexión a internet. Tu pregunta será procesada cuando vuelvas a estar en línea.',
      offline: true,
      queued: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-nevin') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  try {
    const pending = await getFromIndexedDB('pendingSync');
    if (!pending || pending.length === 0) return;
    
    const database = await openDatabase();
    const tx = database.transaction('pendingSync', 'readwrite');
    const store = tx.objectStore('pendingSync');
    
    for (const item of pending) {
      try {
        if (item.type === 'nevin') {
          const response = await fetch('/api/nevin/chat/revolutionary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          });
          
          if (response.ok) {
            store.delete(item.id);
          }
        }
      } catch (error) {
        console.error('[SW] Sync failed for item:', item.id);
      }
    }
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

self.addEventListener('message', async (event) => {
  if (event.data.type === 'DOWNLOAD_BIBLE') {
    const { books } = event.data;
    
    for (const book of books) {
      for (let chapter = 1; chapter <= book.chapters; chapter++) {
        try {
          const response = await fetch(`/api/bible/verses/${encodeURIComponent(book.name)}/${chapter}`);
          if (response.ok) {
            const data = await response.json();
            const versesToSave = data.verses.map((v, i) => ({
              id: `${book.name}-${chapter}-${v.verse || i + 1}`,
              book: book.name,
              chapter,
              verse: v.verse || i + 1,
              tzotzil_text: v.tzotzil_text,
              spanish_text: v.spanish_text
            }));
            await saveToIndexedDB('verses', versesToSave);
          }
        } catch (error) {
          console.error(`[SW] Failed to download ${book.name} ${chapter}`);
        }
      }
      
      event.source.postMessage({
        type: 'DOWNLOAD_PROGRESS',
        book: book.name,
        completed: true
      });
    }
    
    event.source.postMessage({ type: 'DOWNLOAD_COMPLETE' });
  }
  
  if (event.data.type === 'CLEAR_CACHE') {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    event.source.postMessage({ type: 'CACHE_CLEARED' });
  }
});

console.log('[SW] Tzotzil Bible Service Worker loaded');
