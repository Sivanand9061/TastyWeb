// Minimal Service Worker to satisfy PWA install requirements.
// No fetch handler — browser handles all requests natively.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(self.clients.claim());
});
