/* ===== FX layer: toast v2 / popup / sound / system notification / splash / confetti / page transition ===== */
(function(){
const d=document,el=(t,c,h)=>{const e=d.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;},esc=UI.esc;
const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const ICON={ok:'✅',err:'⚠️',info:'💬',alert:'🚨'};

/* ---------- ตั้งค่าการแจ้งเตือน ---------- */
UI.pref=k=>{let p={sound:true,vibrate:true,sys:false};try{Object.assign(p,JSON.parse(ls.get('ui-np')||'{}'));}catch(e){}return k?p[k]:p;};
UI.setPref=(k,v)=>{const p=UI.pref();p[k]=v;ls.set('ui-np',JSON.stringify(p));};

/* ---------- เสียง / สั่น ---------- */
let ac=null;
function unlock(){if(!ac)try{ac=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}if(ac&&ac.state==='suspended')ac.resume();}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,unlock,{passive:true}));
function tone(f,t0,dur,type,vol){const o=ac.createOscillator(),g=ac.createGain(),n=ac.currentTime+t0;o.type=type||'sine';o.frequency.value=f;o.connect(g);g.connect(ac.destination);
  g.gain.setValueAtTime(0,n);g.gain.linearRampToValueAtTime(vol||.18,n+.02);g.gain.exponentialRampToValueAtTime(.0001,n+dur);o.start(n);o.stop(n+dur+.05);}
UI.sound=kind=>{if(!UI.pref('sound'))return;unlock();if(!ac||ac.state!=='running')return;
  if(kind==='ding'){tone(988,0,.25);tone(1318,.16,.4);}
  else if(kind==='siren'){for(let i=0;i<3;i++){tone(880,i*.55,.27,'square',.1);tone(620,i*.55+.27,.27,'square',.1);}}
  else if(kind==='ok'){tone(660,0,.12);tone(880,.1,.22);}};
UI.vibrate=p=>{if(UI.pref('vibrate')&&navigator.vibrate)try{navigator.vibrate(p);}catch(e){}};

/* ---------- แจ้งเตือนของอุปกรณ์ (เมื่อเปิดหน้าเว็บค้างไว้/แท็บอยู่เบื้องหลัง) ---------- */
UI.sys={
  state:()=>('Notification' in window)?Notification.permission:'unsupported',
  async enable(){if(!('Notification' in window))return 'unsupported';let p=Notification.permission;if(p==='default')p=await Notification.requestPermission();UI.setPref('sys',p==='granted');return p;},
  async show(title,body,data){
    if(!UI.pref('sys')||!('Notification' in window)||Notification.permission!=='granted')return;
    try{const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
      const o={body,icon:'icon-192.png',badge:'icon-192.png',tag:(data&&data.id)||'inc',renotify:true,vibrate:[200,100,200],data:data||{},requireInteraction:!!(data&&data.urgent)};
      if(reg&&reg.showNotification)await reg.showNotification(title,o);
      else{const n=new Notification(title,o);n.onclick=()=>{focus();n.close();};}}catch(e){}}
};

/* ---------- Toast v2 ---------- */
function host(){let h=d.getElementById('ui-toasts');if(!h){h=el('div');h.id='ui-toasts';d.body.appendChild(h);}return h;}
UI.toast=function(msg,o){o=typeof o==='string'?{type:o}:(o||{});
  const tw=host(),type=o.type||'info',ms=o.ms||(o.action?7000:4200),t=el('div','ui-t '+type);
  t.setAttribute('role',type==='err'||type==='alert'?'alert':'status');
  t.innerHTML=`<span class="ib">${o.icon||ICON[type]}</span><div class="tb">${o.title?`<b class="tt">${esc(o.title)}</b>`:''}<span class="tx">${esc(msg)}</span></div>${o.action?`<button class="ta" type="button">${esc(o.action.label)}</button>`:''}<span class="pg" style="animation-duration:${ms}ms"></span>`;
  tw.appendChild(t);while(tw.children.length>4)tw.firstChild.remove();
  requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('in')));
  let closed=false;const close=()=>{if(closed)return;closed=true;t.classList.remove('in');t.classList.add('out');setTimeout(()=>t.remove(),450);};
  const tm=setTimeout(close,ms);
  if(o.action)t.querySelector('.ta').onclick=e=>{e.stopPropagation();clearTimeout(tm);close();o.action.fn&&o.action.fn();};
  /* ปัดทิ้งได้ด้วยนิ้ว/เมาส์ */
  let sx=null,dx=0;
  t.addEventListener('pointerdown',e=>{if(e.target.closest('.ta'))return;sx=e.clientX;dx=0;t.style.transition='none';t.setPointerCapture(e.pointerId);});
  t.addEventListener('pointermove',e=>{if(sx==null)return;dx=e.clientX-sx;t.style.transform=`translateX(${dx}px)`;t.style.opacity=Math.max(.2,1-Math.abs(dx)/260);});
  const end=()=>{if(sx==null)return;t.style.transition='';if(Math.abs(dx)>80){t.style.transform=`translateX(${dx>0?'120%':'-120%'})`;clearTimeout(tm);close();}else{t.style.transform='';t.style.opacity='';if(Math.abs(dx)<6)close();}sx=null;};
  t.addEventListener('pointerup',end);t.addEventListener('pointercancel',end);
  return t;};

/* ---------- Popup เด่น (เหตุฉุกเฉิน / ได้รับมอบหมาย) ---------- */
let curPop=null;
UI.popup=function(o){o=o||{};if(curPop&&o.replace!==false)curPop.close();
  const tone=o.tone||'info',ov=el('div','ui-pop '+tone+(o.persist?' persist':''));
  ov.setAttribute('role','alertdialog');ov.setAttribute('aria-modal','true');
  ov.innerHTML=`<div class="pc"><div class="pic"><span class="pr r1"></span><span class="pr r2"></span><span class="pe">${o.icon||'🔔'}</span></div>
    <h3>${esc(o.title||'')}</h3><p>${esc(o.msg||'')}</p>${o.sub?`<small>${esc(o.sub)}</small>`:''}
    <div class="pa">${(o.actions||[{label:'ตกลง',primary:true}]).map((a,i)=>`<button type="button" data-i="${i}" class="${a.primary?'pri':''}">${esc(a.label)}</button>`).join('')}</div></div>`;
  d.body.appendChild(ov);requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('in')));
  let iv=null,closed=false;
  const close=()=>{if(closed)return;closed=true;clearInterval(iv);ov.classList.remove('in');ov.classList.add('out');setTimeout(()=>ov.remove(),400);if(curPop&&curPop.el===ov)curPop=null;d.removeEventListener('keydown',key);};
  const key=e=>{if(e.key==='Escape'&&!o.persist)close();};d.addEventListener('keydown',key);
  ov.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');
    if(b){const a=(o.actions||[{}])[+b.dataset.i]||{};close();a.onClick&&a.onClick();return;}
    if(e.target===ov&&!o.persist)close();});
  if(o.siren){UI.sound('siren');UI.vibrate([300,150,300,150,300]);iv=setInterval(()=>{UI.sound('siren');UI.vibrate([300,150,300]);},1900);}
  else{UI.sound('ding');UI.vibrate([150]);}
  curPop={close,el:ov};return curPop;};

/* ---------- Confetti ---------- */
UI.confetti=function(n){n=n||120;const c=el('canvas');c.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99998';
  d.body.appendChild(c);const x=c.getContext('2d'),dpr=Math.min(2,devicePixelRatio||1);c.width=innerWidth*dpr;c.height=innerHeight*dpr;x.scale(dpr,dpr);
  const cols=['#e63946','#2a5ad7','#16a34a','#f59e0b','#8b5cf6','#06b6d4'],P=Array.from({length:n},()=>({x:innerWidth/2+(Math.random()-.5)*120,y:innerHeight*.45,vx:(Math.random()-.5)*14,vy:-Math.random()*14-4,s:5+Math.random()*7,r:Math.random()*6,vr:(Math.random()-.5)*.4,c:cols[Math.random()*cols.length|0]}));
  let f=0;(function a(){x.clearRect(0,0,innerWidth,innerHeight);P.forEach(p=>{p.vy+=.35;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.globalAlpha=Math.max(0,1-f/110);x.fillRect(-p.s/2,-p.s/3,p.s,p.s*.6);x.restore();});
    if(++f<120)requestAnimationFrame(a);else c.remove();})();};

/* ---------- Splash ---------- */
let holds=0,loaded=d.readyState==='complete',t0=Date.now(),sp=null;
function tryHide(){if(holds>0||!loaded||!sp)return;const s=sp;sp=null;setTimeout(()=>{s.classList.add('hide');setTimeout(()=>s.remove(),700);},Math.max(0,550-(Date.now()-t0)));}
UI.hold=()=>{holds++;let done=false;return()=>{if(done)return;done=true;holds--;tryHide();};};
function splash(){if(sp||d.getElementById('ui-splash'))return;sp=el('div');sp.id='ui-splash';
  sp.innerHTML='<div class="sp-logo"><div class="ui-ring big"><i></i><b>🏫</b></div></div><div class="sp-t">ระบบแจ้งเหตุ</div><div class="sp-s">โรงเรียนเดชะปัตตนยานุกูล</div><div class="sp-d"><i></i><i></i><i></i></div>';
  d.body.appendChild(sp);setTimeout(()=>{holds=0;loaded=true;tryHide();},9000);}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',splash);else splash();
addEventListener('load',()=>{loaded=true;tryHide();});

/* ---------- เปลี่ยนหน้าแบบนุ่มนวล ---------- */
d.addEventListener('click',e=>{const a=e.target.closest('a[href]');
  if(!a||a.target==='_blank'||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||e.button!==0||a.hasAttribute('download'))return;
  const u=new URL(a.href,location.href);if(u.origin!==location.origin||/^tel:|^mailto:/.test(a.getAttribute('href'))||(u.pathname===location.pathname&&u.search===location.search))return;
  e.preventDefault();d.body.classList.add('ui-leave');setTimeout(()=>{location.href=a.href;},170);});
addEventListener('pageshow',e=>{d.body.classList.remove('ui-leave');});
})();
