/* Envision PWA service worker */
const CACHE = "envision-pwa-v4";

/* Minimal shell precache for installability only. No images, no large assets. */
const PRECACHE = [
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-180.png",
  "/icons/icon-512-maskable.png"
];

/* Install: precache only the tiny installability shell, then take over immediately. */
self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return Promise.allSettled(
        PRECACHE.map(function (url) {
          return cache.add(new Request(url, { cache: "reload" }));
        })
      );
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

/* Activate: drop any old cache versions, then claim open clients immediately. */
self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE; })
            .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Always-fresh: network-first for everything. Cache is only an offline fallback,
   and a successful network response is never replaced by a cached one. */
self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") { return; }

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) { return; }

  event.respondWith(
    fetch(request).then(function (response) {
      /* Only cache full 200 responses — Cache.put() rejects partial (206)
         responses, which would surface as unhandled promise rejections. */
      if (response && response.status === 200) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put(request, copy); })
          .catch(function () { /* quota exceeded or opaque put failure — ignore */ });
      }
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) { return cached; }
        if (request.mode === "navigate") { return caches.match("/"); }
        return Response.error();
      });
    })
  );
});
