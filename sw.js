// Servicio sin conexión de Captura SisAT.
// Para publicar una versión nueva, suba los archivos y cambie el número de VERSION.
const VERSION = 'sisat-v9';
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

self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const pagina = req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (pagina) {
    // La página va primero a la red, para que una actualización se vea de inmediato.
    // Sin conexión se usa la última copia guardada.
    e.respondWith(
      fetch(url.href, { cache: 'no-store' })
        .then(r => {
          if (r && r.ok) { const copia = r.clone(); caches.open(VERSION).then(c => c.put(req, copia)); }
          return r;
        })
        .catch(() => caches.match(req, { ignoreSearch: true }).then(h => h || caches.match('index.html')))
    );
    return;
  }
  // Lo demás (íconos, librerías) responde desde la copia guardada y se actualiza en segundo plano.
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
