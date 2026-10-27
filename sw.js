/* 每日一学 · Service Worker
   策略：
   - 页面外壳（html/css/js/图标/manifest）→ 缓存优先，后台更新（stale-while-revalidate）
   - 每日内容 data/days/*.js → 网络优先，断网回落到缓存
   每次发布页面外壳有改动时，把 VERSION 改一下即可让旧缓存自动淘汰。 */

const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './assets/style.css',
  './assets/app.js',
  './assets/art.js',
  './assets/pwa.js',
  './assets/favicon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
  './assets/apple-touch-icon.png',
  './data/days/index.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(SHELL_CACHE);
    // 单个资源失败不影响整体安装
    await Promise.all(SHELL.map((url) => cache.add(url).catch(() => null)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([SHELL_CACHE, DATA_CACHE]);
    const names = await caches.keys();
    await Promise.all(names.filter((n) => !keep.has(n)).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 每日内容：先要最新的，失败才用缓存
  if (url.pathname.includes('/data/days/')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        if (fresh && fresh.status === 200) {
          const cache = await caches.open(DATA_CACHE);
          cache.put(req, fresh.clone());
        }
        return fresh;
      } catch (err) {
        const cached = await caches.match(req);
        if (cached) return cached;
        throw err;
      }
    })());
    return;
  }

  // 外壳：先用缓存的，同时后台拉新
  event.respondWith((async () => {
    const cache = await caches.open(SHELL_CACHE);
    const cached = await cache.match(req);
    const network = fetch(req)
      .then((res) => {
        if (res && res.status === 200) cache.put(req, res.clone());
        return res;
      })
      .catch(() => null);
    return cached || (await network) || Response.error();
  })());
});
