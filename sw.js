/**
 * Service Worker - English Flashcards B1/B2
 * Zapewnia działanie offline i cache zasobów
 */

const CACHE_NAME = 'english-flashcards-v1.0.0';
const STATIC_CACHE = 'english-flashcards-static-v1';
const DYNAMIC_CACHE = 'english-flashcards-dynamic-v1';

// Zasoby do cache'owania
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/main.css',
  '/css/themes.css', 
  '/css/components.css',
  '/css/responsive.css',
  '/js/app.js',
  '/js/config/constants.js',
  '/js/utils/utils.js',
  '/js/utils/storage-manager.js',
  '/js/utils/notification-manager.js',
  '/js/modules/data-loader.js',
  '/js/modules/theme-manager.js',
  '/js/modules/audio-manager.js',
  '/js/modules/image-manager.js',
  '/js/modules/progress-manager.js',
  '/js/modules/flashcard-manager.js',
  '/js/modules/quiz-manager.js',
  '/js/modules/module-loader.js',
  '/data/categories.json'
];

// URLs do cache'owania dynamicznego
const DYNAMIC_URLS = [
  '/data/vocabulary.json'
];

// Install event
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('SW: Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Static assets cached');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Error caching static assets:', error);
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Return cached version
          return cachedResponse;
        }

        // Network first for dynamic content
        return fetch(request)
          .then(response => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone response for caching
            const responseToCache = response.clone();

            // Cache dynamic content
            if (shouldCacheDynamically(request.url)) {
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  cache.put(request, responseToCache);
                });
            }

            return response;
          })
          .catch(error => {
            console.log('SW: Network failed, trying cache...', error);
            
            // Return offline page for navigation requests
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // Return a basic offline response for other requests
            return new Response('Offline', {
              status: 200,
              statusText: 'Offline',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Helper function to determine if URL should be cached dynamically
function shouldCacheDynamically(url) {
  return DYNAMIC_URLS.some(pattern => url.includes(pattern)) ||
         url.includes('/data/') ||
         url.includes('.json');
}

// Background sync for quiz results
self.addEventListener('sync', event => {
  if (event.tag === 'quiz-results-sync') {
    event.waitUntil(
      syncQuizResults()
    );
  }
});

// Sync quiz results when online
async function syncQuizResults() {
  try {
    // Get stored quiz results that need syncing
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('quiz-results')) {
        // Process sync logic here
        console.log('SW: Syncing quiz results...');
      }
    }
  } catch (error) {
    console.error('SW: Error syncing quiz results:', error);
  }
}

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Czas na naukę angielskiego!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'english-flashcards-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'study',
        title: 'Rozpocznij naukę',
        icon: '/icons/study-action.png'
      },
      {
        action: 'later',
        title: 'Przypomnij później',
        icon: '/icons/later-action.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'English Flashcards', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  const action = event.action;
  
  if (action === 'study') {
    // Open app in study mode
    event.waitUntil(
      clients.openWindow('/?mode=flashcards&notification=true')
    );
  } else if (action === 'later') {
    // Schedule another reminder
    console.log('SW: Scheduling later reminder...');
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message handler for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

// Error handling
self.addEventListener('error', event => {
  console.error('SW: Error occurred:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('SW: Unhandled promise rejection:', event.reason);
});