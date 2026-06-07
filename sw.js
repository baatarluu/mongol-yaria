/* ============================================================
   Монгол.яриа — Service Worker (офлайн дэмжлэг)
   Статик файлуудыг кэшлэж, интернетгүй үед апп нээгдэнэ.
   AI хүсэлт (/api/ai) болон яриа таних нь интернет шаардана.
   ============================================================ */

const CACHE = "mongol-yaria-v1";

// Аппын "бүрхүүл" — офлайн ажиллахад шаардлагатай статик файлууд
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png",
];

// Суулгах үед бүрхүүлийг урьдчилан кэшлэх
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

// Идэвхжих үед хуучин кэшийг цэвэрлэх
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Зөвхөн GET хүсэлтийг кэшлэнэ
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // AI болон бусад API хүсэлтийг кэшлэхгүй — үргэлж сүлжээгээр
  if (url.pathname.startsWith("/api/") || url.pathname.includes("/.netlify/functions/")) {
    return;
  }

  // Навигаци (хуудас нээх): сүлжээ эхэлж, амжилтгүй бол кэшээс
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("./index.html"))
    );
    return;
  }

  // Статик нөөц: кэш эхэлж, дараа нь сүлжээ (stale-while-revalidate)
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && (url.origin === self.location.origin)) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
