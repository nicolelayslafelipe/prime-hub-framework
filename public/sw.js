// Service Worker for Push Notifications and PWA
// VERSÃO INCREMENTADA PARA FORÇAR ATUALIZAÇÃO
const CACHE_VERSION = 'v4';
const CACHE_NAME = `deliveryos-${CACHE_VERSION}`;
const STATIC_CACHE = `deliveryos-static-${CACHE_VERSION}`;

// Assets to cache for offline
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Offline fallback page HTML
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sem Conexão</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .icon svg { width: 40px; height: 40px; opacity: 0.8; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { opacity: 0.7; margin-bottom: 24px; line-height: 1.5; }
    button {
      background: #10b981;
      color: white;
      border: none;
      padding: 12px 32px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, background 0.2s;
    }
    button:hover { background: #059669; transform: scale(1.02); }
    button:active { transform: scale(0.98); }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
      </svg>
    </div>
    <h1>Sem Conexão</h1>
    <p>Não foi possível conectar à internet. Verifique sua conexão e tente novamente.</p>
    <button onclick="location.reload()">Tentar Novamente</button>
  </div>
</body>
</html>
`;

// Handle push notifications
self.addEventListener('push', function(event) {
  console.log('[SW] Push received:', event);
  
  let data = {
    title: 'DeliveryOS',
    body: 'Nova notificação',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    tag: 'default',
    data: {}
  };
  
  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || data.tag,
        data: payload.data || data.data
      };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
  }
  
  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [200, 100, 200, 100, 200],
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Ver pedido' },
      { action: 'dismiss', title: 'Dispensar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  // Focus or open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to focus an existing window
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.focus();
          // Send message to navigate if needed
          if (event.notification.data && event.notification.data.url) {
            client.postMessage({
              type: 'NOTIFICATION_CLICK',
              url: event.notification.data.url
            });
          }
          return;
        }
      }
      // Open new window if no existing window
      const url = event.notification.data?.url || '/orders';
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle service worker installation
self.addEventListener('install', function(event) {
  console.log('[SW] Installing service worker', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        // Cache offline fallback
        cache.put('/offline.html', new Response(OFFLINE_HTML, {
          headers: { 'Content-Type': 'text/html' }
        }));
        return cache.addAll(STATIC_ASSETS.filter(url => !url.includes('icon')));
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
      .catch(err => {
        console.log('[SW] Cache failed, continuing anyway:', err);
        return self.skipWaiting();
      })
  );
});

// Handle service worker activation
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating service worker', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              // Delete ALL old caches (different version)
              return !cacheName.includes(CACHE_VERSION);
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return clients.claim();
      })
  );
});

// Fetch handler with network-first strategy for API and HTML
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests except for specific domains
  if (url.origin !== location.origin) {
    // Allow Supabase storage for logos/images
    if (!url.hostname.includes('supabase')) {
      return;
    }
  }
  
  // NETWORK-FIRST for HTML pages (most important for updates!)
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone and cache the response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Try cache, then offline page
          return caches.match(event.request)
            .then(cached => cached || caches.match('/offline.html'));
        })
    );
    return;
  }
  
  // Network-first for API calls
  if (url.pathname.startsWith('/api') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Stale-while-revalidate for images
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => cachedResponse);
          
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }
  
  // Cache-first for other static assets (JS, CSS)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Update cache in background
          fetch(event.request).then(response => {
            if (response.ok && url.origin === location.origin) {
              caches.open(STATIC_CACHE).then(cache => {
                cache.put(event.request, response);
              });
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          if (response.ok && url.origin === location.origin) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        });
      })
  );
});

// Handle messages from the app
self.addEventListener('message', function(event) {
  console.log('[SW] Message received:', event.data);
  
  if (event.data === 'SKIP_WAITING' || event.data?.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data === 'CLEAR_CACHE' || event.data?.type === 'CLEAR_CACHE') {
    console.log('[SW] Clear cache requested');
    caches.keys().then(names => {
      Promise.all(names.map(name => caches.delete(name))).then(() => {
        console.log('[SW] All caches cleared');
        // Notify client
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_CLEARED' });
        }
      });
    });
  }
  
  // Handle manifest update check
  if (event.data?.type === 'CHECK_UPDATE') {
    console.log('[SW] Checking for updates...');
    self.registration.update();
  }
});
