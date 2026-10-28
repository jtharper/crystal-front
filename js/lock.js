'use strict';
/* ---------- cursor lock (desktop) ----------
   Keeps the mouse inside the game during a match, so scrolling at a screen edge never slides onto another monitor.
   Browsers do this with "pointer lock": the real cursor disappears and only movement is reported. The game draws its
   own cursor, keeps its position, and routes every press to whatever is under it: the battlefield, the minimap or a
   HUD button. Esc (or opening the game menu) frees the cursor; resuming or clicking the battlefield locks it again. */
const PL={want:true,on:false,x:0,y:0,cap:null,press:null,lostAt:0,quiet:false,clk:{t:0,x:0,y:0,n:0},el:null,hov:null};
try{PL.want=localStorage.getItem('cf-lock')!=='0'}catch(e){}
const plCan=()=>!TOUCH&&!!cvs.requestPointerLock;
function plWanted(){return PL.want&&plCan()&&state==='play'&&escEl.hidden&&!(typeof NET!=='undefined'&&NET.ended)}
function plRequest(){if(!plWanted()||document.pointerLockElement)return;try{const r=cvs.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}catch(e){}}
function plRelease(){if(document.pointerLockElement){PL.quiet=true;document.exitPointerLock()}}
/* the drawn cursor */
PL.el=document.createElement('div');PL.el.id='vcur';PL.el.hidden=true;
PL.el.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path class="ar" d="M3 2l15 9.2-6.6 1.3 3.9 7.4-2.9 1.5-3.9-7.4L3 18.8z"/><g class="xh"><circle cx="12" cy="12" r="6.5"/><path d="M12 1.5v6M12 16.5v6M1.5 12h6M16.5 12h6"/></g></svg>';
$('#stage').appendChild(PL.el);
function plDraw(){const s=PL.el.style;s.transform=`translate(${PL.x}px,${PL.y}px)`;
  PL.el.dataset.k=place?'copy':mode==='amove'||mode==='rift'?'cross':mode==='repair'||mode==='sell'?'point':''}
/* what is under the drawn cursor: 'map', 'mm' (minimap) or a HUD element */
function plUnder(){const r=cvs.getBoundingClientRect(),el=document.elementFromPoint(r.left+PL.x,r.top+PL.y);
  if(!el||el===cvs||el.id==='ov'||el.id==='wxVeil'||el.id==='stage')return 'map';if(el===mm||mm.contains(el))return 'mm';return el}
function plSend(target,type,src,extra){const r=cvs.getBoundingClientRect();
  target.dispatchEvent(new PointerEvent(type,Object.assign({bubbles:true,cancelable:true,clientX:r.left+PL.x,clientY:r.top+PL.y,pointerId:1,pointerType:'mouse',isPrimary:true,
    button:src.button,buttons:src.buttons,shiftKey:src.shiftKey,ctrlKey:src.ctrlKey,altKey:src.altKey,metaKey:src.metaKey},extra||{})))}
/* hover highlight for HUD buttons (CSS :hover can't follow a drawn cursor) */
function plHover(el){const b=el&&el!=='map'&&el!=='mm'?el.closest('button,.bt,.stb'):null;if(b===PL.hov)return;if(PL.hov)PL.hov.classList.remove('plHov');PL.hov=b;if(b)b.classList.add('plHov')}
document.addEventListener('pointerlockchange',()=>{
  const on=document.pointerLockElement===cvs;
  if(on&&!PL.on){PL.on=true;PL.x=Math.max(0,Math.min(W-1,mouse.x||W/2));PL.y=Math.max(0,Math.min(H-1,mouse.y||H/2));mouse.in=true;ptrMouse=true;PL.el.hidden=false;document.body.classList.add('plOn');plDraw()}
  else if(!on&&PL.on){PL.on=false;PL.el.hidden=true;document.body.classList.remove('plOn');PL.cap=null;PL.press=null;plHover(null);PL.lostAt=performance.now();
    /* Esc pressed (the browser frees the cursor itself): show the game menu, like Esc normally does */
    if(!PL.quiet&&state==='play'&&escEl.hidden)openEsc();PL.quiet=false}
});
document.addEventListener('mousemove',e=>{if(!PL.on)return;
  PL.x=Math.max(0,Math.min(W-1,PL.x+e.movementX));PL.y=Math.max(0,Math.min(H-1,PL.y+e.movementY));plDraw();
  const u=plUnder();plHover(PL.cap?null:u);
  if(PL.cap){plSend(PL.cap,'pointermove',e);return}
  plSend(u==='mm'?mm:cvs,'pointermove',e);if(u!=='map'&&u!=='mm')mouse.in=true;
});
document.addEventListener('mousedown',e=>{if(!PL.on)return;e.preventDefault();
  const u=plUnder();
  if(u==='map'||u==='mm'){PL.cap=u==='mm'?mm:cvs;plSend(PL.cap,'pointerdown',e);return}
  PL.press={el:u,button:e.button};
},true);
document.addEventListener('mouseup',e=>{if(!PL.on)return;
  if(PL.cap){const c=PL.clk,now=performance.now();c.n=now-c.t<350&&Math.hypot(PL.x-c.x,PL.y-c.y)<6?c.n+1:1;c.t=now;c.x=PL.x;c.y=PL.y;
    plSend(PL.cap,'pointerup',e,{detail:c.n});PL.cap=null;return}
  const p=PL.press;PL.press=null;if(!p)return;const u=plUnder();if(u!==p.el&&!(u instanceof Element&&p.el instanceof Element&&p.el.contains(u)))return;
  /* deliver to the control itself (the press may land on an icon inside it, e.g. an SVG, which has no click()) */
  const t=p.el.closest('button,[role=tab],.bt,.stb,.sbGrp,.sbCard,a,label')||p.el,mods={bubbles:true,cancelable:true,ctrlKey:e.ctrlKey,shiftKey:e.shiftKey,metaKey:e.metaKey,altKey:e.altKey};
  if(p.button===0){if(!t.disabled)t.dispatchEvent(new MouseEvent('click',Object.assign({button:0,detail:1},mods)))}
  else if(p.button===2)t.dispatchEvent(new MouseEvent('contextmenu',Object.assign({button:2},mods)));
},true);
/* the wheel scrolls the build list when the cursor is over it, otherwise it zooms (input.js) */
cvs.addEventListener('wheel',e=>{if(!PL.on)return;const u=plUnder();const tr=u instanceof Element&&u.closest('#tray');if(tr){tr.scrollTop+=e.deltaY;e.preventDefault();e.stopImmediatePropagation()}},{capture:true,passive:false});
/* keep the lock in step with the game: none in menus, none while the game menu is open */
function plFrame(){if(PL.on){if(!plWanted())plRelease();else plDraw()}}
/* game-menu toggle */
function plSync(){const b=$('#escLock');if(b){b.hidden=!plCan();b.textContent='Cursor lock: '+(PL.want?'On':'Off')}}
$('#escLock').addEventListener('click',()=>{PL.want=!PL.want;try{localStorage.setItem('cf-lock',PL.want?'1':'0')}catch(e){}plSync();sfx('click')});
plSync();
