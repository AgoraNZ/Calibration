// Update cache version for new release
const CACHE_NAME = 'agora-form-cache-v55';

// Shell assets (app should load fully offline)
const urlsToCache = [
  './',
  './index.html',
  // CSS/Fonts/Firebase
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.2/css/bootstrap.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
  // Brand logo (cache a stable one for offline brochure header)
  'https://firebasestorage.googleapis.com/v0/b/dairy-farm-record-system.appspot.com/o/Agora%20Logo%2F6-1YdaEP.jpeg?alt=media'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.error('Cache open failed:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(names =>
        Promise.all(names.map(n => n !== CACHE_NAME ? caches.delete(n) : null))
      ),
      self.clients.claim()
    ])
  );
});

// Cache-first for shell; network-first + cache-put for JSON records.
// If offline and not cached → fall back to shell, not a blank page.
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  const isShell = urlsToCache.some(u => req.url.startsWith(u)) ||
                  (url.origin === location.origin && (url.pathname === '/' || url.pathname.endsWith('/index.html')));

  // JSON in "Pre Check/*.json" from Firebase storage → runtime cache them for offline brochures
  const isPrecheckJson =
    (url.hostname.includes('googleapis.com') || url.hostname.includes('firebase')) &&
    /Pre%20Check\/.*\.json/i.test(url.href);

  if (isPrecheckJson) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        try {
          const net = await fetch(req);
          if (net && net.ok) cache.put(req, net.clone());
          return net;
        } catch (e) {
          const cached = await cache.match(req);
          return cached || new Response(JSON.stringify({offline:true}), {status:200, headers:{'Content-Type':'application/json'}});
        }
      })
    );
    return;
  }

  if (isShell) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchAndUpdate = fetch(req)
          .then(res => { if (res && res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone())); return res; })
          .catch(() => cached || caches.match('./index.html'));
        return cached || fetchAndUpdate;
      })
    );
    return;
  }

  // default: cache-first, then network, then fallback to index
  event.respondWith(
    caches.match(req).then(resp => resp || fetch(req).then(res => {
      if (res && res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
      return res;
    }).catch(()=>caches.match('./index.html')))
  );
});