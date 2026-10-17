/* خدمة بسيطة: الشبكة أولًا، ولو مفيش نت يرجّع آخر نسخة محفوظة من الصفحة، ولو الصفحة عمرها ما اتحمّلت يعرض offline.html */
const CACHE = 'hakim-pages-v2';
const OFFLINE_URL = 'offline.html';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.add(OFFLINE_URL)).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(fetch(r).then(res => {
    if (res.ok && r.mode === 'navigate') { const c = res.clone(); caches.open(CACHE).then(ca => ca.put(r, c)); }
    return res;
  }).catch(() => caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match(OFFLINE_URL) : undefined)).then(m => m || new Response('', { status: 504, statusText: 'offline' }))));
});
