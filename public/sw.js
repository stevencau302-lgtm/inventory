const CACHE_NAME = 'nexo-v1'
const OFFLINE_URL = '/'

// Files to cache for offline shell
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
]

// Install: cache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and supabase API calls
  if (request.method !== 'GET') return
  if (url.hostname.includes('supabase')) return

  // For navigation requests, try network first, fallback to cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // For assets: cache-first
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/favicon')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      })
    )
    return
  }
})

// Listen for sync events (background sync for offline transactions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.respondWith(syncOfflineTransactions())
  }
})

async function syncOfflineTransactions() {
  // This will be triggered by the app when back online
  const clients = await self.clients.matchAll()
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_OFFLINE_DATA' })
  })
}

// Listen for messages from app
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
