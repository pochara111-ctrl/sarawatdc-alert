// network-first: ได้โค้ดล่าสุดเสมอ ถ้าออฟไลน์ใช้ของที่แคชไว้
const C='school-v2';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res;}).catch(()=>caches.match(r)));});

self.addEventListener('notificationclick',e=>{e.notification.close();const id=(e.notification.data||{}).id;
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{
    const c=cs.find(x=>/dashboard\.html/.test(x.url))||cs[0];
    if(c){c.focus();c.postMessage({focus:id});}else clients.openWindow('dashboard.html'+(id?'?focus='+id:''));}));});
