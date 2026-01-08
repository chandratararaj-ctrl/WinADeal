/// <reference lib="webworker" />

const CACHE_NAME = 'winadeal-v1';
const RUNTIME_CACHE = 'winadeal-runtime';

// Assets to cache on install
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
];

// Install event - cache essential assets
self.addEventListener('install', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    // Force the waiting service worker to become the active service worker
    (self as any).skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
                    .map((name) => caches.delete(name))
            );
        })
    );
    // Claim all clients immediately
    (self as any).clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event: FetchEvent) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip API calls (always fetch from network)
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request).catch(() => {
                return new Response(
                    JSON.stringify({ error: 'Offline', message: 'You are currently offline' }),
                    {
                        headers: { 'Content-Type': 'application/json' },
                        status: 503,
                    }
                );
            })
        );
        return;
    }

    // Network first, fallback to cache strategy
    event.respondWith(
        fetch(request)
            .then((response) => {
                // Clone the response
                const responseToCache = response.clone();

                // Cache the fetched response
                caches.open(RUNTIME_CACHE).then((cache) => {
                    cache.put(request, responseToCache);
                });

                return response;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(request).then((cachedResponse) => {
                    if (cachedResponse) {
                        return cachedResponse;
                    }

                    // Return offline page for navigation requests
                    if (request.mode === 'navigate') {
                        return caches.match('/index.html').then((response) => {
                            return response || new Response('Offline', { status: 503 });
                        });
                    }

                    return new Response('Offline', { status: 503 });
                });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event: any) => {
    if (event.tag === 'sync-orders') {
        event.waitUntil(syncOrders());
    }
});

async function syncOrders() {
    // Implement order sync logic here
    console.log('Syncing orders...');
}

// Push notifications
self.addEventListener('push', (event: any) => {
    const data = event.data?.json() ?? {};
    const title = data.title || 'WinADeal';
    const options = {
        body: data.body || 'You have a new notification',
        icon: '/logo192.png',
        badge: '/logo192.png',
        data: data.data,
        actions: data.actions || [],
    };

    event.waitUntil((self as any).registration.showNotification(title, options));
});

// Notification click
self.addEventListener('notificationclick', (event: any) => {
    event.notification.close();

    event.waitUntil(
        (self as any).clients.openWindow(event.notification.data?.url || '/')
    );
});

export { };
