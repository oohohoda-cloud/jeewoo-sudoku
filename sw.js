// 지우가 좋아하는 스도쿠 - 오프라인 캐시 v1.1
const CACHE_NAME = 'jiwoo-sudoku-static-v1.1';
const APP_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // 다른 웹앱의 캐시는 건드리지 않습니다.
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names
        .filter((name) => (name === 'jiwoo-sudoku-v1' || name.startsWith('jiwoo-sudoku-static-')) && name !== CACHE_NAME)
        .map((name) => caches.delete(name))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // 현재 앱 폴더 외의 요청에는 개입하지 않습니다.
  if (url.origin !== self.location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;

  // 최신 화면 우선. 네트워크 연결이 없어도 캐시된 화면을 보여줍니다.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)));
        }
        return response;
      }).catch(async () =>
        (await caches.match(request)) || (await caches.match('./index.html'))
      )
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
