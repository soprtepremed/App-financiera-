/**
 * Service Worker - FinanzApp PWA
 * Estrategia: Cache First para assets, Network First para API calls
 */

const CACHE_NAME = 'finanzapp-v1.0.0';

// Assets que se cachean al instalar el SW
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/favicon.ico',
];

// ── Instalación: pre-cachear assets estáticos ──
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando FinanzApp SW...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch(() => {
                // Ignorar errores de assets que no existen aún
                console.log('[SW] Algunos assets no se pudieron cachear todavía');
            });
        })
    );
    // Activar inmediatamente sin esperar
    self.skipWaiting();
});

// ── Activación: limpiar caches antiguas ──
self.addEventListener('activate', (event) => {
    console.log('[SW] FinanzApp SW activado');
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => {
                        console.log('[SW] Eliminando cache antiguo:', key);
                        return caches.delete(key);
                    })
            )
        )
    );
    // Tomar control de todos los clientes abiertos
    self.clients.claim();
});

// ── Fetch: estrategia híbrida ──
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorar requests a Supabase (siempre red)
    if (url.hostname.includes('supabase.co')) return;

    // Para navegación (HTML): Network First → fallback a cache
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => caches.match(request).then((cached) => cached || caches.match('/')))
        );
        return;
    }

    // Para assets estáticos (JS, CSS, imágenes): Cache First → fallback a red
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                });
            })
        );
    }
});
