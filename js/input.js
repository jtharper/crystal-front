'use strict';
/* ---------- input ---------- */
function entityAt(wx,wy,pred){
  let best=null,bd=14;
  for(const u of units){if(!pred(u))continue;const d=Math.hypot(u.x-wx,u.y-wy);if(d<bd){bd=d;best=u}}
  if(best)return best;
  for(const b of blds){if(pred(b)&&wx>=b.tx*T&&wx<(b.tx+b.w)*T&&wy>=b.ty*T&&wy<(b.ty+b.h)*T)return b}
  return null;
}
/* a group's own members are about to move, so only other units' positions count when spacing them out */
function openSpotFor(u,x,y,taken,list){const hide=list.filter(o=>o!==u&&!o.dead).map(o=>[o,o.dead]);for(const [o] of hide)o.dead=true;
  try{return openSpot(x,y,u,taken)}finally{for(const [o,d] of hide)o.dead=d}}
function groupDests(list,wx,wy){
  const tx=wx/T|0,ty=wy/T|0,cand=[];
  for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=MW||y>=MH||occ[y*MW+x])continue;cand.push({x,y,d:dx*dx+dy*dy})}
  cand.sort((a,b)=>a.d-b.d);
  const us=list.slice().sort((a,b)=>Math.hypot(a.x-wx,a.y-wy)-Math.hypot(b.x-wx,b.y-wy));
  /* biggest units claim spots first so tanks get room and infantry fill the gaps */
  const taken=[];us.sort((a,b)=>sepR(b)-sepR(a)||Math.hypot(a.x-wx,a.y-wy)-Math.hypot(b.x-wx,b.y-wy));
  for(const u of us){const s=openSpotFor(u,wx,wy,taken,list);taken.push({x:s.x,y:s.y,r:sepR(u)});u._dx=s.x;u._dy=s.y}
}
function ping(x,y,col){fxs.push({t:'ping',x,y,age:0,life:.5,r:18,col})}
function command(sx,sy,amove){
  const us=sel.filter(e=>e.k==='u'&&!e.dead&&e.side===ME);if(!us.length)return;
  sfx('ack');
  const w0=screenToWorld(sx,sy);if(!w0)return;const wx=r1(w0.x),wy=r1(w0.y);
  const tg=amove?null:pickScreen(sx,sy,e=>e.side!==ME&&!ally(ME,e.side)&&!e.dead&&seenBy0(e));
  issue({c:'go',u:us.map(u=>u.id),x:wx,y:wy,a:amove?1:0,t:tg?tg.id:null});
  if(tg){ping(tg.x,tg.y,us.some(u=>UDEF[u.type].eng)&&tg.k==='b'?'#5fd68a':'#ff5b44');return}
  ping(wx,wy,!amove&&cry[ti(wx,wy)]>0?'#c46bff':amove?'#ff5b44':'#5fd68a');
}
function moveGroup(us,wx,wy,amove){
  const air=us.filter(u=>u.air);if(air.length){airGo(air,wx,wy,amove);us=us.filter(u=>!u.air);if(!us.length)return}
  groupDests(us,wx,wy);
  for(const u of us){
    u.atk=null;u.cand=null;u.cap=null;u.amove=(amove&&u.type!=='harv'&&u.type!=='eng')?{x:u._dx,y:u._dy}:null;
    setPath(u,u._dx,u._dy);if(u.type==='harv')u.hold=true;
  }
}
const cvs=$('#cv'),mm=$('#mm'),mx=mm.getContext('2d'),ov=$('#ov'),ox=ov.getContext('2d');
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),_v=new THREE.Vector3();
let yaw=0,camDist=520,rot=null;
function screenToWorld(sx,sy){
  ndc.set(sx/W*2-1,-(sy/H)*2+1);ray.setFromCamera(ndc,camera);
  const o=ray.ray.origin,d=ray.ray.direction;if(d.y>=-.02)return null;
  let h=0,x=0,z=0;for(let i=0;i<3;i++){const t=(h-o.y)/d.y;x=o.x+d.x*t;z=o.z+d.z*t;h=hAt(x,z)}
  return {x,y:z};
}
function toScreen(x,h,z){_v.set(x,h,z).project(camera);return {x:(_v.x+1)/2*W,y:(1-_v.y)/2*H,behind:_v.z>1}}
/* where a unit is on screen: aircraft are picked at their altitude */
const uPickH=u=>{if(u.air){const r=ents.get(u.id);return (r?r.g.position.y:gH(u.x,u.y)+u.alt)+5}return gH(u.x,u.y)+9};
function pickScreen(sx,sy,pred){
  let best=null,bd=20;
  for(const u of units){if(!pred(u))continue;const p=toScreen(u.x,uPickH(u),u.y);if(p.behind)continue;const d=Math.hypot(p.x-sx,p.y-sy)-(u.air?10:0);if(d<bd){bd=d;best=u}}
  if(best)return best;
  const gs=[];for(const b of blds){if(!pred(b))continue;const r=ents.get(b.id);if(r&&r.g.visible)gs.push(r.g)}
  if(gs.length){ndc.set(sx/W*2-1,-(sy/H)*2+1);ray.setFromCamera(ndc,camera);const hit=ray.intersectObjects(gs,true).find(h=>h.object.name!=='dome'&&h.object.visible); /* clicks pass through shield domes */
    if(hit){let o=hit.object;while(o&&!o.userData.ent)o=o.parent;if(o)return o.userData.ent}}
  const w=screenToWorld(sx,sy);
  if(w)for(const b of blds)if(pred(b)&&w.x>=b.tx*T&&w.x<(b.tx+b.w)*T&&w.y>=b.ty*T&&w.y<(b.ty+b.h)*T)return b;
  return null;
}
function selectAt(sx,sy,add,dbl){
  const e=pickScreen(sx,sy,e=>e.side===ME&&!e.dead);
  if(!add)sel=[];
  if(!e)return;
  if(dbl&&e.k==='u'){
    for(const u of units){if(u.side!==ME||u.type!==e.type||u.dead||sel.includes(u))continue;const p=toScreen(u.x,uPickH(u),u.y);if(!p.behind&&p.x>=0&&p.x<=W&&p.y>=0&&p.y<=H)sel.push(u)}
    sfx('click');return;
  }
  const i=sel.indexOf(e);if(i>=0)sel.splice(i,1);else sel.push(e);
  sfx('click');
}
function boxSelect(x0,y0,x1,y1,add){
  const l=Math.min(x0,x1),r=Math.max(x0,x1),t=Math.min(y0,y1),b=Math.max(y0,y1);
  if(!add)sel=[];
  const got=[];for(const u of units){if(u.side!==ME||u.dead||sel.includes(u))continue;const p=toScreen(u.x,uPickH(u),u.y);if(!p.behind&&p.x>=l&&p.x<=r&&p.y>=t&&p.y<=b)got.push(u)}
  const army=got.filter(u=>u.type!=='harv');for(const u of (army.length?army:got))sel.push(u);
  if(sel.length)sfx('click');
}
function placeSpot(sx,sy,t,rot){
  const w=screenToWorld(sx,sy);if(!w)return null;
  const d=dims(t,rot||0);return {tx:Math.round(w.x/T-d.w/2),ty:Math.round(w.y/T-d.h/2)};
}
let lastRot=0;
function rotatePlace(){if(!place)return;place.rot=(place.rot+1)%4;lastRot=place.rot;sfx('click')}
function tryPlace(sx,sy){
  const s=sides[ME],t=place.t,sp=placeSpot(sx,sy,t,place.rot);
  if(s[RD(CAT[t])]!==t){place=null;return}
  if(!sp)return;
  if(!validPlace(ME,t,sp.tx,sp.ty,0,place.rot)){msg(inBuildZone(ME,sp.tx,sp.ty,dims(t,place.rot).w,dims(t,place.rot).h)?'Cannot build here: the ground is blocked.':'Too far from your Command Yard. Build inside the marked zone.','bad');sfx('err');return}
  issue({c:'place',t,x:sp.tx,y:sp.ty,r:place.rot});place=null;sfx('place');
}
const posOf=e=>{const r=cvs.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
cvs.addEventListener('contextmenu',e=>e.preventDefault());
mm.addEventListener('contextmenu',e=>e.preventDefault());
cvs.addEventListener('wheel',e=>{e.preventDefault();camDist=Math.max(ZMIN,Math.min(zMax(),camDist*Math.exp(e.deltaY*.001)))},{passive:false});
let ptrMouse=false;const ptrs=new Map();let gest=null,gestLock=false,lpT=0,lastTap=null,boxMode=false;
function startGest(){const [a,b]=[...ptrs.values()];gest={d0:Math.max(20,Math.hypot(b.x-a.x,b.y-a.y)),a0:Math.atan2(b.y-a.y,b.x-a.x),cd:camDist,y0:yaw,mx:(a.x+b.x)/2,my:(a.y+b.y)/2};gestLock=true}
function endPtr(e){if(e.pointerType==='mouse')return false;ptrs.delete(e.pointerId);if(gestLock){if(!ptrs.size){gestLock=false;gest=null}drag=null;clearTimeout(lpT);return true}return false}
cvs.addEventListener('pointercancel',e=>{if(typeof PL!=='undefined'&&PL.on&&e.isTrusted)return;endPtr(e);drag=null;clearTimeout(lpT)});
cvs.addEventListener('pointerdown',e=>{
  if(typeof PL!=='undefined'&&PL.on&&e.isTrusted)return;
  if(state!=='play')return;
  if(e.isTrusted&&e.pointerType==='mouse'&&typeof plRequest==='function')plRequest();
  try{cvs.setPointerCapture(e.pointerId)}catch(er){}
  const p=posOf(e);ptrMouse=e.pointerType==='mouse';if(ptrMouse||!place)mouse={x:p.x,y:p.y,in:true};
  if(e.pointerType!=='mouse'){ptrs.set(e.pointerId,p);if(ptrs.size>=2){startGest();drag=null;clearTimeout(lpT);return}if(gestLock)return}
  if(e.pointerType==='mouse'&&e.button===1){rot={x:p.x};e.preventDefault();return}
  if(e.pointerType==='mouse'&&e.button===2){
    if(place){place=null;return}
    if(mode){mode=null;return}
    if(sel.length===1&&isProd(sel[0])){setRally(sel[0],p.x,p.y);return}
    command(p.x,p.y,false);return;
  }
  drag={sx:p.x,sy:p.y,x:p.x,y:p.y,shift:e.shiftKey,touch:e.pointerType!=='mouse',panned:false,lx:p.x,ly:p.y,box:e.pointerType!=='mouse'&&boxMode,gx:mouse.x,gy:mouse.y};
  if(drag.touch&&!place&&!mode&&!drag.box){clearTimeout(lpT);lpT=setTimeout(()=>{const d=drag;if(d&&!d.panned&&!place&&!mode&&sel.some(u=>u.k==='u'&&u.side===ME&&!u.dead)){command(d.x,d.y,true);d.lp=true;sfx('ack');try{navigator.vibrate&&navigator.vibrate(18)}catch(err){}}},520)}
});
cvs.addEventListener('pointermove',e=>{
  if(typeof PL!=='undefined'&&PL.on&&e.isTrusted)return;
  const p=posOf(e);ptrMouse=e.pointerType==='mouse';
  if(ptrMouse||!place)mouse={x:p.x,y:p.y,in:true};
  else if(drag&&drag.touch&&ptrs.size<2){mouse={x:Math.max(0,Math.min(W,drag.gx+p.x-drag.sx)),y:Math.max(0,Math.min(H,drag.gy+p.y-drag.sy)),in:true}}
  if(e.pointerType!=='mouse'&&ptrs.has(e.pointerId)){ptrs.set(e.pointerId,p);
    if(gest&&ptrs.size>=2){const [a,b]=[...ptrs.values()],dd=Math.max(20,Math.hypot(b.x-a.x,b.y-a.y)),aa=Math.atan2(b.y-a.y,b.x-a.x),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      camDist=Math.max(ZMIN,Math.min(zMax(),gest.cd*gest.d0/dd));yaw=gest.y0+(aa-gest.a0);
      const w1=screenToWorld(gest.mx,gest.my),w2=screenToWorld(mx,my);if(w1&&w2){cam.x-=w2.x-w1.x;cam.y-=w2.y-w1.y;clampCam()}gest.mx=mx;gest.my=my;updateCamera();return}
    if(gestLock)return}
  if(rot){yaw+=(p.x-rot.x)*.006;rot.x=p.x;return}
  if(!drag)return;
  drag.x=p.x;drag.y=p.y;
  if(drag.touch&&Math.hypot(p.x-drag.sx,p.y-drag.sy)>9)clearTimeout(lpT);
  if(drag.touch&&!place&&!drag.box&&Math.hypot(p.x-drag.sx,p.y-drag.sy)>8){
    drag.panned=true;const a=screenToWorld(drag.lx,drag.ly),b=screenToWorld(p.x,p.y);
    if(a&&b){cam.x-=b.x-a.x;cam.y-=b.y-a.y;clampCam();updateCamera()}
  }
  drag.lx=p.x;drag.ly=p.y;
});
cvs.addEventListener('pointerleave',()=>{if(typeof PL!=='undefined'&&PL.on)return;mouse.in=false});
cvs.addEventListener('pointerup',e=>{
  if(typeof PL!=='undefined'&&PL.on&&e.isTrusted)return;
  if(endPtr(e))return;
  if(rot){rot=null;return}
  if(!drag||state!=='play'){drag=null;return}
  const d=drag;drag=null;if(e.button===2)return;
  if(place){if(!d.touch)tryPlace(d.x,d.y);return}
  if(d.touch){
    clearTimeout(lpT);if(d.lp)return;
    if(d.box){if(Math.hypot(d.x-d.sx,d.y-d.sy)>10)boxSelect(d.sx,d.sy,d.x,d.y,false);else selectAt(d.x,d.y,false,false);boxMode=false;return}
    if(d.panned)return;
    const now=performance.now(),dbl=!!lastTap&&now-lastTap.t<340&&Math.hypot(d.x-lastTap.x,d.y-lastTap.y)<30;lastTap={t:now,x:d.x,y:d.y};
    const own=pickScreen(d.x,d.y,en=>en.side===ME&&!en.dead);
    if(mode==='rift'){riftAt(d.x,d.y);mode=null}
    else if(mode==='repair')repairAt(d.x,d.y);
    else if(mode==='sell')sellAt(d.x,d.y);
    else if(mode==='amove'){command(d.x,d.y,true);mode=null}
    else if(own)selectAt(d.x,d.y,false,dbl);
    else if(sel.length===1&&isProd(sel[0])){setRally(sel[0],d.x,d.y);sel=[]}
    else if(sel.some(s=>s.k==='u'))command(d.x,d.y,false);
    else sel=[];
    return;
  }
  if(mode==='rift'){riftAt(d.x,d.y);mode=null;return}
  if(mode==='repair'){repairAt(d.x,d.y);return}
  if(mode==='sell'){sellAt(d.x,d.y);return}
  if(mode==='amove'){command(d.x,d.y,true);mode=null;return}
  const moved=Math.hypot(d.x-d.sx,d.y-d.sy)>5;
  if(moved)boxSelect(d.sx,d.sy,d.x,d.y,d.shift);
  else selectAt(d.x,d.y,d.shift,e.detail>=2);
});
/* the minimap turns with the camera in quarter steps, so 'up' on the minimap is always 'up' on screen */
let mmRot=0;
function mmPos(e){const r=mm.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=(e.clientX-cx)/r.width,dy=(e.clientY-cy)/r.height,c=Math.cos(-mmRot),s=Math.sin(-mmRot);
  return {x:(dx*c-dy*s+.5)*WW,y:(dx*s+dy*c+.5)*WH}}
let mmDrag=false;
mm.addEventListener('pointerdown',e=>{
  if(state!=='play')return;
  const p=mmPos(e);
  if(e.pointerType==='mouse'&&e.button===2){moveGroupWorld(p.x,p.y);return}
  try{mm.setPointerCapture(e.pointerId)}catch(er){}mmDrag=true;cam.x=p.x;cam.y=p.y;clampCam();
});
mm.addEventListener('pointermove',e=>{if(!mmDrag)return;const p=mmPos(e);cam.x=p.x;cam.y=p.y;clampCam()});
mm.addEventListener('pointerup',()=>{mmDrag=false});
function moveGroupWorld(wx,wy){const us=sel.filter(e=>e.k==='u'&&!e.dead&&e.side===ME);if(!us.length)return;issue({c:'go',u:us.map(u=>u.id),x:r1(wx),y:r1(wy),a:0,t:null});ping(wx,wy,'#5fd68a')}
let lastGrp=null;
addEventListener('keydown',e=>{
  if(e.target.tagName==='BUTTON'&&(e.key===' '||e.key==='Enter'))return;
  const k=e.key.toLowerCase();keys[k]=true;
  if(k==='escape'&&state==='menu'){if(!$('#colPop').hidden)$('#colPop').hidden=true;else if($('.card').classList.contains('setup')){if(!$('#pOnline').hidden)netReset();showPanel('home');sfx('click')}return}
  if(state!=='play')return;
  if(k==='escape'&&typeof PL!=='undefined'&&performance.now()-PL.lostAt<400)return;
  if(k==='escape'){if(!escEl.hidden&&!$('#escConfirm').hidden)escBack();else if(escEl.hidden&&(place||mode)){place=null;mode=null}else togglePause();return}
  if(!escEl.hidden)return;
  if(k==='r'&&place){rotatePlace()}
  else if(k==='a'&&(e.ctrlKey||e.metaKey)){e.preventDefault();selectArmy()}
  else if(k==='t'&&sel.some(e=>e.type==='rift'&&e.side===ME)){place=null;mode='rift'}
  else if(k==='g'){toggleRepair()}
  else if(k==='x'){toggleSell()}
  else if(k===' '&&alerts.length){const a=alerts[alerts.length-1];cam.x=a.x;cam.y=a.y;clampCam();e.preventDefault()}
  else if(k==='a'&&sel.some(s=>s.k==='u')){mode='amove'}
  else if(k==='s'){const us=sel.filter(u=>u.k==='u'&&u.side===ME&&!u.dead);if(us.length){issue({c:'stop',u:us.map(u=>u.id)});sfx('ack')}}
  else if(k==='p')togglePause();
  else if(k==='m')toggleMute();
  else if(k==='h'){const y=blds.find(b=>b.side===ME&&b.type==='yard');if(y){cam.x=y.x;cam.y=y.y;clampCam()}}
  else if(/^[1-9]$/.test(k)){
    if(e.ctrlKey||e.metaKey){groups[k]=sel.slice();e.preventDefault();msg('Group '+k+' set','')}
    else if(groups[k]){sel=groups[k].filter(x=>!x.dead);if(sel.length){const c=sel[0];if(lastGrp===k){cam.x=c.x;cam.y=c.y;clampCam()}lastGrp=k}}
  }
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)&&e.target===document.body)e.preventDefault();
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false});
const escEl=$('#escMenu');let escAction=null;
function syncEscSound(){$('#escSound').textContent='Sound: '+(muted?'Off':'On')}
function openEsc(){if(state!=='play')return;if(typeof plRelease==='function')plRelease();paused=!NET.on;drag=null;escBack();syncEscSound();escEl.hidden=false;$('#escResume').focus()}
function closeEsc(){escEl.hidden=true;paused=false;if(typeof plRequest==='function')plRequest()}
function escBack(){$('#escMain').hidden=false;$('#escConfirm').hidden=true;escAction=null}
function escAsk(q,act){$('#escQ').textContent=q;$('#escMain').hidden=true;$('#escConfirm').hidden=false;escAction=act;$('#escNo').focus()}
function toggleSell(){if(state!=='play')return;place=null;mode=mode==='sell'?null:'sell';sfx('click')}
function sellAt(sx,sy){const b=pickScreen(sx,sy,e=>e.k==='b'&&e.side===ME&&!e.dead);if(!b)return;
  if(BDEF[b.type].cap){msg("This structure can't be sold",'bad');sfx('err');return}
  if(b.type==='yard'){msg("The Command Yard can't be sold.",'bad');sfx('err');return}
  issue({c:'sell',b:b.id});mode=null}
/* simulation side of selling (runs on every player's game at the same step) */
function sellBld(b,side){
  if(!b||b.dead||b.side!==side||state!=='play'||BDEF[b.type].cap||b.type==='yard')return;
  const val=Math.floor((BDEF[b.type].cost||0)*.5),sd=sides[b.side];
  sd.credits+=val;if(b.q&&b.q.length)sd.credits+=b.q.reduce((a,i)=>a+i.paid,0);
  b.sold=true;b.repairing=false;b.dead=true;
  for(let y=b.ty;y<b.ty+b.h;y++)for(let x=b.tx;x<b.tx+b.w;x++)occ[y*MW+x]=0;
  for(let i=0;i<7;i++)fxs.push({t:'dust',x:b.x+(vr()-.5)*b.w*T*.8,y:b.y+(vr()-.5)*b.h*T*.8,h:3,age:-vr()*.5,life:1.8,r:11});
  if(side===ME){msg(`Sold ${BDEF[b.type].name} for $${val}.`,'ok');sfx('place');say('Structure sold','sell',.5)}
}
$('#sellBtn').addEventListener('click',toggleSell);
document.querySelectorAll('[data-cancel]').forEach(b=>b.addEventListener('click',e=>{e.stopPropagation();place=null;mode=null;sfx('click')}));
const myArmy=()=>sel.filter(u=>u.k==='u'&&u.side===ME&&!u.dead);
$('#tbBox').addEventListener('click',()=>{boxMode=!boxMode;sfx('click')});
const selectArmy=()=>{if(state!=='play')return;place=null;mode=null;sel=units.filter(u=>u.side===ME&&!u.dead&&u.type!=='harv');updSel();sfx(sel.length?'ack':'err');if(!sel.length)msg('No army to select','')};
$('#tbAll').addEventListener('click',selectArmy);$('#armyBtn').addEventListener('click',selectArmy);
$('#tbAtk').addEventListener('click',()=>{if(!myArmy().length)return;place=null;mode=mode==='amove'?null:'amove';sfx('click')});
$('#tbStop').addEventListener('click',()=>{const us=myArmy();if(us.length)issue({c:'stop',u:us.map(u=>u.id)});sfx('ack')});
$('#tbHome').addEventListener('click',()=>{const y=blds.find(b=>b.side===ME&&b.type==='yard'&&!b.dead)||blds.find(b=>b.side===ME&&!b.dead);if(y){cam.x=y.x;cam.y=y.y;clampCam()}});
$('#sideTgl').addEventListener('click',()=>{const off=document.body.classList.toggle('sideOff');$('#sideTgl').innerHTML=off?'&#9664;':'&#9654;';$('#sideTgl').setAttribute('aria-label',off?'Show command panel':'Hide command panel')});
{const fs=$('#fsBtn'),de=document.documentElement,can=document.fullscreenEnabled||document.webkitFullscreenEnabled;
  if(TOUCH&&can&&(de.requestFullscreen||de.webkitRequestFullscreen)){fs.hidden=false;
    fs.addEventListener('click',()=>{try{if(document.fullscreenElement||document.webkitFullscreenElement){(document.exitFullscreen||document.webkitExitFullscreen).call(document)}
      else{const r=(de.requestFullscreen||de.webkitRequestFullscreen).call(de);if(r&&r.then)r.then(()=>{try{screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{})}catch(err){}}).catch(()=>{fs.hidden=true})}}catch(err){fs.hidden=true}})}}
if(TOUCH){$('#placeTxt').textContent='Drag to move';$('#repTxt').textContent='Tap damaged buildings to repair';$('#sellTxt').textContent='Tap a building to sell it for half price'}
else{$('#repTxt').textContent='Click damaged buildings to repair';$('#sellTxt').textContent='Click a building to sell it for half price';
  const dl=document.querySelector('.howto .keys');if(dl)dl.innerHTML=[['Left-click','Select · drag a box to select many'],['Right-click','Move / attack · cancel placement'],['Double-click','Select all of that unit type'],
    ['A + click','Attack-move'],['R','Rotate a building while placing'],['Arrows','Scroll (or move the mouse to the screen edge) · Q / E rotate · wheel zoom'],['Ctrl+A','Select whole army'],['Ctrl+1-9','Save a group · 1-9 recall it'],
    ['X / G','Sell / repair mode'],['H','Jump to your base'],['Space','Jump to the latest alert'],['Esc / P','Game menu / pause']].map(([k,v])=>`<dt>${k}</dt><dd>${v}</dd>`).join('')}
function toggleRepair(){if(state!=='play')return;place=null;mode=mode==='repair'?null:'repair';sfx('click')}
function repairAt(sx,sy){
  const b=pickScreen(sx,sy,e=>e.k==='b'&&e.side===ME&&!e.dead);if(!b)return;
  if(b.hp>=b.mhp&&!b.repairing){msg(BDEF[b.type].name+' is not damaged.','');return}
  const on=!b.repairing;issue({c:'repair',b:b.id,on:on?1:0});sfx('click');if(on)msg('Repairing '+BDEF[b.type].name+'.','ok');
}
$('#repBtn').addEventListener('click',toggleRepair);
let alertT=0;function showAlert(){const b=$('#alertBtn');b.hidden=false;clearTimeout(alertT);alertT=setTimeout(()=>{b.hidden=true},5000)}
function togglePause(){if(state!=='play')return;escEl.hidden?openEsc():closeEsc()}
function showPanel(n){
  for(const [k,id] of [['home','#pHome'],['setup','#pSetup'],['end','#pEnd'],['online','#pOnline']])$(id).hidden=k!==n;
  $('.card').classList.toggle('setup',n==='setup'||n==='online');
  $('#ovTitle').hidden=n!=='end';
  if(n==='home'||n==='setup')$('#ovText').textContent='Harvest. Build. Conquer.';
}
function exitToMenu(){
  if(NET.on)netResign();netReset();
  closeEsc();sel=[];place=null;mode=null;
  $('#overlay').hidden=false;showPanel('home');
  menuScene();
}
$('#escResume').addEventListener('click',closeEsc);
$('#escSound').addEventListener('click',()=>{toggleMute();syncEscSound()});
$('#escRestart').addEventListener('click',()=>escAsk('Restart this match?',()=>{closeEsc();startGame(diffKey)}));
$('#escExit').addEventListener('click',()=>escAsk(NET.on?'Surrender and leave this match?':'Leave this match?',exitToMenu));
$('#escNo').addEventListener('click',escBack);
$('#escYes').addEventListener('click',()=>{const a=escAction;escBack();if(a)a()});
$('#pauseBtn').addEventListener('click',togglePause);
$('#rotBtn').addEventListener('click',rotatePlace);
$('#trayX').addEventListener('click',()=>{trayOpen=false;sfx('click');updUI()});
$('#placeOk').addEventListener('click',()=>{if(place)tryPlace(mouse.x,mouse.y)});
$('#alertBtn').addEventListener('click',()=>{const a=alerts[alerts.length-1]||alertPos;if(a){cam.x=a.x;cam.y=a.y;clampCam()}$('#alertBtn').hidden=true});

$('#muteBtn').addEventListener('click',toggleMute);
