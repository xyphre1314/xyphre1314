// Hookworthy service worker: cache-first for the app shell, network-first for fonts.
const CACHE = 'hookworthy-v34';
let SLOW = 0; /* when the network just timed out, core.js comes from the cache right away instead of waiting again */
/* the page is cached once (as ./index.html); the big photo sprite is cached when a page first uses it */
const SHELL = ['./index.html', './core.js', './manifest.webmanifest', './assets/icon.svg', './assets/app-icon.svg', './assets/app-icon.png', './fonts/GeistMono-Variable.woff2', './fonts/EBGaramond-Regular.woff2', './fonts/EBGaramond-Italic.woff2', './fonts/Figtree-Regular.woff2', './fonts/Caveat-500.woff2', './fonts/Inter-400.woff2', './fonts/Inter-600.woff2', './assets/people/avatars.jpg', './assets/people/avatars-2.jpg', './assets/people/you.jpg'];

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
    if (/^\/(api|auth|login|r|v)(\/|$)/.test(url.pathname) || url.searchParams.has('review') || url.searchParams.has('vote')) return;
    /* the page itself: network first so updates land, cache when offline */
    if (req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/core.js')) {
      /* network first, but a slow network falls back to the cached copy after 3 seconds instead of hanging */
      const key = req.mode === 'navigate' ? './index.html' : req;
      /* only the app's own page becomes the offline copy, never some other file opened in a tab */
      const isApp = req.mode !== 'navigate' || /^\/(index\.html)?$/.test(url.pathname.replace(/^.*\/(?=[^/]*$)/, '/'));
      const net = fetch(req).then(res => { if (res.ok && isApp && (req.mode !== 'navigate' || /text\/html/.test(res.headers.get('content-type') || ''))) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); } return res; });
      const cached = () => caches.match(key).then(hit => hit || caches.match('./index.html'));
      if (req.mode !== 'navigate' && Date.now() - SLOW < 20000) { e.respondWith(caches.match(key).then(hit => hit || net)); return; }
      e.respondWith(new Promise(resolve => { let done = false; const t = setTimeout(() => cached().then(hit => { if (hit && !done) { done = true; SLOW = Date.now(); resolve(hit); } }), 3000);
        net.then(res => { clearTimeout(t); if (!done) { done = true; resolve(res); } }).catch(() => { clearTimeout(t); cached().then(hit => { if (!done) { done = true; resolve(hit || Response.error()); } }); }); }));
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

/* breakout alerts: the server pushes when a post is taking off; tapping opens its replies */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch { d = { title: 'Hookworthy', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Hookworthy', { body: d.body || '', tag: d.tag || 'hookworthy', renotify: true, icon: './assets/app-icon.png', badge: './assets/icon.svg', data: { url: d.url || './' } }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close(); const url = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    const open = list.find(c => new URL(c.url).origin === location.origin);
    if (open) { open.postMessage({ type: 'breakout', url }); return open.focus(); }
    return self.clients.openWindow(url);
  }));
});
