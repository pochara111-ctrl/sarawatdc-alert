/* ===== UI helpers: toast / loader / confirm / busy / count-up ===== */
(function(){
const d=document, el=(t,c,h)=>{const e=d.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let tw,ld,cf,bar,off,cfRes;
function mount(){
  if(tw)return;
  tw=el('div');tw.id='ui-toasts';tw.setAttribute('aria-live','polite');
  ld=el('div');ld.id='ui-loader';ld.innerHTML='<div class="ui-ring"><i></i><b>🏫</b></div><p id="ui-lt">กำลังโหลด…</p>';
  cf=el('div');cf.id='ui-cf';
  bar=el('div');bar.id='ui-bar';
  off=el('div');off.id='ui-off';off.textContent='📡 ออฟไลน์ — ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
  d.body.append(bar,off,tw,ld,cf);
  d.body.classList.add('ui-enter');
}
const ICON={ok:'✅',err:'⚠️',info:'ℹ️',alert:'🚨'};
const UI={
  esc,
  toast(msg,o){o=typeof o==='string'?{type:o}:(o||{});mount();
    const type=o.type||'info',ms=o.ms||4000,t=el('div','ui-t '+type);
    t.innerHTML=`<span class="ic">${o.icon||ICON[type]}</span><span class="tx">${esc(msg)}</span><span class="pg" style="animation-duration:${ms}ms"></span>`;
    tw.appendChild(t);while(tw.children.length>4)tw.firstChild.remove();
    requestAnimationFrame(()=>requestAnimationFrame(()=>t.classList.add('in')));
    const close=()=>{t.classList.remove('in');t.classList.add('out');setTimeout(()=>t.remove(),500);};
    t.onclick=close;setTimeout(close,ms);return t;},
  loading(on,text){mount();d.getElementById('ui-lt').textContent=text||'กำลังโหลด…';ld.classList.toggle('on',!!on);},
  bar(on){mount();bar.classList.toggle('on',!!on);},
  busy(btn,on,text){if(!btn)return;
    if(on){btn._t=btn.textContent;btn.classList.add('ui-busy');btn.disabled=true;if(text)btn.textContent=text;}
    else{btn.classList.remove('ui-busy');btn.disabled=false;if(btn._t!=null)btn.textContent=btn._t;}},
  shake(e){if(!e)return;e.classList.remove('ui-shake');void e.offsetWidth;e.classList.add('ui-shake');},
  confirm(msg,o){o=o||{};mount();
    cf.innerHTML=`<div class="bx" role="dialog" aria-modal="true"><div class="ci">${o.icon||'❓'}</div><p>${esc(msg)}</p>
      <div class="bt"><button class="no">${o.no||'ยกเลิก'}</button><button class="yes ${o.safe?'safe':''}">${o.yes||'ยืนยัน'}</button></div></div>`;
    cf.classList.add('on');
    return new Promise(r=>{const done=v=>{cf.classList.remove('on');r(v);};
      cf.querySelector('.no').onclick=()=>done(false);cf.querySelector('.yes').onclick=()=>done(true);
      cf.onclick=e=>{if(e.target===cf&&!o.lock)done(false);};});},
  prompt(msg,o){o=o||{};mount();
    cf.innerHTML=`<div class="bx" role="dialog" aria-modal="true"><div class="ci">${o.icon||'📝'}</div><p>${esc(msg)}</p>
      ${(o.chips||[]).length?`<div class="ui-chips">${o.chips.map(c=>`<button type="button" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>`:''}
      <textarea id="ui-pi" rows="3" maxlength="300" placeholder="${esc(o.ph||'')}" style="width:100%;border:1.5px solid #e3e8f4;border-radius:12px;padding:.6rem;font:500 .95rem 'Sarabun',sans-serif;margin-bottom:1rem;outline:none"></textarea>
      <div class="bt"><button class="no">${o.no||'ข้าม'}</button><button class="yes safe">${o.yes||'บันทึก'}</button></div></div>`;
    cf.classList.add('on');setTimeout(()=>d.getElementById('ui-pi').focus(),80);
    cf.querySelectorAll('.ui-chips button').forEach(b=>b.onclick=()=>{const t=d.getElementById('ui-pi');t.value=(t.value?t.value+' • ':'')+b.dataset.c;t.focus();});
    return new Promise(r=>{const done=v=>{cf.classList.remove('on');r(v);};
      cf.querySelector('.no').onclick=()=>done('');cf.querySelector('.yes').onclick=()=>done(d.getElementById('ui-pi').value.trim());
      cf.onclick=e=>{if(e.target===cf)done(null);};});},
  async copy(t){try{await navigator.clipboard.writeText(t);UI.toast('คัดลอกแล้ว','ok',1800);}catch(e){UI.toast(t,'info');}},
  count(e,to,ms=700){if(!e)return;const from=+e.textContent||0;if(from===to){e.textContent=to;return;}
    const t0=performance.now();(function f(t){const p=Math.min(1,(t-t0)/ms),v=Math.round(from+(to-from)*(1-Math.pow(1-p,3)));
      e.textContent=v;if(p<1)requestAnimationFrame(f);})(t0);},
  skeleton(n=4){return Array.from({length:n},()=>'<div class="sk"><i></i><i></i><i></i></div>').join('');},
  check(){return '<div class="ui-check"><svg viewBox="0 0 52 52"><path d="M14 27l8 8 16-17"/></svg></div>';}
};
/* ripple บนปุ่ม */
d.addEventListener('pointerdown',e=>{const b=e.target.closest('.btn-login,.btn-next,.btn-more,.btn-qr,.btn-add');if(!b||b.disabled)return;
  b.classList.add('ui-rip');const r=b.getBoundingClientRect(),s=el('span','rp');
  s.style.left=(e.clientX-r.left)+'px';s.style.top=(e.clientY-r.top)+'px';b.appendChild(s);setTimeout(()=>s.remove(),650);});
/* ออนไลน์/ออฟไลน์ */
addEventListener('offline',()=>{mount();off.classList.add('on');});
addEventListener('online',()=>{mount();off.classList.remove('on');UI.toast('กลับมาออนไลน์แล้ว',{type:'ok',ms:2500});});
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',mount);else mount();
/* ===== ตั้งค่าการแสดงผล: โหมดมืด/สว่าง, ขนาดตัวอักษร, ภาษา ===== */
const ls={get:k=>{try{return localStorage.getItem(k);}catch(e){return null;}},set:(k,v)=>{try{localStorage.setItem(k,v);}catch(e){}}};
const root=d.documentElement;
let theme=ls.get('ui-theme')||root.dataset.def||'light',fs=+ls.get('ui-fs')||100,lang=ls.get('ui-lang')||'th',dict=null,pill=null;
const orig=new WeakMap(),origA=new WeakMap();
function applyPrefs(){root.dataset.theme=theme;root.style.fontSize=fs+'%';root.lang=lang;}
function walk(n,f){const w=d.createTreeWalker(n,NodeFilter.SHOW_TEXT,{acceptNode:x=>/^(SCRIPT|STYLE|TEXTAREA)$/.test(x.parentNode.nodeName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});let x;while(x=w.nextNode())f(x);}
function applyLang(){if(!dict)return;
  walk(d.body,n=>{const t=n.nodeValue.trim();if(!t)return;
    if(lang==='en'&&dict[t]){if(!orig.has(n))orig.set(n,n.nodeValue);n.nodeValue=n.nodeValue.replace(t,dict[t]);}
    else if(lang==='th'&&orig.has(n)){n.nodeValue=orig.get(n);orig.delete(n);}});
  d.querySelectorAll('[placeholder],[title],[aria-label]').forEach(e=>['placeholder','title','aria-label'].forEach(a=>{const v=e.getAttribute(a);if(!v)return;
    if(lang==='en'&&dict[v]){if(!origA.has(e))origA.set(e,{});origA.get(e)[a]=v;e.setAttribute(a,dict[v]);}
    else if(lang==='th'&&origA.has(e)&&origA.get(e)[a]){e.setAttribute(a,origA.get(e)[a]);}}));}
UI.t=s=>(lang==='en'&&dict&&dict[s])||s;
UI.lang=()=>lang;
UI.i18n=x=>{dict=x;buildPill();applyLang();};
function buildPill(){const host=d.getElementById('hud-tools');
  if(!pill){pill=el('div','ui-pill'+(host?' in':''));
    pill.innerHTML='<button data-k="th" title="โหมดมืด/สว่าง">🌓</button><button data-k="fm" title="ลดขนาดตัวอักษร">A−</button><button data-k="fp" title="เพิ่มขนาดตัวอักษร">A+</button>'+(dict?'<button data-k="lg" title="Language">🌐</button>':'');
    pill.onclick=e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;
      if(k==='th'){theme=theme==='dark'?'light':'dark';ls.set('ui-theme',theme);}
      if(k==='fm'){fs=Math.max(85,fs-10);ls.set('ui-fs',fs);}
      if(k==='fp'){fs=Math.min(140,fs+10);ls.set('ui-fs',fs);}
      if(k==='lg'){lang=lang==='th'?'en':'th';ls.set('ui-lang',lang);applyLang();}
      applyPrefs();window.dispatchEvent(new Event('ui-prefs'));};
    (host||d.body).appendChild(pill);}
  else if(dict&&!pill.querySelector('[data-k=lg]')){const b=el('button');b.dataset.k='lg';b.title='Language';b.textContent='🌐';pill.appendChild(b);}}
applyPrefs();
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',buildPill);else buildPill();
window.UI=UI;
})();
