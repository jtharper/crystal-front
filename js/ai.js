'use strict';
/* ---------- AI ---------- */
function aiInit(){
  ai={};
  for(const sd of sides)if(sd.ai){const D=DIFF[sd.diff||diffKey];ai[sd.id]={t:0,cd:1.5+sd.id*.35,wave:0,size:D.wave,next:D.first+(sd.id-1)*25}}
}
function aiTick(dt){for(const sd of sides)if(sd.ai&&ai[sd.id])aiSide(sd,ai[sd.id],dt)}
function aiSide(s,A,dt){
  A.t+=dt;A.cd-=dt;if(A.cd>0)return;A.cd=1;
  if(s.credits>300)for(const b of blds)if(b.side===s.id&&!b.dead&&b.hp<b.mhp*.6)b.repairing=true;
  const me=s.id,eAir=units.some(u=>!u.dead&&u.air&&enemy(me,u.side)),cnt=t=>blds.reduce((n,b)=>n+(b.side===me&&b.type===t&&!b.dead?1:0),0);
  const yard=blds.find(b=>b.side===me&&b.type==='yard'&&!b.dead)||blds.find(b=>b.side===me&&!b.dead);
  if(!yard)return;
  const toC=[Math.sign(WW/2-yard.x),Math.sign(WH/2-yard.y)];
  /* forward bases: a refinery next to each one, and some of the defenses */
  const posts=blds.filter(b=>b.side===me&&b.type==='outpost'&&!b.dead);
  const bareP=posts.find(p=>!p.noRef&&!blds.some(b=>b.side===me&&!b.dead&&b.type==='refinery'&&Math.hypot(b.x-p.x,b.y-p.y)<T*9));
  for(const slot of ['ready','readyD'])if(s[slot]){
    const t=s[slot];let ok=false;
    let P=(t==='refinery'&&bareP)?bareP:(slot==='readyD'&&posts.length&&rng()<.35)?posts[(rng()*posts.length)|0]:null;
    for(let n=0;n<160&&!ok;n++){
      const rot=(rng()*4)|0;
      let bx=yard.x/T+(rng()-.5)*22,by=yard.y/T+(rng()-.5)*22;
      if(t==='turret'){bx=yard.x/T+toC[0]*(4+rng()*9);by=yard.y/T+toC[1]*(4+rng()*9)}
      if(t==='guard'||t==='missile'){bx=yard.x/T+toC[0]*(4+rng()*9);by=yard.y/T+toC[1]*(4+rng()*9)}
      if(P){bx=P.x/T+(rng()-.5)*14;by=P.y/T+(rng()-.5)*14}
      const df=CAT[t]==='d';
      if(validPlace(me,t,Math.round(bx),Math.round(by),df?0:1,rot)){placeBuilding(s,t,Math.round(bx),Math.round(by),rot);s[slot]=null;ok=true}
      if(n===100&&P){if(t==='refinery')P.noRef=true;P=null}  /* no room by the forward base: build it at home instead */
      else if(n===60&&!P&&posts.length)P=posts[(rng()*posts.length)|0];  /* home plateau full: use a forward base */
    }
    /* nowhere to put it at all: refund it so the build queue never stalls */
    if(!ok){A.stuck=(A.stuck||0)+1;if(A.stuck>20){s.credits+=def(t).cost;s[slot]=null;A.stuck=0}}else A.stuck=0;
  }
  if(!s.q.d.length&&!s.readyD&&has(s,'barracks')&&cnt('turret')+cnt('guard')+cnt('missile')<Math.min(9,2+A.wave*1.5)){
    const nd=(s.fac===0&&has(s,'tech')&&!cnt('shield'))?'shield':eAir&&has(s,'tech')&&cnt('missile')<3&&rng()<.7?'missile':rng()<.4?'guard':(has(s,'tech')&&rng()<.5)?'missile':'turret';if(s.credits>=Math.min(150,def(nd).cost*.4))enqueue(s,nd);
  }
  if(!s.q.b.length&&!s.ready){
    let nb=null;
    if(s.pw-s.use<40)nb='power';
    else if(!cnt('refinery')||bareP)nb='refinery';
    else if(!cnt('barracks'))nb='barracks';
    else if(!cnt('factory'))nb='factory';
    else if(cnt('refinery')<2)nb='refinery';
    else if(!cnt('tech')&&A.wave>=1)nb='tech';
    else if(!cnt('airfield')&&A.wave>=2)nb='airfield';
    else if(cnt('barracks')<2)nb='barracks';
    else if(cnt('factory')<2)nb='factory';
    if(nb&&s.credits>=Math.min(150,def(nb).cost*.4))enqueue(s,nb);
  }
  const harvs=units.reduce((n,u)=>n+(u.side===me&&u.type==='harv'&&!u.dead?1:0),0)+qAll(s,'v').filter(i=>i.t==='harv').length;
  if(has(s,'factory')&&has(s,'refinery')&&harvs<cnt('refinery')+1+(A.wave>2?1:0)&&qAll(s,'v').length<2*prods(s,'v').length)enqueue(s,'harv');
  if(has(s,'barracks')&&qAll(s,'i').length<2*prods(s,'i').length){const r=rng();enqueue(s,s.fac===2&&r<.15?'rift':r<(eAir?.62:.4)?'rocket':r<.55?'gren':has(s,'tech')&&r<.65?'sniper':'rifle')}
  if(has(s,'factory')&&qAll(s,'v').length<2*prods(s,'v').length){const r=rng(),tc=has(s,'tech');enqueue(s,s.fac===1&&r<.2?'stank':tc&&r<.38?'htank':tc&&r<.5?'arty':r<.62?'mlrs':r<.78?'buggy':'tank')}
  /* expansion: an Outpost Crawler drives to a free crystal field and deploys there */
  {const crawl=units.filter(u=>u.side===me&&!u.dead&&u.type==='mcv'),qd=qAll(s,'v').filter(i=>i.t==='mcv').length,maxP=(s.diff||diffKey)==='easy'?1:2;
    if(has(s,'factory')&&A.wave>=2&&posts.length+crawl.length+qd<maxP&&s.credits>150&&qAll(s,'v').length<3*prods(s,'v').length)enqueue(s,'mcv');
    for(const u of crawl){
      if(!u.goal){const mine=blds.filter(b=>b.side===me&&!b.dead&&(b.type==='yard'||b.type==='outpost')),foes=blds.filter(b=>!b.dead&&enemy(me,b.side));
        let best=null,bd=1e9;
        for(const [fx,fy,fr] of FIELDS){const x=fx*T,y=fy*T;if(mine.some(b=>Math.hypot(b.x-x,b.y-y)<T*15)||foes.some(b=>Math.hypot(b.x-x,b.y-y)<T*16))continue;
          if(crawl.some(o=>o!==u&&o.goal&&Math.hypot(o.goal.x-x,o.goal.y-y)<T*6))continue;let cr=0;for(let j=Math.floor(fy-fr);j<=fy+fr;j++)for(let i=Math.floor(fx-fr);i<=fx+fr;i++)if(i>0&&j>0&&i<MW&&j<MH)cr+=cry[j*MW+i];if(cr<1500)continue;
          const d=Math.hypot(x-yard.x,y-yard.y);if(d<bd){bd=d;best=[x,y,fr]}}
        if(best){const dx=yard.x-best[0],dy=yard.y-best[1],L=Math.hypot(dx,dy)||1,k=(best[2]+3.2)*T;u.goal={x:best[0]+dx/L*k,y:best[1]+dy/L*k,tries:0};setPath(u,u.goal.x,u.goal.y)}}
      else if(!u.path){if(Math.hypot(u.x-u.goal.x,u.y-u.goal.y)>T*3&&u.goal.tries<3){u.goal.tries++;setPath(u,u.goal.x,u.goal.y)}
        else if(!doDeploy(u)){u.goal.tries++;if(u.goal.tries>8)u.goal=null;else setPath(u,u.x+(rng()-.5)*T*5,u.y+(rng()-.5)*T*5)}}}}
  /* aircraft: a couple of gunships, and bombers while there are free pads */
  if(has(s,'airfield')&&!qAll(s,'a').length&&s.credits>150){const gs=units.filter(u=>u.side===me&&!u.dead&&u.type==='gunship').length;
    if(bomberRoom(s)>0&&rng()<.5)enqueue(s,'bomber');else if(gs<2+A.wave/2)enqueue(s,'gunship')}
  {const tg=blds.filter(b=>!b.dead&&BDEF[b.type].cap&&!ally(me,b.side)),engs=units.filter(u=>u.side===me&&!u.dead&&u.type==='eng');
    if(tg.length&&has(s,'barracks')&&A.t>40&&engs.length<1&&!qAll(s,'i').some(i=>i.t==='eng')&&s.credits>600)enqueue(s,'eng');
    for(const u of engs)if(!u.cap||u.cap.dead||ally(me,u.cap.side)){let best=null,bd=1e9;for(const b of tg){const dd=Math.hypot(b.x-u.x,b.y-u.y);if(dd<bd){bd=dd;best=b}}if(best){u.cap=best;pathToward(u,best)}}}
  const army=units.filter(u=>u.side===me&&!u.dead&&u.type!=='harv'&&u.type!=='eng'&&u.type!=='mcv'&&!u.air),idle=army.filter(u=>!u.path&&!u.atk&&!u.amove);
  const fly=units.filter(u=>u.side===me&&!u.dead&&u.air),flyIdle=fly.filter(u=>!u.dest&&!u.atk&&(u.type!=='bomber'||u.as==='park'&&u.ammo>=UDEF.bomber.ammo));
  /* send idle aircraft: gunships hunt, bombers strike a building or a tank */
  const airAt=(tg)=>{for(const u of flyIdle){if(u.type==='bomber'){if(canHit(u,tg))airAttack(u,tg)}else airGo([u],tg.x+(rng()-.5)*T*2,tg.y+(rng()-.5)*T*2,true)}};
  let threat=null;
  for(const u of units){if(!enemy(me,u.side)||u.dead||u.type==='harv'||u.cloaked)continue;for(const b of blds)if(b.side===me&&!b.dead&&Math.hypot(b.x-u.x,b.y-u.y)<T*13){threat=u;break}if(threat)break}
  if(threat){for(const u of idle){u.amove={x:threat.x,y:threat.y};setPath(u,threat.x,threat.y)}if(!flying(threat))airAt(threat);return}
  /* bombers between waves: hit the nearest enemy structure every so often */
  if(flyIdle.some(u=>u.type==='bomber')&&A.t>(A.bt||0)){A.bt=A.t+35;let tg=null,bd=1e9;for(const b of blds){if(!enemy(me,b.side)||b.dead||BDEF[b.type].cap)continue;const d=Math.hypot(b.x-yard.x,b.y-yard.y);if(d<bd){bd=d;tg=b}}
    if(tg)for(const u of flyIdle)if(u.type==='bomber')airAttack(u,tg)}
  if(A.t>A.next&&idle.length>=A.size){
    let tgt=null,bd=1e9;
    for(const b of blds){if(!enemy(me,b.side)||b.dead||BDEF[b.type].cap)continue;const d=Math.hypot(b.x-yard.x,b.y-yard.y)*(b.side===0?.9:1);if(d<bd){bd=d;tgt=b}}
    if(tgt){for(const u of idle){u.amove={x:tgt.x,y:tgt.y};setPath(u,tgt.x+(rng()-.5)*T*4,tgt.y+(rng()-.5)*T*4)}
      airAt(tgt);A.wave++;A.size=Math.min(26,A.size+2);A.next=A.t+50}
  }
}
