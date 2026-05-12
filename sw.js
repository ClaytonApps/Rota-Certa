/**
 * Service Worker — Rota Certa (raiz).
 *
 * Cobre toda a aplicação: landing (index.html), app (app.html), manifest,
 * ícones e CDNs externos. App instalado abre direto em app.html.
 *
 *   - App shell  → cache-first
 *   - Externos   → stale-while-revalidate
 */
const CACHE_NAME = 'rota-certa-v11';
const APP_SHELL = [
    './',
    './index.html',
    './app.html',
    './manifest.webmanifest',
    './icon.svg',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable.png',
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
        event.respondWith(
            caches.match(req).then(cached => cached || fetch(req).then(res => {
                const copy = res.clone();
                caches.open(CACHE_NAME).then(c => c.put(req, copy));
                return res;
            }).catch(() => caches.match('./index.html')))
        );
    } else {
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
