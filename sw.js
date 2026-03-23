// BookLens Service Worker — cache-first strategy for offline support
const CACHE_NAME = 'booklens-v1';

// app shell and key CDN assets to pre-cache on install
const PRE_CACHE_URLS = [
  './',
  './BookLens.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/screenshot-mobile.png',
  './icons/screenshot-wide.png',
  // Google Fonts stylesheets
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@300;400&display=swap',
  // Tesseract.js CDN bundle
  'https://cdn.jsdelivr.net/npm/tesseract.js@4/dist/tesseract.min.js'
];

// install — open cache and pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// activate — clean up old caches from previous versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// fetch — serve from cache first, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // not in cache — fetch from network and cache the response for next time
        return fetch(event.request).then((networkResponse) => {
          // only cache successful responses for http/https requests
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
            return networkResponse;
          }

          // cache a clone since the response body can only be consumed once
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });

          return networkResponse;
        });
      })
      .catch(() => {
        // network failed and nothing in cache — offline with no cached fallback
        // for navigation requests, could serve an offline page here later
      })
  );
});
