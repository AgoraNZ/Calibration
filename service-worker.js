// Bump the cache name version each time you release a new update:
const CACHE_NAME = 'dairy-shed-cache-v52';  // <--- increment for new version

const urlsToCache = [
    '/',
    '/index.html',
    // Add any other local assets or URLs that need to be cached
    'https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css',
    'https://i.postimg.cc/htZPjx5g/logo-89.png',
    // Add the JS scripts
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-storage-compat.js',
    'https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.0.3/dexie.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js'
    // And any other assets
];

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .catch(function (error) {
                console.error('Failed to cache resources:', error);
            })
    );
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            if (response) {
                return response;
            }
            return fetch(event.request).then(function (response) {
                if (!response || response.status !== 200) {
                    return response;
                }
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                    .then(function (cache) {
                        cache.put(event.request, responseToCache);
                    });
                return response;
            });
        }).catch(function () {
            return caches.match('/index.html');
        })
    );
});

self.addEventListener('activate', function (event) {
    // Claim any clients immediately, so that the new service worker takes control.
    event.waitUntil(
        Promise.all([
            caches.keys().then(function (cacheNames) {
                return Promise.all(
                    cacheNames.map(function (cacheName) {
                        if (cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            self.clients.claim()
        ])
    );
});
