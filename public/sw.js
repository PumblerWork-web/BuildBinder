const CACHE = 'build-binder-v0.3-react'
const SHELL = ['/', '/manifest.webmanifest', '/assets/favicon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (cache) => {
      const response = await fetch('/index.html')
      const html = await response.clone().text()
      const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((match) => match[1])
      await cache.put('/index.html', response)
      await cache.addAll([...new Set([...SHELL, ...assets])])
    }),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(event.request, copy))
          }
          return response
        })
        .catch(() => cached || caches.match('/index.html'))

      return cached || network
    }),
  )
})
