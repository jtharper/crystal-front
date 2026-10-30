'use strict';
/* ---------- Blender-made models (see /blender): loaded as glTF, every part re-dressed in the game's own materials by name,
   with ambient occlusion baked in Blender on the second UV set. Until a model has loaded, the code-built version is used. ---------- */
const GLB={src:{gunship:'models/gunship.json',bomber:'models/bomber.json',airfield:'models/airfield.json',tank_v:'models/tank_v.json',power:'models/power.json',refinery:'models/refinery.json',tech_v:'models/tech_v.json',
    p_fuel_depot:'models/p_fuel_depot.json',p_pillbox:'models/p_pillbox.json',p_pole:'models/p_pole.json',p_ruin_house:'models/p_ruin_house.json',p_traps:'models/p_traps.json',p_water_tower:'models/p_water_tower.json',p_wreck_tank:'models/p_wreck_tank.json',p_wreck_truck:'models/p_wreck_truck.json',inf_eng_h:'models/inf_eng_h.json',inf_eng_s:'models/inf_eng_s.json',inf_eng_v:'models/inf_eng_v.json',inf_gren_h:'models/inf_gren_h.json',inf_gren_s:'models/inf_gren_s.json',inf_gren_v:'models/inf_gren_v.json',inf_rifle_h:'models/inf_rifle_h.json',inf_rifle_s:'models/inf_rifle_s.json',inf_rifle_v:'models/inf_rifle_v.json',inf_rift_h:'models/inf_rift_h.json',inf_rocket_h:'models/inf_rocket_h.json',inf_rocket_s:'models/inf_rocket_s.json',inf_rocket_v:'models/inf_rocket_v.json',inf_sniper_h:'models/inf_sniper_h.json',inf_sniper_s:'models/inf_sniper_s.json',inf_sniper_v:'models/inf_sniper_v.json',
    
    htank_v:'models/htank_v.json',mlrs_v:'models/mlrs_v.json',buggy_v:'models/buggy_v.json',arty_v:'models/arty_v.json',harv_v:'models/harv_v.json',tank_s:'models/tank_s.json',tank_h:'models/tank_h.json',
    htank_s:'models/htank_s.json',mlrs_s:'models/mlrs_s.json',buggy_s:'models/buggy_s.json',arty_s:'models/arty_s.json',harv_s:'models/harv_s.json',stank_s:'models/stank_s.json',htank_h:'models/htank_h.json',mlrs_h:'models/mlrs_h.json',buggy_h:'models/buggy_h.json',arty_h:'models/arty_h.json',harv_h:'models/harv_h.json'},
  ao:{gunship_body:'models/gunship_body_ao.jpg',gunship_rotorL:'models/gunship_rotorL_ao.jpg',gunship_rotorR:'models/gunship_rotorR_ao.jpg',bomber_body:'models/bomber_body_ao.jpg',bomber_bombs:'models/bomber_bombs_ao.jpg',bomber_gear:'models/bomber_gear_ao.jpg',airfield_body:'models/airfield_body_ao.jpg',airfield_dish:'models/airfield_dish_ao.jpg',tank_v_body:'models/tank_v_body_ao.jpg',tank_v_turret:'models/tank_v_turret_ao.jpg',power_body:'models/power_body_ao.jpg',refinery_body:'models/refinery_body_ao.jpg',tech_v_body:'models/tech_v_body_ao.jpg',
    p_fuel_depot_body:'models/p_fuel_depot_body_ao.jpg',p_pillbox_body:'models/p_pillbox_body_ao.jpg',p_pole_body:'models/p_pole_body_ao.jpg',p_ruin_house_body:'models/p_ruin_house_body_ao.jpg',p_traps_body:'models/p_traps_body_ao.jpg',p_water_tower_body:'models/p_water_tower_body_ao.jpg',p_wreck_tank_body:'models/p_wreck_tank_body_ao.jpg',p_wreck_truck_body:'models/p_wreck_truck_body_ao.jpg',
    tech_v_spin:'models/tech_v_spin_ao.jpg',tech_v_dish:'models/tech_v_dish_ao.jpg',
    htank_v_body:'models/htank_v_body_ao.jpg',htank_v_turret:'models/htank_v_turret_ao.jpg',mlrs_v_body:'models/mlrs_v_body_ao.jpg',mlrs_v_turret:'models/mlrs_v_turret_ao.jpg',buggy_v_body:'models/buggy_v_body_ao.jpg',buggy_v_turret:'models/buggy_v_turret_ao.jpg',arty_v_body:'models/arty_v_body_ao.jpg',arty_v_turret:'models/arty_v_turret_ao.jpg',harv_v_body:'models/harv_v_body_ao.jpg',
    tank_s_body:'models/tank_s_body_ao.jpg',tank_s_turret:'models/tank_s_turret_ao.jpg',tank_h_body:'models/tank_h_body_ao.jpg',tank_h_turret:'models/tank_h_turret_ao.jpg',
    htank_s_body:'models/htank_s_body_ao.jpg',htank_s_turret:'models/htank_s_turret_ao.jpg',mlrs_s_body:'models/mlrs_s_body_ao.jpg',mlrs_s_turret:'models/mlrs_s_turret_ao.jpg',buggy_s_body:'models/buggy_s_body_ao.jpg',buggy_s_turret:'models/buggy_s_turret_ao.jpg',arty_s_body:'models/arty_s_body_ao.jpg',arty_s_turret:'models/arty_s_turret_ao.jpg',harv_s_body:'models/harv_s_body_ao.jpg',stank_s_body:'models/stank_s_body_ao.jpg',stank_s_turret:'models/stank_s_turret_ao.jpg',htank_h_body:'models/htank_h_body_ao.jpg',htank_h_turret:'models/htank_h_turret_ao.jpg',mlrs_h_body:'models/mlrs_h_body_ao.jpg',mlrs_h_turret:'models/mlrs_h_turret_ao.jpg',buggy_h_body:'models/buggy_h_body_ao.jpg',buggy_h_turret:'models/buggy_h_turret_ao.jpg',arty_h_body:'models/arty_h_body_ao.jpg',arty_h_turret:'models/arty_h_turret_ao.jpg',harv_h_body:'models/harv_h_body_ao.jpg'},
  /* which cached templates/thumbnails to rebuild once a model arrives */
  uses:{gunship:['u:gunship:'],bomber:['u:bomber:'],airfield:['b:airfield:'],tank_v:['u:tank:'],power:['b:power:'],refinery:['b:refinery:'],tech_v:['b:tech:'],inf_eng_h:['u:eng:'],inf_eng_s:['u:eng:'],inf_eng_v:['u:eng:'],inf_gren_h:['u:gren:'],inf_gren_s:['u:gren:'],inf_gren_v:['u:gren:'],inf_rifle_h:['u:rifle:'],inf_rifle_s:['u:rifle:'],inf_rifle_v:['u:rifle:'],inf_rift_h:['u:rift:'],inf_rocket_h:['u:rocket:'],inf_rocket_s:['u:rocket:'],inf_rocket_v:['u:rocket:'],inf_sniper_h:['u:sniper:'],inf_sniper_s:['u:sniper:'],inf_sniper_v:['u:sniper:'],htank_v:['u:htank:'],mlrs_v:['u:mlrs:'],buggy_v:['u:buggy:'],arty_v:['u:arty:'],harv_v:['u:harv:'],tank_s:['u:tank:'],tank_h:['u:tank:'],htank_s:['u:htank:'],mlrs_s:['u:mlrs:'],buggy_s:['u:buggy:'],arty_s:['u:arty:'],harv_s:['u:harv:'],stank_s:['u:stank:'],htank_h:['u:htank:'],mlrs_h:['u:mlrs:'],buggy_h:['u:buggy:'],arty_h:['u:arty:'],harv_h:['u:harv:']},scene:{},aoT:{},mats:{},parts:{},ug:{},failed:{},pending:0};
/* AO darkens bounced light fully and direct sunlight partly, like a Blender render */
function aoCompile(sh){cfCompile(sh);sh.fragmentShader=sh.fragmentShader.replace('#include <aomap_fragment>',
  '#include <aomap_fragment>\n#ifdef USE_AOMAP\n reflectedLight.directDiffuse*=mix(1.,ambientOcclusion,.72);reflectedLight.directSpecular*=ambientOcclusion;\n#endif')}
function glbMat(name,f,ao){
  const s=f&15,st=f>>4,key=name+'|'+f+'|'+(ao?ao.uuid:'');if(GLB.mats[key])return GLB.mats[key];
  const W=st===2?MT.ceram:st===1?MT.gun:MT.plate2,TW=st===1?MT.brickD:st===2?MT.ceram:MT.concrete;
  const base={TEAM:TD[s],TEAMLT:TM[s],GLOW:TG[s],WALL:W,TOWER:TW,rubber:MT.char}[name]||MT[name]||MT.gun;
  if(name==='GLOW'||name==='lamp'||name==='win'||!ao)return GLB.mats[key]=base;
  const m=base.clone();m.aoMap=ao;m.aoMapIntensity=1;m.onBeforeCompile=aoCompile;m.customProgramCacheKey=()=>'cfao';
  return GLB.mats[key]=m;
}
/* ---------- merged "uber" meshes: every part of a model (body, turret, legs...) becomes ONE mesh with one material.
   Per-vertex attributes carry what used to be separate materials: base colour, roughness, metalness, which surface texture
   (panel / concrete / ceramic / brick), glow, and flags for team colour / team glow / faction wall finish. This cuts a
   unit from ~15-20 draw calls (twice that with shadows) to 2-4. Hazard stripes, windows and glass keep their own materials. */
const UB_FLAG={TEAM:1,TEAMLT:2,GLOW:3,WALL:4,TOWER:5},UB_SEP={haz:1,win:1,gwire:1,gdome:1},UB_PULSE={value:1};
const ubTex=m=>{const t=m&&m.map;return !t?0:t===TEX.panel?1:t===TEX.concrete?2:t===TEX.ceram?3:t===TEX.brick?4:0};
function ubGeo(list){
  let nv=0,ni=0;const ps=list.map(({g,name,src,flag})=>{const n=g.attributes.position.count,ic=g.index?g.index.count:n;nv+=n;ni+=ic;return {g,name,src,flag,n,ic}});
  const P=new Float32Array(nv*3),N=new Float32Array(nv*3),U=new Float32Array(nv*2),U2=new Float32Array(nv*2),C=new Float32Array(nv*3),Mt=new Float32Array(nv*4),E=new Float32Array(nv*3),I=new Uint32Array(ni);
  let vo=0,io=0,hasU2=false;
  for(const c of ps){const a=c.g.attributes;
    for(let i=0;i<c.n;i++){const j=vo+i;P[j*3]=a.position.getX(i);P[j*3+1]=a.position.getY(i);P[j*3+2]=a.position.getZ(i);
      if(a.normal){N[j*3]=a.normal.getX(i);N[j*3+1]=a.normal.getY(i);N[j*3+2]=a.normal.getZ(i)}
      if(a.uv){U[j*2]=a.uv.getX(i);U[j*2+1]=a.uv.getY(i)}if(a.uv2){U2[j*2]=a.uv2.getX(i);U2[j*2+1]=a.uv2.getY(i)}}
    if(a.uv2)hasU2=true;
    const fl=c.flag!=null?c.flag:(UB_FLAG[c.name]||0),src=c.src&&!fl?c.src:fl?null:(MT[c.name==='rubber'?'char':c.name]||MT.gun);
    const col=src?src.color:{r:1,g:1,b:1},rr=src?src.roughness:.5,mm=src?src.metalness:0,ti=src?ubTex(src):0;
    const em=src&&src.emissive?src.emissive.clone().multiplyScalar(src.emissiveIntensity||0):{r:0,g:0,b:0};
    for(let i=0;i<c.n;i++){const j=vo+i;C[j*3]=col.r;C[j*3+1]=col.g;C[j*3+2]=col.b;Mt[j*4]=rr;Mt[j*4+1]=mm;Mt[j*4+2]=fl;Mt[j*4+3]=ti;E[j*3]=em.r;E[j*3+1]=em.g;E[j*3+2]=em.b}
    if(c.g.index){const ix=c.g.index;for(let i=0;i<c.ic;i++)I[io+i]=ix.getX(i)+vo}else for(let i=0;i<c.n;i++)I[io+i]=vo+i;
    vo+=c.n;io+=c.ic;c.g.dispose()}
  const out=new THREE.BufferGeometry(),A=(n,a,k)=>out.setAttribute(n,new THREE.BufferAttribute(a,k));
  A('position',P,3);A('normal',N,3);A('uv',U,2);if(hasU2)A('uv2',U2,2);A('color',C,3);A('mat',Mt,4);A('emi',E,3);
  out.setIndex(new THREE.BufferAttribute(I,1));out.computeBoundingSphere();out.computeBoundingBox();return out;
}
const UB_V=`
vColor = vec3(1.0);
#ifdef USE_COLOR
 vColor *= color;
#endif
vMat = mat; vEmi = emi;
int ubF = int(mat.z + 0.5);
if (ubF > 0) { vColor = uFC[ubF]; vMat.xy = uFR[ubF]; vMat.w = uFT[ubF]; vEmi = uFE[ubF] * (ubF == 3 ? uPulse : 1.0); }
#ifdef USE_INSTANCING_COLOR
 vColor.xyz *= instanceColor.xyz;
#endif`;
const UB_MAP=`
vec4 ubW = vec4(step(abs(vMat.w-1.),.5), step(abs(vMat.w-2.),.5), step(abs(vMat.w-3.),.5), step(abs(vMat.w-4.),.5));
{ vec4 tx = texture2D(map,vUv)*ubW.x + texture2D(tConc,vUv)*ubW.y + texture2D(tCer,vUv)*ubW.z + texture2D(tBrk,vUv)*ubW.w + vec4(1.-dot(ubW,vec4(1.)));
  diffuseColor *= mapTexelToLinear(tx); }`;
const UB_NRM=`
{ vec2 nP=texture2D(normalMap,vUv).xy*2.-1., nC=texture2D(nConc,vUv).xy*2.-1., nE=texture2D(nCer,vUv).xy*2.-1., nB=texture2D(nBrk,vUv).xy*2.-1.;
  vec3 mapN = vec3(nP*.55*ubW.x + nC*.45*ubW.y + nE*.4*ubW.z + nB*.6*ubW.w, 1.);
  normal = perturbNormal2Arb( -vViewPosition, normal, normalize(mapN), faceDirection ); }`;
function uberMat(f,ao){
  const key='U|'+f+'|'+(ao?ao.uuid:'');if(GLB.mats[key])return GLB.mats[key];
  const s=f&15,st=f>>4,W=st===2?MT.ceram:st===1?MT.gun:MT.plate2,TW=st===1?MT.brickD:st===2?MT.ceram:MT.concrete;
  const src=[null,TD[s]||MT.gun,TM[s]||MT.gun,TG[s]||MT.lamp,W,TW];
  const U={uFC:{value:src.map(x=>x?x.color.clone():new THREE.Color(1,1,1))},uFR:{value:src.map(x=>new THREE.Vector2(x?x.roughness:.5,x?x.metalness:0))},
    uFE:{value:src.map((x,i)=>x&&x.emissive?x.emissive.clone().multiplyScalar(i===3?1:(x.emissiveIntensity||0)):new THREE.Color(0,0,0))},uPulse:UB_PULSE,uFT:{value:src.map(x=>x?ubTex(x):0)},
    tConc:{value:TEX.concrete},tCer:{value:TEX.ceram},tBrk:{value:TEX.brick},nConc:{value:TEX.concreteN},nCer:{value:TEX.ceramN},nBrk:{value:TEX.brickN}};
  const m=new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,map:TEX.panel,normalMap:TEX.panelN,aoMap:ao||null,aoMapIntensity:1,roughness:.5,metalness:0});
  m.onBeforeCompile=sh=>{(ao?aoCompile:cfCompile)(sh);Object.assign(sh.uniforms,U);
    sh.vertexShader='attribute vec4 mat;\nattribute vec3 emi;\nvarying vec4 vMat;\nvarying vec3 vEmi;\nuniform vec3 uFC[6];\nuniform vec2 uFR[6];\nuniform vec3 uFE[6];\nuniform float uFT[6];\nuniform float uPulse;\n'+
      sh.vertexShader.replace('#include <color_vertex>',UB_V);
    sh.fragmentShader='varying vec4 vMat;\nvarying vec3 vEmi;\nuniform sampler2D tConc;\nuniform sampler2D tCer;\nuniform sampler2D tBrk;\nuniform sampler2D nConc;\nuniform sampler2D nCer;\nuniform sampler2D nBrk;\n'+
      sh.fragmentShader.replace('#include <map_fragment>',UB_MAP).replace('#include <roughnessmap_fragment>','float roughnessFactor = vMat.x;')
        .replace('#include <metalnessmap_fragment>','float metalnessFactor = vMat.y;').replace('#include <normal_fragment_maps>',UB_NRM)
        .replace('#include <emissivemap_fragment>','totalEmissiveRadiance = vEmi;')};
  m.customProgramCacheKey=()=>'uber'+(ao?1:0);
  /* keep the shader hooks when the game clones materials (stealth fade, build ghost) */
  const ob=m.onBeforeCompile,ck=m.customProgramCacheKey;m.clone=function(){const c=THREE.MeshStandardMaterial.prototype.clone.call(this);c.onBeforeCompile=ob;c.customProgramCacheKey=ck;c.clone=this.clone;return c};
  return GLB.mats[key]=m;
}
/* code-built models (buildings without a Blender model yet): merge each group's plain-material meshes the same way.
   Named parts (fans, doors, dish...), power-dependent lamps, glass, flat decals and special textures stay as they are. */
let UB_REV=null;
function ubRev(){if(UB_REV)return UB_REV;UB_REV=new Set([...Object.values(MT),...TD,...TM,...TG]);return UB_REV}
function ubOK(o){const m=o.material;if(!o.isMesh||o.userData.keep||o.name||!m||Array.isArray(m)||!ubRev().has(m)||m.userData.glow||m.transparent||m.wireframe||m.flatShading||m.side===THREE.BackSide)return false;
  if(m.map&&!ubTex(m))return false;return !/Plane|Shape|Circle/.test(o.geometry.type||'')}
function uberize(grp,f){
  const list=grp.children.filter(ubOK);if(list.length<3)return;
  const s=f&15,items=list.map(o=>{o.updateMatrix();const g=(o.geometry.index?o.geometry.clone():o.geometry.clone()).applyMatrix4(o.matrix);if(!g.attributes.normal)g.computeVertexNormals();return {g,src:o.material,flag:o.material===TG[s]?3:0}});
  const m=new THREE.Mesh(ubGeo(items),uberMat(f,null));m.castShadow=m.receiveShadow=true;
  for(const o of list)grp.remove(o);grp.add(m);
}
/* the merged geometry of each part, in that part's own frame (cached per model, shared by every unit/skin) */
function ubParts(key,oy,pivots){
  const ck=key+'|'+oy+'|'+(pivots||[]).join(',');if(GLB.ug[ck])return GLB.ug[ck];
  const root=GLB.scene[key];root.updateMatrixWorld(true);const piv={},buckets={},sep=[],pts={};
  for(const n of pivots||[]){const o=root.getObjectByName(n);if(o)piv[n]=new THREE.Vector3().setFromMatrixPosition(o.matrixWorld).add(new THREE.Vector3(0,oy,0))}
  root.traverse(o=>{let top=o;while(top.parent&&top.parent!==root)top=top.parent;const part=piv[top.name]?top.name:'';
    if(o.isMesh){const m=new THREE.Matrix4().makeTranslation(0,oy,0).multiply(o.matrixWorld);if(part)m.premultiply(new THREE.Matrix4().makeTranslation(-piv[part].x,-piv[part].y,-piv[part].z));
      const name=o.material.name;if(UB_SEP[name])sep.push({part,top:top.name,g:o.geometry,m,name});else (buckets[part]||(buckets[part]={top:top.name,list:[]})).list.push({g:o.geometry.clone().applyMatrix4(m),name})}
    else if(!o.children.length&&o!==root){const p=new THREE.Vector3().setFromMatrixPosition(o.matrixWorld);pts[o.name]=[p.x,p.y+oy,p.z]}});
  const merged=Object.entries(buckets).map(([part,b])=>({part,top:b.top,geo:ubGeo(b.list)}));
  return GLB.ug[ck]={piv,merged,sep,pts};
}
/* copy a loaded model into group g (game coords). Named nodes listed in `pivots` become their own groups (turret etc.).
   Returns empties (named points) in g's coordinates. */
function glbInto(g,key,f,oy,pivots){
  if(!GLB.scene[key])return null;const U=ubParts(key,oy,pivots),groups={};
  for(const n in U.piv){const gr=new THREE.Group();gr.name=n;gr.position.copy(U.piv[n]);g.add(gr);groups[n]=gr}
  const add=(tgt,mesh)=>{mesh.castShadow=mesh.receiveShadow=true;mesh.userData.keep=true;tgt.add(mesh)};
  for(const p of U.merged)add(groups[p.part]||g,new THREE.Mesh(p.geo,uberMat(f,GLB.aoT[key+'_'+p.top])));
  for(const s of U.sep){const m=new THREE.Mesh(s.g,glbMat(s.name,f,GLB.aoT[key+'_'+s.top]));s.m.decompose(m.position,m.quaternion,m.scale);add(groups[s.part]||g,m)}
  return Object.assign({},U.pts);
}
/* scenery: the whole model becomes one instanced batch (chunked for culling) covering all placements */
function glbScatter(key,list,cast){if(!GLB.scene[key])return false;if(!list.length)return true;const U=ubParts(key,0,[]),ao=GLB.aoT[key+'_body'],o={cast:cast!==false,cell:WW/3};
  for(const p of U.merged)chunkInst(p.geo,uberMat(0,ao),list,o);
  for(const s of U.sep){const g=s.g.clone().applyMatrix4(s.m);chunkInst(g,glbMat(s.name,0,ao),list,o)}return true}
function glbReady(key){
  /* drop templates + thumbnails built from the old code models so the new one is used from now on */
  for(const pre of GLB.uses[key]||[])for(const k of Object.keys(tmpl))if(k.startsWith(pre))delete tmpl[k];
  if(typeof thCache!=='undefined')for(const k of Object.keys(thCache)){const t=k.split(':')[0];if((GLB.uses[key]||[]).some(p=>p.split(':')[1]===t))delete thCache[k]}
  /* batch the follow-up work: models arrive one after another, so redo icons / backdrop once when they settle.
     Build-menu icons are only needed in a match (startGame draws them); the start page is rebuilt only if it was
     already drawn with stand-in models. */
  if(/^p_/.test(key))glbScenDirty=true;
  clearTimeout(glbSettleT);glbSettleT=setTimeout(()=>{try{
    if(state==='play'&&typeof applyThumbs==='function')applyThumbs();
    else if(state==='menu'&&glbMenuBuilt&&typeof menuDrop==='function'){if(glbScenDirty)menuScene(true);else menuDrop(()=>true)}glbScenDirty=false;
    glbStartCheck();thumbPrewarm()}catch(e){console.warn(e)}},400);
}
let glbSettleT=0,glbScenDirty=false,glbMenuBuilt=false,glbStartCbs=[],thPreT=0;
/* draw the build-menu icons in the background while the player is on the menu, one per tick, so a match starts instantly */
function thumbPrewarm(){clearTimeout(thPreT);if(typeof thumb!=='function'||typeof btn==='undefined')return;
  const sk=(typeof pickFac==='number'?pickFac:0)*16+playerCol(),todo=Object.keys(btn).filter(t=>thCache[t+':'+sk+':180']===undefined&&!(def(t).fac!=null&&def(t).fac!==pickFac));
  const step=()=>{if(state!=='menu'||!todo.length)return;try{thumb(todo.shift(),sk,180)}catch(e){}thPreT=setTimeout(step,60)};thPreT=setTimeout(step,300)}
/* the start page waits for the building + own-faction models (or a few seconds at most) so it is built once, with the real models */
function glbStartKeys(){const sf=GSUF[typeof pickFac==='number'?pickFac:0];return Object.keys(GLB.src).filter(k=>!GSUF.some(x=>k.endsWith(x))||k.endsWith(sf))}
function glbStartCheck(){if(!glbStartCbs.length)return;if(glbStartKeys().every(k=>GLB.scene[k]||GLB.failed[k])){const cbs=glbStartCbs;glbStartCbs=[];cbs.forEach(f=>f())}}
function whenStartModels(fn,maxMs){let done=false;const go=()=>{if(done)return;done=true;fn()};glbStartCbs.push(go);setTimeout(go,maxMs||6000);glbStartCheck()}
/* models load per faction: the buildings plus the player's own faction at start, the others only once a match needs them */
const GSUF=['_v','_s','_h'],glbAsked={};let glbL=null,glbTL=null;
function glbLoad(k){
  if(glbAsked[k]||!GLB.src[k])return;glbAsked[k]=1;
  glbL=glbL||new THREE.GLTFLoader();glbTL=glbTL||new THREE.TextureLoader();
  const tex=a=>new Promise(res=>{const t=glbTL.load(GLB.ao[a],()=>res(t),undefined,()=>res(null));t.flipY=false;GLB.aoT[a]=t});
  const geo=new Promise((res,rej)=>glbL.load(GLB.src[k],gl=>res(gl.scene),undefined,rej));
  Promise.all([geo,...Object.keys(GLB.ao).filter(a=>a.startsWith(k+'_')).map(a=>tex(a).then(t=>{if(!t)delete GLB.aoT[a]}))])
    .then(([scene])=>{GLB.scene[k]=scene;glbReady(k)}).catch(e=>{GLB.failed[k]=1;console.warn('model failed to load: '+k,e);glbStartCheck()});
}
function glbNeed(st){const sf=GSUF[st];if(sf)for(const k in GLB.src)if(k.endsWith(sf))glbLoad(k)}
function loadGLB(){
  if(!THREE.GLTFLoader)return;
  for(const k in GLB.src)if(!GSUF.some(sf=>k.endsWith(sf)))glbLoad(k);
  glbNeed(typeof pickFac==='number'?pickFac:0);
}
loadGLB();
