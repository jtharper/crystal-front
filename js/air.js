'use strict';
/* ---------- aircraft ----------
   Gunships hover: they fly straight to where they are sent, hold position and strafe ground targets with a chain gun.
   Bombers are jets: they never stop in the air. Sent at a target they fly over it, drop both bombs and return to their
   Airfield, land on a pad, re-arm and repair, then fly back out if the target is still standing. Each Airfield has two
   pads, so a side can keep two bombers per Airfield. Only rocket weapons hit aircraft in the air (see canHit, core.js).
   Everything here runs inside the lockstep simulation: rng() only, no presentation state. */
const PADS=[[-24,24],[24,24]];
const padPos=(b,i)=>refLocal(b,PADS[i][0],PADS[i][1]);
const approach=(a,b,m)=>a<b?Math.min(b,a+m):Math.max(b,a-m);
/* pad i of airfield b: forget stale claims, then the pad u already holds, else the first free one (-1 if none) */
function padFree(b,u){if(!b.pad)b.pad=[null,null];
  for(let i=0;i<2;i++){const o=b.pad[i];if(o&&(o.dead||o.home!==b||o.padI!==i))b.pad[i]=null}
  for(let i=0;i<2;i++)if(b.pad[i]===u)return i;for(let i=0;i<2;i++)if(!b.pad[i])return i;return -1}
function relPad(u){const b=u.home;if(b&&b.pad&&b.pad[u.padI]===u)b.pad[u.padI]=null;u.padI=-1}
function claimPad(u,b){const i=padFree(b,u);if(i<0)return false;if(u.padI>=0&&u.home!==b)relPad(u);u.home=b;b.pad[i]=u;u.padI=i;return true}
/* the Airfield this aircraft belongs to: its own if still standing, else the nearest one with a free pad */
function homeOf(u){
  if(u.home&&!u.home.dead&&u.home.side===u.side)return u.home;
  relPad(u);u.home=null;let bd=1e9;
  for(const b of blds)if(!b.dead&&b.side===u.side&&b.type==='airfield'){const d=Math.hypot(b.x-u.x,b.y-u.y)+(padFree(b,u)<0?T*60:0);if(d<bd){bd=d;u.home=b}}
  return u.home;
}
const airfieldsOf=sid=>blds.filter(b=>!b.dead&&b.side===sid&&b.type==='airfield');
/* bombers are limited by pads: built + queued bombers may not exceed two per Airfield */
function bomberRoom(s){let n=0;for(const u of units)if(!u.dead&&u.side===s.id&&u.type==='bomber')n++;
  for(const p of airfieldsOf(s.id))for(const it of prodQ(p))if(it.t==='bomber')n++;return airfieldsOf(s.id).length*2-n}
function spawnAir(s,t,p){
  const u=addUnit(t,s.id,p.x,p.y);u.home=p;u.ang=u.tang=refFace(p)+Math.PI;
  if(t==='bomber'&&claimPad(u,p)){const q=padPos(p,u.padI);u.x=q.x;u.y=q.y;u.as='park';return true}
  /* out of the hangar door and up */
  const q=refLocal(p,-26,-2);u.x=q.x;u.y=q.y;u.alt=4;u.as='fly';
  const o=p.rally||refLocal(p,(rng()-.5)*60,92);u.dest={x:o.x+(p.rally?(rng()-.5)*T*2:0),y:o.y+(p.rally?(rng()-.5)*T*2:0)};
  if(t==='bomber')u.dest=null;
  p.doorT=2.4;return true;
}
/* orders (cmd.js): move, attack, attack-move, stop */
function airGo(us,wx,wy,amove){
  const n=us.length;us.forEach((u,k)=>{const a=k*2.39996,r=n>1?T*.9*Math.sqrt(k+.5):0;
    u.dest={x:wx+Math.cos(a)*r,y:wy+Math.sin(a)*r};u.atk=null;u.cand=null;u.amove=amove?u.dest:null})}
function airAttack(u,tg){if(!canHit(u,tg)){u.atk=null;u.dest={x:tg.x,y:tg.y};return}u.atk=tg;u.dest=null;u.amove=null}
function airStop(u){u.atk=null;u.amove=null;u.cand=null;u.dest=null}
function updAir(u,dt){
  const d=UDEF[u.type];
  if(u.atk&&(u.atk.dead||u.atk.cloaked||!canHit(u,u.atk)||!enemy(u.side,u.atk.side)||(u.atk.k==='b'&&BDEF[u.atk.type].cap)))u.atk=null;
  if(u.type==='bomber')updBomber(u,dt,d);else updGunship(u,dt,d);
  u.tang=u.ang;
  u.x=Math.max(T*.5,Math.min(WW-T*.5,u.x));u.y=Math.max(T*.5,Math.min(WH-T*.5,u.y));
}
function updGunship(u,dt,d){
  if(u.padI>=0)relPad(u);
  u.alt=approach(u.alt,d.alt,dt*30);
  let tg=u.atk;
  if(!tg&&(!u.dest||u.amove)){u.scan-=dt;
    if(u.scan<=0){u.scan=.25+rng()*.1;u.cand=nearestEnemy(u,d.range*T+(u.dest?0:2*T))}
    if(u.cand&&!u.cand.dead&&canHit(u,u.cand))tg=u.cand;else u.cand=null}
  let gx=null,gy=null,face=null;
  if(tg){const L=Math.hypot(tg.x-u.x,tg.y-u.y)||1,dist=edgeDist(u,tg);face=Math.atan2(tg.y-u.y,tg.x-u.x);
    if(dist>d.range*T*.9){const rr=(tg.k==='b'?Math.max(tg.w,tg.h)*T/2:0)+d.range*T*.7;gx=tg.x-(tg.x-u.x)/L*rr;gy=tg.y-(tg.y-u.y)/L*rr}
    if(dist<=d.range*T&&u.cool<=0&&u.alt>d.alt*.6&&Math.abs(angd(u.ang,face))<.3){u.cool=d.rof;shoot(u,tg,d)}}
  else if(u.dest){gx=u.dest.x;gy=u.dest.y;if(Math.hypot(gx-u.x,gy-u.y)<4){u.dest=null;u.amove=null;gx=null}}
  let spT=0;
  if(gx!=null){const dx=gx-u.x,dy=gy-u.y,L=Math.hypot(dx,dy);if(L>1){spT=Math.min(d.speed,L*2.2);if(face==null)face=Math.atan2(dy,dx);u.mvx=dx/L;u.mvy=dy/L}}
  u.v=approach(u.v||0,spT*Math.min(1,.25+u.alt/(d.alt*.5)),dt*(spT>(u.v||0)?140:220));
  if(u.v>0){u.x+=(u.mvx||0)*u.v*dt;u.y+=(u.mvy||0)*u.v*dt}
  if(face!=null)u.ang=turn(u.ang,face,dt*d.turn);
}
function updBomber(u,dt,d){
  const home=homeOf(u);
  if(u.as==='park'){
    if(!home||u.padI<0||u.home!==home){u.as='fly'}
    else{const pp=padPos(home,u.padI);u.x=pp.x;u.y=pp.y;u.alt=0;u.v=0;
      const sp=sides[u.side].low?.5:1;
      if(u.ammo<d.ammo){u.rearmT=(u.rearmT||0)+dt*sp;if(u.rearmT>=d.rearm){u.ammo=d.ammo;u.rearmT=0}}
      if(u.hp<u.mhp)u.hp=Math.min(u.mhp,u.hp+14*dt*sp);
      if(!((u.atk&&u.ammo>=d.ammo)||u.dest))return;
      u.as='fly';
    }
  }
  /* where to: the target (armed), a move order, home to land, or circle */
  let gx,gy,mode;
  if(u.atk&&u.ammo>0){gx=u.atk.x;gy=u.atk.y;mode='atk'}
  else if(u.dest){gx=u.dest.x;gy=u.dest.y;mode='go';
    if(u.amove&&u.ammo>0){u.scan-=dt;if(u.scan<=0){u.scan=.3+rng()*.1;const c=nearestEnemy(u,T*4);if(c)u.atk=c}}
    if(Math.hypot(gx-u.x,gy-u.y)<T*1.5){u.dest=null;u.amove=null}}
  else if(home&&claimPad(u,home)){const pp=padPos(home,u.padI);gx=pp.x;gy=pp.y;mode='land'}
  else{const c=home||u;if(!u.orb||home)u.orb={x:c.x,y:c.y};gx=u.orb.x;gy=u.orb.y;mode='orbit'}
  if(mode!=='orbit')u.orb=null;
  const dx=gx-u.x,dy=gy-u.y,L=Math.hypot(dx,dy),want=Math.atan2(dy,dx),off=angd(u.ang,want),R=d.speed/d.turn;
  let altT=d.alt,spd=d.speed,tk=1;
  if(mode==='land'&&L<R*1.7){spd=Math.max(34,Math.min(d.speed,L*1.4));altT=Math.min(d.alt,L*.55);tk=3.2;
    if(L<14){const st=Math.min(L,Math.max(spd,40)*dt);if(L>.01){u.x+=dx/L*st;u.y+=dy/L*st}u.ang=turn(u.ang,refFace(home)+Math.PI,dt*2);u.v=st/dt;
      u.alt=approach(u.alt,0,dt*40);
      if(L<1.5&&u.alt<1){u.as='park';u.alt=0;u.dest=null;u.amove=null;const pp=padPos(home,u.padI);u.x=pp.x;u.y=pp.y}
      return}}
  /* too close to turn onto the point: hold course to open the circle, then turn in */
  if(!(Math.abs(off)>1.2&&L<R*2.1&&mode!=='land'))u.ang=turn(u.ang,want,dt*d.turn*tk);
  u.alt=approach(u.alt,altT,dt*(altT<u.alt?38:30));
  u.v=approach(u.v||0,spd*Math.min(1,.3+u.alt/(d.alt*.6)),dt*(spd<(u.v||0)?160:110));
  u.x+=Math.cos(u.ang)*u.v*dt;u.y+=Math.sin(u.ang)*u.v*dt;
  /* bombs keep the jet's forward speed while they fall: release when the predicted impact point is over the target */
  if(mode==='atk'){const tg=u.atk,rr=(tg.k==='b'?Math.max(tg.w,tg.h)*T*.3:0)+T*.7,lead=u.v*BOMB_FALL;
    if(u.alt>d.alt*.5&&Math.hypot(u.x+Math.cos(u.ang)*lead-tg.x,u.y+Math.sin(u.ang)*lead-tg.y)<rr)dropBombs(u,d)}
}
const BOMB_FALL=.55;
function dropBombs(u,d){
  const c=Math.cos(u.ang),s=Math.sin(u.ang),lead=u.v*BOMB_FALL;
  for(let k=0;k<u.ammo;k++){const sd=k%2?8:-8,fw=lead+k*14-7,
      x0=u.x-s*sd,y0=u.y+c*sd,tgt={k:'pt',x:u.x+c*fw-s*sd*.6,y:u.y+s*fw+c*sd*.6,dead:false};
    projs.push({x:x0,y:y0,px:x0,py:y0,x0,y0,h0:u.alt-3,h1:0,tgt,dmg:d.dmg,wt:'bomb',sp:Math.max(60,Math.hypot(tgt.x-x0,tgt.y-y0)/BOMB_FALL),side:u.side,src:u,n:0,laser:false,beam:false,col:null,loft:false,
      d0:Math.max(1,Math.hypot(tgt.x-x0,tgt.y-y0)),bomb:true})}
  u.ammo=0;u.rearmT=0;sfx('drop',u.x,u.y);
}
/* a bomb reaching the ground: blast damage around the point, ground units and buildings only */
function bombHit(p){
  const t=p.tgt,R=T*1.45;
  for(const u of units){if(u.dead||!enemy(u.side,p.side)||flying(u))continue;const dd=Math.hypot(u.x-t.x,u.y-t.y);
    if(dd<R)hurt(u,p.dmg*MUL.bomb[armorOf(u)]*(1-.5*dd/R),p.src)}
  for(const b of blds){if(b.dead||!enemy(b.side,p.side))continue;if(edgeDist(t,b)<R*.4)hurt(b,p.dmg*MUL.bomb.bld,p.src)}
  for(let i=0;i<5;i++)fxs.push({t:'boom',x:t.x+(rng()-.5)*34,y:t.y+(rng()-.5)*34,age:-rng()*.15,life:.55,r:18+rng()*8});
  fxs.push({t:'smoke',x:t.x,y:t.y,age:0,life:1.8,r:16});fxs.push({t:'dust',x:t.x,y:t.y,h:2,age:0,life:1.2,r:20});
  sfx('boomBig',t.x,t.y);
}
/* hovering gunships keep apart from each other */
function separateAir(){
  for(let i=0;i<units.length;i++){const a=units[i];if(a.dead||a.type!=='gunship'||a.alt<20)continue;
    for(let j=i+1;j<units.length;j++){const b=units[j];if(b.dead||b.type!=='gunship'||b.alt<20)continue;
      const dx=b.x-a.x,dy=b.y-a.y,m=40;if(Math.abs(dx)>m||Math.abs(dy)>m)continue;const d2=dx*dx+dy*dy;if(d2>=m*m)continue;
      const dd=Math.sqrt(d2)||.01,push=Math.min(1.2,(m-dd)/2),ux=dx/dd*push,uy=dy/dd*push;a.x-=ux;a.y-=uy;b.x+=ux;b.y+=uy}}
}
