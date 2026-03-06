/* eslint-disable no-restricted-globals */

// UniGuide Service Worker
// Strategy: Stale-While-Revalidate for API, Cache-First for static assets.

const CACHE_NAME = 'uniguide-v2'; // Incremented version to force update
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // Strategy: Network-First for API and index.html
    // This ensures that when online, the latest data/code is always shown.
    if (url.pathname.includes('/api/') || url.pathname === '/' || url.pathname.endsWith('/index.html')) {
        event.respondWith(
            fetch(request).then((networkResponse) => {
                if (networkResponse.ok) {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
                }
                return networkResponse;
            }).catch(() => {
                // Fallback to cache if network fails
                return caches.match(request);
            })
        );
        return;
    }

    // Strategy: Cache-First for versioned static assets (JS, CSS, Images)
    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            const fetchPromise = fetch(request).then((networkResponse) => {
                if (networkResponse.ok && (url.origin === self.location.origin)) {
                    const cacheCopy = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, cacheCopy));
                }
                return networkResponse;
            });

            return cachedResponse || fetchPromise;
        })
    );
});
