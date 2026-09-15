// 오프라인 대비 캐시
// 기내·지하철 등 통신이 끊기는 구간에서도 일정이 열리도록 합니다.
// 온라인이면 항상 최신을 받아오고, 통신이 끊겼을 때만 캐시된 일정을 보여줍니다.
var CACHE = 'sh2026-v1';

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function (c) { return c.addAll(['./', './index.html']); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () {})
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  // 지도 링크·날씨 API는 캐시해도 의미가 없으므로 그대로 통과
  if (/amap\.com|open-meteo\.com|accuweather\.com/.test(url.hostname)) return;

  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) {
        return r || caches.match('./index.html');
      });
    })
  );
});
