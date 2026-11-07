const C='remont-07.11-32-3160a5313c',F=["./", "index.html", "fbsdk.js", "manifest.webmanifest", "icons/icon-180.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "lib/jszip.min.js", "lib/mammoth.browser.min.js", "lib/pdf.min.js", "lib/pdf.worker.min.js", "lib/xlsx.full.min.js"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!=C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!='GET')return;const u=new URL(r.url);if(u.origin!=location.origin)return;
 if(r.mode=='navigate'){e.respondWith(fetch(r).then(n=>{const c=n.clone();caches.open(C).then(x=>x.put('index.html',c));return n}).catch(()=>caches.match('index.html')));return}
 e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r)))});
