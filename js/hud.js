'use strict';
/* ---------- sidebar ---------- */
const tabsEl=$('#tabs'),barEl=$('#tabbar'),btn={},tabBtn={},tabSec={};
const ICONS={
  b:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 21V11l5-3v3l5-3v3l5-3V4h3v17z"/></svg>',
  i:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3h8v5H8z M7 9h10l2 6h-3v6h-3v-5h-2v5H8v-6H5z"/></svg>',
  v:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 15h18l-2 5H5z M5 10h11l2 4H5z M15 11h8v2h-8z"/></svg>',
  d:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z M12 6l-4 1.6V11c0 3 1.7 5.7 4 7z"/></svg>'
};
const UNLOCK={b:null,d:'barracks',i:'barracks',v:'factory'};
let curTab='b',trayOpen=false;
function showTab(c){curTab=c;for(const k in tabSec){tabSec[k].hidden=k!==c;tabBtn[k].classList.toggle('on',k===c);tabBtn[k].setAttribute('aria-selected',k===c)}}
for(const c of ['b','d','i','v']){
  const tb=document.createElement('button');tb.type='button';tb.className='tb';tb.setAttribute('role','tab');
  tb.innerHTML=ICONS[c]+`<span>${{b:'Base',d:'Defense',i:'Infantry',v:'Vehicles'}[c]}</span><i class="dot"></i><i class="tp"></i>`;
  tb.setAttribute('aria-label',UNLOCK[c]?`${TITLES[c]} (build a ${BDEF[UNLOCK[c]].name} to unlock)`:TITLES[c]);
  tb.addEventListener('click',()=>{if(tb.disabled)return;tb.classList.remove('fresh');if(DESK){if(trayOpen&&curTab===c)trayOpen=false;else{showTab(c);trayOpen=true}}else if(selBarOn){selBarOff=selKey;selBarOn=false;$('#selBar').hidden=true;showTab(c);trayOpen=true}else if(trayOpen&&curTab===c){trayOpen=false}else{showTab(c);trayOpen=true}sfx('click');updUI()});
  barEl.appendChild(tb);tabBtn[c]=tb;
  const sec=document.createElement('section');sec.className='tab';sec.setAttribute('role','tabpanel');tabSec[c]=sec;
  sec.innerHTML=`<h3>${TITLES[c]}</h3>`+((c==='i'||c==='v')?`<div class="subtabs" id="sub_${c}" hidden></div>`:'');
  for(const t of LISTS[c]){
    const d=def(t),b=document.createElement('button');
    b.type='button';b.className='bt';b.dataset.t=t;
    const reqs=(d.req||[]).map(r=>BDEF[r].name);if(c==='i')reqs.push('Barracks');if(c==='v')reqs.push('War Factory');
    b.setAttribute('aria-label',`${d.name}. Needs: ${reqs.join(', ')||'none'}. Build time ${d.time}s.`);
    b.innerHTML=`<img alt=""><i class="pg"></i><span class="nm">${d.name}</span><span class="cs">$${d.cost}</span><span class="bd"></span><b class="qn" hidden></b><i class="pgb"></i>`;
    b.addEventListener('click',()=>onBuild(t));
    b.addEventListener('contextmenu',e=>{e.preventDefault();onCancel(t)});
    sec.appendChild(b);btn[t]=b;
  }
  tabsEl.appendChild(sec);
}
showTab('b');
for(const c of ['i','v'])$('#sub_'+c).addEventListener('click',e=>{const b=e.target.closest('.stb');if(!b)return;prodSel[c]=+b.dataset.id;sfx('click');updUI()});
const unlocked={d:false,i:false,v:false};
function onBuild(t){
  if(state!=='play')return;
  const s=sides[ME],c=CAT[t];
  if(isStruct(c)&&s[RD(c)]===t){place={t,rot:lastRot};mode=null;mouse={x:W/2,y:H*.42,in:true};sfx('click');return}
  if(atCap(s,t)){msg('Limit reached: only one '+BDEF[t].name+' allowed.','bad');sfx('err');return}
  if(!canBuild(s,t)){msg('Requires '+((def(t).req||[]).concat(c==='i'?['barracks']:c==='v'?['factory']:[]).map(r=>BDEF[r].name).join(', ')),'bad');sfx('err');return}
  if(isStruct(c)&&s.q[c].length){msg(c==='b'?'Already building a structure.':'Already building a defense.','bad');sfx('err');say('Unable to comply','err',2);return}
  const cp=(c==='i'||c==='v')?curProd(c):null;if(cp&&prodQ(cp).length>=6){msg('Queue is full.','bad');sfx('err');return}
  issue({c:'build',t,p:cp?cp.id:null});sfx('click');say(c==='i'?'Training':'Building','build',.6);
}
function onCancel(t){
  if(state!=='play')return;const c=CAT[t],cp=(c==='i'||c==='v')?curProd(c):null;
  issue({c:'cancel',t,p:cp?cp.id:null});if(isStruct(c)&&place&&place.t===t)place=null;
}
let wasLow=false;
function updUI(){
  if(!sides||state==='menu')return;
  const s=sides[ME];
  $('#cr').textContent='$'+Math.floor(s.credits).toLocaleString('en-US');
  const f=s.pw?Math.min(1,s.use/s.pw):(s.use?1:0),pb=$('#pmfill');pb.style.width=(s.low?100:f*100)+'%';
  pb.classList.toggle('low',s.low);pb.classList.toggle('warn',!s.low&&f>.85);
  if(s.low&&!wasLow&&state==='play'){msg('Low power: radar and defenses offline. Build a Power Plant.','bad');sfx('err');say('Low power','low',8)}wasLow=s.low;
  document.body.classList.toggle('placing',!!place);document.body.classList.toggle('moding',mode==='repair'||mode==='sell'||mode==='rift');$('#tray').hidden=DESK?!trayOpen:(!trayOpen||selBarOn);
  /* the open tab is highlighted; a closed tray leaves every tab unlit */
  for(const k in tabBtn){const on=trayOpen&&k===curTab;tabBtn[k].classList.toggle('on',on);tabBtn[k].setAttribute('aria-selected',on)}
  {const tb=$('#tbar');tb.hidden=true;if(!tb.hidden){const hasU=myArmy().length>0;$('#tbBox').classList.toggle('on',boxMode);$('#tbAtk').classList.toggle('on',mode==='amove');$('#tbAtk').disabled=!hasU;$('#tbStop').disabled=!hasU}}
  $('#sellBtn').classList.toggle('on',mode==='sell');$('#sellBtn').setAttribute('aria-pressed',mode==='sell');
  $('#repBtn').classList.toggle('on',mode==='repair');$('#repBtn').setAttribute('aria-pressed',mode==='repair');
  for(const c of ['b','d','i','v']){
    const tb=tabBtn[c],open=!UNLOCK[c]||has(s,UNLOCK[c]);
    if(UNLOCK[c]){
      if(open&&!unlocked[c]&&state==='play'){unlocked[c]=true;tb.classList.add('fresh');msg(TITLES[c]+' unlocked','ok')}
      if(!open)unlocked[c]=false;
    }
    tb.disabled=!open;
    if(!open&&curTab===c)showTab('b');
    const q=(c==='i'||c==='v')?qAll(s,c):s.q[c],q0=q[0]&&LISTS[c].includes(q[0].t)?q[0]:null;tb.querySelector('.tp').style.width=(q0?q0.prog*100:0)+'%';
    tb.classList.toggle('has',isStruct(c)&&!!s[RD(c)]);
  }
  $('#army').textContent=units.filter(u=>u.side===ME&&u.type!=='harv').length;
  for(const t in btn){
    const b=btn[t],c=CAT[t],cp=(c==='i'||c==='v')?curProd(c):null,q=cp?prodQ(cp):(c==='i'||c==='v')?[]:s.q[c],d=def(t);
    const first=q[0]&&q[0].t===t?q[0]:null,n=q.filter(i=>i.t===t).length;
    let badge='',pg=0;
    if(isStruct(c)&&s[RD(c)]===t)badge='PLACE';
    else if(first){pg=first.prog*100;badge=s.credits<1?'NO FUNDS':(s.low?'LOW POWER':Math.floor(pg)+'%')}
    /* how many of this unit are waiting, across every barracks / war factory (shown even for a single one) */
    const tot=isStruct(c)?0:qAll(s,c).filter(i=>i.t===t).length,qn=b.querySelector('.qn');qn.hidden=!tot;qn.textContent=tot||'';
    if(!badge&&atCap(s,t))badge='MAX';
    b.classList.toggle('locked',!canBuild(s,t));
    b.classList.toggle('ready',isStruct(c)&&s[RD(c)]===t);
    b.querySelector('.bd').textContent=badge;
    b.querySelector('.pg').style.height=(first?100-pg:0)+'%';b.querySelector('.pgb').style.width=pg+'%';
  }
  for(const c of ['i','v']){
    const el=$('#sub_'+c),ps=prods(s,c);el.hidden=ps.length<2;if(ps.length<2)continue;
    const key=ps.map(p=>p.id).join(',');
    if(el.dataset.k!==key){el.dataset.k=key;el.innerHTML=ps.map((p,i)=>`<button type="button" class="stb" data-id="${p.id}">${c==='i'?'Barracks':'Factory'} ${i+1}<b></b><i></i></button>`).join('')}
    const cur=curProd(c);
    for(const b of el.children){const p=ps.find(x=>x.id===+b.dataset.id);if(!p)continue;const q=prodQ(p);
      b.classList.toggle('on',p===cur);b.querySelector('i').style.width=(q[0]?q[0].prog*100:0)+'%';b.querySelector('b').textContent=q.length?q.length:''}
  }
  updSel();
}
const ROLE={gren:['Heavy trooper, area damage','Infantry · Buildings','Tanks'],htank:['Slow twin-cannon heavy tank','Tanks · Buildings','Infantry'],mlrs:['Long-range missile carrier','Tanks · Buildings','Infantry'],shield:['Halves damage to nearby buildings','',''],stank:['Invisible until it fires or is spotted','',''],rift:['Teleports nearby squads','',''],eng:['Captures buildings','',''],spike:['Generates income when captured','',''],radar:['Reveals the area when captured','',''],sniper:['Long-range marksman','Infantry','Tanks · Buildings'],buggy:['Fast raider','Infantry','Tanks'],arty:['Long-range siege gun','Buildings · Infantry','Fast units'],
  guard:['Anti-infantry tower','Infantry','Tanks'],missile:['Anti-armor tower','Vehicles','Infantry'],tech:['Unlocks advanced units','',''],
  rifle:['Assault infantry','Infantry','Tanks · Buildings'],rocket:['Anti-armor infantry','Tanks · Buildings','Infantry'],
  tank:['Fast, cheap light tank','Tanks · Buildings','Infantry'],harv:['Crystal harvester','',''],yard:['Command center','',''],
  power:['Generates 100 power','',''],refinery:['Turns crystal into credits','',''],barracks:['Trains infantry','',''],
  factory:['Builds and repairs vehicles','',''],turret:['Base defense','Vehicles','']};
let selKey='',selRefs=[];
let selBarOn=false,selBarOff='';
function updSel(){
  const chip=$('#selChip'),bar=$('#selBar'),list=sel.filter(e=>!e.dead&&e.side===ME);chip.hidden=true;
  if(!list.length||state!=='play'){bar.hidden=true;selBarOn=false;selKey='';selBarOff='';return}
  const one=list.length===1?list[0]:null,pc=one&&one.k==='b'&&(one.type==='barracks'||one.type==='factory')?(one.type==='barracks'?'i':'v'):null;
  const us=list.filter(e=>e.k==='u'),key=list.map(e=>e.id).join(',');
  if(key!==selKey){selKey=key;if(pc){prodSel[pc]=one.id;showTab(pc);trayOpen=true}selBarOff='';if(us.length)buildSelBar(us);else selRefs=[]}
  selBarOn=us.length>0&&selBarOff!==key&&!place;bar.hidden=!selBarOn;
  for(const r of selRefs){
    if(r.all){let hp=0,mx=0,n=0;for(const e of r.all)if(!e.dead){hp+=Math.max(0,e.hp);mx+=e.mhp;n++}const f=mx?hp/mx:0;
      r.bar.style.width=(f*100)+'%';r.bar.className=f>.55?'':f>.25?'warn':'low';if(r.cnt)r.cnt.textContent='×'+n;continue}
    if(r.ab){const rws=r.list.filter(e=>e.type==='rift'&&!e.dead),cd=Math.min(...rws.map(e=>e.rcd>0?e.rcd:0));r.ab.disabled=cd>0;r.ab.textContent=cd>0?'Rift '+Math.ceil(cd)+'s':'Rift Jump';continue}
    const e=r.e,f=Math.max(0,e.hp/e.mhp);r.bar.style.width=(f*100)+'%';r.bar.className=f>.55?'':f>.25?'warn':'low';
    if(r.txt)r.txt.textContent=Math.ceil(Math.max(0,e.hp))+' / '+e.mhp;
    if(r.cargo){r.cargo.style.width=(e.cargo/UDEF.harv.cap*100)+'%';r.ctxt.textContent=Math.floor(e.cargo)+' / '+UDEF.harv.cap}
    if(r.card)r.card.classList.toggle('dead',!!e.dead);
  }
}
function buildSelBar(us){
  const sp=$('#selBar');selRefs=[];sp.classList.remove('sbTiles');sp.style.width='';
  const desel=`<button type="button" class="sbX" aria-label="Deselect">&#10005;</button>`;
  if(us.length===1){
    const e=us[0],ro=ROLE[e.type]||[''],hint=e.type==='eng'?'Tap an enemy or map building to capture it':e.type==='harv'?'Tap crystals to harvest there':'Tap ground to move · enemy to attack';
    sp.innerHTML=`<div class="sbOne"><div class="sbPort"><img alt="" src="${thumb(e.type,skinOf(e.side),220)}"></div>
      <div class="sbInfo"><div class="sbName">${nm(e.type,e.side)}</div><div class="sbRole">${ro[0]}</div>
      <div class="sbRow"><span class="lbl">Health</span><span class="sbV ht"></span></div><div class="hp hpm"><i></i></div>`+
      (e.type==='harv'?`<div class="sbRow"><span class="lbl">Cargo</span><span class="sbV ct"></span></div><div class="hp cargo"><i></i></div>`:'')+
      `<div class="sbHint">${hint}</div></div></div>`+desel;
    selRefs.push({e,bar:sp.querySelector('.hpm i'),txt:sp.querySelector('.ht'),cargo:e.type==='harv'?sp.querySelector('.hp.cargo i'):null,ctxt:sp.querySelector('.ct')});
  }else if(DESK){
    /* desktop: one entry per selected unit, never a scrollbar. A few units get full rows (picture, name, health);
       a big army switches to compact tiles and the panel widens until every unit fits on screen. */
    const head=78,avail=Math.max(200,H-16-16-head),rowH=58,tile=58,gap=6,rows=us.length*rowH<=avail;
    let cols=1;if(!rows){const maxR=Math.max(1,Math.floor((avail+gap)/(tile+gap)));cols=Math.max(5,Math.ceil(us.length/maxR))}
    sp.classList.toggle('sbTiles',!rows);sp.style.width=rows?'':(cols*(tile+gap)-gap+24)+'px';sp.style.setProperty('--cols',cols);
    sp.innerHTML=`<div class="sbArmy"><div class="sbAHead"><span class="sbN">${us.length}</span><span class="lbl">units selected</span></div>
      <div class="hp hpm sbAll"><i></i></div><div class="sbUnits"></div></div>`+desel;
    selRefs.push({all:us,bar:sp.querySelector('.sbAll i')});
    const box=sp.querySelector('.sbUnits');
    for(const e of us){const b=document.createElement('button');b.type='button';b.className=rows?'sbU':'sbT';b.setAttribute('aria-label',nm(e.type,e.side));
      b.innerHTML=rows?`<img alt="" src="${thumb(e.type,skinOf(e.side),96)}"><span class="uTxt"><span class="uN">${nm(e.type,e.side)}</span><span class="hp uH"><i></i></span></span>`
        :`<img alt="" src="${thumb(e.type,skinOf(e.side),96)}"><span class="mh"><i></i></span>`;
      b.addEventListener('click',ev=>{sel=ev.ctrlKey||ev.metaKey?sel.filter(x=>x!==e):[e];sfx('click');updSel()});
      box.appendChild(b);selRefs.push({e,bar:b.querySelector(rows?'.uH i':'.mh i'),card:b})}
  }else{
    const counts={};for(const e of us)counts[e.type]=(counts[e.type]||0)+1;
    const types=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    sp.innerHTML=`<div class="sbMulti"><div class="sbHead"><span class="sbN">${us.length}</span><span class="lbl">selected</span>
      <div class="sbTypes">${types.map(([t,n])=>`<button type="button" class="sbType" data-t="${t}"><img alt="" src="${thumb(t,skinOf(ME),96)}"><span>${nm(t,ME)}</span><b>×${n}</b></button>`).join('')}</div></div>
      <div class="sbCards"></div></div>`+desel;
    const cards=sp.querySelector('.sbCards');
    for(const e of us.slice(0,60)){const b=document.createElement('button');b.type='button';b.className='sbCard';b.setAttribute('aria-label',nm(e.type,e.side));
      b.innerHTML=`<img alt="" src="${thumb(e.type,skinOf(e.side),96)}"><span class="mh"><i></i></span>`;
      b.addEventListener('click',()=>{sel=[e];sfx('click');updSel()});cards.appendChild(b);selRefs.push({e,bar:b.querySelector('.mh i'),card:b})}
    sp.querySelectorAll('.sbType').forEach(b=>b.addEventListener('click',()=>{sel=sel.filter(e=>e.type===b.dataset.t);sfx('click');updSel()}));
  }
  if(us.some(e=>e.type==='rift')){const ab=document.createElement('button');ab.type='button';ab.className='sbAb';ab.textContent='Rift Jump';sp.appendChild(ab);
    ab.addEventListener('click',()=>{if(ab.disabled)return;place=null;mode='rift';sfx('click');updUI()});selRefs.push({ab,list:us})}
  sp.querySelector('.sbX').addEventListener('click',()=>{sel=[];sfx('click');updSel();updUI()});
}
function buildSel(list){
  const sp=$('#selChip');selRefs=[];
  if(list.length===1){
    const e=list[0],isB=e.k==='b',dn=isB?BDEF[e.type].name:nm(e.type,e.side);
    sp.innerHTML=`<img class="scImg" alt="" src="${thumb(e.type,skinOf(e.side),96)}"><div class="scMain"><div class="scName">${dn}</div><div class="hp hpm"><i></i></div>${e.type==='harv'?'<div class="hp cargo"><i></i></div>':''}</div>`+
      (isB?`<button type="button" class="scBtn" data-a="rep">Repair</button>`:'')+(isB&&e.type!=='yard'?`<button type="button" class="scBtn sell" data-a="sell">Sell $${Math.floor((BDEF[e.type].cost||0)*.5)}</button>`:'')+
      `<button type="button" class="scX" aria-label="Deselect">&#10005;</button>`;
    selRefs.push({e,bar:sp.querySelector('.hpm i'),cargo:e.type==='harv'?sp.querySelector('.hp.cargo i'):null,rep:sp.querySelector('[data-a="rep"]')});
    const rb=sp.querySelector('[data-a="rep"]');if(rb)rb.addEventListener('click',()=>{if(e.hp>=e.mhp&&!e.repairing){msg(BDEF[e.type].name+' is not damaged','');return}issue({c:'repair',b:e.id,on:e.repairing?0:1});sfx('click');updSel()});
    const sb=sp.querySelector('[data-a="sell"]');if(sb)sb.addEventListener('click',()=>{if(e.side!==ME||BDEF[e.type].cap)return;issue({c:'sell',b:e.id});sel=[];updSel()});
  }else{
    const counts={};for(const e of list)counts[e.type]=(counts[e.type]||0)+1;
    const sum=Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([t,n])=>`${nm(t,ME)} ×${n}`).join(' · ');
    sp.innerHTML=`<div class="scCount">${list.length}</div><div class="scMain"><div class="scName">${sum}</div><div class="hp hpm"><i></i></div></div><button type="button" class="scX" aria-label="Deselect">&#10005;</button>`;
    selRefs.push({list,bar:sp.querySelector('.hpm i')});
  }
  sp.querySelector('.scX').addEventListener('click',()=>{sel=[];sfx('click');updSel()});
}
function msg(text,kind){
  const box=$('#msgs');while(box.children.length>3)box.firstChild.remove();
  const d=document.createElement('div');d.className='msg '+(kind||'');d.textContent=text;box.appendChild(d);
  setTimeout(()=>d.remove(),4000);
}
/* ---------- info card: larger portrait, description and stats for any unit or structure ---------- */
const DESC={
  rifle:'Cheap, quick-to-train foot soldier. Shreds enemy infantry but barely scratches armour.',
  rocket:'Shoulder-launched missiles punch through tanks and buildings. Nearly useless against infantry.',
  gren:'Heavy trooper with a grenade launcher. Slow and tough, its blasts hit groups of infantry and structures.',
  sniper:'Long-range marksman. Picks off infantry from far outside their reach. Fragile up close.',
  eng:'Unarmed specialist. Walks into an enemy or neutral building to capture it for your side.',
  rift:'Helix specialist that can tear open a rift and teleport nearby squads a short distance.',
  tank:'Fast, cheap light tank. Good all-round armour hunter that can also hit buildings.',
  htank:'Slow, heavily armed twin-cannon tank. Crushes armour and bases; keep infantry away from it.',
  stank:'Syndicate tank that stays invisible until it fires or an enemy comes close.',
  mlrs:'Fires long-range missile volleys that wreck tanks and buildings. Lightly armoured.',
  buggy:'Very fast raider with a rapid-fire gun. Hunts infantry and scouts the map.',
  arty:'Long-range siege gun. Its shells splash over an area. Needs protection.',
  harv:'Gathers crystal from fields and brings it to a Refinery for credits.',
  yard:'Your command centre. Lose every building and the match is over.',
  power:'Generates 100 power. Without enough power, defenses and production slow down.',
  refinery:'Processes crystal into credits. Comes with a Harvester.',
  barracks:'Trains infantry. Build more to train several squads at once.',
  factory:'Builds vehicles and repairs damaged vehicles parked nearby.',
  tech:'Unlocks advanced units and defenses: Marksman, Heavy Tank, Siege Artillery, Missile Tower and the Vanguard Shield Generator. Limit one.',
  turret:'Cannon emplacement. Strong against vehicles.',
  guard:'Machine-gun tower. Strong against infantry.',
  missile:'Missile launcher tower. Hits vehicles hard from long range.',
  shield:'Vanguard generator that halves damage to nearby buildings.',
  spike:'Neutral crystal spike. Capture it with an Engineer for steady income.',
  radar:'Neutral radar tower. Capture it with an Engineer to reveal the area around it.'};
const icEl=document.createElement('div');icEl.id='infoCard';icEl.className='glass';icEl.hidden=true;$('#hud').appendChild(icEl);
let icKey='';
function infoHTML(t,side){
  const d=def(t),U=!!UDEF[t],ro=ROLE[t]||['','',''],sk=skinOf(side==null?0:side);
  const bar=(l,v,mx)=>`<div class="icStat"><span>${l}</span><i><b style="width:${Math.max(4,Math.min(100,v/mx*100))}%"></b></i></div>`;
  let stats='';
  if(U&&d.dmg)stats=bar('Health',d.hp,950)+bar('Damage',d.dmg/d.rof,40)+bar('Range',d.range,11)+bar('Speed',d.speed,128);
  else if(U)stats=bar('Health',d.hp,950)+bar('Speed',d.speed,128);
  else if(d.dmg)stats=bar('Health',d.hp,1600)+bar('Damage',d.dmg/d.rof,40)+bar('Range',d.range,11);
  else stats=bar('Health',d.hp,3000);
  const meta=[d.cost?'$'+d.cost:'',d.time?d.time+'s':'',!U&&d.power?(d.power>0?'+':'')+d.power+' power':'',(d.req||[]).length?'Needs '+d.req.map(r=>BDEF[r].name).join(', '):''].filter(Boolean).join(' · ');
  return `<img class="icImg" alt="" src="${thumb(t,sk,260)}"><div class="icBody"><div class="icName">${nm(t,side||0)}</div><div class="icRole">${ro[0]||d.name}</div>
    <p class="icDesc">${DESC[t]||''}</p>${stats}
    ${ro[1]||ro[2]?`<div class="icVs">${ro[1]?`<span class="g">Strong vs ${ro[1]}</span>`:''}${ro[2]?`<span class="r">Weak vs ${ro[2]}</span>`:''}</div>`:''}
    ${meta?`<div class="icMeta">${meta}</div>`:''}</div>`;
}
function showInfo(t,side,x,y,anchor){
  const k=t+':'+side;if(icKey!==k){icEl.innerHTML=infoHTML(t,side);icKey=k}
  icEl.hidden=false;const hr=$('#hud').getBoundingClientRect(),w=icEl.offsetWidth,h=icEl.offsetHeight;
  let lx,ly;if(anchor==='above'){lx=x-w/2;ly=y-h-10}else{lx=x+18;ly=y-h/2;if(lx+w>hr.width-8)lx=x-w-18}
  icEl.style.left=Math.max(8,Math.min(hr.width-w-8,lx))+'px';icEl.style.top=Math.max(8,Math.min(hr.height-h-8,ly))+'px';
}
function hideInfo(){icEl.hidden=true}
/* build cards: hover with a mouse, or press and hold on touch */
for(const t in btn){const b=btn[t];let lp=0,shown=false;
  const at=()=>{const r=b.getBoundingClientRect(),hr=$('#hud').getBoundingClientRect();return [r.left+r.width/2-hr.left,r.top-hr.top]};
  b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){const [x,y]=at();showInfo(t,0,x,y,'above')}});
  b.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')hideInfo();clearTimeout(lp)});
  b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;shown=false;clearTimeout(lp);lp=setTimeout(()=>{const [x,y]=at();showInfo(t,0,x,y,'above');shown=true;try{navigator.vibrate&&navigator.vibrate(12)}catch(er){}},420)});
  for(const ev of ['pointerup','pointercancel'])b.addEventListener(ev,e=>{clearTimeout(lp);if(e.pointerType!=='mouse'&&shown)setTimeout(hideInfo,1600)});
  b.addEventListener('click',e=>{if(shown){shown=false;e.stopImmediatePropagation();e.preventDefault()}},true);
  b.addEventListener('contextmenu',e=>{if(e.pointerType!=='mouse')e.preventDefault()});
}
/* the battlefield: only the Command Yard shows a hover card (everything else has one in the build menu) */
let hovT=0,hovE=null;
cvs.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||state!=='play'||drag)return;const now=performance.now();if(now-hovT<90)return;hovT=now;
  const r=cvs.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,hit=pickScreen(x,y,o=>!o.dead&&o.type==='yard'&&seenBy0(o));
  if(hit){hovE=hit;clearTimeout(hovE._t);showInfo(hit.type,hit.side,x,y)}else{hovE=null;hideInfo()}});
cvs.addEventListener('pointerleave',()=>{hovE=null;hideInfo()});
cvs.addEventListener('pointerdown',()=>hideInfo());
/* touch: tap the portrait in the selection panel */
$('#selBar').addEventListener('click',e=>{const p=e.target.closest('.sbPort');if(!p)return;const one=sel.filter(o=>!o.dead)[0];if(!one)return;
  if(!icEl.hidden){hideInfo();return}const r=p.getBoundingClientRect(),hr=$('#hud').getBoundingClientRect();showInfo(one.type,one.side,r.left+r.width/2-hr.left,r.top-hr.top,'above');e.stopPropagation()});
