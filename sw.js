// Servicio sin conexión de Captura SisAT.
// Para publicar una versión nueva, suba los archivos y cambie el número de VERSION.
const VERSION = 'sisat-v7';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'vendor/jspdf.umd.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Responde desde la copia guardada y la actualiza en segundo plano.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(guardado => {
      const red = fetch(req)
        .then(r => {
          if (r && r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
          return r;
        })
        .catch(() => guardado || caches.match('index.html'));
      return guardado || red;
    })
  );
});
