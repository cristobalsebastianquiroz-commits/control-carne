// ═══════════════════════════════════════════
// sw.js — Service Worker
// Control Carne PWA
// ═══════════════════════════════════════════

const CACHE_NAME = "control-carne-v1.2";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/app.js",
  "/js/firebase.js",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Roboto+Mono:wght@400;700&display=swap"
];

// ── INSTALL: cachear assets estáticos ────
self.addEventListener("install", event => {
  console.log("[SW] Instalando v1.2...");
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS.map(url => {
        return new Request(url, { cache: "reload" });
      })).catch(err => {
        console.warn("[SW] Error cacheando algunos assets:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: limpiar caches viejos ──────
self.addEventListener("activate", event => {
  console.log("[SW] Activando...");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: cache-first para estáticos ────
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // No interceptar Firebase / Google APIs
  if (
    url.hostname.includes("firebaseio.com") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("gstatic.com") ||
    url.hostname.includes("firestore.googleapis.com")
  ) {
    return; // dejar pasar sin cache
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      return fetch(request)
        .then(response => {
          // Solo cachear respuestas válidas
          if (!response || response.status !== 200 || response.type === "opaque") {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Fallback offline: devolver index.html para navegación
          if (request.mode === "navigate") {
            return caches.match("/index.html");
          }
        });
    })
  );
});

// ── BACKGROUND SYNC (cuando vuelve internet) ─
self.addEventListener("sync", event => {
  if (event.tag === "sync-ciclos") {
    console.log("[SW] Sincronizando ciclos pendientes...");
    event.waitUntil(syncPendingCycles());
  }
});

async function syncPendingCycles() {
  // La lógica de sync real ocurre en app.js via Firebase offline SDK
  console.log("[SW] Sync completado");
}
