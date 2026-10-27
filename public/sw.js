const CACHE = 'build-binder-v0.3-react-v2'
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
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          event.waitUntil(
            caches.open(CACHE)
              .then((cache) => cache.put(event.request, copy))
              .catch((error) => console.warn('Could not update the offline cache', error)),
          )
        }
        return response
      })
      .catch(async (networkError) => {
        const cached = await caches.match(event.request)
        if (cached) return cached
        if (event.request.mode === 'navigate') {
          const shell = await caches.match('/index.html')
          if (shell) return shell
        }
        throw networkError
      }),
  )
})
