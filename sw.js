// ─── Hydro PWA — Service Worker ──────────────────────────────────────────────
const CACHE_NAME = 'hydro-v1'
const FICHIERS_A_CACHER = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json'
]

// ── 1. INSTALLATION : on met tout en cache ────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FICHIERS_A_CACHER)
    })
  )
  self.skipWaiting()
})

// ── 2. ACTIVATION : on nettoie les anciens caches ────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(noms => {
      return Promise.all(
        noms
          .filter(nom => nom !== CACHE_NAME)
          .map(nom => caches.delete(nom))
      )
    })
  )
  self.clients.claim()
})

// ── 3. FETCH : cache d'abord, réseau ensuite ─────────────────────────────────
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request)
    })
  )
})

// ── 4. NOTIFICATIONS : reçoit les messages de l'app ──────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'NOTIFIER') {
    self.registration.showNotification('💧 Hydro', {
      body: event.data.message || 'N\'oublie pas de boire de l\'eau !',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      vibrate: [200, 100, 200],
      tag: 'hydro-rappel',
      renotify: true
    })
  }
})

// ── 5. Clic sur la notification → ouvre l'app ────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientsList => {
      if (clientsList.length > 0) {
        return clientsList[0].focus()
      }
      return clients.openWindow('/')
    })
  )
})
