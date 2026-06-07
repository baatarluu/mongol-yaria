// ─────────────────────────────────────────────────────────────
//  Service Worker — офлайн дэмжлэг + апп болгож суулгах боломж.
//
//  Стратеги:
//   • /api/* дуудлагыг ХЭЗЭЭ Ч кэшлэхгүй (өгөгдөл шинэ байх ёстой).
//   • Навигаци (хуудас нээх): network-first → офлайн үед index.html.
//   • Бусад GET (JS/CSS/зураг): stale-while-revalidate.
// ─────────────────────────────────────────────────────────────

const CACHE = 'classroom-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // API болон бусад origin-ийг шууд дамжуулна (кэшлэхгүй).
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Хуудас нээх хүсэлт: network-first, офлайн бол index.html.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  // Статик нөөц: кэшээс шууд өгөөд, далд горимд шинэчилнэ.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
