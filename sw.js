const CACHE_VERSION = 'coloring-app-v20260222zg';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

const STATIC_ASSETS = [
    './',
    './index.html',
    './styles.css',
    './manifest.webmanifest',
    './favicon.svg',
    './icons/icon-192.png',
    './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;

    // Navigation: network first, fallback to cached index.
    if (req.mode === 'navigate') {
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
                    return res;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    if (!sameOrigin) return;

    // Static/resources: cache first, then network fallback.
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (!res || res.status !== 200 || res.type === 'opaque') return res;
                const copy = res.clone();
                caches.open(RUNTIME_CACHE).then((cache) => cache.put(req, copy));
                return res;
            });
        })
    );
});
