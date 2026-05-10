/**
 * Service Worker — Rota Certa
 *
 * Faz cache do app shell (HTML, manifest, ícones) e dos CDNs externos
 * (Bootstrap, Bootstrap Icons, Inter) na primeira visita. A partir daí o
 * app abre instantaneamente e funciona offline.
 *
 * Estratégia:
 *   - App shell  → cache-first (versionado por CACHE_NAME)
 *   - Externos   → stale-while-revalidate
 */
const CACHE_NAME = 'rota-certa-v2';
const APP_SHELL = [
    './',
    './index.html',
    './manifest.webmanifest',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    const sameOrigin = url.origin === self.location.origin;

    if (sameOrigin) {
        // Cache-first para o app shell
        event.respondWith(
            caches.match(req).then(cached => cached || fetch(req).then(res => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(req, copy));
                return res;
            }).catch(() => caches.match('./index.html')))
        );
    } else {
        // Stale-while-revalidate para CDNs externos
        event.respondWith(
            caches.open(CACHE_NAME).then(cache =>
                cache.match(req).then(cached => {
                    const fetched = fetch(req).then(res => {
                        if (res.ok) cache.put(req, res.clone());
                        return res;
                    }).catch(() => cached);
                    return cached || fetched;
                })
            )
        );
    }
});
