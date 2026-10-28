'use strict';
/* ---------- main loop ---------- */
function resize(){
  const st=$('#stage');dpr=Math.min(dprCap,devicePixelRatio||1);
  W=Math.max(100,st.clientWidth);H=Math.max(100,st.clientHeight);
  if(renderer){renderer.setPixelRatio(dpr);renderer.setSize(W,H,false);if(typeof postResize==='function')postResize()}
  ov.width=W*dpr;ov.height=H*dpr;clampCam();
  const dk=!TOUCH&&W>=1200&&H>=680;
  if(dk!==DESK){DESK=dk;document.body.classList.toggle('desk',DESK);camDist=Math.min(camDist,zMax());}
  const ms=DESK?320:192;if(mm.width!==ms){mm.width=mm.height=ms}
}
new ResizeObserver(resize).observe($('#stage'));
let last=performance.now(),uiT=0;
/* ?nodraw (automated tests only): run the game without drawing frames */
const NODRAW=/[?&]nodraw\b/.test(location.search);
let lastErr='';
let fcount=0;
let dprCap=Math.min(1.5,devicePixelRatio||1),pfT=0,pfN=0,pfA=0,lowFx=false;
function perfTick(dt){
  if(state!=='play'||paused||!renderer)return;pfA+=dt;pfN++;pfT+=dt;if(pfT<2.5)return;
  const avg=pfA/pfN;pfT=pfA=pfN=0;
  if(avg>1/42&&GFX==='high'){setGfx('medium');msg('Graphics lowered to Medium for smoother play','')}
  else if(avg>1/48&&dprCap>1){dprCap=Math.max(1,dprCap-.25);resize()}
  else if(avg>1/30&&dprCap<=1&&!lowFx){lowFx=true;sun.shadow.mapSize.set(512,512);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
  else if(avg<1/57&&dprCap<Math.min(1.5,devicePixelRatio||1)){dprCap=Math.min(1.5,dprCap+.25);resize()}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(state==='play'&&escEl.hidden)openEsc();if(AC&&AC.state==='running')AC.suspend()}else if(AC&&!muted)AC.resume()});
function frame(now){
  requestAnimationFrame(frame);fcount++;
  const j0=performance.now();try{frameBody(now)}catch(err){const m=String(err&&err.stack||err);if(m!==lastErr){lastErr=m;console.error(m)}}
  if(typeof plFrame==='function')plFrame();
  if(typeof diagFrame==='function')diagFrame(now,performance.now()-j0);
}
function frameBody(now){
  const rdt=(now-last)/1000,dt=Math.min(.05,rdt);last=now;fdt=paused?0:dt;if(rdt<.5)perfTick(rdt);
  if(state==='play'&&!paused){
    const sp=620*dt*(camDist/520);let mxv=0,myv=0;
    if(keys['arrowleft'])mxv-=1;if(keys['arrowright'])mxv+=1;if(keys['arrowup'])myv+=1;if(keys['arrowdown'])myv-=1;
    if(ptrMouse&&mouse.in&&!drag&&!rot){const m=16;if(mouse.x<m)mxv-=1;if(mouse.x>W-m)mxv+=1;if(mouse.y<m)myv+=1;if(mouse.y>H-m)myv-=1}
    cam.x+=(Math.cos(yaw)*mxv-Math.sin(yaw)*myv)*sp;cam.y+=(-Math.sin(yaw)*mxv-Math.cos(yaw)*myv)*sp;
    if(keys['q'])yaw-=1.5*dt;if(keys['e'])yaw+=1.5*dt;
    clampCam();
    /* fixed-step simulation: catch up on real time (a slow frame runs several steps), never more than 1/4 s at once */
    simAcc+=Math.min(rdt,.25)+netBoost();let n=0;
    while(simAcc>=TICK&&simCanStep()){simStep();simAcc-=TICK;if(++n>=15){simAcc=0;break}}
    if(simAcc>TICK*3)simAcc=TICK*3;
  }
  if(!NODRAW)draw();
  uiT-=dt;if(uiT<=0){uiT=.1;updUI()}
}
resize();
if(!renderer){$('#ovText').textContent='This game needs WebGL, which this browser or device has turned off.';$('#pHome').hidden=true}
else{
  const refreshMenu=()=>{if(state==='menu')menuRefresh()};
  const fill=(id,opts,val)=>{const el=$(id);el.innerHTML=opts.map(([v,l])=>`<option value="${v}"${String(v)===String(val)?' selected':''}>${l}</option>`).join('')};
  fill('#selFac',FACTIONS.map((F,i)=>[i,F.short]),pickFac);
  const setEmb=()=>{const im=$('#facEmb');im.src=emblemURL(pickFac,playerCol());im.alt=FACTIONS[pickFac].name+' emblem'};setEmb();
  fill('#selMap',MAPS.map((M,i)=>[i,M.name]),pickMap);
  fill('#selPl',[[2,'2'],[3,'3'],[4,'4']],pickPlayers);
  fill('#selDf',[['easy','Easy'],['normal','Normal'],['hard','Hard']],pickDiff);
  const note=()=>{};
  const store=(k,v)=>{try{localStorage.setItem(k,v)}catch(er){}};
  $('#selFac').addEventListener('change',e=>{pickFac=+e.target.value;store('cf-fac',pickFac);if(typeof glbNeed==='function')glbNeed(pickFac);setEmb();refreshMenu()});
  fill('#selWx',WEATHER,pickWx);
  fill('#selMode',[['skirmish','Skirmish'],['sandbox','Sandbox']],pickMode);
  $('#selMap').addEventListener('change',e=>{const n=+e.target.value,ch=n!==pickMap;pickMap=n;store('cf-map',pickMap);if(ch)menuNewMap()});
  $('#selWx').addEventListener('change',e=>{pickWx=e.target.value;store('cf-wx',pickWx);if(state==='menu'&&world){applyBiome();buildWeather()}});
  $('#selPl').addEventListener('change',e=>{pickPlayers=+e.target.value;store('cf-pl',pickPlayers);note()});
  $('#selDf').addEventListener('change',e=>{pickDiff=e.target.value;store('cf-df',pickDiff)});
  $('#selMode').addEventListener('change',e=>{pickMode=e.target.value;store('cf-mode',pickMode)});
  const pick=(sel,v)=>{const sl=$(sel);sl.value=v;sl.dispatchEvent(new Event('change'));sfx('click')};
  /* ---------- skirmish lobby: map list / rules, start points, faction showcase, player slots ---------- */
  {
    const lob=$('#lobby'),FT=['Shielded bases and disciplined armour','Steel, spikes and stealth','Energy weapons and rift tech'];
    const prevs=MAPS.map((M,i)=>mapPreview(i,true));
    const accent=hex=>{const c=new THREE.Color(hex),r=c.r*255|0,g=c.g*255|0,b=c.b*255|0,st=lob.style;st.setProperty('--acc',`rgb(${r},${g},${b})`);
      for(const p of [15,25,35,38,55,70])st.setProperty('--a'+p,`rgba(${r},${g},${b},${p/100})`);
      for(const p of [40,45,50,55,85])st.setProperty('--d'+p,`rgb(${r*p/100|0},${g*p/100|0},${b*p/100|0})`)};
    const slots=LOBBY.slots,active=()=>slots.filter(s=>s.kind!=='closed');
    const colOf=i=>i===0?playerCol():slots[i].col;
    const takenCols=i=>new Set(slots.map((s,j)=>j!==i&&s.kind!=='closed'?colOf(j):-1).filter(c=>c>=0));
    /* header: commander name and tabs */
    const nameEl=$('#cmdName');nameEl.value=LOBBY.name;nameEl.addEventListener('input',()=>{LOBBY.name=nameEl.value.slice(0,16)||'Commander';saveLobby();rows()});
    nameEl.addEventListener('keydown',e=>{if(e.key==='Enter')nameEl.blur()});
    lob.querySelector('.lbTabs').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;sfx('click');
      for(const t of b.parentNode.children)t.classList.toggle('on',t===b);$('#lbMapPane').hidden=b.dataset.t!=='map';$('#lbRulesPane').hidden=b.dataset.t!=='rules'});
    /* map list */
    const ml=$('#mapList');ml.innerHTML=MAPS.map((M,i)=>`<button type="button" class="lbItem" role="option" data-v="${i}"><span><i style="background:${M.swatch[0]}"></i>${M.name}${M.size<64?' <em>small</em>':''}</span><span>${mapPlayers(M)}</span></button>`).join('');
    ml.addEventListener('click',e=>{const b=e.target.closest('.lbItem');if(!b)return;pick('#selMap',b.dataset.v);
      if(active().length>mapPlayers(MAPS[pickMap]))applyFmt();syncMap();rows()});
    /* rules */
    const rules=[['Weather','#selWx',WEATHER],['Mode','#selMode',[['skirmish','Skirmish'],['sandbox','Sandbox']]],['Credits',null,[[2500,'2,500'],[5000,'5,000'],[10000,'10,000']]],['Graphics','gfx',GFX_LEVELS]];
    $('#lbRulesPane').innerHTML=rules.map(([l,sel,o],k)=>`<div class="rRow"><span>${l}</span><div class="seg" data-k="${k}">${o.map(([v,t])=>`<button type="button" data-v="${v}">${t}</button>`).join('')}</div></div>`).join('');
    const syncRules=()=>{for(const sg of $('#lbRulesPane').querySelectorAll('.seg')){const [,sel]=rules[+sg.dataset.k],cur=sel==='gfx'?GFX:sel?$(sel).value:String(LOBBY.credits);for(const b of sg.children)b.classList.toggle('on',b.dataset.v===String(cur))}};
    $('#lbRulesPane').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const [,sel]=rules[+b.parentNode.dataset.k];if(sel==='gfx'){setGfx(b.dataset.v);sfx('click');syncRules();return}
      if(sel)pick(sel,b.dataset.v);else{LOBBY.credits=+b.dataset.v;saveLobby();sfx('click')}syncRules()});
    /* start points on the preview */
    const sm=$('#startMarks');
    const syncMarks=()=>{const idx=slots.map((s,i)=>i).filter(i=>slots[i].kind!=='closed'),cor=lobbyCorners(idx.map(i=>slots[i]));
      const owner=c=>{const k=cor.indexOf(c);return k<0?-1:idx[k]};
      const M=MAPS[pickMap],N=mapSize(M),av=mapCorners(M);
      sm.innerHTML=basesFor(N).map(([bx,by],c)=>{if(!av.includes(c))return '';const o=owner(c),col=o>=0&&colOf(o)>=0?COLORS[colOf(o)].col:'#9aa0a6',auto=o>=0&&slots[o].corner<0;
        return `<button type="button" class="smk${o>=0?' taken':''}${o===0?' you':''}${auto?' auto':''}" data-c="${c}" style="left:${(bx+.5)/N*100}%;top:${(by+.5)/N*100}%;--c:${col}" aria-label="Start point ${c+1}${o>=0?', player '+(o+1):''}">${o>=0?o+1:''}</button>`}).join('')};
    sm.addEventListener('click',e=>{const b=e.target.closest('.smk');if(!b)return;const c=+b.dataset.c,o=slots.findIndex(s=>s.kind!=='closed'&&s.corner===c);if(o===0&&slots[0].corner<0){slots[0].corner=c;saveLobby();syncMarks();return}
      if(o===0){slots[0].corner=-1}else{if(o>0)slots[o].corner=slots[0].corner;slots[0].corner=c}saveLobby();sfx('click');syncMarks()});
    const syncMap=()=>{for(const b of ml.children)b.classList.toggle('on',+b.dataset.v===pickMap);$('#prevImg').src=prevs[pickMap];
      syncMarks()};
    /* faction showcase */
    const syncArt=()=>{const pc=playerCol(),A=$('#lbArt');accent(COLORS[pc].ui||COLORS[pc].hex);document.documentElement.style.setProperty('--tc',COLORS[pc].col);
      A.querySelector('.artEmb').src=emblemURL(pickFac,pc);A.querySelector('.artEmb').alt=FACTIONS[pickFac].name+' emblem';A.querySelector('.artName').textContent=FACTIONS[pickFac].name};
    /* player slots */
    const opt=(v,t,cur)=>`<option value="${v}"${String(v)===String(cur)?' selected':''}>${t}</option>`;
    const sideOpts=cur=>(cur===-2?'':opt(-1,'Random',cur))+FACTIONS.map((F,i)=>opt(i,F.short,cur)).join('');
    const rows=()=>{$('#slotRows').innerHTML=slots.map((s,i)=>{const on=s.kind!=='closed',c=colOf(i);
      return `<div class="lbRow" data-i="${i}">
        ${i===0?`<div class="cell you">${(LOBBY.name||'Commander').replace(/[<&]/g,'')}</div>`:`<div class="cell sel"><select data-f="kind" aria-label="Player ${i+1}">${opt('ai','Computer',s.kind)}${opt('closed','Closed',s.kind)}</select></div>`}
        <div class="cell sel"><select data-f="fac" aria-label="Side" ${on?'':'disabled'}>${i===0?FACTIONS.map((F,k)=>opt(k,F.short,pickFac)).join(''):sideOpts(s.fac)}</select></div>
        ${i===0||!on?`<div class="cell"><span class="na">${i===0?'Human':'-'}</span></div>`:`<div class="cell sel"><select data-f="diff" aria-label="AI personality">${opt('easy','Easy',s.diff)}${opt('normal','Normal',s.diff)}${opt('hard','Hard',s.diff)}</select></div>`}
        <div class="cell sel"><select data-f="team" aria-label="Team" ${on?'':'disabled'}>${[0,1,2,3,4].map(t=>opt(t,t?t:'-',s.team|0)).join('')}</select></div>
        <div class="cell">${on?`<button type="button" class="colBtn${c<0?' auto':''}" data-f="col" style="--c:${c>=0?COLORS[c].col:'#444'}" aria-label="Colour: ${c>=0?COLORS[c].name:'automatic'}">${c<0?'?':''}</button>`:'<span class="na">-</span>'}</div>
      </div>`}).join('');check()};
    const check=()=>{const act=active(),hasFoe=act.some((s,i)=>i>0&&(!(s.team|0)||(s.team|0)!==(slots[0].team|0)));
      const mp=mapPlayers(MAPS[pickMap]);
      const msg=act.length<2?'Open at least one computer slot':act.length>mp?MAPS[pickMap].name+' is a '+mp+'-player map':!hasFoe?'Everyone is on your team - put a rival on another team':'';
      $('#lbHint').textContent=msg;$('#startBtn').disabled=!!msg;syncFmt();pickPlayers=act.length;try{localStorage.setItem('cf-pl',pickPlayers)}catch(e){}};
    $('#slotRows').addEventListener('change',e=>{const el=e.target,i=+el.closest('.lbRow').dataset.i,f=el.dataset.f,v=el.value;
      if(i===0&&f==='fac'){pick('#selFac',v);syncArt();rows();return}
      if(f==='kind'){slots[i].kind=v;if(v==='closed')slots[i].corner=-1}else if(f==='diff')slots[i].diff=v;else slots[i][f]=+v;
      saveLobby();sfx('click');rows();syncMarks()});
    /* colour picker popover */
    const pop=$('#colPop');let popI=-1;
    $('#slotRows').addEventListener('click',e=>{const b=e.target.closest('.colBtn');if(!b)return;popI=+b.closest('.lbRow').dataset.i;const tk=takenCols(popI),cur=colOf(popI);
      pop.innerHTML=(popI?`<button type="button" class="auto${cur<0?' on':''}" data-v="-1" aria-label="Automatic">AUTO</button>`:'')+COLORS.map((C,k)=>tk.has(k)?'':`<button type="button" class="${k===cur?'on':''}" data-v="${k}" style="--c:${C.col}" aria-label="${C.name}" title="${C.name}"></button>`).join('');
      const r=b.getBoundingClientRect(),lr=lob.getBoundingClientRect();pop.hidden=false;const pw=pop.offsetWidth,ph=pop.offsetHeight;
      pop.style.left=Math.max(4,Math.min(lr.width-pw-4,r.right-lr.left-pw))+'px';pop.style.top=Math.max(4,r.top-lr.top-ph-6)+'px';sfx('click');e.stopPropagation()});
    pop.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.classList.contains('taken'))return;const v=+b.dataset.v;
      if(popI===0){pickCol=v;store('cf-col',pickCol);syncArt();refreshMenu()}else slots[popI].col=v;saveLobby();pop.hidden=true;sfx('click');rows();syncMarks()});
    document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!e.target.closest('.colBtn'))pop.hidden=true});
    /* a 2-player map closes the extra computer slots */
    function applyFmt(){slots[0].team=0;slots.forEach((s,j)=>{if(j){s.kind=j===1?'ai':'closed';s.team=0;if(j>1)s.corner=-1}});saveLobby()}
    function syncFmt(){}
    syncMap();syncRules();syncArt();rows();
  }
  $('#playBtn').addEventListener('click',()=>{audioInit();sfx('click');showPanel('setup')});
  $('#backBtn').addEventListener('click',()=>showPanel('home'));
  $('#startBtn').addEventListener('click',()=>{audioInit();startGame(pickDiff);plRequest()});
  $('#againBtn').addEventListener('click',()=>{audioInit();startGame(diffKey);plRequest()});
  $('#menuBtn2').addEventListener('click',()=>{netReset();showPanel('home');menuScene()});
  setupPost();
  $('#escGfx').addEventListener('click',()=>{const i=GFX_LEVELS.findIndex(g=>g[0]===GFX);setGfx(GFX_LEVELS[(i+1)%GFX_LEVELS.length][0]);sfx('click')});setGfx(GFX);
  showPanel('home');whenStartModels(()=>{if(state==='menu'){menuScene();glbMenuBuilt=true;thumbPrewarm()}},6000);
}
/* if the browser drops the GPU context (low memory, tab in background), pause and rebuild the 3D scene when it comes back */
if(renderer){const cv=renderer.domElement;
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();if(state==='play'&&escEl.hidden)openEsc();msg('Graphics paused by the browser, restoring...','bad')});
  cv.addEventListener('webglcontextrestored',()=>{try{for(const k in thCache)delete thCache[k];if(world)build3D();updFog();msg('Graphics restored','ok')}catch(e){console.error(e)}})}
requestAnimationFrame(frame);
window.__cf={place:()=>place,fc:()=>[fcount,uiT,state,paused],ui:()=>updUI(),autoPlace:t=>{for(let r=2;r<12;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const tx=BASES[0][0]+dx,ty=BASES[0][1]-3+dy;if(validPlace(0,t,tx,ty,0,0)){placeBuilding(sides[0],t,tx,ty,0);return true}}return false},select:a=>{sel=a},memB,hurt,hAt,start:startGame,step:(n)=>{for(let i=0;i<n;i++)simStep()},hash:()=>simHash(),tick:()=>simTick,get:()=>({units,blds,sides,state,sel,cam,ents,cd:camDist,yaw}),snd:()=>{audioInit();const r=[];for(const n in SFX){try{SFX[n](AC.currentTime+.01,1,0);r.push(n)}catch(e){r.push(n+"!"+e.message)}}try{say("Building","t",0);r.push("say")}catch(e){r.push("say!"+e.message)}return r.join(" ")+" ac="+AC.state},view:(d,y)=>{camDist=d;if(y!=null)yaw=y},br:()=>BRIDGES.map(b=>[b.ax/T,b.az/T,b.bx/T,b.bz/T,b.hA|0,b.hB|0]),hills:()=>HILLS,ter:()=>ter,occ:()=>occ,gH:(x,z)=>gH(x,z),reveal:()=>{REVEAL=true;updFog()},tex:()=>terrain.toDataURL(),spawn:(t,s,x,y)=>addUnit(t,s,x,y),thumb:(t,sk,sz)=>thumb(t,sk,sz),rift:(u,x,y)=>riftJump(u,x,y),scene:()=>scene,cam:()=>camera,info:()=>{const i=renderer.info;return {calls:i.render.calls,tris:i.render.triangles,geos:i.memory.geometries,tex:i.memory.textures,progs:i.programs.length}},draw:()=>draw(),upd:dt=>update(dt)};
