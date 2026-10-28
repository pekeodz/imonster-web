// Service worker: cache-first for game files so the game can be played offline after loading once.
const CACHE = 'imonster-v9';
const CORE = ['./', 'index.html', 'css/game.css', 'js/lib/spine-webgl.js', 'js/lib/fengari.js', 'js/main.js', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const isCode = /\.(js|css|html|json|lua)$/.test(u.pathname) || u.pathname.endsWith('/');
  if (isCode) {
    // network-first for code/data so updates arrive; fall back to cache offline
    e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); } return r; }).catch(() => caches.match(e.request)));
  } else {
    // cache-first for images / audio
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); } return r; })));
  }
});
