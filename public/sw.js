const CACHE_NAME = 'utility-hub-v0.2.0';
const APP_SCOPE = self.registration.scope;
const PRECACHE_URLS = [
  APP_SCOPE,
  new URL('offline.html', APP_SCOPE).href,
  new URL('manifest.webmanifest', APP_SCOPE).href,
  new URL('icons/app-icon-192.png', APP_SCOPE).href,
  new URL('icons/app-icon-512.png', APP_SCOPE).href,
  new URL('icons/app-icon.svg', APP_SCOPE).href,
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
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
          caches.open(CACHE_NAME).then((cache) => cache.put(APP_SCOPE, copy));
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
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    })),
  );
});
