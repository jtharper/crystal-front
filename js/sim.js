'use strict';
/* ---------- entities ---------- */
function addUnit(type,side,x,y){
  const d=UDEF[type];
  const u={id:nid++,k:'u',type,side,x,y,hp:d.hp,mhp:d.hp,ang:rng()*6.28,tang:0,path:null,pi:0,atk:null,cool:0,amove:null,cargo:0,hold:false,rep:0,flash:0,scan:rng()*.3,cand:null,hs:'seek',ref:null};
  if(d.air){u.air=true;u.alt=0;u.v=0;u.ammo=d.ammo||0;u.padI=-1;u.home=null;u.dest=null;u.as='fly'}
  u.tang=u.ang;units.push(u);return u;
}
function dims(t,rot){const d=BDEF[t];return rot&1?{w:d.h,h:d.w}:{w:d.w,h:d.h}}
const DOOR=[[0,1],[-1,0],[0,-1],[1,0]];
function doorPt(b){const r=b.rot||0;return r===0?[b.tx+b.w/2,b.ty+b.h+.5]:r===1?[b.tx-.5,b.ty+b.h/2]:r===2?[b.tx+b.w/2,b.ty-.5]:[b.tx+b.w+.5,b.ty+b.h/2]}
function addBld(type,side,tx,ty,rot){
  rot=rot||0;const d=dims(type,rot);
  const b={id:nid++,k:'b',type,side,tx,ty,rot,w:d.w,h:d.h,x:(tx+d.w/2)*T,y:(ty+d.h/2)*T,hp:BDEF[type].hp,mhp:BDEF[type].hp,cool:0,tang:Math.PI/2,flash:0,seen:side===ME,cand:null,scan:0};
  for(let y=ty;y<ty+d.h;y++)for(let x=tx;x<tx+d.w;x++)occ[y*MW+x]=2;
  blds.push(b);return b;
}
function findFree(tx,ty){
  tx=Math.max(0,Math.min(MW-1,tx|0));ty=Math.max(0,Math.min(MH-1,ty|0));
  for(let r=0;r<16;r++){
    let best=-1,bd=1e9;
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
      if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
      const x=tx+dx,y=ty+dy;if(x<0||y<0||x>=MW||y>=MH||occ[y*MW+x])continue;
      const d=dx*dx+dy*dy;if(d<bd){bd=d;best=y*MW+x}
    }
    if(best>=0)return best;
  }
  return ty*MW+tx;
}
function edgeDist(u,t){
  if(t.k==='u')return Math.hypot(t.x-u.x,t.y-u.y)-8;
  const dx=Math.max(t.tx*T-u.x,0,u.x-(t.tx+t.w)*T),dy=Math.max(t.ty*T-u.y,0,u.y-(t.ty+t.h)*T);
  return Math.hypot(dx,dy);
}
function nearestEnemy(e,r){
  let best=null,bd=r;
  for(const o of units){if(o.dead||!enemy(e.side,o.side)||o.cloaked||!canHit(e,o))continue;const d=Math.hypot(o.x-e.x,o.y-e.y)-8;if(d<bd){bd=d;best=o}}
  for(const o of blds){if(o.dead||!enemy(e.side,o.side)||BDEF[o.type].cap)continue;const d=edgeDist(e,o)+20;if(d<bd){bd=d;best=o}}
  return best;
}
function shieldFor(b){for(const o of blds)if(o.type==='shield'&&!o.dead&&o.side===b.side&&!(sides[o.side]||{}).low&&Math.hypot(o.x-b.x,o.y-b.y)<SHIELD_R)return o;return null}
function hurt(e,dmg,from){
  if(e.dead||(e.k==='b'&&BDEF[e.type].cap))return;
  if(e.k==='b'){const sh=shieldFor(e);if(sh){dmg*=.5;sh.sfl=.3}}
  if(e.k==='u'&&UDEF[e.type].stealth)e.revealT=Math.max(e.revealT||0,1.5);
  e.hp-=dmg;e.flash=.1;
  if(e.side===ME&&from&&from.side!==ME){
    const near=alerts.find(a=>Math.hypot(a.x-e.x,a.y-e.y)<T*10&&time-a.t<12);
    if(near){near.t=time}else{alerts.push({x:e.x,y:e.y,t:time,t0:time});if(alerts.length>6)alerts.shift();alertPos={x:e.x,y:e.y,t:time};
      if(time-lastAlert>3){lastAlert=time;showAlert();sfx('alert');say(e.k==='b'?'Our base is under attack':'Unit under attack','attack',14)}fxs.push({t:'ping',x:e.x,y:e.y,age:0,life:1.2,r:60,col:'#ff5b44'})}
  }
  if(e.hp<=0){kill(e);return}
  if(e.k==='u'&&from&&!from.dead&&!e.atk&&!e.path&&!e.dest&&UDEF[e.type].dmg&&UDEF[e.type].wt!=='bomb'&&canHit(e,from))e.atk=from;
}
function kill(e){
  e.dead=true;if(e.q&&e.q.length)sides[e.side].credits+=e.q.reduce((a,i)=>a+i.paid,0);sfx(e.k==='b'?'boomBig':'boomSmall',e.x,e.y);
  if(e.k==='b'){
    for(let y=e.ty;y<e.ty+e.h;y++)for(let x=e.tx;x<e.tx+e.w;x++)occ[y*MW+x]=0;
    for(let i=0;i<5+e.w*e.h;i++)fxs.push({t:'boom',x:e.x+(rng()-.5)*e.w*T,y:e.y+(rng()-.5)*e.h*T,age:-rng()*.6,life:.7,r:18+rng()*18});
  }else if(e.air&&e.alt>8){for(let i=0;i<3;i++)fxs.push({t:'boom',x:e.x+(rng()-.5)*20,y:e.y+(rng()-.5)*20,h:e.alt+(rng()-.5)*10,age:-rng()*.2,life:.6,r:20})}
  else fxs.push({t:'boom',x:e.x,y:e.y,age:0,life:.5,r:e.air?24:e.type==='tank'||e.type==='harv'||e.type==='htank'||e.type==='mlrs'?(e.type==='htank'?32:26):14});
}

/* ---------- pathfinding ---------- */
function los(x0,y0,x1,y1){
  const dx=x1-x0,dy=y1-y0,L=Math.hypot(dx,dy),n=Math.ceil(L/8),px=-dy/(L||1)*6,py=dx/(L||1)*6;
  for(let i=1;i<=n;i++){const t=i/n,x=x0+dx*t,y=y0+dy*t;
    if(occ[ti(x,y)]||occ[ti(x+px,y+py)]||occ[ti(x-px,y-py)])return false}
  return true;
}
function smooth(sx,sy,pts){
  const out=[];let cx=sx,cy=sy,i=0;
  while(i<pts.length){let j=pts.length-1;while(j>i&&!los(cx,cy,pts[j].x,pts[j].y))j--;out.push(pts[j]);cx=pts[j].x;cy=pts[j].y;i=j+1}
  return out;
}
function findPath(sx,sy,gx,gy){
  const si=ti(sx,sy),gi=ti(gx,gy);
  if(si===gi)return [tc(gi)];
  const N=MW*MH,g=new Float32Array(N).fill(1e9),par=new Int32Array(N).fill(-1),closed=new Uint8Array(N);
  const hf=[],hi=[];
  const push=(f,i)=>{let n=hf.length;hf.push(f);hi.push(i);while(n>0){const p=(n-1)>>1;if(hf[p]<=hf[n])break;[hf[p],hf[n]]=[hf[n],hf[p]];[hi[p],hi[n]]=[hi[n],hi[p]];n=p}};
  const pop=()=>{const r=hi[0],lf=hf.pop(),li=hi.pop();if(hf.length){hf[0]=lf;hi[0]=li;let n=0;for(;;){const l=2*n+1,rr=l+1;let m=n;if(l<hf.length&&hf[l]<hf[m])m=l;if(rr<hf.length&&hf[rr]<hf[m])m=rr;if(m===n)break;[hf[m],hf[n]]=[hf[n],hf[m]];[hi[m],hi[n]]=[hi[n],hi[m]];n=m}}return r};
  const gx_=gi%MW,gy_=(gi/MW)|0;
  const h=i=>{const dx=Math.abs(i%MW-gx_),dy=Math.abs(((i/MW)|0)-gy_);return Math.max(dx,dy)+.414*Math.min(dx,dy)};
  g[si]=0;push(h(si),si);let it=0,found=false;
  while(hf.length&&it++<6000){
    const c=pop();if(closed[c])continue;closed[c]=1;if(c===gi){found=true;break}
    const cx=c%MW,cy=(c/MW)|0;
    for(let k=0;k<8;k++){
      const nx=cx+DX[k],ny=cy+DY[k];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;
      const ni=ny*MW+nx;if(occ[ni]||closed[ni])continue;
      if(k>=4&&(occ[cy*MW+nx]||occ[ny*MW+cx]))continue;
      const ng=g[c]+(k<4?1:1.414);if(ng<g[ni]){g[ni]=ng;par[ni]=c;push(ng+h(ni),ni)}
    }
  }
  if(!found)return null;
  const pts=[];for(let c=gi;c!==si&&c>=0;c=par[c])pts.push(tc(c));pts.reverse();
  return smooth(sx,sy,pts);
}
function setPath(u,x,y){
  const gi=findFree(x/T,y/T),exact=gi===ti(x,y),p=findPath(u.x,u.y,(gi%MW+.5)*T,(((gi/MW)|0)+.5)*T);
  if(p&&p.length&&exact)p[p.length-1]={x,y};
  u.path=p&&p.length?p:null;u.pi=0;return !!u.path;
}
/* ---------- spacing: every unit keeps a footprint so groups spread out instead of stacking ---------- */
const SEPR={rifle:6.5,rocket:6.5,gren:7,sniper:6.5,eng:6.5,rift:7,tank:16,htank:21,stank:15,mlrs:16,buggy:13,arty:17,harv:17};
const sepR=u=>SEPR[u.type]||UDEF[u.type].r;
const goalOf=o=>o.path?o.path[o.path.length-1]:o;
/* nearest spot around (x,y) on open ground that no other unit stands on or is heading to */
function openSpot(x,y,u,taken){
  const r0=sepR(u),step=Math.max(14,r0*2.1);
  const clear=(px,py)=>{if(px<T||py<T||px>WW-T||py>WH-T)return false;const i=ti(px,py);if(occ[i]||ter[i]===2)return false;
    for(const [ax,ay] of [[-r0*.7,0],[r0*.7,0],[0,-r0*.7],[0,r0*.7]])if(occ[ti(px+ax,py+ay)])return false;
    for(const o of units){if(o===u||o.dead||o.docked||o.air)continue;const g=goalOf(o),m=r0+sepR(o);if(Math.abs(g.x-px)<m&&Math.abs(g.y-py)<m&&Math.hypot(g.x-px,g.y-py)<m)return false}
    if(taken)for(const t of taken)if(Math.hypot(t.x-px,t.y-py)<r0+t.r)return false;return true};
  if(clear(x,y))return {x,y};
  for(let ring=1;ring<9;ring++){const n=Math.max(6,Math.round(ring*6.3)),a0=rng()*6.28;
    for(let k=0;k<n;k++){const a=a0+k/n*6.2832,px=x+Math.cos(a)*ring*step,py=y+Math.sin(a)*ring*step;if(clear(px,py))return {x:px,y:py}}}
  return {x,y};
}
function moveSpread(u,x,y,taken){const s=openSpot(x,y,u,taken);if(taken)taken.push({x:s.x,y:s.y,r:sepR(u)});return setPath(u,s.x,s.y)}
function pathToward(u,tg){
  const d=UDEF[u.type];let dx=u.x-tg.x,dy=u.y-tg.y;const L=Math.hypot(dx,dy)||1;
  const rr=(tg.k==='b'?Math.max(tg.w,tg.h)*T/2:0)+d.range*T*.7;
  const k=Math.min(rr,L);setPath(u,tg.x+dx/L*k,tg.y+dy/L*k);
}

/* ---------- units ---------- */
function moveAlong(u,dt){
  if(!u.path)return;
  const d=UDEF[u.type];let step=d.speed*dt;
  while(step>0&&u.path){
    const p=u.path[u.pi],dx=p.x-u.x,dy=p.y-u.y,dist=Math.hypot(dx,dy);
    const want=Math.atan2(dy,dx)+(u.rev?Math.PI:0);u.ang=turn(u.ang,want,dt*d.turn);
    /* vehicles turn on the spot before setting off on a new heading instead of sliding sideways */
    if(d.armor==='veh'&&dist>2){const off=Math.abs(angd(u.ang,want));if(off>.9)break;if(off>.25)step*=Math.max(.35,Math.cos(off))}
    if(dist<=step){u.x=p.x;u.y=p.y;step-=dist;u.pi++;if(u.pi>=u.path.length){u.path=null;u.hold=false;break}}
    else{u.x+=dx/dist*step;u.y+=dy/dist*step;step=0}
  }
}
function capture(b,u){
  const old=b.side;b.side=u.side;b.q=[];b.repairing=false;b.doorT=0;b.seen=true;
  if(old>=0&&sides[old]){for(const slot of ['ready','readyD'])if(sides[old][slot]&&b.type==='yard'){} }
  forget(b.id);if(b.side!==ME)remember(b);
  const r=ents.get(b.id);if(r){entGroup.remove(r.g);ents.delete(b.id)}
  u.dead=true;u.silent=true;sel=sel.filter(e=>e!==u);
  fxs.push({t:'ping',x:b.x,y:b.y,age:0,life:1,r:70,col:'#5fd68a'});sfx('ready');
  if(u.side===ME){msg(BDEF[b.type].name+' captured','ok');say(b.type==='spike'?'Crystal spike captured':b.type==='radar'?'Radar tower captured':'Building captured','cap',1)}
  else if(old===0){msg(BDEF[b.type].name+' lost to the enemy','bad');say('Building lost','cap',1)}
}
function isProd(b){return b&&b.k==='b'&&b.side===ME&&!b.dead&&(b.type==='barracks'||b.type==='factory'||b.type==='airfield')}
function setRally(b,sx,sy){const w=screenToWorld(sx,sy);if(!w)return;issue({c:'rally',b:b.id,x:r1(w.x),y:r1(w.y)});ping(w.x,w.y,'#ffd27a');fxs.push({t:'ping',x:w.x,y:w.y,age:0,life:.9,r:40,col:'#ffd27a'});sfx('ack');msg('Rally point set','ok')}
function riftAt(sx,sy){
  const w=screenToWorld(sx,sy);if(!w)return;
  const rws=sel.filter(e=>e.type==='rift'&&!e.dead&&e.side===ME&&!(e.rcd>0));if(!rws.length){msg('Rift Walker is recharging','bad');sfx('err');return}
  const rw=rws.sort((a,b)=>Math.hypot(a.x-w.x,a.y-w.y)-Math.hypot(b.x-w.x,b.y-w.y))[0];
  if(Math.hypot(rw.x-w.x,rw.y-w.y)>RIFT_R){msg('Too far: Rift Jump reaches '+(RIFT_R/T|0)+' tiles','bad');sfx('err');return}
  if(occ[ti(w.x,w.y)]){msg("Can't open a rift there",'bad');sfx('err');return}
  issue({c:'rift',r:rw.id,x:r1(w.x),y:r1(w.y)});
}
function riftJump(rw,wx,wy){
  const sq=units.filter(u=>!u.dead&&u.side===rw.side&&u.type!=='harv'&&!u.air&&Math.hypot(u.x-rw.x,u.y-rw.y)<T*4.2);
  for(const u of sq)fxs.push({t:'ping',x:u.x,y:u.y,age:0,life:.7,r:22,col:'#9fffd8'});
  groupDests(sq,wx,wy);
  for(const u of sq){relDock(u);u.x=u._dx;u.y=u._dy;u.path=null;u.atk=null;u.amove=null;u.cap=null;u.rally=null;fxs.push({t:'flash',x:u.x,y:u.y,age:0,life:.3,r:14})}
  fxs.push({t:'ping',x:wx,y:wy,age:0,life:1.1,r:90,col:'#9fffd8'});rw.rcd=RIFT_CD;sfx('ready',wx,wy);
  if(rw.side===ME){msg('Rift Jump: '+sq.length+' unit'+(sq.length>1?'s':'')+' moved','ok');say('Rift open','rift',1)}
}
function updEng(u,dt){
  u.tang=u.ang;
  const c=u.cap;if(!c)return;
  if(c.dead||c.side===u.side){u.cap=null;return}
  if(edgeDist(u,c)<T*.8){capture(c,u);return}
  u.rep=(u.rep||0)-dt;if(!u.path&&u.rep<=0){u.rep=.8;pathToward(u,c)}
}
function updCombat(u,dt){
  const d=UDEF[u.type];if(d.eng){updEng(u,dt);return}
  if(u.atk&&(u.atk.dead||u.atk.cloaked||!canHit(u,u.atk)))u.atk=null;
  let tg=u.atk;
  if(!tg&&(!u.path||u.amove)){
    u.scan-=dt;
    if(u.scan<=0){u.scan=.2+rng()*.1;u.cand=nearestEnemy(u,d.range*T*hiScan(u)+(u.path?0:2*T))}
    if(u.cand&&!u.cand.dead&&canHit(u,u.cand))tg=u.cand;else u.cand=null;
  }
  if(tg){
    const dist=edgeDist(u,tg),want=Math.atan2(tg.y-u.y,tg.x-u.x);
    if(dist<=d.range*T*hiMul(u,tg)){
      u.path=null;
      u.tang=turn(u.tang,want,dt*(d.turn+3));
      if(d.armor==='inf')u.ang=u.tang; /* vehicles keep their hull heading; the turret swings to the target */
      if(u.cool<=0&&Math.abs(angd(u.tang,want))<.3){u.cool=d.rof;shoot(u,tg,d)}
    }else if(u.atk===tg||!u.path){
      u.rep-=dt;if(!u.path||u.rep<=0){u.rep=.6;pathToward(u,tg)}
    }
  }else{
    u.tang=turn(u.tang,u.ang,dt*6);
    if(u.amove&&!u.path){
      if(Math.hypot(u.amove.x-u.x,u.amove.y-u.y)<T*1.5)u.amove=null;
      else if(!setPath(u,u.amove.x,u.amove.y))u.amove=null;
    }
  }
}
/* muzzle offsets in model space: [forward, height, side], an entry may be per faction [Vanguard,Syndicate,Helix] */
const MUZ={rifle:[11,10,1.2],rift:[11,10,1.2],rocket:[10,[14,14,12.6],3.6],gren:[8.5,10,1.2],sniper:[[20,27,19],10.2,1.2],
  tank:[[32,40.7,49.1],[16.2,18.1,17.6],[0,3,0]],htank:[[37.6,49.2,51.5],[19.6,20.4,20.4],[4.3,4.2,3.8]],mlrs:[[2,-.2,-3],[22,22.3,26.6],[3,1.4,2.8]],buggy:[[9.2,10.6,1.8],[13.6,16.7,16.6],[0,0,2.5]],arty:[[30,35,35.8],[27,28.8,29.1],0],stank:[26.1,16,1.6],
  turret:[16,22,0],guard:[12,24,0],missile:[10,22,0],gunship:[27,-1,0],bomber:[0,-4,0]};
const pick3=(v,st)=>Array.isArray(v)?v[st]:v;
function muzzle(a,k){const st=Math.max(0,facOf(a.side)),M=MUZ[a.type]||[10,12,0],f=pick3(M[0],st),h=pick3(M[1],st),sd=pick3(M[2],st)*(k?-1:1);
  const c=Math.cos(a.tang),s=Math.sin(a.tang);return {x:a.x+c*f-s*sd,y:a.y+s*f+c*sd,h:h+(a.alt||0)}}
const aimH=t=>t.k==='b'?(BTOP[t.type]||30)*.4:(t.alt||0)+(UTOP[t.type]||20)*.45;
/* Helix fires energy weapons; the other factions fire tracers, shells and smoke-trailing missiles */
function shoot(a,tg,d){
  if(a.k==='u'&&UDEF[a.type].stealth)a.revealT=2.6;
  const laser=facOf(a.side)===2,wt=d.wt,col=COLORS[sides[a.side].col].ge,two=a.type==='htank'||a.type==='mlrs';
  const beam=laser&&(wt==='cannon'||wt==='tcannon'||wt==='snipe');
  if(laser)sfx(beam?'lbeam':wt==='bullet'||wt==='chain'?'laser':wt==='rocket'?'lrocket':wt==='grenade'||wt==='shell'?'lorb':'laser',a.x,a.y);
  else sfx(wt==='snipe'?'snipe':wt==='chain'?'mg':wt==='bullet'?(a.type==='buggy'||a.type==='guard'?'mg':'rifle'):wt==='rocket'?'rocket':wt==='shell'?'arty':wt==='grenade'?'gren':'tank',a.x,a.y);
  const th=aimH(tg);
  for(let k=0;k<(two?2:1);k++){
    const m=muzzle(a,k),sp=d.psp*(beam?5:laser&&(wt==='bullet'||wt==='chain'||wt==='rocket')&&a.type!=='mlrs'?1.8:1)*(k?.94:1);
    projs.push({x:m.x,y:m.y,px:m.x,py:m.y,x0:m.x,y0:m.y,h0:m.h,h1:th,tgt:tg,dmg:two?d.dmg/2:d.dmg,wt,sp,side:a.side,src:a,n:0,laser,beam,col,loft:a.type==='mlrs',
      d0:Math.max(1,Math.hypot(tg.x-m.x,tg.y-m.y))});
    if(beam)fxs.push({t:'beam',x:m.x,y:m.y,h:m.h,x1:tg.x,y1:tg.y,h1:th,col,w:wt==='snipe'?1.1:a.type==='htank'?2.2:1.7,age:0,life:wt==='snipe'?.2:.24});
    if((wt!=='bullet'&&wt!=='chain')||laser)fxs.push({t:'flash',x:m.x,y:m.y,h:m.h,col:laser?col:null,age:0,life:laser?.1:.12,r:a.type==='htank'||wt==='cannon'?9:wt==='bullet'?3:6});
    else fxs.push({t:'flash',x:m.x,y:m.y,h:m.h,age:0,life:.06,r:3});
    if(!laser&&(wt==='cannon'||wt==='tcannon'||wt==='shell'))fxs.push({t:'puff',x:m.x,y:m.y,h:m.h,age:0,life:.7,r:wt==='shell'?9:7});
    if(!laser&&a.type==='mlrs')fxs.push({t:'puff',x:m.x,y:m.y,h:m.h-4,age:0,life:1,r:10});
  }
}
function nearestRefinery(u){
  let best=null,bd=1e9;
  for(const b of blds)if(!b.dead&&b.side===u.side&&b.type==='refinery'){const d=Math.hypot(b.x-u.x,b.y-u.y);if(d<bd){bd=d;best=b}}
  return best;
}
function nearestCrystal(u){
  let best=-1,bd=1e9;
  for(let i=0;i<MW*MH;i++){if(cry[i]<=0)continue;const c=tc(i),d=Math.hypot(c.x-u.x,c.y-u.y)+rng()*2*T;if(d<bd){bd=d;best=i}}
  return best;
}
/* refinery dock: harvesters line up on the bay axis, drive straight in, unload, then reverse out */
const DOCK={lx:-28,park:12,appr:54};
function refLocal(b,lx,lz){const th=-(b.rot||0)*Math.PI/2,c=Math.cos(th),s2=Math.sin(th);return {x:b.x+lx*c+lz*s2,y:b.y-lx*s2+lz*c}}
function refFace(b){const th=-(b.rot||0)*Math.PI/2;return Math.atan2(-Math.cos(th),-Math.sin(th))}
function refLz(b,x,y){const th=-(b.rot||0)*Math.PI/2,dx=x-b.x,dy=y-b.y;return dx*Math.sin(th)+dy*Math.cos(th)}
function relDock(u){if(u.ref&&u.ref.dock===u)u.ref.dock=null;u.docked=false;u.rev=false}
function updHarv(u,dt){
  const s=sides[u.side],cap=UDEF.harv.cap;
  if(u.hold||u.path)return;
  u.rep-=dt;
  switch(u.hs){
    case 'return':{
      if(!u.ref||u.ref.dead)u.ref=nearestRefinery(u);
      const r=u.ref;if(!r){u.hs='seek';break}
      const ap=refLocal(r,DOCK.lx,DOCK.appr),apOk=ap.x>T&&ap.y>T&&ap.x<WW-T&&ap.y<WH-T&&!occ[ti(ap.x,ap.y)];
      if(!apOk){if(edgeDist(u,r)<T*1.1){u.hs='unload';break}if(u.rep<=0){u.rep=.5;const dp=doorPt(r);setPath(u,dp[0]*T,dp[1]*T)}break}
      if(r.dock&&(r.dock.dead||r.dock.ref!==r||!r.dock.docked))r.dock=null;
      const dAp=Math.hypot(u.x-ap.x,u.y-ap.y);
      if(dAp<T*1.3&&!r.dock){r.dock=u;u.docked=true;u.hs='dockalign';u.path=[{x:ap.x,y:ap.y}];u.pi=0;break}
      if(u.rep<=0){u.rep=.6;if(dAp>=T*1.3)setPath(u,ap.x,ap.y)}
      break}
    case 'dockalign':{const r=u.ref;if(!r||r.dead){relDock(u);u.hs='seek';break}const fa=refFace(r);u.ang=turn(u.ang,fa,dt*UDEF.harv.turn);
      if(Math.abs(angd(u.ang,fa))<.04){u.ang=fa;const pk=refLocal(r,DOCK.lx,DOCK.park);u.path=[{x:pk.x,y:pk.y}];u.pi=0;u.hs='dockin'}break}
    case 'dockin':{const r=u.ref;if(!r||r.dead){relDock(u);u.hs='seek';break}u.ang=refFace(r);u.hs='unload';break}
    case 'unload':{
      const take=Math.min(u.cargo,160*dt);u.cargo-=take;s.credits+=take*(s.ai?DIFF[s.diff||diffKey].inc:1);
      if(u.cargo<=.01){u.cargo=0;
        if(u.docked&&u.ref&&!u.ref.dead){const ap=refLocal(u.ref,DOCK.lx,DOCK.appr);u.rev=true;u.hs='dockout';u.path=[{x:ap.x,y:ap.y}];u.pi=0}else{relDock(u);u.hs='seek'}}
      break}
    case 'dockout':{relDock(u);u.hs='seek';break}
    case 'harvest':{
      const i=ti(u.x,u.y);if(cry[i]<=0){u.hs='seek';break}
      const take=Math.min(45*dt,cry[i],cap-u.cargo);cry[i]-=take;if(cryIdle)cryIdle[i]=0;u.cargo+=take;
      if(u.cargo>=cap-.01)u.hs='return';
      break}
    default:{
      if(u.cargo>=cap){u.hs='return';break}
      if(cry[ti(u.x,u.y)]>0){u.hs='harvest';break}
      if(u.rep>0)break;u.rep=.6;
      const f=nearestCrystal(u);
      if(f<0){if(u.cargo>0)u.hs='return';break}
      const c=tc(f);setPath(u,c.x,c.y);
    }
  }
}
function updUnit(u,dt){
  u.flash=Math.max(0,u.flash-dt);u.cool-=dt;if(u.exitT>0)u.exitT-=dt;if(u.rcd>0)u.rcd-=dt;
  if(u.air){updAir(u,dt);return}
  if(UDEF[u.type].stealth){u.revealT=Math.max(0,(u.revealT||0)-dt);u.scanC=(u.scanC||0)-dt;
    if(u.scanC<=0){u.scanC=.3;u.near=units.some(o=>!o.dead&&enemy(o.side,u.side)&&Math.hypot(o.x-u.x,o.y-u.y)<T*2.6)||blds.some(b=>!b.dead&&enemy(b.side,u.side)&&edgeDist(u,b)<T*1.6)}
    u.cloaked=u.revealT<=0&&!u.near}
  if(u.rally&&!u.path&&!(u.exitT>2.5)){const r=u.rally;u.rally=null;if(!u.atk)moveSpread(u,r.x,r.y)}
  /* idle units that ended up on top of each other step aside to open ground */
  if(!u.path&&!u.atk&&!u.docked&&!(u.exitT>0)&&u.type!=='harv'){u.setT=(u.setT||0)-dt;
    if(u.setT<=0){u.setT=.5+rng()*.3;const r=sepR(u);
      for(const o of units){if(o===u||o.dead||o.docked||o.path||o.id>u.id)continue;const m=(r+sepR(o))*.8;
        if(Math.abs(o.x-u.x)<m&&Math.abs(o.y-u.y)<m&&Math.hypot(o.x-u.x,o.y-u.y)<m){const s=openSpot(u.x,u.y,u);if(Math.hypot(s.x-u.x,s.y-u.y)>2){const h=u.hold;setPath(u,s.x,s.y);u.hold=h}break}}}}
  if(u.type==='harv')updHarv(u,dt);else updCombat(u,dt);
  moveAlong(u,dt);
}
function updTurret(b,dt){
  const d=BDEF[b.type];b.flash=Math.max(0,b.flash-dt);b.cool-=dt;
  if(sides[b.side].low)return;
  b.scan-=dt;if(b.scan<=0){b.scan=.25;b.cand=nearestEnemy(b,d.range*T*hiScan(b))}
  const tg=b.cand;if(!tg||tg.dead||tg.cloaked||!canHit(b,tg)){b.cand=null;return}
  const want=Math.atan2(tg.y-b.y,tg.x-b.x);b.tang=turn(b.tang,want,dt*6);
  if(b.cool<=0&&Math.abs(angd(b.tang,want))<.25&&edgeDist(b,tg)<=d.range*T*hiMul(b,tg)){b.cool=d.rof;shoot(b,tg,d)}
}
function separate(){
  const n=units.length;
  for(let i=0;i<n;i++){const a=units[i];if(a.dead||a.docked||a.exitT>0||a.air)continue;
    for(let j=i+1;j<n;j++){const b=units[j];if(b.dead||b.docked||b.exitT>0||b.air)continue;
      const dx=b.x-a.x,dy=b.y-a.y,m=(a.path||b.path)?UDEF[a.type].r+UDEF[b.type].r-2:(sepR(a)+sepR(b))*.85;
      if(Math.abs(dx)>m||Math.abs(dy)>m)continue;
      const d2=dx*dx+dy*dy;if(d2>=m*m)continue;
      const d=Math.sqrt(d2)||.01,push=(m-d)/2,ux=dx/d*push,uy=dy/d*push;
      if(!occ[ti(a.x-ux,a.y-uy)]){a.x-=ux;a.y-=uy}
      if(!occ[ti(b.x+ux,b.y+uy)]){b.x+=ux;b.y+=uy}
    }
  }
  separateAir();
}

/* ---------- economy ---------- */
const has=(s,t)=>blds.some(b=>b.side===s.id&&b.type===t&&!b.dead);
/* building limits: structures with max (Tech Center) count built, queued and ready-to-place copies */
function atCap(s,t){if(t==='bomber')return bomberRoom(s)<=0;const d=BDEF[t];if(!d||!d.max)return false;const c=CAT[t];
  let n=blds.filter(b=>b.side===s.id&&b.type===t&&!b.dead).length;if(s[RD(c)]===t)n++;if(s.q[c]&&s.q[c].some(i=>i.t===t))n++;return n>=d.max}
function canBuild(s,t){
  const c=CAT[t];if(def(t).fac!=null&&s.fac!==def(t).fac)return false;if(atCap(s,t))return false;
  if(c==='i'&&!has(s,'barracks'))return false;
  if(c==='v'&&!has(s,'factory'))return false;
  if(c==='a'&&!has(s,'airfield'))return false;
  const d=def(t);if(d.req&&!(SANDBOX&&s.id===0))for(const r of d.req)if(!has(s,r))return false;
  return true;
}
/* each Barracks / War Factory has its own queue and they build in parallel */
function prods(s,c){const pt=c==='i'?'barracks':c==='a'?'airfield':'factory';return blds.filter(b=>b.side===s.id&&b.type===pt&&!b.dead).sort((a,b)=>a.id-b.id)}
function prodQ(b){return b.q||(b.q=[])}
function qAll(s,c){let a=[];for(const p of prods(s,c))a=a.concat(prodQ(p));return a}
const prodSel={i:null,v:null,a:null};
function curProd(c){const ps=sides?prods(sides[ME],c):[];return ps.find(b=>b.id===prodSel[c])||ps[0]||null}
function enqueue(s,t,pb){
  const c=CAT[t];
  if(!canBuild(s,t))return false;
  if(c==='i'||c==='v'||c==='a'){
    const ps=prods(s,c);if(!ps.length)return false;
    const p=pb&&!pb.dead?pb:ps.reduce((a,b)=>prodQ(b).length<prodQ(a).length?b:a);
    const q=prodQ(p);if(q.length>=6)return false;q.push({t,prog:0,paid:0});return true;
  }
  const q=s.q[c];if(q.length||s[RD(c)])return false;
  q.push({t,prog:0,paid:0});return true;
}
function spawnUnit(s,t,pp){
  if(CAT[t]==='a'){const p=pp&&!pp.dead?pp:airfieldsOf(s.id)[0];return p?spawnAir(s,t,p):false}
  const pt=CAT[t]==='i'?'barracks':'factory';
  const p=pp&&!pp.dead?pp:blds.find(b=>b.side===s.id&&b.type===pt&&!b.dead);
  if(!p)return false;
  {const bar_=p.type==='barracks',bi=bar_?(p.dn=((p.dn||0)+1)%2):0,lx=bar_?(bi?10:-10):0,a=refLocal(p,lx,bar_?21:24),o=refLocal(p,lx+(rng()-.5)*8,bar_?44:62);
    if(o.x>T&&o.y>T&&o.x<WW-T&&o.y<WH-T&&!occ[ti(o.x,o.y)]){const u=addUnit(t,s.id,a.x,a.y);u.ang=u.tang=refFace(p)+Math.PI;{const sp=openSpot(o.x,o.y,u);u.path=[{x:o.x,y:o.y}];if(Math.hypot(sp.x-o.x,sp.y-o.y)>2)u.path.push(sp)}u.pi=0;u.exitB=p;u.exitT=3.5;p.doorT=2.4;p.doorI=bi;if(p.rally&&t!=='harv')u.rally={x:p.rally.x+(rng()-.5)*T*2,y:p.rally.y+(rng()-.5)*T*2};return true}}
  const dp=doorPt(p),dv=DOOR[p.rot||0],gi=findFree(dp[0]+(rng()-.5)*(dv[0]?0:2),dp[1]+(rng()-.5)*(dv[1]?0:2)),c=tc(gi);
  const u=addUnit(t,s.id,c.x,c.y);u.ang=Math.atan2(dv[1],dv[0]);u.tang=u.ang;p.doorT=2.4;
  if(t!=='harv')setPath(u,c.x+dv[0]*T*2+(rng()-.5)*T*1.5,c.y+dv[1]*T*2+(rng()-.5)*T*1.5);
  if(p.rally&&t!=='harv')u.rally={x:p.rally.x+(rng()-.5)*T*2,y:p.rally.y+(rng()-.5)*T*2};
  return true;
}
function tickProd(s,dt){
  const sp=(s.low?.5:1)*(s.ai?DIFF[s.diff||diffKey].speed:1);
  const run=(q,c,p)=>{
    if(!q.length)return;const it=q[0],d=def(it.t);
    if(it.prog<1&&SANDBOX&&s.id===0)it.prog=1;
    if(it.prog<1){const step=Math.min(1-it.prog,dt*sp/d.time),cost=d.cost*step;if(s.credits>=cost){s.credits-=cost;it.prog+=step;it.paid+=cost}else if(s.id===ME&&!SANDBOX&&state==='play'){/* production stalled: tell the player, at most every 12 seconds */if(time-(s.nfT||-99)>12){s.nfT=time;say('Insufficient funds','funds',12);msg('Insufficient funds','bad')}}}
    if(it.prog>=.9999){
      if(isStruct(c)){s[RD(c)]=it.t;q.shift();if(s.id===ME){msg(def(it.t).name+' ready. Tap it to place.','ok');sfx('ready');say('Construction complete','ready',.5)}}
      else if(spawnUnit(s,it.t,p)){q.shift();if(s.id===ME){msg(nm(it.t,ME)+' ready.','ok');sfx('ready');say('Unit ready','unit',2.5)}}
      else it.prog=1;
    }
  };
  run(s.q.b,'b');run(s.q.d,'d');
  for(const c of ['i','v','a'])for(const p of prods(s,c))run(prodQ(p),c,p);
}
function validPlace(sid,t,tx,ty,margin,rot){
  const d=dims(t,rot||0);margin=margin||0;
  if(tx<1||ty<1||tx+d.w>MW-1||ty+d.h>MH-1)return false;
  for(let y=ty-margin;y<ty+d.h+margin;y++)for(let x=tx-margin;x<tx+d.w+margin;x++){
    if(x<0||y<0||x>=MW||y>=MH)continue;
    const i=y*MW+x;if(occ[i]||ter[i]===5)return false;
    if(margin&&(y<ty||y>=ty+d.h||x<tx||x>=tx+d.w))continue;
    if(cry[i]>0)return false;
  }
  return inBuildZone(sid,tx,ty,d.w,d.h);
}
/* structures may only go up inside the build zone around one of your Command Yards */
const BUILD_R=12;
const yardsOf=sid=>blds.filter(b=>!b.dead&&b.side===sid&&b.type==='yard');
function inBuildZone(sid,tx,ty,w,h){
  for(const b of yardsOf(sid)){const cx=b.tx+b.w/2,cy=b.ty+b.h/2;
    if(Math.max(Math.abs(tx-cx),Math.abs(tx+w-cx),Math.abs(ty-cy),Math.abs(ty+h-cy))<=BUILD_R+.01)return true}
  return false;
}
function placeBuilding(s,t,tx,ty,rot){
  const b=addBld(t,s.id,tx,ty,rot),dp=doorPt(b),dv=DOOR[b.rot];
  for(const u of units){if(u.dead)continue;
    if(u.x>=tx*T-6&&u.x<=(tx+b.w)*T+6&&u.y>=ty*T-6&&u.y<=(ty+b.h)*T+6){const c=tc(findFree(dp[0],dp[1]));u.x=c.x;u.y=c.y;u.path=null}}
  if(t==='refinery'){const c=tc(findFree(dp[0],dp[1]));const h=addUnit('harv',s.id,c.x,c.y);h.ang=Math.atan2(dv[1],dv[0])}
  clearDetail(b);
  return b;
}
