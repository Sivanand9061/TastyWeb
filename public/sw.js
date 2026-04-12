// Minimal Service Worker to satisfy PWA requirements
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Do nothing, just satisfy the PWA requirement
});
