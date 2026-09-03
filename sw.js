const CACHE_NAME = "bambuseae-shell-v10";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./config.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./providers/registry.js",
  "./providers/bambuseae-free/models.js",
  "./providers/bambuseae-free/adapter.js",
  "./providers/bambuseae-fast/models.js",
  "./providers/bambuseae-fast/adapter.js",
  "./providers/openai/models.js",
  "./providers/openai/adapter.js",
  "./providers/anthropic/models.js",
  "./providers/anthropic/adapter.js",
  "./providers/google/models.js",
  "./providers/google/adapter.js",
  "./providers/xai/models.js",
  "./providers/xai/adapter.js",
  "./providers/deepseek/models.js",
  "./providers/deepseek/adapter.js",
  "./providers/meta/models.js",
  "./providers/meta/adapter.js",
  "./providers/mistral/models.js",
  "./providers/mistral/adapter.js",
  "./providers/qwen/models.js",
  "./providers/qwen/adapter.js",
  "./providers/perplexity/models.js",
  "./providers/perplexity/adapter.js",
  "./providers/cohere/models.js",
  "./providers/cohere/adapter.js",
  "./providers/local/models.js",
  "./providers/local/adapter.js",
  "./providers/free-web/models.js",
  "./providers/free-web/adapter.js",
  "./providers/gateway-free/models.js",
  "./providers/gateway-free/adapter.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("./index.html")))
  );
});
