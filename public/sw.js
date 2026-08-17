const SHELL_CACHE = 'utility-hub-shell-v0.8.0-audio-suite';
const TOOL_CACHE = 'utility-hub-tools-v0.8.0-audio-suite';
const CACHE_NAMES = [SHELL_CACHE, TOOL_CACHE];
const APP_SCOPE = self.registration.scope;
const APP_SHELL_URL = new URL('index.html', APP_SCOPE).href;
const PRECACHE_URLS = [
  APP_SCOPE,
  APP_SHELL_URL,
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
        .then(async (response) => {
          if (!response.ok) throw new Error(`Navigation failed with ${response.status}`);
          const cache = await caches.open(SHELL_CACHE);
          await Promise.all([
            cache.put(APP_SCOPE, response.clone()),
            cache.put(APP_SHELL_URL, response.clone()),
          ]);
          return response;
        })
        .catch(async () => (
          await caches.match(APP_SHELL_URL)
          ?? await caches.match(APP_SCOPE)
          ?? await caches.match(new URL('offline.html', APP_SCOPE).href)
          ?? Response.error()
        )),
    );
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(request, { ignoreVary: true });
    if (cached) return cached;

    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(url.pathname.includes('/assets/') ? TOOL_CACHE : SHELL_CACHE);
      await cache.put(request, response.clone());
    }
    return response;
  })());
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
