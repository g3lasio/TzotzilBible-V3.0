const CACHE_NAME = 'tzotzil-bible-v1';
const BIBLE_CACHE = 'bible-content-v1';
const STATIC_CACHE = 'static-assets-v1';

const STATIC_ASSETS = [
  '/',
  '/static/css/style.css',
  '/static/js/bible.js',
  '/static/js/offline_manager.js',
  '/static/images/Designer.png',
  '/static/manifest.json'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, BIBLE_CACHE, STATIC_CACHE].includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
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
    return;
  }

  if (url.pathname.includes('/api/bible/')) {
    event.respondWith(
      caches.open(BIBLE_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  if (url.pathname.startsWith('/chapter/') || 
      url.pathname === '/books' || 
      url.pathname.startsWith('/static/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        }).catch(() => {
          if (url.pathname.startsWith('/chapter/') || url.pathname === '/books') {
            return caches.match('/').then((offlinePage) => {
              return offlinePage || new Response(
                '<html><body><h1>Sin conexión</h1><p>No se puede cargar esta página sin internet.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          }
        });
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((response) => {
        return response || new Response('Offline', { status: 503 });
      });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_BIBLE_DATA') {
    const { books, chapters, verses } = event.data.data;
    
    caches.open(BIBLE_CACHE).then((cache) => {
      if (books) {
        cache.put('/api/bible/books', new Response(JSON.stringify(books)));
      }
      if (chapters) {
        Object.entries(chapters).forEach(([book, data]) => {
          cache.put(`/api/bible/chapters/${book}`, new Response(JSON.stringify(data)));
        });
      }
      if (verses) {
        Object.entries(verses).forEach(([key, data]) => {
          cache.put(`/api/bible/verses/${key}`, new Response(JSON.stringify(data)));
        });
      }
    });
  }
});
