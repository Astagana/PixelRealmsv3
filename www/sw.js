const V='pixelrealm-v6',F=['./','index.html','style.css','config.js','net.js','sprite.js','game.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/btn-fist.png','icons/btn-up.png','icons/btn-left.png','icons/btn-right.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).pathname.endsWith('moderators.txt'))return;
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(e.request,cp));return res}).catch(()=>caches.match('index.html'))))});
