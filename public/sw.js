// Service Worker بسيط — PWA
// يحفظ الملفات الأساسية ويرجّعها لما مفيش نت

const CACHE_NAME = "aljazeera5-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Simple pass-through: مفيش caching حالياً — نضيفه لاحقاً
self.addEventListener("fetch", (event) => {
  // نتركه يمر عادي — PWA يقبل service worker حتى لو مفيش caching
  return;
});
