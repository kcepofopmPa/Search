const CACHE = 'encar-v4';
const ASSETS = ['/Search/index.html', '/Search/manifest.json'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  // Only handle same-origin requests — don't intercept external images/APIs
  if(!e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.match(e.request).then(c => c || fetch(e.request).catch(()=>caches.match('/Search/index.html'))));
});
