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
  const me=s.id,cnt=t=>blds.reduce((n,b)=>n+(b.side===me&&b.type===t&&!b.dead?1:0),0);
  const yard=blds.find(b=>b.side===me&&b.type==='yard'&&!b.dead)||blds.find(b=>b.side===me&&!b.dead);
  if(!yard)return;
  const toC=[Math.sign(WW/2-yard.x),Math.sign(WH/2-yard.y)];
  for(const slot of ['ready','readyD'])if(s[slot]){
    const t=s[slot];let ok=false;
    for(let n=0;n<160&&!ok;n++){
      const rot=(rng()*4)|0;
      let bx=yard.x/T+(rng()-.5)*22,by=yard.y/T+(rng()-.5)*22;
      if(t==='turret'){bx=yard.x/T+toC[0]*(4+rng()*9);by=yard.y/T+toC[1]*(4+rng()*9)}
      const tx=Math.round(bx),ty=Math.round(by);
      if(t==='guard'||t==='missile'){bx=yard.x/T+toC[0]*(4+rng()*9);by=yard.y/T+toC[1]*(4+rng()*9)}
      const df=CAT[t]==='d';
      if(validPlace(me,t,Math.round(bx),Math.round(by),df?0:1,rot)){placeBuilding(s,t,Math.round(bx),Math.round(by),rot);s[slot]=null;ok=true}
    }
  }
  if(!s.q.d.length&&!s.readyD&&has(s,'barracks')&&cnt('turret')+cnt('guard')+cnt('missile')<Math.min(9,2+A.wave*1.5)){
    const nd=(s.fac===0&&has(s,'tech')&&!cnt('shield'))?'shield':rng()<.4?'guard':(has(s,'tech')&&rng()<.5)?'missile':'turret';if(s.credits>=def(nd).cost*.4)enqueue(s,nd);
  }
  if(!s.q.b.length&&!s.ready){
    let nb=null;
    if(s.pw-s.use<40)nb='power';
    else if(!cnt('refinery'))nb='refinery';
    else if(!cnt('barracks'))nb='barracks';
    else if(!cnt('factory'))nb='factory';
    else if(cnt('refinery')<2)nb='refinery';
    else if(!cnt('tech')&&A.wave>=1)nb='tech';
    else if(cnt('barracks')<2)nb='barracks';
    else if(cnt('factory')<2)nb='factory';
    if(nb&&s.credits>=def(nb).cost*.4)enqueue(s,nb);
  }
  const harvs=units.reduce((n,u)=>n+(u.side===me&&u.type==='harv'&&!u.dead?1:0),0)+qAll(s,'v').filter(i=>i.t==='harv').length;
  if(has(s,'factory')&&has(s,'refinery')&&harvs<2+(A.wave>2?1:0)&&qAll(s,'v').length<2*prods(s,'v').length)enqueue(s,'harv');
  if(has(s,'barracks')&&qAll(s,'i').length<2*prods(s,'i').length){const r=rng();enqueue(s,s.fac===2&&r<.15?'rift':r<.4?'rocket':r<.55?'gren':has(s,'tech')&&r<.65?'sniper':'rifle')}
  if(has(s,'factory')&&qAll(s,'v').length<2*prods(s,'v').length){const r=rng(),tc=has(s,'tech');enqueue(s,s.fac===1&&r<.2?'stank':tc&&r<.38?'htank':tc&&r<.5?'arty':r<.62?'mlrs':r<.78?'buggy':'tank')}
  {const tg=blds.filter(b=>!b.dead&&BDEF[b.type].cap&&!ally(me,b.side)),engs=units.filter(u=>u.side===me&&!u.dead&&u.type==='eng');
    if(tg.length&&has(s,'barracks')&&A.t>40&&engs.length<1&&!qAll(s,'i').some(i=>i.t==='eng')&&s.credits>600)enqueue(s,'eng');
    for(const u of engs)if(!u.cap||u.cap.dead||ally(me,u.cap.side)){let best=null,bd=1e9;for(const b of tg){const dd=Math.hypot(b.x-u.x,b.y-u.y);if(dd<bd){bd=dd;best=b}}if(best){u.cap=best;pathToward(u,best)}}}
  const army=units.filter(u=>u.side===me&&!u.dead&&u.type!=='harv'&&u.type!=='eng'),idle=army.filter(u=>!u.path&&!u.atk&&!u.amove);
  let threat=null;
  for(const u of units){if(!enemy(me,u.side)||u.dead||u.type==='harv'||u.cloaked)continue;for(const b of blds)if(b.side===me&&!b.dead&&Math.hypot(b.x-u.x,b.y-u.y)<T*13){threat=u;break}if(threat)break}
  if(threat){for(const u of idle){u.amove={x:threat.x,y:threat.y};setPath(u,threat.x,threat.y)}return}
  if(A.t>A.next&&idle.length>=A.size){
    let tgt=null,bd=1e9;
    for(const b of blds){if(!enemy(me,b.side)||b.dead||BDEF[b.type].cap)continue;const d=Math.hypot(b.x-yard.x,b.y-yard.y)*(b.side===0?.9:1);if(d<bd){bd=d;tgt=b}}
    if(tgt){for(const u of idle){u.amove={x:tgt.x,y:tgt.y};setPath(u,tgt.x+(rng()-.5)*T*4,tgt.y+(rng()-.5)*T*4)}
      A.wave++;A.size=Math.min(26,A.size+2);A.next=A.t+50}
  }
}
