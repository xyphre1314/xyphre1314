// Hookworthy service worker: cache-first for the app shell, network-first for fonts.
const CACHE = 'hookworthy-v13';
const SHELL = ['./', './index.html', './core.js', './manifest.webmanifest', './assets/icon.svg', './assets/app-icon.svg', './assets/app-icon.png', './fonts/GeistMono-Variable.woff2', './fonts/EBGaramond-Regular.woff2', './fonts/EBGaramond-Italic.woff2', './fonts/Figtree-Regular.woff2', './fonts/Caveat-500.woff2', './fonts/Inter-400.woff2', './fonts/Inter-600.woff2', './assets/people/avatars.jpg', './assets/people/photos.jpg', './assets/people/avatars-2.jpg', './assets/people/you.jpg'];

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
    /* live data is never cached: the server's API, sign-in and review links */
    if (/^\/(api|auth|login|r)(\/|$)/.test(url.pathname) || url.searchParams.has('review')) return;
    /* the page itself: network first so updates land, cache when offline */
    if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/core.js')) {
      e.respondWith(fetch(req).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html'))));
      return;
    }
    e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res;
    })));
  } else if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res;
    }).catch(() => caches.match(req)));
  }
});
