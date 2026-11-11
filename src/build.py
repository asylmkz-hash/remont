# Сборка сайта: src/app.html + src/fbshim.js -> index.html и sw.js в корне репозитория.
# Запуск из корня репозитория: python3 src/build.py
import os,re,json,hashlib
R=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
h=open(R+'/src/app.html',encoding='utf-8').read()
ver=re.search(r"const VER='версия ([^']+)'",h).group(1)
head='<meta name="theme-color" content="#c2410c"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="apple-mobile-web-app-title" content="Ремонт"><meta name="robots" content="noindex,nofollow"><link rel="manifest" href="manifest.webmanifest"><link rel="apple-touch-icon" href="icons/icon-180.png"><link rel="icon" href="icons/icon-192.png">'
assert h.count('<title>Ремонт — учёт</title>')==1 and h.count('<script>\n')==1
h=h.replace('<title>Ремонт — учёт</title>','<title>Ремонт — учёт</title>'+head)
shim=open(R+'/src/fbshim.js',encoding='utf-8').read()
sdkh=hashlib.sha1(open(R+'/fbsdk.js','rb').read()).hexdigest()[:8]
h=h.replace('<script>\n','<script src="fbsdk.js?h='+sdkh+'"></script>\n<script>\n'+shim+'\n</script>\n<script>\n',1)
open(R+'/index.html','w',encoding='utf-8').write(h)
files=['./','index.html','fbsdk.js?h='+sdkh,'manifest.webmanifest']+['icons/'+f for f in sorted(os.listdir(R+'/icons'))]+['lib/'+f for f in sorted(os.listdir(R+'/lib'))]
dig=hashlib.sha1(b''.join(open(R+'/'+f.split('?')[0],'rb').read() for f in files if f!='./')).hexdigest()[:10]
sw="""const C='remont-%s',F=%s;
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!=C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!='GET')return;const u=new URL(r.url);if(u.origin!=location.origin)return;
 if(r.mode=='navigate'){e.respondWith(fetch(r).then(n=>{const c=n.clone();caches.open(C).then(x=>x.put('index.html',c));return n}).catch(()=>caches.match('index.html')));return}
 e.respondWith(caches.match(r).then(m=>m||fetch(r).then(n=>{if(n.ok){const c=n.clone();caches.open(C).then(x=>x.put(r,c))}return n})))});
"""%(ver+'-'+dig,json.dumps(files))
open(R+'/sw.js','w').write(sw)
print('собрано',ver,dig)
