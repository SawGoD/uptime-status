const CACHE_NAME = 'uptime-status-v2.0.1.1753557287951'
const CONFIG_FILE = '/config.js'

// Устанавливаем Service Worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Установка')
    self.skipWaiting()
})

// Активируем Service Worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Активация')
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Удаляем старый кеш', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )
    return self.clients.claim()
})

// Перехватываем запросы
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url)

    // Для config.js всегда идем в сеть
    if (url.pathname.includes('config.js')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Если сеть недоступна, пытаемся взять из кеша
                return caches.match(event.request)
            })
        )
        return
    }

    // Для HTML файлов используем network-first стратегию
    if (event.request.destination === 'document') {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // Кешируем успешный ответ
                    const responseClone = response.clone()
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone)
                    })
                    return response
                })
                .catch(() => {
                    // Если сеть недоступна, берем из кеша
                    return caches.match(event.request)
                })
        )
        return
    }

    // Для остальных ресурсов используем cache-first стратегию
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request)
        })
    )
})

// Слушаем сообщения от главной страницы
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }
})
