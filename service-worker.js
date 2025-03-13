// Update cache version with each release
const CACHE_NAME = 'agora-form-cache-v6';

const urlsToCache = [
  '/',
  '/index.html',
  'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
  // Logo from "Agora Logo" folder
  'https://firebasestorage.googleapis.com/v0/b/dairy-farm-record-system.appspot.com/o/Agora%20Logo%2F6-1YdaEP.jpeg?alt=media',
  // Firebase and additional libraries
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
  'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache:', CACHE_NAME);
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache open failed:', error);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200) return response;
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        });
      })
      .catch(() => caches.match('/index.html'))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames =>
        Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        )
      ),
      self.clients.claim()
    ])
  );
});
