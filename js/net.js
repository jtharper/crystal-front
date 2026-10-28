'use strict';
/* ---------- online 1v1 (lockstep) ----------
   Both browsers run the same deterministic simulation. Players never send unit positions, only their commands:
   the commands a player gives during turn n are sealed and sent for turn n+delay (a turn is TURN simulation steps),
   and a game only starts a turn once it holds both players' commands for it. Every 10 turns both sides also send a
   fingerprint of the game state; a mismatch means the two games diverged ("out of sync").
   The relay (server/, a Cloudflare Durable Object) just forwards messages between the two players, in order. */
const TURN=6,BUILD_ID='dev';
const NET={on:false,ws:null,slot:0,role:'',code:'',peer:false,state:'idle',delay:2,turns:new Map(),pend:[],remoteMax:-1,
  hashes:new Map(),waitT:0,rtt:0,lobby:null,leaving:false,bgT:0,bgLast:0,ended:false};
const OL_CODE_CH='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function olNewCode(){let s='';for(let i=0;i<5;i++)s+=OL_CODE_CH[(vr()*OL_CODE_CH.length)|0];return s}
function olBase(){const q=new URLSearchParams(location.search).get('mp');return q||((location.protocol==='https:'?'wss://':'ws://')+location.host)}
function netSend(o){const ws=NET.ws;if(ws&&ws.readyState===1)ws.send(typeof o==='string'?o:JSON.stringify(o))}

/* ---------- lockstep: called by the simulation ---------- */
function netIssue(c){NET.pend.push(c)}
function turnSet(n,side,cmds){let t=NET.turns.get(n);if(!t){t=[null,null];NET.turns.set(n,t)}t[side]=cmds}
function netRunTick(tk){
  if(!NET.on){runLocalCmds();return}
  if(tk%TURN)return;
  const n=tk/TURN,tgt=n+NET.delay,cmds=NET.pend;NET.pend=[];
  const m={t:'turn',n:tgt,c:cmds};if(n%10===0){m.h=[n,simHash()];netHash(n,ME,m.h[1])}
  turnSet(tgt,ME,cmds);netSend(m);
  const T_=NET.turns.get(n);NET.turns.delete(n);
  if(T_)for(const side of [0,1])for(const c of T_[side]||[])applyCmd(side,c);
}
function netCanStep(tk){
  if(!NET.on)return true;if(NET.ended)return false;if(tk%TURN)return true;
  const t=NET.turns.get(tk/TURN),ok=!!(t&&t[0]&&t[1]);
  if(ok){if(NET.waitT){NET.waitT=0;olWait(false)}}
  else{const now=performance.now();if(!NET.waitT)NET.waitT=now;else if(now-NET.waitT>700)olWait(true)}
  return ok;
}
/* how many extra seconds of simulation to run this frame when the opponent's game is ahead of ours */
function netBoost(){if(!NET.on||NET.remoteMax<0)return 0;const behind=(NET.remoteMax-NET.delay)-Math.floor(simTick/TURN);return behind>2?Math.min(.1,(behind-1)*TURN*TICK*.25):0}
function netHash(n,side,v){let h=NET.hashes.get(n);if(!h){h=[null,null];NET.hashes.set(n,h)}h[side]=v;
  if(h[0]!=null&&h[1]!=null){NET.hashes.delete(n);if(h[0]!==h[1])netFail('desync','The two games went out of sync (turn '+n+').')}}

/* ---------- connection ---------- */
function netConnect(code,role){
  netClose();NET.code=code;NET.role=role;NET.peer=false;NET.state='connecting';olRender();
  let ws;try{ws=new WebSocket(olBase()+'/mp/room/'+code+'?role='+role)}catch(e){olError('Could not reach the game server.');return}
  NET.ws=ws;
  ws.onopen=()=>{if(NET.ws!==ws)return;NET.pingT=setInterval(()=>{NET.pingAt=performance.now();netSend('ping')},3000)};
  ws.onmessage=e=>{if(NET.ws!==ws)return;netMsg(String(e.data))};
  ws.onerror=()=>{};
  ws.onclose=()=>{if(NET.ws!==ws)return;clearInterval(NET.pingT);NET.ws=null;
    if(NET.on&&state==='play'&&!NET.ended)netFail('lost','Lost the connection to the game server.');
    else if(NET.state!=='idle'&&NET.state!=='error'&&!NET.leaving){olError(NET.state==='connecting'?'Could not reach the game server.':'Disconnected from the game server.')}};
}
function netClose(){NET.leaving=true;clearInterval(NET.pingT);if(NET.ws){try{NET.ws.close()}catch(e){}}NET.ws=null;NET.leaving=false}
function netMsg(s){
  if(s==='pong'){if(NET.pingAt){NET.rtt=performance.now()-NET.pingAt;olPing()}return}
  let m;try{m=JSON.parse(s)}catch(e){return}
  const other=1-NET.slot;
  switch(m.t){
    case 'turn':turnSet(m.n,other,Array.isArray(m.c)?m.c:[]);if(m.n>NET.remoteMax)NET.remoteMax=m.n;if(m.h)netHash(m.h[0],other,m.h[1]);return;
    case 'hello':NET.slot=m.slot;NET.state='lobby';
      if(m.slot===0){NET.lobby={map:pickMap>=0&&mapPlayers(MAPS[pickMap])>=2?pickMap:0,wx:pickWx,credits:5000,p:[olMe(),null]}}
      else netSend({t:'hi',p:olMe(),v:BUILD_ID});
      olRender();return;
    case 'peer':NET.peer=true;olRender();sfx('ready');return;
    case 'hi':if(NET.slot!==0)return;
      if(m.v!==BUILD_ID){netSend({t:'bye',msg:'Your game is a different version from the host. Reload the page (Ctrl+Shift+R) and join again.'});olHint('A player with a different game version tried to join.');return}
      NET.peer=true;NET.lobby.p[1]=olFix(m.p,1);olPush();sfx('ready');return;
    case 'me':if(NET.slot!==0||!NET.lobby)return;NET.lobby.p[1]=olFix(m.p,1);olPush();return;
    case 'lobby':if(NET.slot!==1)return;NET.lobby=m.l;NET.peer=true;olRender();return;
    case 'echo':netSend({t:'echo2',ts:m.ts});return;
    case 'echo2':NET.rtt2=performance.now()-m.ts;return;
    case 'start':if(NET.slot!==1)return;netBegin(m.cfg);return;
    case 'bye':olError(m.msg||'The host closed the game.');return;
    case 'resign':NET.oppResigned=true;return;
    case 'left':
      if(NET.on&&state==='play'&&!NET.ended)netFail('left',NET.oppResigned?'Your opponent surrendered.':'Your opponent left the match.');
      else if(NET.state==='lobby'){NET.peer=false;if(NET.slot===0&&NET.lobby){NET.lobby.p[1]=null;olRender();olHint('Your opponent left. Waiting for someone to join...')}else olError('The host left the game.')}
      return;
    case 'err':NET.state='error';olError(m.msg);return;
  }
}

/* ---------- match ---------- */
function netStart(){/* host */
  if(NET.slot!==0||!NET.peer||!NET.lobby||!NET.lobby.p[1])return;
  const L=NET.lobby,ms=Math.max(NET.rtt2||NET.rtt||120,NET.rtt||0);
  const cfg={seed:(Date.now()^(vr()*0x7fffffff))>>>0,map:L.map,wx:L.wx,credits:L.credits,facs:[L.p[0].fac,L.p[1].fac],cols:[L.p[0].col,L.p[1].col],
    names:[L.p[0].name,L.p[1].name],corners:[0,1],teams:[0,0],diffs:['normal','normal'],ai:[false,false],
    delay:Math.max(2,Math.min(8,Math.ceil((ms/2+60)/(TURN*TICK*1000))+1)),build:BUILD_ID};
  netSend({t:'start',cfg});netBegin(cfg);
}
function netBegin(cfg){
  ME=NET.slot;NET.on=true;NET.ended=false;NET.oppResigned=false;NET.delay=cfg.delay|0||2;NET.turns=new Map();NET.hashes=new Map();NET.pend=[];NET.remoteMax=-1;NET.waitT=0;NET.state='play';NET.cfg=cfg;
  for(let n=0;n<NET.delay;n++){turnSet(n,0,[]);turnSet(n,1,[])}
  pickMap=cfg.map;pickWx=cfg.wx;curMap=MAPS[pickMap];
  document.body.classList.add('online');
  startGame('normal',cfg);
  msg('Online match: '+cfg.names[0]+' vs '+cfg.names[1]+'. Good luck!','ok');
}
/* the match can't continue (opponent gone, connection lost, games diverged) */
function netFail(kind,text){
  if(NET.ended)return;NET.ended=true;olWait(false);
  if(state!=='play')return;
  state='over';sfx(kind==='left'?'win':'lose');
  $('#ovTitle').textContent=kind==='left'?'Victory':'Match ended';$('#ovTitle').hidden=false;
  $('#ovText').textContent=text+(kind==='left'?' You win.':'');showPanel('end');$('#overlay').hidden=false;
  setTimeout(netClose,500);
}
/* back to offline play (main menu) */
function netReset(){netClose();NET.on=false;NET.ended=false;NET.state='idle';NET.peer=false;NET.lobby=null;NET.turns=new Map();NET.pend=[];ME=0;
  document.body.classList.remove('online');olWait(false)}
/* leaving an online match counts as surrendering */
function netResign(){if(!NET.on||state!=='play')return;netSend({t:'resign'})}
/* a hidden browser tab gets no animation frames: keep the simulation going on a timer so the opponent isn't left waiting */
setInterval(()=>{const now=performance.now();if(!NET.on||state!=='play'||!document.hidden){NET.bgLast=now;return}
  simAcc+=Math.min(1,(now-NET.bgLast)/1000);NET.bgLast=now;let n=0;while(simAcc>=TICK&&simCanStep()&&n<240){simStep();simAcc-=TICK;n++}if(simAcc>TICK*3)simAcc=TICK*3},250);

/* ---------- lobby UI ---------- */
function olMe(){return {name:(LOBBY&&LOBBY.name)||'Commander',fac:pickFac,col:playerCol()}}
function olFix(p,i){p=p||{};const L=NET.lobby,o=L&&L.p[1-i];let col=+p.col;if(!(col>=0&&col<COLORS.length))col=COL_ORDER[i];
  if(o&&o.col===col)col=COL_ORDER.find(c=>c!==o.col);return {name:String(p.name||'Commander').slice(0,16),fac:Math.min(2,Math.max(0,p.fac|0)),col}}
function olPush(){if(NET.slot!==0||!NET.lobby)return;netSend({t:'lobby',l:NET.lobby});olRender()}
/* a change to my own side / colour / name */
function olMeChanged(){if(NET.state!=='lobby')return;if(NET.slot===0){NET.lobby.p[0]=olFix(olMe(),0);olPush()}else{netSend({t:'me',p:olMe()});}}
function olHint(t){const h=$('#olHint');if(h)h.textContent=t||''}
function olError(t){NET.state='error';olRender();olHint(t);sfx('err')}
function olPing(){const e=$('#olPing');if(e)e.textContent=NET.rtt?'Ping '+Math.round(NET.rtt)+' ms':''}
function olWait(on){const w=$('#netWait');if(w)w.hidden=!on}
function olOpen(code){showPanel('online');$('#olLobby').style.cssText=$('#lobby').style.cssText;NET.state='idle';$('#olName').value=LOBBY.name;if(code){$('#olCode').value=code;olJoin()}else olRender()}
function olHost(){netConnect(olNewCode(),'host')}
function olJoin(){const c=$('#olCode').value.toUpperCase().replace(/[^A-Z0-9]/g,'');if(c.length<4){olHint('Enter the code your friend gave you.');return}netConnect(c,'join')}
function olRender(){
  const room=NET.state==='lobby'||NET.state==='connecting';
  $('#olBack').textContent=room?'Leave game':'Main menu';
  $('#olStart').hidden=room;$('#olRoom').hidden=!room;
  $('#olCodeTxt').textContent=NET.code||'-----';
  if(NET.state==='connecting'){olHint(NET.role==='host'?'Creating game...':'Joining game...');$('#olGo').hidden=true;$('#olRows').innerHTML='';return}
  if(NET.state!=='lobby'){$('#olGo').hidden=true;return}
  const L=NET.lobby,host=NET.slot===0;
  $('#olGo').hidden=!host;$('#olGo').disabled=!(NET.peer&&L&&L.p[1]);
  if(!L){olHint('Connected. Waiting for the host...');return}
  olHint(host?(L.p[1]?'Ready when you are: press Start.':'Send the code (or the invite link) to your opponent.'):'Waiting for the host to start...');
  /* map list: the host chooses */
  $('#olMaps').innerHTML=MAPS.map((M,i)=>`<button type="button" class="lbItem${i===L.map?' on':''}" data-v="${i}" ${host?'':'disabled'}><span><i style="background:${M.swatch[0]}"></i>${M.name}${M.size<64?' <em>small</em>':''}</span></button>`).join('');
  $('#olPrev').src=mapPreview(L.map,true);
  $('#olRows').innerHTML=[0,1].map(i=>{const p=L.p[i],mine=i===NET.slot;
    if(!p)return `<div class="lbRow olRow"><div class="cell you">${i?'Waiting for opponent...':''}</div><div class="cell"><span class="na">-</span></div><div class="cell"><span class="na">-</span></div><div class="cell"><span class="na">${i?'Open':''}</span></div></div>`;
    const fac=mine?`<div class="cell sel"><select data-f="fac" aria-label="Your side">${FACTIONS.map((F,k)=>`<option value="${k}"${k===p.fac?' selected':''}>${F.short}</option>`).join('')}</select></div>`:`<div class="cell"><span>${FACTIONS[p.fac].short}</span></div>`;
    const oc=L.p[1-i]?L.p[1-i].col:-1;
    const col=mine?`<div class="cell sel"><select data-f="col" aria-label="Your colour">${COLORS.map((C,k)=>k===oc?'':`<option value="${k}"${k===p.col?' selected':''}>${C.name}</option>`).join('')}</select></div>`:`<div class="cell"><span class="olSw" style="--c:${COLORS[p.col].col}"></span>${COLORS[p.col].name}</div>`;
    return `<div class="lbRow olRow${mine?' me':''}"><div class="cell you"><span class="olSw" style="--c:${COLORS[p.col].col}"></span>${p.name.replace(/[<&]/g,'')}${mine?' <em>(you)</em>':''}</div>${fac}${col}<div class="cell"><span>${i===0?'Host':'Joined'}</span></div></div>`}).join('');
  olPing();
}
{
  /* the Play lobby has two tabs: Skirmish (vs computer) and Online 1v1 */
  for(const b of document.querySelectorAll('.lbMode'))b.addEventListener('click',()=>{const m=b.dataset.m;audioInit();
    if(m==='online'){if($('#pOnline').hidden){sfx('click');olOpen()}}else if($('#pSetup').hidden){sfx('click');netReset();showPanel('setup')}});
  $('#olBack').addEventListener('click',()=>{sfx('click');if(NET.state==='lobby'||NET.state==='connecting'){netReset();olRender();olHint('')}else{netReset();showPanel('home')}});
  $('#olHost').addEventListener('click',()=>{sfx('click');olHost()});
  $('#olJoin').addEventListener('click',()=>{sfx('click');olJoin()});
  $('#olCode').addEventListener('keydown',e=>{if(e.key==='Enter')olJoin()});
  $('#olName').addEventListener('input',e=>{LOBBY.name=e.target.value.slice(0,16)||'Commander';saveLobby();olMeChanged()});
  $('#olCopy').addEventListener('click',()=>{const u=location.origin+location.pathname+'?join='+NET.code;
    try{navigator.clipboard.writeText(u).then(()=>olHint('Invite link copied. Send it to your opponent.'),()=>olHint(u))}catch(e){olHint(u)}sfx('click')});
  $('#olMaps').addEventListener('click',e=>{const b=e.target.closest('.lbItem');if(!b||NET.slot!==0||!NET.lobby)return;NET.lobby.map=+b.dataset.v;pickMap=NET.lobby.map;olPush();sfx('click')});
  $('#olRows').addEventListener('change',e=>{const f=e.target.dataset.f,v=+e.target.value;
    if(f==='fac'){pickFac=v;try{localStorage.setItem('cf-fac',v)}catch(er){}if(typeof glbNeed==='function')glbNeed(v)}
    if(f==='col'){pickCol=v;try{localStorage.setItem('cf-col',v)}catch(er){}}
    sfx('click');olMeChanged();if(state==='menu')menuRefresh()});
  $('#olGo').addEventListener('click',()=>{sfx('click');netStart()});
  /* measure the player-to-player round trip while in the lobby (sets the command delay) */
  setInterval(()=>{if(NET.state==='lobby'&&NET.peer)netSend({t:'echo',ts:performance.now()})},2000);
}
/* invite links: ...?join=CODE opens the online lobby and joins straight away */
{const j=new URLSearchParams(location.search).get('join');if(j){try{history.replaceState(null,'',location.pathname)}catch(e){}setTimeout(()=>olOpen(j.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)),50)}}
