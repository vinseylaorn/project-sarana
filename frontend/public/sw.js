
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests — let POST, PUT, DELETE, WebSocket upgrades, etc. pass through untouched
  if (event.request.method !== "GET") {
    return;
  }

  // Only handle same-origin requests — avoid interfering with cross-origin calls (APIs, CDNs, etc.)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      // If the network fetch fails, just let it fail naturally instead of throwing inside the SW
      return new Response("Network error", {
        status: 408,
        headers: { "Content-Type": "text/plain" },
      });
    })
  );
});