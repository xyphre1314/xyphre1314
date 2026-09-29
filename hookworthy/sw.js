// Hookworthy service worker: cache-first for the app shell, network-first for fonts.
const CACHE = 'hookworthy-v3';
const SHELL = ['./', './index.html', './manifest.webmanifest', './assets/icon.svg', './assets/app-icon.svg', './assets/app-icon.png', './fonts/Geist-Variable.woff2', './fonts/GeistMono-Variable.woff2', './fonts/Caveat-500.woff2', './fonts/EBGaramond-500.woff2', './fonts/EBGaramond-400-italic.woff2', './fonts/Inter-400.woff2', './fonts/Inter-600.woff2'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    })));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req)));
  }
});
