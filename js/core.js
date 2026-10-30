'use strict';
const $=s=>document.querySelector(s);
/* browser game first: touch-specific hints and fullscreen only on phones and tablets */
const TOUCH=matchMedia('(hover:none) and (pointer:coarse)').matches;
/* desktop layout: a mouse and a monitor-sized window (set in resize) */
let DESK=false;const ZMIN=240,zMax=()=>DESK?1350:900,zDef=()=>DESK?760:520;
if(TOUCH)document.body.classList.add('touch');
const T=32;
/* map size is per map (64 or 48 tiles square); set by setMapSize before a world is generated */
let MW=64, MH=64, WW=MW*T, WH=MH*T;
/* original factions: same stats, different look */
const FACTIONS=[
  {key:'vanguard',name:'Vanguard Coalition',short:'Vanguard',col:'#4da3ff',hex:0x4da3ff,em:0x0a2a50,dark:0x22446e,gl:0x9fd4ff,ge:0x3aa0ff,style:0,color:3,tag:'Rounded armor'},
  {key:'syndicate',name:'Iron Syndicate',short:'Syndicate',col:'#ff5b44',hex:0xff5b44,em:0x501208,dark:0x6a1f17,gl:0xff8a6a,ge:0xff2a08,style:1,color:0,tag:'Spiked steel'},
  {key:'helix',name:'Helix Collective',short:'Helix',col:'#3fe0a0',hex:0x3fe0a0,em:0x0a4030,dark:0x145a48,gl:0x9fffd8,ge:0x18e0a0,style:2,color:2,tag:'Sculpted armor'}
];
const MAPS=[
  {key:'valley',short:'Valley',name:'Verdant Valley',tag:'River crossings',ga:[82,90,50],gb:[112,108,66],dirt:[126,106,78],moss:[60,72,40],grav:[104,98,86],floor:[50,56,34],mud:[64,64,52],
   road:'rgba(112,96,70,.85)',edge:'rgba(60,50,35,.5)',blade:[110,125,60],blades:9000,rock:[.40,.36,.31],rockTh:.64,waterTh:.29,forestTh:.70,ruins:5,
   water:0x2c6670,waterOp:.82,ice:false,tree:'broad',tuft:[[.34,.44,.2],[.12,.14,.06]],sky:0x0a0f0d,hemi:[0xcfe0ff,0x3a3a28,.8],sun:[0xfff0d2,.95],fogT:[1,1.02,1.05,.5],
   mm:['#4b4d35','#2a2d2b','#2c5a63','#2b4426','#55544c','#8a7a5c'],swatch:['#5d6b38','#2b4426','#2c6670']},
  {key:'dunes',short:'Dunes',name:'Ash Dunes',tag:'Open desert, mesas',ga:[168,140,96],gb:[190,164,116],dirt:[140,108,74],moss:[152,130,92],grav:[120,104,86],floor:[124,100,72],mud:[96,82,62],
   road:'rgba(88,78,68,.8)',edge:'rgba(60,50,40,.45)',blade:[150,130,80],blades:2600,rock:[.50,.40,.30],rockTh:.62,waterTh:.12,forestTh:.80,ruins:12,
   water:0x3a7f86,waterOp:.85,ice:false,tree:'dead',tuft:[[.55,.47,.3],[.1,.1,.06]],sky:0x14100b,hemi:[0xffe6c4,0x5a4630,.85],sun:[0xffe0b0,1.05],fogT:[1.05,1,.94,.44],
   mm:['#9c8459','#5c4a36','#3a7f86','#6d5a3c','#7d7466','#8a7a5c'],swatch:['#c9a86f','#9c7a4c','#6d5a3c']},
  {key:'frost',short:'Frost',name:'Frostline',tag:'Frozen central lake',ga:[166,175,188],gb:[188,196,208],dirt:[150,156,164],moss:[184,194,206],grav:[118,124,132],floor:[176,184,190],mud:[150,170,186],
   road:'rgba(120,124,130,.8)',edge:'rgba(80,84,90,.45)',blade:[150,156,160],blades:2200,rock:[.42,.45,.5],rockTh:.66,waterTh:.31,forestTh:.64,ruins:5,
   water:0xbfe6f2,waterOp:.93,ice:true,tree:'pine',tuft:[[.76,.79,.82],[.08,.08,.08]],sky:0x0c1116,hemi:[0xdde8f5,0x56626e,.8],sun:[0xf2f6ff,.85],fogT:[.9,.98,1.1,.3],
   mm:['#b8c0c8','#5d646c','#9fd2e2','#3f5a4c','#7a8088','#8a8478'],swatch:['#e6ecf2','#9fd2e2','#3f5a4c']},
  {key:'canyon',short:'Canyon',name:'Iron Pass',tag:'Ridges, chokepoints, high ground',ga:[150,98,66],gb:[174,122,84],dirt:[128,84,58],moss:[118,90,62],grav:[112,86,72],floor:[102,72,52],mud:[90,66,50],
   road:'rgba(82,62,50,.8)',edge:'rgba(50,36,28,.45)',blade:[150,112,72],blades:1600,rock:[.54,.34,.24],ridgeH:16,cliff:[104,60,40],ruins:6,
   water:0x3a6f78,waterOp:.85,ice:false,tree:'dead',tuft:[[.55,.41,.27],[.1,.08,.05]],sky:0x150c08,hemi:[0xffdcc0,0x5a3a28,.85],sun:[0xffd4a8,1.05],fogT:[1.06,.98,.9,.44],
   mm:['#94603f','#4e3426','#3a6f78','#5b4632','#7a6a5e','#8a7a60','#5a3826'],swatch:['#b07a52','#6e4630','#4e3426']},
  {key:'delta',short:'Rivers',name:'Twin Rivers',tag:'Four islands, eight bridges',ga:[72,94,58],gb:[100,118,70],dirt:[112,98,72],moss:[50,74,44],grav:[98,96,86],floor:[42,58,34],mud:[58,62,50],
   road:'rgba(106,94,74,.85)',edge:'rgba(60,50,35,.5)',blade:[92,130,60],blades:9500,rock:[.38,.37,.34],ruins:4,
   water:0x2a5f72,waterOp:.84,ice:false,tree:'broad',tuft:[[.32,.44,.2],[.12,.14,.06]],sky:0x0a0f0d,hemi:[0xd0e4ff,0x34402a,.82],sun:[0xfff2d8,.95],fogT:[.98,1.02,1.06,.5],
   mm:['#47553a','#2a2d2b','#2a5f72','#29422a','#55544c','#9a8a68'],swatch:['#58743f','#2a5f72','#8a7a5c']},
  {key:'bowl',short:'Bowl',name:'Dust Bowl',tag:'Small duel map',size:60,base:48,players:2,storm:'sand',ga:[176,136,92],gb:[198,160,112],dirt:[140,108,74],moss:[152,130,92],grav:[120,104,86],floor:[124,100,72],mud:[96,82,62],
   road:'rgba(88,78,68,.8)',edge:'rgba(60,50,40,.45)',blade:[150,130,80],blades:2600,rock:[.50,.40,.30],rockTh:.62,waterTh:.12,forestTh:.80,ruins:5,
   water:0x3a7f86,waterOp:.85,ice:false,tree:'dead',tuft:[[.55,.47,.3],[.1,.1,.06]],sky:0x14100b,hemi:[0xffe6c4,0x5a4630,.85],sun:[0xffe0b0,1.05],fogT:[1.05,1,.94,.44],
   mm:['#9c8459','#5c4a36','#3a7f86','#6d5a3c','#7d7466','#8a7a5c'],swatch:['#c9a86f','#9c7a4c','#6d5a3c']},
  {key:'cross',short:'Cross',name:'Crossroads',tag:'Small 3-4 player map',size:60,base:48,ga:[82,90,50],gb:[112,108,66],dirt:[126,106,78],moss:[60,72,40],grav:[104,98,86],floor:[50,56,34],mud:[64,64,52],
   road:'rgba(112,96,70,.85)',edge:'rgba(60,50,35,.5)',blade:[110,125,60],blades:5200,rock:[.40,.36,.31],rockTh:.64,waterTh:.29,forestTh:.70,ruins:3,
   water:0x2c6670,waterOp:.82,ice:false,tree:'broad',tuft:[[.34,.44,.2],[.12,.14,.06]],sky:0x0a0f0d,hemi:[0xcfe0ff,0x3a3a28,.8],sun:[0xfff0d2,.95],fogT:[1,1.02,1.05,.5],
   mm:['#4b4d35','#2a2d2b','#2c5a63','#2b4426','#55544c','#8a7a5c'],swatch:['#5d6b38','#2b4426','#2c6670']}
];
const WEATHER=[['clear','Clear'],['night','Night'],['storm','Storm']];
/* player colours are separate from faction style, so 4 players never clash */
const COLORS=[
  {key:'red',name:'Red',col:'#ff4a36',hex:0xff4a36,em:0x501208,dark:0xc0281a,gl:0xff8a6a,ge:0xff2a08},
  {key:'yellow',name:'Yellow',col:'#ffd23a',hex:0xffd23a,em:0x4a3a06,dark:0xd2a210,gl:0xfff09a,ge:0xffd010},
  {key:'green',name:'Green',col:'#2fe08a',hex:0x2fe08a,em:0x0a4030,dark:0x14a868,gl:0x9fffcf,ge:0x10e080},
  {key:'blue',name:'Blue',col:'#3d8bff',hex:0x3d8bff,em:0x0a2a60,dark:0x1f5fd0,gl:0x9fd0ff,ge:0x2a8aff},
  {key:'purple',name:'Purple',col:'#a866ff',hex:0xa866ff,em:0x2a0a50,dark:0x6a2ad0,gl:0xd6b0ff,ge:0x9a40ff},
  {key:'pink',name:'Pink',col:'#ff5fb8',hex:0xff5fb8,em:0x501030,dark:0xd02a88,gl:0xffb0dc,ge:0xff3aa8},
  {key:'orange',name:'Orange',col:'#ff8a1e',hex:0xff8a1e,em:0x4a2006,dark:0xd86a10,gl:0xffc08a,ge:0xff7a10},
  {key:'black',name:'Black',col:'#4b5058',ui:0x9aa4ae,hex:0x2a2d32,em:0x000000,dark:0x17191c,gl:0xb8c2cc,ge:0x7c8894},
  {key:'white',name:'White',col:'#eef1f4',hex:0xeef1f4,em:0x2c2f33,dark:0xc4c9d0,gl:0xffffff,ge:0xdde6ef}];
/* AI players take the most contrasting colours left after the player's pick */
const COL_ORDER=[3,0,2,1,4,6,5,8,7];
let pickCol=-1;try{const c=localStorage.getItem('cf-col');if(c!==null&&c!=='')pickCol=Math.min(COLORS.length-1,Math.max(-1,+c|0))}catch(e){}
/* alliances: sides on the same team (1-4) are allies; team 0 means everyone for themselves */
const teamOf=i=>(typeof sides!=='undefined'&&sides&&sides[i]&&sides[i].team)||100+i;
const enemy=(a,b)=>a>=0&&b>=0&&a!==b&&teamOf(a)!==teamOf(b),ally=(a,b)=>a===b||(a>=0&&b>=0&&teamOf(a)===teamOf(b));
const playerCol=()=>pickCol>=0?pickCol:FACTIONS[pickFac].color;
let pickWx='clear',pickFac=0,pickMap=0,pickPlayers=2,pickDiff='normal',pickMode='skirmish',SANDBOX=false,curMap=MAPS[0];
try{pickPlayers=(+localStorage.getItem('cf-pl'))||2;pickDiff=localStorage.getItem('cf-df')||'normal';pickMode=localStorage.getItem('cf-mode')==='sandbox'?'sandbox':'skirmish'}catch(e){}
pickPlayers=Math.min(4,Math.max(2,pickPlayers|0));if(!['easy','normal','hard'].includes(pickDiff))pickDiff='normal';
try{pickFac=(+localStorage.getItem('cf-fac'))||0;pickMap=(+localStorage.getItem('cf-map'))||0;pickWx=localStorage.getItem('cf-wx')||'clear'}catch(e){}
if(!WEATHER.some(w=>w[0]===pickWx))pickWx='clear';
pickFac=Math.min(2,Math.max(0,pickFac|0));pickMap=Math.min(MAPS.length-1,Math.max(0,pickMap|0));
const facOf=side=>(typeof sides!=='undefined'&&sides&&sides[side])?sides[side].fac:side;
const TCOL=side=>side<0?'#a7aaa2':(typeof sides!=='undefined'&&sides&&sides[side])?COLORS[sides[side].col].col:COLORS[COL_ORDER[side%COL_ORDER.length]].col;
const skinOf=side=>(typeof sides!=='undefined'&&sides&&sides[side])?sides[side].fac*16+sides[side].col:(side<0?-16:side*16+COL_ORDER[side%COL_ORDER.length]);
/* base corners: [flipX, flipY]; bottom-left is always the human player */
const CORNERS=[[0,0],[1,1],[0,1],[1,0]],basesFor=n=>[[8,n-11],[n-9,10],[8,10],[n-9,n-11]];let BASES=basesFor(64);
const mapSize=M=>M.size||80,mapPlayers=M=>M.players||4,mapCorners=M=>mapPlayers(M)===2?[0,1]:[0,1,2,3];
function setMapSize(n){if(n===MW)return;MW=MH=n;WW=WH=n*T;BASES=basesFor(n);if(typeof visResize==='function')visResize()}
const cornerXY=(c,x,y)=>[CORNERS[c][0]?MW-1-x:x,CORNERS[c][1]?MH-1-y:y];
const cornerBox=(c,tx,ty,w,h)=>[CORNERS[c][0]?MW-tx-w:tx,CORNERS[c][1]?MH-ty-h:ty];
const DX=[1,-1,0,0,1,1,-1,-1], DY=[0,0,1,-1,1,-1,1,-1];

/* ---------- data ---------- */
const BDEF={
  yard:{name:'Command Yard',w:3,h:3,hp:1600,vis:8,power:0},
  power:{name:'Power Plant',w:2,h:2,hp:600,cost:300,time:8,power:100,vis:5,req:['yard']},
  refinery:{name:'Refinery',w:3,h:2,hp:900,cost:600,time:14,power:-30,vis:6,req:['power']},
  barracks:{name:'Barracks',w:2,h:2,hp:700,cost:400,time:10,power:-20,vis:6,req:['power']},
  factory:{name:'War Factory',w:3,h:3,hp:1100,cost:900,time:16,power:-30,vis:6,req:['refinery']},
  turret:{name:'Cannon Turret',w:1,h:1,hp:520,cost:350,time:9,power:-15,vis:9,req:['barracks'],range:7.5,dmg:30,rof:1.1,wt:'tcannon',psp:520},
  guard:{name:'Guard Tower',w:1,h:1,hp:420,cost:250,time:7,power:-10,vis:8,req:['barracks'],range:6.5,dmg:10,rof:.45,wt:'bullet',psp:900},
  tech:{name:'Tech Center',w:2,h:2,hp:800,cost:1200,time:18,power:-40,vis:6,req:['factory'],max:1},
  repair:{name:'Repair Bay',w:2,h:2,hp:700,cost:600,time:12,power:-20,vis:6,req:['factory'],max:1},
  shield:{name:'Shield Generator',w:2,h:2,hp:900,cost:900,time:14,power:-40,vis:7,req:['tech'],fac:0},
  spike:{name:'Crystal Spike',w:2,h:2,hp:3000,vis:5,power:0,cap:true},
  radar:{name:'Radar Tower',w:2,h:2,hp:3000,vis:16,power:0,cap:true},
  missile:{name:'Missile Tower',w:1,h:1,hp:500,cost:600,time:12,power:-25,vis:9,req:['tech'],range:8.5,dmg:40,rof:2,wt:'rocket',psp:360},
  airfield:{name:'Airfield',w:3,h:3,hp:1000,cost:1000,time:16,power:-40,vis:7,req:['factory']}
};
/* roles: gunmen beat infantry; rockets beat vehicles and buildings but barely scratch infantry;
   heavy units are slow and hit hard, light units are fast, cheap and fragile */
const UDEF={
  rifle:{name:'Rifleman',cost:100,time:5,hp:100,speed:64,range:5,dmg:10,rof:.7,wt:'bullet',psp:900,vis:6,armor:'inf',r:6,turn:9},
  rocket:{name:'Rocketeer',cost:250,time:8,hp:90,speed:54,range:6.5,dmg:30,rof:2,wt:'rocket',psp:330,vis:6,armor:'inf',r:6,turn:9},
  gren:{name:'Grenadier',cost:300,time:8,hp:150,speed:44,range:5.5,dmg:38,rof:1.8,wt:'grenade',psp:300,vis:6,armor:'inf',r:6,turn:8},
  sniper:{name:'Marksman',cost:400,time:10,hp:70,speed:56,range:10,dmg:70,rof:2.8,wt:'snipe',psp:1400,vis:10,armor:'inf',r:6,turn:9,req:['tech']},
  eng:{name:'Engineer',cost:500,time:10,hp:80,speed:60,range:0,dmg:0,rof:1,wt:'bullet',psp:900,vis:6,armor:'inf',r:6,turn:9,eng:true},
  rift:{name:'Rift Walker',cost:700,time:12,hp:150,speed:62,range:5,dmg:12,rof:.8,wt:'bullet',psp:900,vis:7,armor:'inf',r:6,turn:9,fac:2},
  tank:{name:'Light Tank',cost:600,time:11,hp:340,speed:92,range:6,dmg:32,rof:1.3,wt:'cannon',psp:560,vis:7,armor:'veh',r:10,turn:6},
  htank:{name:'Heavy Tank',cost:1500,time:20,hp:650,speed:40,range:7,dmg:84,rof:2.1,wt:'cannon',psp:520,vis:7,armor:'veh',r:13,turn:3,req:['tech']},
  stank:{name:'Phantom Stealth Tank',cost:1000,time:14,hp:300,speed:90,range:6,dmg:36,rof:1.4,wt:'cannon',psp:520,vis:7,armor:'veh',r:10,turn:6,stealth:true,fac:1},
  mlrs:{name:'Missile Carrier',cost:900,time:14,hp:220,speed:70,range:9,dmg:60,rof:3,wt:'rocket',psp:330,vis:8,armor:'veh',r:10,turn:5},
  buggy:{name:'Raider Buggy',cost:400,time:7,hp:180,speed:128,range:5.5,dmg:8,rof:.35,wt:'bullet',psp:900,vis:8,armor:'veh',r:9,turn:7},
  arty:{name:'Siege Artillery',cost:1000,time:16,hp:240,speed:42,range:11,dmg:80,rof:3.6,wt:'shell',psp:380,vis:7,armor:'veh',r:11,turn:3,req:['tech']},
  harv:{name:'Harvester',cost:600,time:12,hp:320,speed:52,vis:5,armor:'veh',r:10,turn:5,cap:600},
  /* aircraft fly over everything. Only rocket weapons (rocket infantry, missile carriers, missile towers) can hit them
     while they are in the air; on the pad they can be hit like a vehicle */
  gunship:{name:'Gunship',cost:1100,time:16,hp:300,speed:118,range:5.5,dmg:13,rof:.36,wt:'chain',psp:1100,vis:8,armor:'air',r:14,turn:3.2,air:true,alt:62},
  bomber:{name:'Bomber',cost:1400,time:20,hp:260,speed:205,range:1,dmg:160,rof:1,wt:'bomb',psp:0,vis:8,armor:'air',r:16,turn:1.9,air:true,alt:92,ammo:2,rearm:9}
};
/* damage multipliers: weapon vs armor */
const MUL={snipe:{inf:2,veh:.1,bld:.08,air:0},shell:{inf:.9,veh:.6,bld:1.6,air:0},bullet:{inf:1.4,veh:.12,bld:.1,air:0},rocket:{inf:.22,veh:1.6,bld:1.3,air:1.25},grenade:{inf:1.25,veh:.35,bld:1.2,air:0},cannon:{inf:.3,veh:1.15,bld:1.5,air:0},tcannon:{inf:.8,veh:1,bld:0,air:0},
  chain:{inf:1.35,veh:.6,bld:.35,air:0},bomb:{inf:.7,veh:1.15,bld:1.5,air:0}};
/* aircraft: flying = off the ground (a parked aircraft counts as a vehicle); only weapons with an air multiplier hit fliers */
const isAirT=t=>!!(UDEF[t]&&UDEF[t].air);
const flying=e=>e.k==='u'&&(e.alt||0)>8;
const armorOf=e=>e.k==='b'?'bld':flying(e)?'air':UDEF[e.type].armor==='air'?'veh':UDEF[e.type].armor;
const wpnOf=e=>(e.k==='b'?BDEF[e.type]:UDEF[e.type]).wt;
function canHit(a,t){const w=wpnOf(a);if(!w||!MUL[w])return false;return flying(t)?MUL[w].air>0:true}
const CAT={power:'b',refinery:'b',barracks:'b',factory:'b',turret:'d',guard:'d',tech:'b',repair:'b',missile:'d',rifle:'i',rocket:'i',sniper:'i',eng:'i',rift:'i',stank:'v',airfield:'b',gunship:'a',bomber:'a',shield:'d',tank:'v',gren:'i',htank:'v',mlrs:'v',harv:'v',buggy:'v',arty:'v'};
const LISTS={b:['power','refinery','barracks','factory','airfield','tech'],d:['turret','guard','missile','shield'],i:['rifle','rocket','gren','sniper','eng','rift'],v:['tank','htank','mlrs','buggy','arty','stank','harv'],a:['gunship','bomber']};
const TITLES={b:'Structures',d:'Defenses',i:'Infantry',v:'Vehicles',a:'Aircraft'};
const def=t=>BDEF[t]||UDEF[t];
const UNAMES=[
  {gren:'Breacher',htank:'Citadel Heavy Tank',mlrs:'Javelin Carrier',shield:'Aegis Shield Generator',rifle:'Trooper',rocket:'Lancer',eng:'Field Engineer',sniper:'Ranger',tank:'Bulwark Tank',buggy:'Pathfinder Rover',arty:'Longbow Artillery',harv:'Crystal Hauler',gunship:'Kestrel Gunship',bomber:'Albatross Bomber',airfield:'Airbase'},
  {gren:'Bombardier',htank:'Juggernaut Heavy Tank',mlrs:'Hellstorm Launcher',stank:'Phantom Stealth Tank',rifle:'Conscript',rocket:'Breaker',eng:'Saboteur',sniper:'Deadeye',tank:'Ironclad Tank',buggy:'Marauder Buggy',arty:'Hellfire Howitzer',harv:'Reaper Harvester',gunship:'Vulture Gunship',bomber:'Warhammer Bomber',airfield:'Airstrip'},
  {gren:'Arc Grenadier',htank:'Monolith Heavy Tank',mlrs:'Lance Battery',rift:'Rift Walker',rifle:'Warden',rocket:'Striker',eng:'Technician',sniper:'Spectre',tank:'Viper Tank',buggy:'Hornet Buggy',arty:'Prism Artillery',harv:'Gleaner',gunship:'Dragonfly Gunship',bomber:'Manta Bomber',airfield:'Skyport'}];
const nm=(t,side)=>{const fc=(typeof sides!=='undefined'&&sides&&sides[side||0])?sides[side||0].fac:pickFac;return (UNAMES[fc]&&UNAMES[fc][t])||def(t).name};
const RD=c=>c==='d'?'readyD':'ready',isStruct=c=>c==='b'||c==='d',isUnitCat=c=>c==='i'||c==='v'||c==='a';
/* the building that trains each unit category */
const PRODB={i:'barracks',v:'factory',a:'airfield'};
/* crystal tiles start regrowing after CRY_WAIT seconds untouched and take CRY_REGROW seconds to refill */
const CRY_WAIT=25,CRY_REGROW=240;
/* crystal per field tile is multiplied by CRY_RICH: harvesting speed and income stay the same, fields last longer */
const CRY_RICH=2.5;
const PLACE_R=6,SPIKE_INC=14,SHIELD_R=7*T,RIFT_R=13*T,RIFT_CD=40;
const DIFF={easy:{wave:8,speed:.7,inc:.8,first:140},normal:{wave:6,speed:1,inc:1,first:100},hard:{wave:5,speed:1.25,inc:1.2,first:75}};

/* ---------- state ---------- */
let rng,ter,cry,occ,vis,terrain,mmTerrain,groundMask;
let alerts=[],units,blds,projs,fxs,sides,sel,groups,nid,time,paused,state='menu',lastAlert=-99,alertPos=null,diffKey='normal';
let cam={x:0,y:0},W=800,H=600,dpr=1,mode=null,place=null,drag=null,mouse={x:0,y:0,in:false};
let PLAZAS=[],ai,fogT=0,winT=0,fogC,fogX,fogImg,cryMem=null,cryMax=null,cryIdle=null,regT=0;
const memB=new Map(),memG=new Map();
const keys={};

/* rng() is the GAME random stream: only the simulation may use it (both players' games must draw the same numbers in the same order).
   Anything cosmetic (effects, scenery, menus) uses vr(). SIMIN>0 while simulation code runs; RNG_GUARD (tests) reports any other use. */
let SIMIN=0,RNG_GUARD=null;
/* ME: which side this browser plays (0 offline; 0 or 1 online). Only presentation and input may depend on it, never game rules. */
let ME=0;
const vr=()=>Math.random();
/* the simulation advances in fixed steps of TICK seconds, independent of the screen's frame rate */
const TICK=1/60;
function seed(s){let a=s>>>0;rng=()=>{if(RNG_GUARD&&!SIMIN)RNG_GUARD(new Error().stack);a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const ti=(x,y)=>(Math.max(0,Math.min(MH-1,(y/T)|0)))*MW+Math.max(0,Math.min(MW-1,(x/T)|0));
const tc=i=>({x:(i%MW+.5)*T,y:(((i/MW)|0)+.5)*T});
const angd=(a,b)=>{let d=(b-a)%(Math.PI*2);if(d>Math.PI)d-=Math.PI*2;if(d<-Math.PI)d+=Math.PI*2;return d};
const turn=(a,b,m)=>{const d=angd(a,b);return Math.abs(d)<=m?b:a+Math.sign(d)*m};
