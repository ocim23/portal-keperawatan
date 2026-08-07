const CACHE = 'portal-keperawatan-v6.0.2-clean';
const CORE = [
  './',
  './index.html',
  './assets/css/styles-v6-0-0.css?v=6.0.2',
  './assets/js/app-v6-0-0.js?v=6.0.2',
  './assets/data/catalog-v6-0-0.json?v=6.0.2',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;
  const isData=url.pathname.endsWith('.json');
  const networkFirst=req.mode==='navigate'||isData||url.pathname.endsWith('.js')||url.pathname.endsWith('.css');
  if(networkFirst){
    event.respondWith(fetch(req,{cache:'no-store'}).then(res=>{
      if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
      return res;
    }).catch(async()=>{
      const cached=await caches.match(req);
      if(cached)return cached;
      if(req.mode==='navigate')return caches.match('./index.html');
      if(isData)return new Response(JSON.stringify({error:'offline-data-unavailable'}),{status:503,headers:{'Content-Type':'application/json'}});
      return new Response('Offline resource unavailable',{status:503});
    }));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(res=>{
    if(res&&res.ok){const copy=res.clone();caches.open(CACHE).then(cache=>cache.put(req,copy));}
    return res;
  })));
});
