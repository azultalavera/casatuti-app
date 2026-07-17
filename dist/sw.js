const CACHE_NAME = 'casatuti-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

// Evento de Instalación: Pre-caché de recursos estáticos críticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-cacheando assets estáticos...');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting(); // Activar inmediatamente
});

// Evento de Activación: Limpieza de cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Limpiando caché antigua:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Tomar control inmediato de las pestañas activas
});

// Evento Fetch: Estrategia de caché personalizada
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Evitar interceptar llamadas a la API del backend real para evitar datos obsoletos
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // 2. Estrategia Stale-While-Revalidate para el frontend (HTML, JS, CSS, Fuentes, Imágenes)
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req).then((networkResponse) => {
          // Guardar una copia de la nueva respuesta en caché si fue exitosa (solo peticiones GET)
          if (networkResponse.status === 200 && req.method === 'GET') {
            cache.put(req, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[Service Worker] Falló la petición de red para:', req.url, err);
        });

        // Retornar la respuesta cacheada inmediatamente, o esperar a la de red si no estaba en caché
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// Evento Push: Recibir notificaciones del servidor
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: { url: '/' }
    };
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      if (windowClients.length > 0) {
        windowClients[0].focus();
      } else {
        clients.openWindow('/');
      }
    })
  );
});
