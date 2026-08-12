const SHELL_CACHE = 'utility-hub-shell-v0.6.0-performance-offline';
const TOOL_CACHE = 'utility-hub-tools-v0.6.0-performance-offline';
const CACHE_NAMES = [SHELL_CACHE, TOOL_CACHE];
const APP_SCOPE = self.registration.scope;
const PRECACHE_URLS = [
  APP_SCOPE,
  new URL('offline.html', APP_SCOPE).href,
  new URL('manifest.webmanifest', APP_SCOPE).href,
  new URL('icons/app-icon-192.png', APP_SCOPE).href,
  new URL('icons/app-icon-512.png', APP_SCOPE).href,
  new URL('icons/app-icon.svg', APP_SCOPE).href,
  new URL('icons/utility-3d-icons.svg', APP_SCOPE).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !CACHE_NAMES.includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(APP_SCOPE, copy));
          return response;
        })
        .catch(async () => (
          await caches.match(APP_SCOPE)
          ?? await caches.match(new URL('offline.html', APP_SCOPE).href)
          ?? Response.error()
        )),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(url.pathname.includes('/assets/') ? TOOL_CACHE : SHELL_CACHE).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_TOOL') return;
  const reply = event.ports?.[0];
  event.waitUntil((async () => {
    try {
      const urls = [...new Set([APP_SCOPE, ...PRECACHE_URLS, ...(event.data.urls ?? [])])]
        .filter((value) => {
          try {
            const url = new URL(value, APP_SCOPE);
            return url.origin === self.location.origin && url.href.startsWith(APP_SCOPE);
          } catch {
            return false;
          }
        });
      const cache = await caches.open(TOOL_CACHE);
      await cache.addAll(urls);
      reply?.postMessage({ ok: true, cached: urls.length, toolId: event.data.toolId });
    } catch (error) {
      reply?.postMessage({ ok: false, cached: 0, error: error instanceof Error ? error.message : 'Cache ไม่สำเร็จ' });
    }
  })());
});
