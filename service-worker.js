const CACHE_NAME = "quiz-app-cache-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/index.js",
  "/quiz.html",
  "/quiz.css",
  "/quiz.js",
  "/thankyou.html",
  "/thankyou.css",
  "/thankyou.js",
  "/admin-login.html",
  "/admin-login.css",
  "/admin-login.js",
  "/admin.html",
  "/admin.css",
  "/admin.js",
  "/students.json",
  "/admin.json",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
