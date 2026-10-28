'use strict';
/* ---------- game flow ---------- */
/* camera yaw and building facing per start corner [BL,TR,TL,BR] */
const CYAW=[0,Math.PI,-Math.PI/2,Math.PI/2],CROT=[0,2,1,3];
function mirror(tx,ty,w,h){return [MW-tx-w,MH-ty-h]}
/* ---------- fixed-step simulation ---------- */
let simTick=0,simAcc=0;
function simStep(){SIMIN++;try{if(typeof netRunTick==='function')netRunTick(simTick);update(TICK)}finally{SIMIN--}simTick++}
function simCanStep(){return typeof netCanStep!=='function'||netCanStep(simTick)}
/* fingerprint of everything that matters in the game state, compared between players to catch any desync */
const _hb=new Float64Array(1),_hw=new Uint32Array(_hb.buffer);
function simHash(){let h=2166136261>>>0;const f=v=>{_hb[0]=v||0;h=Math.imul(h^_hw[0],16777619);h=Math.imul(h^_hw[1],16777619)};
  for(const u of units){f(u.id);f(u.x);f(u.y);f(u.hp);f(u.ang)}for(const b of blds){f(b.id);f(b.hp);f(b.side)}for(const s of sides)f(s.credits);f(projs.length);return h>>>0}
function newWorld(sd0,facs,opt){SIMIN++;try{newWorld0(sd0,facs,opt)}finally{SIMIN--}}
function newWorld0(sd0,facs,opt){
  opt=opt||{};
  seed(sd0>>>0);curMap=MAPS[pickMap];setMapSize(mapSize(curMap));
  units=[];blds=[];projs=[];fxs=[];sel=[];groups={};nid=1;time=0;fogT=0;winT=0;regT=0;cmdQueue=[];paused=false;mode=null;place=null;drag=null;lastAlert=-99;alertPos=null;alerts=[];
  genMap();
  const pc=playerCol(),cols=opt.cols||[pc,...COL_ORDER.filter(c=>c!==pc)],cor=opt.corners||[0,1,2,3];
  sides=facs.map((fc,id)=>({id,fac:fc,col:cols[id],corner:cor[id],team:(opt.teams||[])[id]||0,ai:opt.ai&&opt.ai[id]!=null?!!opt.ai[id]:id!==0,diff:(opt.diffs||[])[id]||diffKey,credits:opt.credits||2500,q:{b:[],d:[],i:[],v:[]},ready:null,readyD:null,pw:0,use:0,low:false}));
  if(typeof glbNeed==='function')for(const sd of sides)glbNeed(sd.fac);
  for(const sd of sides){
    const c=sd.corner,m=(tx,ty,w,h)=>cornerBox(c,tx,ty,w,h),r0=CROT[c];
    addBld('yard',sd.id,...m(5,MH-12,3,3),r0);
  }
  const spot=(x0,y0)=>{for(let r=0;r<10;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const tx=x0+dx,ty=y0+dy;let ok=tx>2&&ty>2&&tx<MW-4&&ty<MH-4;
      for(let y=ty-1;ok&&y<ty+3;y++)for(let x=tx-1;x<tx+3;x++){const i=y*MW+x;if(ter[i]||occ[i]||cry[i]>0){ok=false;break}}
      if(ok&&sides.every(sd=>Math.hypot(BASES[sd.corner][0]-tx,BASES[sd.corner][1]-ty)>10)&&blds.every(b=>b.side>=0||Math.hypot(b.tx-tx,b.ty-ty)>9))return [tx,ty]}return null};
  const LY=curLayout,SP=LY.spike||[19,40];
  const free4=(tx,ty)=>{for(let y=ty-1;y<ty+3;y++)for(let x=tx-1;x<tx+3;x++){const i=y*MW+x;if(ter[i]||occ[i]||cry[i]>0)return false}return true};
  const sp0=spot(SP[0],SP[1])||SP;
  for(let c=0;c<4;c++){const [x,y]=cornerBox(c,sp0[0],sp0[1],2,2),p=free4(x,y)?[x,y]:spot(x,y);if(p)addBld('spike',-1,p[0],p[1],0)}
  for(const [x,y] of LY.radars||[[MW/2-1,17]]){const p=spot(x,y);if(!p)continue;addBld('radar',-1,p[0],p[1],0);
    const [mx,my]=cornerBox(1,p[0],p[1],2,2);if(!LY.radarOnce&&(mx!==p[0]||my!==p[1])&&[0,1,2,3].every(k=>{const i=(my+(k>>1))*MW+mx+(k&1);return !ter[i]&&!occ[i]&&!(cry[i]>0)}))addBld('radar',-1,mx,my,0)}
  vis=new Uint8Array(MW*MH);visT=new Float32Array(MW*MH).fill(-1e9);cryMem=cry.slice();cryMax=cry.slice();cryIdle=new Float32Array(MW*MH);memB.clear();
  if(!fogC||fogC.width!==MW){fogC=document.createElement('canvas');fogC.width=MW;fogC.height=MH;fogX=fogC.getContext('2d');fogImg=fogX.createImageData(MW,MH)}
}
let menuSeed=0;
function menuScene(same){SIMIN++;try{menuScene0(same)}finally{SIMIN--}}
function menuScene0(same){
  if(!renderer)return;
  if(!same||!menuSeed)menuSeed=(Date.now()^0x2545f491)>>>0;
  newWorld(menuSeed,[pickFac,(pickFac+1)%3]);
  const tryB=(t,tx,ty,r)=>{if(validPlace(ME,t,tx,ty,0,r))addBld(t,0,tx,ty,r)};
  const oy=MH-64;tryB('power',9,50+oy,0);tryB('refinery',9,53+oy,0);tryB('barracks',13,47+oy,0);tryB('factory',13,55+oy,3);tryB('turret',15,50+oy,0);tryB('power',4,47+oy,0);tryB('turret',17,46+oy,0);
  for(let i=0;i<5;i++){const c=tc(findFree(15+(i%3)*1.5,51+oy+(i/3|0)*1.5));const u=addUnit(i<3?'tank':'rifle',0,c.x,c.y);u.ang=u.tang=-.8}
  sel=[];place=null;mode=null;if(typeof hideGameFx==='function')hideGameFx();
  vis.fill(2);CFE.value=1;build3D();state='menu';document.body.classList.add('menu');
  /* a rebuild of the same backdrop keeps the slowly circling camera where it is */
  if(!same||!menuCamSet){cam.x=11*T;cam.y=(MH-13)*T;yaw=.5;menuCamSet=true}camDist=DESK?600:470;camH=hAt(cam.x,cam.y);updFog();
  menuFadeIn();
}
/* show the backdrop once its first frame is drawn (it starts hidden so the page never flashes a half-built scene) */
function menuFadeIn(){const cv=$('#cv');if(!cv.classList.contains('fadeOut'))return;requestAnimationFrame(()=>requestAnimationFrame(()=>cv.classList.remove('fadeOut')))}
let menuCamSet=false,menuFadeT=0;
/* the player's colour or faction changed: swap only the models that changed, so the backdrop never restarts */
function menuRefresh(){
  if(state!=='menu'||!sides||!sides[ME])return;
  const pc=playerCol(),chg=new Set();
  if(sides[ME].fac!==pickFac||sides[ME].col!==pc){sides[ME].fac=pickFac;sides[ME].col=pc;chg.add(0)}
  const o=sides[1];if(o&&(o.fac===pickFac||o.col===pc)){if(o.fac===pickFac)o.fac=(pickFac+1)%3;if(o.col===pc)o.col=COL_ORDER.find(c=>c!==pc);chg.add(1)}
  if(typeof glbNeed==='function')glbNeed(pickFac);
  menuDrop(e=>chg.has(e.side));
}
/* forget the 3D models of some entities; the next frame rebuilds them from the current templates */
function menuDrop(pred){
  for(const e of [...units,...blds]){if(!pred(e))continue;const r=ents.get(e.id);if(r){if(r.g.parent)r.g.parent.remove(r.g);ents.delete(e.id)}}
}
/* a different map: fade the backdrop out, build the new one, fade back in */
function menuNewMap(){
  if(state!=='menu')return;const cv=$('#cv');clearTimeout(menuFadeT);cv.classList.add('fadeOut');
  menuFadeT=setTimeout(()=>{if(state==='menu'){menuCamSet=false;menuScene()}else menuFadeIn()},260);
}
/* ---------- skirmish lobby: four slots, slot 0 is the human player ---------- */
const lobbyDefault=()=>({name:'Commander',credits:2500,slots:[0,1,2,3].map(i=>({kind:i===0?'you':i<pickPlayers?'ai':'closed',fac:-1,col:-1,team:0,diff:pickDiff,corner:-1}))});
let LOBBY=null;try{LOBBY=JSON.parse(localStorage.getItem('cf-lobby')||'null')}catch(e){}
if(!LOBBY||!Array.isArray(LOBBY.slots)||LOBBY.slots.length!==4)LOBBY=lobbyDefault();
LOBBY.slots[0].kind='you';LOBBY.name=String(LOBBY.name||'Commander').slice(0,16);
const saveLobby=()=>{try{localStorage.setItem('cf-lobby',JSON.stringify(LOBBY))}catch(e){}};
/* turns the lobby into concrete factions, unique colours, start corners, teams and AI difficulty */
/* start corners: chosen ones first, then the player (default bottom-left); allies start beside the player, rivals across */
function lobbyCorners(act){
  const av=mapCorners(MAPS[pickMap]),cu=new Set(),cor=[];act.forEach((s,k)=>{if(s.corner>=0&&av.includes(s.corner)&&!cu.has(s.corner)){cor[k]=s.corner;cu.add(s.corner)}});
  if(cor[0]==null){const c=av.find(c=>!cu.has(c));cor[0]=c;cu.add(c)}
  const t0=act[0].team|0;
  act.forEach((s,k)=>{if(cor[k]==null){const al=t0&&(s.team|0)===t0,c=(al?[cor[0]^2,cor[0]^3,cor[0]^1]:[cor[0]^1,cor[0]^3,cor[0]^2]).concat(av).filter(c=>av.includes(c)).find(c=>!cu.has(c));cor[k]=c;cu.add(c)}});
  return cor;
}
function lobbyResolve(){
  const act=LOBBY.slots.filter(s=>s.kind!=='closed');
  const facs=act.map(s=>s.kind==='you'?pickFac:s.fac>=0?s.fac:(Math.random()*3)|0);
  const used=new Set(),cols=[];
  act.forEach((s,k)=>{const c=s.kind==='you'?playerCol():s.col;if(c>=0&&!used.has(c)){cols[k]=c;used.add(c)}});
  act.forEach((s,k)=>{if(cols[k]==null){const c=COL_ORDER.find(c=>!used.has(c));cols[k]=c;used.add(c)}});
  return {facs,cols,corners:lobbyCorners(act),teams:act.map(s=>s.team|0),diffs:act.map(s=>s.kind==='you'?'normal':s.diff||pickDiff),credits:LOBBY.credits||2500};
}
/* cfg (optional): a complete match setup {seed,facs,cols,corners,teams,diffs,credits,ai} - used by online matches and tests */
function startGame(dk,cfg){
  unlocked.d=unlocked.i=unlocked.v=false;mode=null;showTab("b");$('#ovTitle').hidden=true;
  document.body.classList.remove('menu');
  diffKey=dk;SANDBOX=!cfg&&pickMode==='sandbox';document.body.classList.toggle('sandbox',SANDBOX);
  const L=cfg||lobbyResolve();newWorld(L.seed!=null?L.seed:(Date.now()^0x5bd1e995),L.facs,L);
  document.documentElement.style.setProperty('--tc',TCOL(ME));applyThumbs();
  {const im=$('#hudEmb');im.src=emblemURL(sides[ME].fac,sides[ME].col);im.alt=FACTIONS[sides[ME].fac].name;im.hidden=false}
  for(const b of blds)if(b.side!==ME)remember(b);showPanel(null);
  SIMIN++;try{aiInit()}finally{SIMIN--}state='play';CFE.value=0;simTick=0;simAcc=0;
  {const c=sides[ME].corner,y=blds.find(b=>b.side===ME&&b.type==='yard');yaw=CYAW[c];lastRot=CROT[c];mmRot=NaN;
   const ux=-Math.sin(yaw),uy=-Math.cos(yaw),rx=Math.cos(yaw),ry=-Math.sin(yaw);cam.x=y.x+ux*T*1.5+rx*T*.5;cam.y=y.y+uy*T*1.5+ry*T*.5}
  camDist=zDef();camH=hAt(cam.x,cam.y);build3D();clampCam();updateCamera();updFog();if(typeof warmShaders==='function')warmShaders();
  $('#overlay').hidden=true;escEl.hidden=true;clearTimeout(menuFadeT);$('#cv').classList.remove('fadeOut');
  trayOpen=true;showTab('b');$('#alertBtn').hidden=true;
  msg(SANDBOX?'Sandbox: everything is free and instant':'Build a Power Plant, then a Refinery','');
}
function endGame(win){
  say(win?'Mission accomplished':'Mission failed','end',0);state='over';sfx(win?'win':'lose');
  $('#ovTitle').textContent=win?'Victory':'Defeat';$('#ovTitle').hidden=false;
  $('#ovText').textContent=win?(sides.filter(s=>enemy(ME,s.id)).length>1?'Every rival commander has fallen.':FACTIONS[facOf(sides.find(s=>enemy(ME,s.id)).id)].name+' has been defeated.'):'Your base has fallen.';showPanel('end');
  $('#againBtn').hidden=NET.on;$('#overlay').hidden=false;
  if(NET.on){NET.ended=true;olWait(false);if(sides[ME].resigned)$('#ovText').textContent='You surrendered.';else if(sides.some(sd=>sd.id!==ME&&sd.resigned))$('#ovText').textContent='Your opponent surrendered.';setTimeout(netClose,2000)}
}
function update(dt){
  time+=dt;
  for(const s of sides){let pw=0,use=0;for(const b of blds){if(b.dead||b.side!==s.id)continue;const p=BDEF[b.type].power;if(p>0)pw+=p;else use-=p}s.pw=pw;s.use=use;s.low=use>pw}
  for(const sd of sides)tickProd(sd,dt);aiTick(dt);
  for(const b of blds)if(b.type==='spike'&&b.side>=0&&!b.dead){sides[b.side].credits+=SPIKE_INC*dt;if(rng()<dt*1.2)fxs.push({t:'ping',x:b.x,y:b.y,age:0,life:.9,r:30,col:'#c46bff'})}
  for(const b of blds){if(!b.repairing||b.dead)continue;if(b.hp>=b.mhp){b.repairing=false;continue}
    const sd=sides[b.side],bd=BDEF[b.type],amt=Math.min(b.mhp-b.hp,b.mhp*.045*dt),cost=amt*((bd.cost||1500)/bd.hp)*.4;
    if(SANDBOX&&b.side===ME||sd.credits>=cost){if(!(SANDBOX&&b.side===ME))sd.credits-=cost;b.hp+=amt;if(rng()<dt*5)fxs.push({t:'flash',x:b.x+(rng()-.5)*b.w*T*.6,y:b.y+(rng()-.5)*b.h*T*.6,age:0,life:.15,r:3})}}
  for(const u of units)if(!u.dead)updUnit(u,dt);
  for(const b of blds)if(!b.dead&&BDEF[b.type].dmg)updTurret(b,dt);
  /* War Factories repair friendly vehicles parked nearby */
  for(const b of blds){if(b.dead||b.type!=='factory'||b.side<0||sides[b.side].low)continue;
    for(const u of units)if(!u.dead&&u.side===b.side&&UDEF[u.type].armor==='veh'&&u.hp<u.mhp&&edgeDist(u,b)<T*3){u.hp=Math.min(u.mhp,u.hp+30*dt);if(rng()<dt*6)fxs.push({t:'flash',x:u.x+(rng()-.5)*14,y:u.y+(rng()-.5)*14,age:0,life:.15,r:3})}}
  separate();
  for(const p of projs){
    if(p.dead)continue;
    const t=p.tgt;if(t.dead){p.dead=true;continue}
    p.px=p.x;p.py=p.y;
    const dx=t.x-p.x,dy=t.y-p.y,dist=Math.hypot(dx,dy),st=p.sp*dt,reach=t.k==='b'?Math.max(t.w,t.h)*T*.35:6;
    if(dist<=st+reach){
      const arm=t.k==='b'?'bld':UDEF[t.type].armor;
      hurt(t,p.dmg*MUL[p.wt][arm],p.src);p.dead=true;sfx('hit',t.x,t.y);
      if(p.wt==='grenade'){for(const u of units)if(!u.dead&&u!==t&&enemy(u.side,p.side)&&Math.hypot(u.x-t.x,u.y-t.y)<T*1.1)hurt(u,p.dmg*.5*MUL.grenade[UDEF[u.type].armor],p.src);
        for(let i=0;i<2;i++)fxs.push({t:'boom',x:t.x+(rng()-.5)*20,y:t.y+(rng()-.5)*20,age:-rng()*.1,life:.35,r:11});fxs.push({t:'dust',x:t.x,y:t.y,h:2,age:0,life:.9,r:9})}
      if(p.wt==='shell'){for(const u of units)if(!u.dead&&u!==t&&enemy(u.side,p.side)&&Math.hypot(u.x-t.x,u.y-t.y)<T*1.4)hurt(u,p.dmg*.45*MUL.shell[UDEF[u.type].armor],p.src);
        for(let i=0;i<4;i++)fxs.push({t:'boom',x:t.x+(rng()-.5)*30,y:t.y+(rng()-.5)*30,age:-rng()*.15,life:.45,r:16});fxs.push({t:'smoke',x:t.x,y:t.y,age:0,life:1.4,r:12})}
      if(p.laser)fxs.push({t:'flash',x:t.x,y:t.y,h:p.h1,col:p.col,age:0,life:.18,r:p.wt==='bullet'?4:9});
      else fxs.push({t:'boom',x:p.x,y:p.y,age:0,life:.3,r:p.wt==='bullet'||p.wt==='snipe'?5:12});
    }else{p.x+=dx/dist*st;p.y+=dy/dist*st}
  }
  for(const b of blds)if(!b.dead&&b.hp<b.mhp*.5&&rng()<dt*5)fxs.push({t:'smoke',x:b.x+(rng()-.5)*b.w*T*.6,y:b.y+(rng()-.5)*b.h*T*.6,age:0,life:1.2,r:7});
  for(const f of fxs)f.age+=dt;
  projs=projs.filter(p=>!p.dead);fxs=fxs.filter(f=>f.age<f.life);
  units=units.filter(u=>!u.dead);blds=blds.filter(b=>!b.dead);sel=sel.filter(e=>!e.dead);
  fogT-=dt;if(fogT<=0){fogT=.15;updFog()}
  /* crystal regrowth: a mined tile left alone for a while slowly grows back to its original size */
  regT-=dt;if(regT<=0&&cryMax){const st=1-regT;regT=1;
    for(let i=0;i<cryMax.length;i++){const mx=cryMax[i];if(!mx||cry[i]>=mx)continue;
      if(occ[i]){continue}cryIdle[i]+=st;if(cryIdle[i]<CRY_WAIT)continue;cry[i]=Math.min(mx,cry[i]+mx/CRY_REGROW*st)}}
  winT-=dt;if(winT<=0){winT=1;
    /* a side is out when it has no real buildings left or has surrendered */
    const alive=sd=>!sd.resigned&&blds.some(b=>b.side===sd.id&&!BDEF[b.type].cap);
    if(!sides.some(sd=>enemy(ME,sd.id)&&alive(sd)))endGame(true);
    else if(!alive(sides[ME]))endGame(false)}
}
let REVEAL=false,visT=null;
/* fog of war (what this player sees; never used by game rules): ground stays in view FOG_LINGER seconds after your
   units move on, then the fog fades back in over FOG_FADE seconds */
const FOG_LINGER=3,FOG_FADE=2.5;
function updFog(){
  for(let i=0;i<vis.length;i++)if(vis[i]===2)vis[i]=1;
  const rev=(e,r)=>{const cx=(e.x/T)|0,cy=(e.y/T)|0;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r+r)continue;const x=cx+dx,y=cy+dy;if(x>=0&&y>=0&&x<MW&&y<MH){vis[y*MW+x]=2;visT[y*MW+x]=time}}};
  for(const u of units)if(ally(ME,u.side))rev(u,UDEF[u.type].vis);
  for(const b of blds)if(ally(ME,b.side))rev(b,BDEF[b.type].vis);
  if(REVEAL)vis.fill(2);
  for(let i=0;i<vis.length;i++)if(vis[i]===1&&time-visT[i]<FOG_LINGER)vis[i]=2;
  for(const b of blds)if(b.side!==ME&&visNow(b)){b.seen=true;remember(b)}
  for(const [id,m] of memB)if(visNow(m)&&!blds.some(b=>b.id===id&&!b.dead))forget(id);
  for(let i=0;i<vis.length;i++)if(vis[i]===2)cryMem[i]=cry[i];
  const d=fogImg.data,vd=visImg.data;
  for(let i=0;i<vis.length;i++){const a=vis[i]===2?0:Math.min(1,Math.max(0,(time-visT[i]-FOG_LINGER)/FOG_FADE));d[i*4]=10;d[i*4+1]=13;d[i*4+2]=13;d[i*4+3]=120*a;vd[i*4]=vd[i*4+1]=vd[i*4+2]=255*(1-a);vd[i*4+3]=255}
  fogX.putImageData(fogImg,0,0);visX.putImageData(visImg,0,0);visTex.needsUpdate=true;
  refreshInst();
}
function visNow(b){for(let y=b.ty;y<b.ty+b.h;y++)for(let x=b.tx;x<b.tx+b.w;x++)if(vis[y*MW+x]===2)return true;return false}
function remember(b){const m=memB.get(b.id)||{id:b.id,type:b.type,side:b.side,tx:b.tx,ty:b.ty,w:b.w,h:b.h,rot:b.rot||0,x:b.x,y:b.y};memB.set(b.id,m)}
function forget(id){memB.delete(id);const g=memG.get(id);if(g){if(g.parent)g.parent.remove(g);memG.delete(id)}}
const seenBy0=e=>ally(ME,e.side)||(e.k==='b'?(memB.has(e.id)||visNow(e)):vis[ti(e.x,e.y)]===2&&!e.cloaked);
