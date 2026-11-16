// Service worker minimal : ne touche plus aux appels API (Supabase, POST, autres domaines).
// Seules les pages/fichiers du site (GET, même origine) passent par ici, avec repli hors-ligne.
const CACHE = 'aiclub-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  e.respondWith(fetch(req).catch(() => caches.match(req)))
})
