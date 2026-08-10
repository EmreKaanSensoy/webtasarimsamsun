/**
 * samsunwebtasarim.com - Clean Service Worker (sw.js)
 * Resolves cache collisions and console errors from previous localhost projects.
 * Clears old caches and allows all network requests to pass through naturally.
 */

self.addEventListener('install', event => {
  // Force the waiting service worker to become active immediately
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Clear any cached assets from previous localhost projects
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Clearing old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', event => {
  // Bypass service worker and fetch directly from network
  // This prevents TypeError: Failed to convert value to 'Response'
  return;
});
