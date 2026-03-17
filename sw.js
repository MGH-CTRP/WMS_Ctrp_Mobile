const CACHE = 'wms-viewer-v4';

self.addEventListener('install', e=>{
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.map(k=>caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  // GAS 요청은 항상 네트워크 직접 요청
  if(e.request.url.includes('script.google.com')){
    e.respondWith(
      fetch(e.request).catch(()=>new Response('{}',{headers:{'Content-Type':'application/json'}}))
    );
    return;
  }

  // HTML 파일은 항상 네트워크 우선 → 실패 시 캐시
  if(e.request.url.includes('.html')){
    e.respondWith(
      fetch(e.request)
        .then(res=>{
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
          return res;
        })
        .catch(()=>caches.match(e.request))
    );
    return;
  }

  // 나머지(폰트 등)는 캐시 우선 → 없으면 네트워크
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(res=>{
        if(res && res.status===200){
          const clone=res.clone();
          caches.open(CACHE).then(c=>c.put(e.request,clone));
        }
        return res;
      }).catch(()=>cached);
    })
  );
});
