'use strict';
/* ---------- player commands ----------
   Every action that changes the game (orders, building, selling...) is a small command object. Offline it runs on the next
   simulation step; online both players' games run the same commands on the same step (net.js), so the battles stay identical.
   applyCmd re-checks everything (ownership, money, placement) because the game may have moved on since the click. */
let cmdQueue=[];
const r1=v=>Math.round(v*10)/10;
function issue(c){if(typeof NET!=='undefined'&&NET.on)netIssue(c);else cmdQueue.push(c)}
function runLocalCmds(){const q=cmdQueue;cmdQueue=[];for(const c of q)applyCmd(ME,c)}
function entById(id){if(id==null)return null;for(const u of units)if(u.id===id)return u;for(const b of blds)if(b.id===id)return b;return null}
function applyCmd(side,c){
  const s=sides&&sides[side];if(!s||!c||state!=='play')return;
  const mine=id=>{const e=entById(id);return e&&!e.dead&&e.side===side?e:null};
  const mineU=ids=>{const set=new Set(ids||[]),r=[];for(const u of units)if(set.has(u.id)&&!u.dead&&u.side===side)r.push(u);return r};
  switch(c.c){
    case 'go':{/* move / attack / attack-move / harvest / capture */
      const us=mineU(c.u);if(!us.length)return;const tg=c.t!=null?entById(c.t):null;
      if(tg&&!tg.dead&&tg.side!==side&&!ally(side,tg.side)){
        const capB=tg.k==='b';
        for(const u of us){
          if(u.air){if(capB&&BDEF[tg.type].cap)airGo([u],tg.x,tg.y,false);else airAttack(u,tg);continue}
          if(flying(tg)&&!canHit(u,tg)){u.atk=null;u.amove=null;setPath(u,tg.x,tg.y);continue}
          if(UDEF[u.type].eng){if(capB){u.cap=tg;u.atk=null;u.path=null;u.amove=null;pathToward(u,tg)}else{u.cap=null;setPath(u,tg.x,tg.y)}}
          else if(capB&&BDEF[tg.type].cap){u.atk=null;setPath(u,tg.x,tg.y)}
          else if(UDEF[u.type].dmg){u.atk=tg;u.path=null;u.amove=null;u.hold=false}else{u.atk=null;setPath(u,tg.x,tg.y);u.hold=true}}
        return;
      }
      if(!c.a&&cry[ti(c.x,c.y)]>0){
        const hs=us.filter(u=>u.type==='harv'),rest=us.filter(u=>u.type!=='harv');
        for(const u of hs){relDock(u);u.hs='seek';u.hold=false;u.path=null;setPath(u,c.x,c.y)}
        if(rest.length)moveGroup(rest,c.x,c.y,false);return;
      }
      moveGroup(us,c.x,c.y,!!c.a);return;
    }
    case 'stop':for(const u of mineU(c.u)){if(u.air){airStop(u);continue}u.path=null;u.atk=null;u.amove=null;u.hold=false}return;
    case 'build':{const t=c.t,ct=CAT[t];if(!def(t)||!ct||atCap(s,t))return;
      if(s.fac!=null&&def(t).fac!=null&&def(t).fac!==s.fac)return;
      const pb=c.p!=null?mine(c.p):null;
      if(!enqueue(s,t,(ct==='i'||ct==='v'||ct==='a')&&pb&&prodQ(pb)?pb:null)&&side===ME){msg(ct==='b'?'Already building a structure.':ct==='d'?'Already building a defense.':t==='bomber'&&bomberRoom(s)<=0?'Every landing pad is taken: build another Airfield.':'Queue is full.','bad');sfx('err')}
      return}
    case 'cancel':{const t=c.t,ct=CAT[t];if(!ct)return;
      if(isStruct(ct)){
        if(s[RD(ct)]===t){s.credits+=def(t).cost;s[RD(ct)]=null;if(side===ME&&place&&place.t===t)place=null;return}
        if(s.q[ct].length&&s.q[ct][0].t===t){s.credits+=s.q[ct][0].paid;s.q[ct].length=0}
        return;
      }
      const pb=(c.p!=null?mine(c.p):null)||prods(s,ct)[0];if(!pb)return;const q=prodQ(pb);
      for(let i=q.length-1;i>=0;i--)if(q[i].t===t){s.credits+=q[i].paid;q.splice(i,1);break}
      return}
    case 'place':{const t=c.t,ct=CAT[t];if(!ct||!isStruct(ct)||s[RD(ct)]!==t)return;const rot=(c.r|0)&3;
      if(!validPlace(side,t,c.x|0,c.y|0,0,rot)){if(side===ME){msg('Cannot build there any more.','bad');sfx('err')}return}
      placeBuilding(s,t,c.x|0,c.y|0,rot);s[RD(ct)]=null;return}
    case 'sell':sellBld(mine(c.b),side);return;
    case 'repair':{const b=mine(c.b);if(!b||b.k!=='b')return;b.repairing=c.on==null?!b.repairing:!!c.on;return}
    case 'rally':{const b=mine(c.b);if(!b||b.k!=='b'||(b.type!=='barracks'&&b.type!=='factory'&&b.type!=='airfield'))return;b.rally={x:c.x,y:c.y};return}
    case 'rift':{const rw=mine(c.r);if(!rw||rw.type!=='rift'||rw.rcd>0)return;
      if(Math.hypot(rw.x-c.x,rw.y-c.y)>RIFT_R||occ[ti(c.x,c.y)])return;riftJump(rw,c.x,c.y);return}
    case 'gg':s.resigned=true;return;
  }
}
