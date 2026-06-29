/**
 * Kid Hub — Service Worker
 *
 * Strategy:
 *   - Static assets (_next/static, icons, sounds, fonts): Cache-first, then background update.
 *   - Navigation requests (HTML pages): Network-first with cache fallback.
 *   - All other GET requests: Network-first.
 *
 * CACHE_VERSION is derived from the ?v= query param injected by ServiceWorkerRegistrar at
 * registration time. The param equals NEXT_PUBLIC_BUILD_ID (git SHA slice / timestamp),
 * so the version changes automatically on every Vercel deploy without manual bumps.
 */

const _buildId = new URLSearchParams(self.location.search).get('v') ?? '1';
const CACHE_VERSION = `kid-hub-v${_buildId}`;

/** Assets to pre-cache on install (app shell). */
const PRECACHE_URLS = ['/', '/dashboard', '/schedule', '/grades', '/manifest.json'];

// ─── Install: pre-cache the app shell ────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ─── Activate: purge stale caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// ─── Fetch: route-based caching policy ───────────────────────────────────────
self.addEventListener('fetch', (event) => {
  /** Only intercept same-origin GET requests. */
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/sounds/') ||
    /\.(png|jpg|jpeg|ico|svg|webp|mp3|woff2?)$/.test(url.pathname);

  if (isStaticAsset) {
    // Cache-first: serve from cache, then update cache in background.
    event.respondWith(
      caches.open(CACHE_VERSION).then((cache) =>
        cache.match(event.request).then((cached) => {
          const networkFetch = fetch(event.request).then((response) => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          return cached ?? networkFetch;
        }),
      ),
    );
    return;
  }

  // Network-first for navigation and API: fall back to cache when offline.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached ?? Response.error())),
  );
});
