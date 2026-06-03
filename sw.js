/* Envision PWA service worker */
const CACHE = "envision-pwa-v1";

/* Full app shell: document, manifest, every icon, every font, every image. */
const PRECACHE = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-180.png",
  "/icons/icon-512-maskable.png",
  "/fonts/montserrat-400.woff2",
  "/fonts/montserrat-500.woff2",
  "/fonts/montserrat-600.woff2",
  "/fonts/montserrat-700.woff2",
  "/fonts/montserrat-800.woff2",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2005_55_01%20PM.png",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2005_56_43%20PM.png",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2006_00_42%20PM.png",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2006_02_11%20PM.png",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2006_10_31%20PM.png",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2006_17_47%20PM.png",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2006_19_47%20PM.png",
  "/images/ChatGPT%20Image%20May%2018%2C%202026%20at%2008_05_09%20PM.png",
  "/images/ChatGPT%20Image%20May%2019%2C%202026%20at%2009_44_08%20AM.png",
  "/images/ChatGPT%20Image%20May%2019%2C%202026%20at%2009_59_03%20AM.png",
  "/images/ChatGPT%20Image%20May%2019%2C%202026%20at%2010_00_42%20AM.png",
  "/images/DSC_6255.jpg",
  "/images/Envision-Day_01-0793.jpg",
  "/images/Envision-Day_01-0989.jpg",
  "/images/Envision-Day_01-1028.jpg",
  "/images/Envision-Workforce-employee-dallas-manufacoring.png",
  "/images/Envision-dallas-manufactoringfloor.png",
  "/images/Envision-print-lableroll.png",
  "/images/Envision-wichita-highangle-buildingphoto.png",
  "/images/EnvisionHandLogo.png",
  "/images/Envision_PrimaryFullColor_RBG.png",
  "/images/Envision_PrimaryLogo_WHITE%5B21979578%5D.png",
  "/images/Visibelt-productshot-instore.png",
  "/images/employee-factory-wichita.png",
  "/images/envision-building-sideangle.png",
  "/images/envision-call-center-employee-headset.png",
  "/images/envision-child-development-center.png",
  "/images/envision-dallas-building-exterior.png",
  "/images/envision-dallas-warehouse-aisle.png",
  "/images/envision-dallas-warehouse-forklift.png",
  "/images/envision-dallas-writing-instruments-assembly.jpg",
  "/images/envision-employee-man-headset-white-cane.png",
  "/images/envision-employee-with-guide-dog-factory.png",
  "/images/envision-employee-woman-with-white-cane.png",
  "/images/envision-manufacturing-floor-bag-machines.png",
  "/images/envision-warehouse-interior-panoramic.png",
  "/images/envision-white-cane-day-walk.jpg",
  "/images/envision-youth-program-students-smiling.png",
  "/images/favicon-180.png",
  "/images/favicon-32.png",
  "/images/favicon-512.png",
  "/images/favicon.ico",
  "/images/printing-brailing.png"
];

/* Install: precache the app shell. Tolerant so one failed asset cannot abort install. */
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

/* Activate: drop any old cache versions. */
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

function isHtmlRequest(request) {
  return request.mode === "navigate" ||
         (request.headers.get("accept") || "").indexOf("text/html") !== -1;
}

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") { return; }

  var url = new URL(request.url);
  if (url.origin !== self.location.origin) { return; }

  /* Network-first for the HTML document so content edits show up when online. */
  if (isHtmlRequest(request)) {
    event.respondWith(
      fetch(request).then(function (response) {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) { cache.put("/", copy); });
        return response;
      }).catch(function () {
        return caches.match(request).then(function (cached) {
          return cached || caches.match("/");
        });
      })
    );
    return;
  }

  /* Cache-first for images, fonts, and icons. */
  if (/^\/(images|fonts|icons)\//.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) { return cached; }
        return fetch(request).then(function (response) {
          if (response && response.ok) {
            var copy = response.clone();
            caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
          }
          return response;
        });
      })
    );
    return;
  }
});
