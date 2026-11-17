// Service worker template. `vite build` fills in the cache version and the list of built files
// (see the `serviceWorker` plugin in vite.config.ts) and writes the result to dist/sw.js.
const CACHE = 'psh-__VERSION__'
const ASSETS = '__ASSETS__'
// Match by URL only. <script crossorigin> / <link crossorigin> requests carry different headers than the
// precache requests, and a server "Vary" header would otherwise make them miss the cache when offline.
const MATCH = { ignoreVary: true }

// Precache the whole app so it opens with no network at all.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  )
})

// Drop caches of older builds.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('psh-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  // The page itself: network first, so a new build is picked up as soon as you are online.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).catch(() => caches.match('./index.html', MATCH).then((hit) => hit ?? Response.error())))
    return
  }
  // Built files have content hashes in their names: cache first is safe.
  event.respondWith(caches.match(req.url, MATCH).then((hit) => hit ?? fetch(req)))
})
