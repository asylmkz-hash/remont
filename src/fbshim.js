/* Общая база: Firebase (Firestore + вход). Тот же API, что и в версии на claude.ai */
(function(){
'use strict';
window.FBMODE=true;
var CFG={apiKey:"AIzaSyAPct01sB0hoy69cD1E7SaF5NkIqIjrRLs",authDomain:"remont-uchet.firebaseapp.com",projectId:"remont-uchet",storageBucket:"remont-uchet.firebasestorage.app",messagingSenderId:"546993748266",appId:"1:546993748266:web:5c02ccd7ac642251f5c653"};
var OWNERS=['asyl.m.kz@gmail.com'];
var L='lib/';
window.LIBMAP={
 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js':L+'xlsx.full.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js':L+'jszip.min.js',
 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js':L+'mammoth.browser.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js':L+'pdf.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js':L+'pdf.worker.min.js'
};
function say(t){try{if(typeof toast=='function')toast(t)}catch(e){}}
function msg(e){var c=(e&&e.code)||'',m=(e&&e.message)||'';if(c=='permission-denied')return 'база не пропускает (правила доступа не опубликованы или вход с другой почты)';if(c=='not-found'||/does not exist|not found/i.test(m))return 'база Firestore не найдена (нужна база с ID «(default)»)';if(c=='unavailable')return 'нет связи с базой (интернет?)';if(c=='timeout')return 'база не ответила за отведённое время';return m||c||'ошибка'}
var shown={};function report(e){var k=(e&&e.code)||'x';if(shown[k])return;shown[k]=1;say('Ошибка базы: '+msg(e));setTimeout(function(){shown[k]=0},20000)}
var F=window.FBSDK,app=F.initializeApp(CFG),auth,fs;
try{auth=F.initializeAuth(app,{persistence:[F.indexedDBLocalPersistence,F.browserLocalPersistence],popupRedirectResolver:F.browserPopupRedirectResolver})}catch(e){auth=F.getAuth(app)}
var DBID='default';
try{fs=F.initializeFirestore(app,{localCache:F.persistentLocalCache({tabManager:F.persistentMultipleTabManager()})},DBID)}catch(e){fs=F.initializeFirestore(app,{},DBID)}

/* ---------- ссылка из адреса ---------- */
var LK='remont_link',LD='remont_linkdata',LINK=null;
var mh=location.hash.match(/^#([bs])=([A-Za-z0-9]{16,64})$/);
try{if(mh){localStorage.setItem(LK,mh[2]);localStorage.removeItem(LD)}LINK=localStorage.getItem(LK)}catch(e){LINK=mh&&mh[2]}
if(mh)try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}

/* ---------- экран входа ---------- */
var G=null;
function gate(html){if(!G){G=document.createElement('div');G.id='gate';G.style.cssText='position:fixed;inset:0;z-index:50;background:var(--bg,#f4f2ec);overflow:auto;padding:24px 16px';(document.body||document.documentElement).appendChild(G)}G.innerHTML='<div style="max-width:420px;margin:12vh auto 0">'+html+'</div>'}
function ungate(){if(G){G.remove();G=null}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return'&#'+c.charCodeAt(0)+';'})}
var HEAD='<h1 style="margin:0 0 6px">Ремонт — учёт</h1>';

var done=false,resolveReady,ready=new Promise(function(r){resolveReady=r});
var ROLE=null,ME=null,INFO={};
function go(role,me,info){if(done)return;done=true;ROLE=role;ME=me;INFO=info||{};window.FBROLE=role;window.FBLINK=INFO;ungate();resolveReady();
 var sp=role=='o'?'objects':role=='b'?'zayavki/'+me+'/items':'sup/'+me+'/items';try{F.onSnapshot(F.collection(fs,sp),{includeMetadataChanges:true},function(q){ST.cache=q.metadata.fromCache;ST.pw=q.metadata.hasPendingWrites;stDraw()},function(e){ST.cache=true;ST.err=msg(e);stDraw()})}catch(e){}
 window.addEventListener('online',stDraw);window.addEventListener('offline',stDraw)}
window.FBX={site:location.origin+location.pathname.replace(/index\.html$/,''),
 get name(){return INFO.name||''},get email(){return INFO.email||''},
 signOut:function(){F.signOut(auth).then(function(){location.reload()})},
 check:function(){var t0=Date.now(),out={};return withTimeout(F.setDoc(F.doc(fs,'meta/ping'),{at:t0,by:INFO.email||ROLE||''}),15000)
  .then(function(){out.write=Date.now()-t0;return withTimeout(F.getDocsFromServer(F.collection(fs,'objects')),15000)})
  .then(function(q){out.objects=q.size;return withTimeout(F.getDocsFromServer(F.collection(fs,'expenses')),15000)})
  .then(function(q){out.expenses=q.size;return {ok:true,text:'✓ Связь с облачной базой есть ('+out.write+' мс). В облаке: объектов '+out.objects+', расходов '+out.expenses+'.'}})
  .catch(function(e){var base='✗ '+msg(e)+(e&&e.code?' ['+e.code+']':'');return probe().then(function(d){return {ok:false,text:base+' — '+d}})})},
 sync:function(){var off=navigator.onLine===false;return{role:ROLE,pend:PEND,pw:ST.pw,cache:ST.cache,off:off,err:ST.err||'',text:ST.err?'⚠ Ошибка базы: '+ST.err:off?'⚠ Нет интернета — изменения сохранятся на устройстве и уйдут в облако позже':(PEND>0||ST.pw)?'⏳ Отправляю изменения в облако…':ST.cache===false?'☁ Синхронизировано с облаком':'… Подключаюсь к облаку'}},
 flush:function(){return withTimeout(F.waitForPendingWrites(fs),120000).then(function(){return true},function(e){report(e);return false})},
 resetLink:function(){try{localStorage.removeItem(LK);localStorage.removeItem(LD)}catch(e){}F.signOut(auth).then(function(){location.reload()},function(){location.reload()})}};

function probe(){return withTimeout(fetch('https://firestore.googleapis.com/v1/projects/'+CFG.projectId+'/databases/'+DBID+'/documents/meta/ping?key='+CFG.apiKey),12000).then(function(r){return r.text().then(function(t){
 if(/does not exist/i.test(t))return 'Диагноз: в проекте нет базы с ID «'+DBID+'».';
 if(/Datastore Mode|datastore mode/i.test(t))return 'Диагноз: база создана в режиме Datastore. Нужна база в режиме Native (Firestore Native mode).';
 if(/has not been used|is disabled|SERVICE_DISABLED/i.test(t))return 'Диагноз: в проекте выключен Cloud Firestore API — включите его в Google Cloud.';
 if(r.status==403||r.status==401||r.status==404)return 'База существует и доступна по сети (ответ '+r.status+'). Вероятно, мешает соединение для приложения: попробуйте другой интернет (мобильный/Wi-Fi), отключите VPN/блокировщик.';
 return 'Ответ базы: '+r.status+' '+t.slice(0,160)})},function(){return 'Диагноз: это устройство не может соединиться с firestore.googleapis.com (интернет, VPN, блокировщик или фильтр сети).'})}
function withTimeout(p,ms){return Promise.race([p,new Promise(function(_,no){setTimeout(function(){no({code:'timeout'})},ms)})])}

function startLink(){
 gate(HEAD+'<p class=m>Подключение…</p>');
 var cached=null;try{cached=JSON.parse(localStorage.getItem(LD)||'null')}catch(e){}
 auth.authStateReady().then(function(){
  if(auth.currentUser&&auth.currentUser.isAnonymous)return auth.currentUser;
  if(auth.currentUser)return F.signOut(auth).then(function(){return F.signInAnonymously(auth)}).then(function(c){return c.user});
  return F.signInAnonymously(auth).then(function(c){return c.user});
 }).then(function(u){
  return withTimeout(F.setDoc(F.doc(fs,'bind/'+u.uid),{t:LINK,at:Date.now()}),8000).catch(function(e){if(e.code=='timeout'&&cached)return;throw e}).then(function(){
   return withTimeout(F.getDoc(F.doc(fs,'links/'+LINK)),8000).then(function(s){
    if(!s.exists()||!s.data().on)throw {code:'link-off'};
    var d=s.data();try{localStorage.setItem(LD,JSON.stringify({type:d.type,f:d.f,name:d.name||''}))}catch(e){}
    return d}).catch(function(e){if(e.code!='link-off'&&cached)return cached;throw e})})
 }).then(function(d){go(d.type,d.f,{name:d.name||'',type:d.type})})
 .catch(function(e){
  if(e&&(e.code=='link-off'||e.code=='permission-denied'))gate(HEAD+'<div class=card><b>Ссылка не действует</b><br><small class=m>Её отключили или заменили. Попросите новую ссылку.</small></div><button class=g onclick="FBX.resetLink()">Понятно</button>');
  else if(cached)go(cached.type,cached.f,{name:cached.name,type:cached.type});
  else gate(HEAD+'<div class=card><b>Нет подключения</b><br><small class=m>Для первого входа по ссылке нужен интернет. '+esc(msg(e))+'</small></div><button onclick="location.reload()">Повторить</button>');
 });
}
function loginScreen(err){
 gate(HEAD+'<p class=m>Вход для владельца</p><div class=card><button id=gbtn>Войти через Google</button><small class=m>Строители и поставщики входят по своим ссылкам — им ничего вводить не нужно.</small>'+(err?'<small class=bad>'+esc(err)+'</small>':'')+'</div>');
 document.getElementById('gbtn').onclick=function(){
  var p=new F.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
  F.signInWithPopup(auth,p).catch(function(e){
   if(e&&/popup-blocked|operation-not-supported|web-storage-unsupported/.test(e.code||''))return F.signInWithRedirect(auth,p);
   if(e&&/popup-closed|cancelled-popup/.test(e.code||''))return;
   loginScreen('Не удалось войти: '+msg(e))})}}
function startOwner(){
 gate(HEAD+'<p class=m>Загрузка…</p>');
 F.getRedirectResult(auth).catch(function(){});
 F.onAuthStateChanged(auth,function(u){
  if(done)return;
  if(!u||u.isAnonymous){loginScreen();return}
  var em=String(u.email||'').toLowerCase();
  if(OWNERS.indexOf(em)>=0&&u.emailVerified!==false)go('o','owner',{email:u.email});
  else gate(HEAD+'<div class=card><b>Нет доступа</b><br><small class=m>Аккаунт '+esc(u.email)+' не является владельцем. Строители и поставщики входят по ссылкам.</small></div><button class=g onclick="FBX.signOut()">Выйти</button>');
 });
}
function boot(){if(LINK)startLink();else startOwner()}
if(document.body)boot();else document.addEventListener('DOMContentLoaded',boot);

/* ---------- база ---------- */
function clean(d){return d===undefined?null:JSON.parse(JSON.stringify(d))}
var PEND=0,ST={cache:null,pw:false},lastSt='';function stDraw(){var t=JSON.stringify([PEND>0,ST.cache,ST.pw]);if(t!==lastSt){lastSt=t;try{if(typeof draw=='function')draw()}catch(e){}}}
function w(p){var to=false;PEND++;stDraw();p.then(function(){PEND--;stDraw()},function(){PEND--;stDraw()});return new Promise(function(ok,no){
 var t=setTimeout(function(){to=true;ok()},navigator.onLine===false?0:2500);
 p.then(function(){clearTimeout(t);if(!to)ok()},function(e){clearTimeout(t);if(to)report(e);else no(e)})})}
function wrapDoc(s){return{id:s.id,exists:s.exists(),data:function(){return s.data()}}}
function docRef(p){var ref=F.doc(fs,p);return{
 set:function(d){return w(F.setDoc(ref,clean(d)))},
 update:function(d){var c=clean(d),ks=Object.keys(c);if(!ks.length)return Promise.resolve();var a=[];ks.forEach(function(k){a.push(new F.FieldPath(k),c[k])});
  return w(F.updateDoc.apply(null,[ref].concat(a)).catch(function(e){if(e&&e.code=='not-found')return F.setDoc(ref,c,{merge:true});throw e}))},
 delete:function(){return w(F.deleteDoc(ref))},
 get:function(){return F.getDoc(ref).then(wrapDoc)},
 onSnapshot:function(f,er){return F.onSnapshot(ref,function(s){f(wrapDoc(s))},function(e){report(e);if(er)er(e)})}}}
var db={collection:function(p){return{doc:function(id){return docRef(p+'/'+id)},onSnapshot:function(f,er){return F.onSnapshot(F.collection(fs,p),function(q){f({docs:q.docs.map(function(d){return{id:d.id,data:function(){return d.data()}}})})},function(e){report(e);if(er)er(e)})}}},doc:docRef};

/* ---------- файлы ---------- */
var TR={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
function tr(n){return String(n).replace(/[а-яё]/gi,function(c){var l=c.toLowerCase(),t=TR[l]||'';return c===l?t:(t.charAt(0).toUpperCase()+t.slice(1))})}
function mimeOf(n){return /\.json$/i.test(n)?'application/json':/\.xlsx$/i.test(n)?'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':'application/octet-stream'}
var downloads={save:function(o){
 var name=o.filename,data=o.data,mime=mimeOf(name),blob=new Blob([data],{type:mime}),f=null;try{f=new File([blob],name,{type:mime})}catch(e){}
 var anchor=function(){var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=tr(name);document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},5000)};
 if(f&&navigator.canShare&&/iPhone|iPad|iPod/.test(navigator.userAgent)&&navigator.canShare({files:[f]}))
  return navigator.share({files:[f],title:name}).catch(function(e){if(e&&e.name=='AbortError'){var x=new Error('declined');x.code='declined';throw x}anchor()});
 anchor();return Promise.resolve()}};

/* ---------- распознавание через ключ Claude API ---------- */
var KEY='remont_api_key';
window.OFFAPI={key:function(){try{return localStorage.getItem(KEY)||''}catch(e){return ''}},setKey:function(k){try{k?localStorage.setItem(KEY,k):localStorage.removeItem(KEY)}catch(e){}}};
function shrink(b){return new Promise(function(ok){var t=(b&&b.type)||'';if(!/^image\//.test(t)){ok(null);return}
 var url=URL.createObjectURL(b),im=new Image();
 im.onload=function(){var s=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*s);c.height=Math.round(im.height*s);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);ok(c.toDataURL('image/jpeg',0.85).split(',')[1])};
 im.onerror=function(){URL.revokeObjectURL(url);ok(null)};im.src=url})}
function jsonFrom(t){t=String(t||'').replace(/```(?:json)?/gi,'').trim();var i=t.search(/[\[{]/);if(i<0)throw new Error('ответ без данных');var s=t.slice(i),c=s[0]=='['?']':'}',j=s.lastIndexOf(c);return JSON.parse(s.slice(0,j+1))}
var sample={json:function(prompt,opt){opt=opt||{};var k=OFFAPI.key();
 return Promise.all((opt.images||[]).map(shrink)).then(function(ims){
  var content=ims.filter(Boolean).map(function(d){return{type:'image',source:{type:'base64',media_type:'image/jpeg',data:d}}});
  content.push({type:'text',text:prompt+'\n\nОтветь только JSON, без пояснений.'});
  return fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:opt.signal,headers:{'content-type':'application/json','x-api-key':k,'anthropic-version':'2023-06-01','anthropic-dangerous-direct-browser-access':'true'},
   body:JSON.stringify({model:'claude-sonnet-5-5',max_tokens:8000,messages:[{role:'user',content:content}]})})})
 .then(function(r){return r.json().then(function(j){
   if(r.status==429){var e=new Error('лимит запросов');e.code='rate_limited';throw e}
   if(!r.ok)throw new Error((j&&j.error&&j.error.message)||('ошибка '+r.status));
   return jsonFrom((j.content||[]).map(function(x){return x.text||''}).join(''))})})}};

/* ---------- распознавание через Gemini (Firebase AI Logic, бесплатный уровень) ---------- */
var GM=['gemini-3.8-flash','gemini-2.5-flash'],AIX=null,ACK=null,RCK='6LeKPRsuAAAAAB1xrZpXFUbMUtDKBs2qWQ1ekIlq';
function gemModel(name){if(!F.getAI||!F.GoogleAIBackend)throw new Error('приложение обновилось — закройте и откройте его заново');if(!ACK&&F.initializeAppCheck){try{ACK=F.initializeAppCheck(app,{provider:new F.ReCaptchaEnterpriseProvider(RCK),isTokenAutoRefreshEnabled:true})}catch(e){ACK=1}}if(!AIX)AIX=F.getAI(app,{backend:new F.GoogleAIBackend()});return F.getGenerativeModel(AIX,{model:name,generationConfig:{responseMimeType:'application/json',temperature:0}})}
var gemini={json:function(prompt,opt){opt=opt||{};return Promise.all((opt.images||[]).map(shrink)).then(function(ims){
 if(!F.getAI||!F.GoogleAIBackend)throw new Error('приложение обновилось — закройте и откройте его заново');
 var parts=[{text:prompt+'\n\nОтветь только JSON, без пояснений.'}].concat(ims.filter(Boolean).map(function(d){return{inlineData:{data:d,mimeType:'image/jpeg'}}}));
 function tryM(k){return gemModel(GM[k]).generateContent(parts).then(function(res){return jsonFrom(res.response.text())},function(e){var m=String((e&&(e.message||e.code))||'');
  if(k+1<GM.length&&/not.?found|404|not supported|unsupported|invalid model/i.test(m))return tryM(k+1);
  if(/\b429\b|quota|RESOURCE_EXHAUSTED/i.test(m)){var x=new Error('лимит бесплатных распознаваний — попробуйте через минуту');x.code='rate_limited';throw x}
  if(/App Check|appCheck|\b401\b/i.test(m))throw new Error('не пройдена проверка безопасности Google (App Check) — обновите страницу и повторите');
  if(/api-not-enabled|not been used|is disabled|SERVICE_DISABLED|PERMISSION_DENIED|\b403\b|API key/i.test(m))throw new Error('распознавание не включено в Firebase (AI Logic → Gemini Developer API)');
  throw e})}
 return tryM(0)})}};
window.claude={use:function(n){return ready.then(function(){
 if(n=='db')return db;
 if(n=='user')return{id:function(){return Promise.resolve(ME)},isOwner:function(){return Promise.resolve(ROLE=='o')},search:function(){return Promise.resolve([])}};
 if(n=='downloads')return downloads;
 if(n=='sample')return navigator.onLine===false?null:(OFFAPI.key()?sample:gemini);
 return null})}};
window.offBack=function(){return 'exit'};
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
if('serviceWorker' in navigator&&location.protocol=='https:')window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){})});
})();
