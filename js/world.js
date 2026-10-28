'use strict';
/* ---------- outlands: terrain, hills, rocks and trees continuing past the playable edge ---------- */
const OEXT=T*36;
function ohs(x,z){const n=Math.sin(x*12.9898+z*78.233)*43758.5453;return n-Math.floor(n)}
function ovn(x,z,sc){x/=sc;z/=sc;const ix=Math.floor(x),iz=Math.floor(z),fx=x-ix,fz=z-iz,sx=fx*fx*(3-2*fx),sz=fz*fz*(3-2*fz);
  const a=ohs(ix,iz),b=ohs(ix+1,iz),c=ohs(ix,iz+1),d=ohs(ix+1,iz+1);return (a+(b-a)*sx)*(1-sz)+(c+(d-c)*sx)*sz}
function outDist(x,z){return Math.hypot(Math.max(0,-x,x-WW),Math.max(0,-z,z-WH))}
function outH(x,z){
  const d=outDist(x,z),base=hAt(Math.max(0,Math.min(WW,x)),Math.max(0,Math.min(WH,z)));
  if(d<=.01)return base-.6;
  const n1=ovn(x,z,300),n2=ovn(x+999,z-777,95),n3=ovn(x-311,z+517,38),ramp=Math.min(1,d/160);
  return base+ramp*(n2*22+n3*6-4)+Math.max(0,d-200)*(.16+n1*.34)+Math.pow(Math.max(0,d-560)/420,2)*110*n1;
}
function buildOutland(){
  const M=curMap,N=Math.round((WW+2*OEXT)/T);
  const geo=new THREE.PlaneGeometry(WW+2*OEXT,WH+2*OEXT,N,N);geo.rotateX(-Math.PI/2);geo.translate(WW/2,0,WH/2);
  const p=geo.attributes.position,uv=geo.attributes.uv;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),inside=x>1&&x<WW-1&&z>1&&z<WH-1;p.setY(i,inside?hAt(x,z)-10:outH(x,z));uv.setXY(i,uv.getX(i)*N/2,uv.getY(i)*N/2)}
  geo.computeVertexNormals();
  const nr=geo.attributes.normal,col=new Float32Array(p.count*3),ga=M.ga,gb=M.gb,rk=M.rock;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i),y=p.getY(i),d=outDist(x,z),m=ovn(x+40,z-90,70),v=.92+ovn(x,z,23)*.2;
    const steep=Math.max(0,Math.min(1,(.9-nr.getY(i))/.25)),high=Math.max(0,Math.min(1,(y-hAt(Math.max(0,Math.min(WW,x)),Math.max(0,Math.min(WH,z)))-60)/140));
    const rr=Math.max(steep,high*.8);
    for(let c=0;c<3;c++){const g=(ga[c]*(1-m)+gb[c]*m)/255*1.22*v;col[i*3+c]=g*(1-rr)+rk[c]*1.25*v*rr}
    if(M.ice&&high>.6){const sn=(high-.6)/.4;for(let c=0;c<3;c++)col[i*3+c]=col[i*3+c]*(1-sn)+.95*sn}}
  geo.setAttribute('color',new THREE.BufferAttribute(col,3));
  const tex=mkTex(x=>{speck(x,'#cfcfcf',.16,7000);for(let i=0;i<40;i++){const px=Math.random()*256,py=Math.random()*256,r=8+Math.random()*30,g=x.createRadialGradient(px,py,0,px,py,r);
    g.addColorStop(0,`rgba(${Math.random()<.5?'40,36,30':'255,255,240'},.12)`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}});
  const dryO=['dunes','canyon','bowl'].includes(M.key)||M.ice,GPo=GPHOTO[M.key]||{};
  const ground=new THREE.Mesh(geo,groundify(new THREE.MeshStandardMaterial({map:tex,vertexColors:true,roughness:.96,metalness:0,envMapIntensity:.1}),{raw:0,crack:dryO?1:0,w:(GPo.w||1)*.85,ns:GPo.ns}));
  ground.receiveShadow=true;world.add(ground);
  const pick=(maxD,fall)=>{for(let k=0;k<40;k++){const x=-maxD+vr()*(WW+2*maxD),z=-maxD+vr()*(WH+2*maxD),d=outDist(x,z);if(d<=6||d>maxD)continue;if(vr()<Math.exp(-d/fall)+.12)return [x,z,d]}return null};
  /* boulders: a dense ridge hugging the edge, scattered further out */
  const RB=[],RC=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),ps=new THREE.Vector3(),sc=new THREE.Vector3();
  for(let i=0;i<400;i++){const r=pick(900,300);if(!r)continue;const [x,z,d]=r,near=d<110;
    const sz=T*(near?.4+vr()*.5:.25+vr()*.55)*(1+Math.min(1,d/700)*.8),hh=sz*(.7+vr()*1.1);
    ps.set(x,outH(x,z)+hh*.25,z);e.set((vr()-.5)*.5,vr()*6.28,(vr()-.5)*.5);q.setFromEuler(e);sc.set(sz,hh,sz*(.8+vr()*.4));
    m4.compose(ps,q,sc);RB.push(m4.clone());const v=.75+vr()*.5;RC.push(new THREE.Color(rk[0]*v,rk[1]*v,rk[2]*v))}
  chunkInst(rockGeo(),rockMat(),RB.map((m,j)=>({m,col:RC[j]})),{cast:true,cell:2000});
  /* tree clusters */
  const TC=treeCollector(),nC=M.tree==='dead'?22:50;
  for(let c=0;c<nC;c++){const r=pick(800,420);if(!r)continue;const [cx,cz]=r,n=M.tree==='dead'?2+(vr()*3|0):6+(vr()*12|0);
    for(let k=0;k<n;k++){const x=cx+(vr()-.5)*120,z=cz+(vr()-.5)*120;if(outDist(x,z)<14)continue;const s2=.8+vr()*.7;
      _p.set(x,outH(x,z),z);_q.setFromEuler(_e.set(0,vr()*6.28,0));_s.set(s2,s2,s2);TC.B.compose(_p,_q,_s);treeParts(M,TC.B,TC.push,vr,true)}}
  buildTreeSet(TC.out,{cast:true,cell:2000});
}
function terrainGeo(off,colored){
  const geo=new THREE.PlaneGeometry(WW,WH,MW*2,MH*2);geo.rotateX(-Math.PI/2);geo.translate(WW/2,0,WH/2);
  const p=geo.attributes.position,col=colored?new Float32Array(p.count*3):null;
  for(let i=0;i<p.count;i++){const h=hAt(p.getX(i),p.getZ(i));p.setY(i,h+off)}
  geo.computeVertexNormals();
  if(col){const n=geo.attributes.normal;
    for(let i=0;i<p.count;i++){const h=p.getY(i),ny=n.getY(i),st=Math.max(0,Math.min(1,(.93-ny)/.22)),c=.86+Math.min(h,45)/45*.24;
      col[i*3]=c*(1-st)+.62*st;col[i*3+1]=c*(1-st)+.6*st;col[i*3+2]=c*(1-st)+.58*st}
    geo.setAttribute('color',new THREE.BufferAttribute(col,3))}
  return geo;
}
const inPlaza=(x,y)=>PLAZAS.some(p=>x>=p[0]&&x<=p[2]&&y>=p[1]&&y<=p[3]);
/* ---------- instanced scenery, split into chunks so off-screen chunks are skipped (also in the shadow pass) ---------- */
function chunkInst(geo,mat,list,o){
  o=o||{};const C=o.cell||WW,cells=new Map();if(!geo.boundingSphere)geo.computeBoundingSphere();
  const gs=geo.boundingSphere,gr=gs.center.length()+gs.radius,loc=new Array(list.length),own=new Array(list.length),meshes=[];
  list.forEach((it,i)=>{_v3.setFromMatrixPosition(it.m);const k=Math.floor(_v3.x/C)*4096+Math.floor(_v3.z/C);let c=cells.get(k);if(!c)cells.set(k,c=[]);loc[i]=c.length;c.push(i)});
  for(const c of cells.values()){
    const box=new THREE.Box3();let rm=0;
    for(const i of c){const e=list[i].m.elements;_v3.set(e[12],e[13],e[14]);box.expandByPoint(_v3);rm=Math.max(rm,Math.hypot(e[0],e[1],e[2]),Math.hypot(e[4],e[5],e[6]),Math.hypot(e[8],e[9],e[10]))}
    const g2=new THREE.BufferGeometry();for(const k in geo.attributes)g2.setAttribute(k,geo.attributes[k]);if(geo.index)g2.setIndex(geo.index);
    g2.boundingSphere=box.getBoundingSphere(new THREE.Sphere());g2.boundingSphere.radius+=rm*gr+4;
    const im=new THREE.InstancedMesh(g2,mat,c.length);im.castShadow=!!o.cast;im.receiveShadow=o.recv!==false;
    c.forEach((i,j)=>{const it=list[i];im.setMatrixAt(j,it.hide?zeroM:it.m);if(it.col)im.setColorAt(j,it.col);own[i]=im});
    if(im.instanceColor)im.instanceColor.needsUpdate=true;world.add(im);meshes.push(im);
  }
  return {meshes,material:mat,
    set(i,m){const im=own[i];if(!im)return;im.setMatrixAt(loc[i],m);im.instanceMatrix.needsUpdate=true},
    color(i,c){const im=own[i];if(!im)return;im.setColorAt(loc[i],c);im.instanceColor.needsUpdate=true}};
}
/* vertex-colour ambient occlusion: darker toward the bottom of a shape */
function addAO(g,y0,y1,lo){const p=g.attributes.position,c=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){let t=Math.max(0,Math.min(1,(p.getY(i)-y0)/(y1-y0)));const a=lo+(1-lo)*t*t*(3-2*t);c[i*3]=c[i*3+1]=c[i*3+2]=a}
  g.setAttribute('color',new THREE.BufferAttribute(c,3));return g}
const _hsh=(x,y,z)=>{const n=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return n-Math.floor(n)};
/* lumpy foliage: displaced icosphere with soft normals and a shaded underside */
function foliageGeo(){return gk('foliage',()=>{const g=new THREE.IcosahedronGeometry(.5,1),p=g.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.multiplyScalar(.8+_hsh(Math.round(v.x*90),Math.round(v.y*90),Math.round(v.z*90))*.4);p.setXYZ(i,v.x,v.y,v.z)}
  const out=addAO(creased(g,75),-.45,.45,.4),c=out.attributes.color,q=out.attributes.position;
  for(let i=0;i<c.count;i++){const t=.78+_hsh(Math.round(q.getX(i)*40),Math.round(q.getY(i)*40),Math.round(q.getZ(i)*40))*.42;c.setXYZ(i,c.getX(i)*t,c.getY(i)*t*1.02,c.getZ(i)*t)}
  return out})}
/* grass clump: a fan of thin blades, darker at the root */
function tuftGeo(){return gk('tuft',()=>{const pos=[],col=[];
  for(let b=0;b<6;b++){const a=b/6*Math.PI*2+_hsh(b,1,2),l=.25+_hsh(b,3,4)*.3,h=.7+_hsh(b,5,6)*.5,w=.09,cx=Math.cos(a),cz=Math.sin(a);
    const bx=cx*.12,bz=cz*.12,tx=cx*l,tz=cz*l;pos.push(bx-cz*w,0,bz+cx*w, bx+cz*w,0,bz-cx*w, tx,h,tz, bx+cz*w,0,bz-cx*w, bx-cz*w,0,bz+cx*w, tx,h,tz);for(let k=0;k<2;k++)col.push(.72,.72,.72,.72,.72,.72,1.3,1.3,1.25)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));g.computeVertexNormals();
  const n=g.attributes.normal;for(let i=0;i<n.count;i++)n.setXYZ(i,n.getX(i)*.3,1,n.getZ(i)*.3);g.normalizeNormals?0:0;return g})}
const pineGeo=()=>gk('pine',()=>addAO(creased(new THREE.ConeGeometry(.5,1,9,2),60),-.5,.5,.5));
const trunkGeo=()=>gk('trunk',()=>addAO(new THREE.CylinderGeometry(.42,.6,1,7),-.5,.5,.6));
const fmat=()=>fogify(new THREE.MeshStandardMaterial({envMapIntensity:.25,color:0xffffff,roughness:.93,metalness:0,vertexColors:true}));
/* one tree, as instanced parts in tree-local space (B is the tree's world transform) */
function treeParts(M,B,push,r,lite){
  const C=(a,b,c)=>new THREE.Color(a,b,c),bark=C(.26+r()*.05,.19+r()*.04,.13);
  if(M.tree==='pine'){push('trunk',0,4,0,1.4,8,1.4,bark);const v=r()*.04,gr=C(.075+v,.15+v+r()*.04,.11+v);
    push('pine',0,9,0,13,12,13,gr);if(!lite)push('pine',0,14.5,0,10,10.5,10,gr.clone().multiplyScalar(1.06));push('pine',0,lite?16.5:19.5,0,lite?8.5:6.6,lite?12:8.5,lite?8.5:6.6,gr.clone().multiplyScalar(1.12));
    if(M.ice){push('pine',0,21.5,0,4.2,5,4.2,C(.9,.93,.96))}}
  else if(M.tree==='broad'){push('trunk',0,5,0,1.8,10,1.8,bark);const v=r(),gr=C(.12+v*.05,.2+v*.06+r()*.03,.07+r()*.03);
    push('fol',0,16,0,16,12.5,16,gr);push('fol',4.5,13,3,11,9,11,gr.clone().multiplyScalar(.9));if(!lite)push('fol',-3,20,-1.5,10,8,10,gr.clone().multiplyScalar(1.14))}
  else{const bc=C(.4,.33,.25);push('trunk',0,6,0,1.2,12,1.2,bc);push('trunk',2,10,0,.7,7,.7,bc,0,-.7);push('trunk',-1.4,9,1,.6,6,.6,bc,.6,.5);if(r()<.6)push('fol',4,1.6,4,7,3,7,C(.42,.37,.24))}
}
function buildTreeSet(list,o){
  const G2={trunk:trunkGeo(),fol:foliageGeo(),pine:pineGeo()},by={trunk:[],fol:[],pine:[]};for(const it of list)by[it.k].push(it);
  for(const k in by)if(by[k].length)chunkInst(G2[k],fmat(),by[k],o);
}
function treeCollector(){
  const out=[],B=new THREE.Matrix4(),L=new THREE.Matrix4();
  const push=(k,lx,ly,lz,sx,sy,sz,col,rx,rz)=>{_q.setFromEuler(_e.set(rx||0,0,rz||0));L.compose(_v3.set(lx,ly,lz),_q,_s2.set(sx,sy,sz));out.push({k,m:B.clone().multiply(L),col})};
  return {out,B,push};
}
/* jagged boulder: icosphere with deterministic per-vertex noise, flat bottom, darker underside */
function rockGeo(){
  return gk('rock',()=>{const g=new THREE.IcosahedronGeometry(1,1),p=g.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const hx=Math.round(v.x*100),hy=Math.round(v.y*100),hz=Math.round(v.z*100),k=.66+_hsh(hx,hy,hz)*.62;
    v.multiplyScalar(k);v.x+=(_hsh(hy,hz,hx)-.5)*.18;v.z+=(_hsh(hz,hx,hy)-.5)*.18;if(v.y<-.35)v.y=-.35;p.setXYZ(i,v.x,v.y,v.z)}
  g.computeVertexNormals();addAO(g,-.35,.9,.48);
  const c=g.attributes.color;for(let i=0;i<c.count;i+=3){const t=.86+_hsh(i,7,3)*.24;for(let j=0;j<3;j++)c.setXYZ(i+j,c.getX(i+j)*t,c.getY(i+j)*t,c.getZ(i+j)*t)}
  return g});
}
const pebbleGeo=()=>gk('pebble',()=>{const g=new THREE.IcosahedronGeometry(1,0),p=g.attributes.position,v=new THREE.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);v.multiplyScalar(.75+_hsh(Math.round(v.x*100),Math.round(v.y*100),Math.round(v.z*100))*.45);if(v.y<-.3)v.y=-.3;p.setXYZ(i,v.x,v.y,v.z)}
  g.computeVertexNormals();return addAO(g,-.3,.8,.6)});
const rockMat=()=>fogify(new THREE.MeshStandardMaterial({envMapIntensity:.35,color:0xffffff,roughness:.94,metalness:0,map:TEX.rock,normalMap:TEX.rockN,normalScale:new THREE.Vector2(.9,.9),vertexColors:true}));
function buildRocks(){
  const list=[],m4=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),pos=new THREE.Vector3(),sc=new THREE.Vector3();
  for(let i=0;i<MW*MH;i++){
    if(ter[i]!==1&&ter[i]!==6)continue;const tx=i%MW,ty=(i/MW)|0,cf=ter[i]===6;if(cf&&vr()<.55)continue;
    for(let k=0;k<(cf?1:2);k++){
      if(k&&vr()<.4)continue;
      const s=T*(.52+vr()*.3)*(cf?.55:1)*(k?1:1.08),h=s*(.8+vr()*1.1)*(k?1.15:.8);
      const rx=(tx+.5)*T+(vr()-.5)*14,rz=(ty+.5)*T+(vr()-.5)*14;pos.set(rx,h*.3+hAt(rx,rz),rz);
      e.set((vr()-.5)*.4,vr()*6.28,(vr()-.5)*.4);q.setFromEuler(e);sc.set(s,h,s*(.8+vr()*.3));
      m4.compose(pos,q,sc);const v=.8+vr()*.45,RC=curMap.rock;list.push({m:m4.clone(),col:new THREE.Color(RC[0]*v,RC[1]*v,RC[2]*v)});
    }
  }
  rocksM=chunkInst(rockGeo(),rockMat(),list,{cast:true});
}
const CPER=12;
function crystalGeo(){const a=new THREE.Mesh(new THREE.CylinderGeometry(.42,.5,1,6,1,true).translate(0,.5,0)),b=new THREE.Mesh(new THREE.ConeGeometry(.42,.6,6,1,true).translate(0,1.3,0));
  const g=mergeMeshes([a,b]);g.computeVertexNormals();return g}
let crysLast=null;
function crysMat(i,k,a,out){
  const tx=i%MW,ty=(i/MW)|0,sc=.35+Math.min(1,a/(cryMax?cryMax[i]||700:700))*.65,h=((i*2654435761+k*40503+977)>>>0),r01=v=>((h>>v)%1000)/1000;
  const an=k*2.4+r01(3)*.9,dist=k?(2+Math.sqrt(k/CPER)*10+r01(7)*2.5):0,tilt=k?.18+r01(11)*.5:r01(13)*.12,ht=(k?4.5+r01(5)*6:9+r01(9)*4)*sc,wd=(k?2.8+r01(15)*1.6:4.6+r01(4)*1.2)*sc;
  const px=tx*T+16+Math.cos(an)*dist,pz=ty*T+16+Math.sin(an)*dist;
  _v3.set(Math.sin(an),0,-Math.cos(an));_q.setFromAxisAngle(_v3,tilt);const qb=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),r01(2)*6.28);_q.multiply(qb);
  _p.set(px,hAt(px,pz)-.8,pz);_s.set(wd,ht,wd);return out.compose(_p,_q,_s);
}
function buildCrystals(){
  crysList=[];for(let i=0;i<MW*MH;i++)if(cry[i]>0)crysList.push(i);crysLast=null;
  const list=[];for(const i of crysList)for(let k=0;k<CPER;k++){const h=((i*2654435761+k*40503+977)>>>0),tint=((h>>6)%1000)/1000;
    list.push({m:crysMat(i,k,700,new THREE.Matrix4()),col:new THREE.Color(.72+tint*.22,.2+tint*.2,.92),hide:true})}
  crysM=chunkInst(crystalGeo(),fogify(new THREE.MeshStandardMaterial({envMapIntensity:.9,color:0xffffff,emissive:0x6a18b8,emissiveIntensity:.62,roughness:.18,metalness:.1,flatShading:true,side:THREE.DoubleSide})),list,{cast:true});
}
const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_p=new THREE.Vector3(),_s=new THREE.Vector3(),_v3=new THREE.Vector3(),_s2=new THREE.Vector3();
let scat=[];
function buildDetail(){
  detTile=[];scat=[];const list=[];
  for(let n=0,NA=4800*MW*MH/4096;n<NA;n++){
    const x=vr()*WW,z=vr()*WH,i=ti(x,z);if(ter[i]||cry[i]>0||occ[i])continue;
    if(inPlaza(x/T,z/T)&&vr()<.92)continue;
    const peb=vr()<.25,s=peb?1.2+vr()*1.6:1.1+vr()*1.3;
    _p.set(x,hAt(x,z)+(peb?.3:0),z);_e.set(peb?vr():(vr()-.5)*.5,vr()*6.28,peb?vr():(vr()-.5)*.5);_q.setFromEuler(_e);
    _s.set(s*(peb?1.4:3.4),peb?s*.7:s*(1.9+vr()*1.5),s*(peb?1.1:3.4));_m.compose(_p,_q,_s);
    const M=curMap,tb=M.tuft[0],tv=M.tuft[1];/* grass */
    list.push({peb,m:_m.clone(),hide:!!occ[i],col:peb?new THREE.Color(M.rock[0]*1.2,M.rock[1]*1.2,M.rock[2]*1.2):new THREE.Color((tb[0]+vr()*tv[0])*.85,(tb[1]+vr()*tv[1])*.85,(tb[2]+vr()*tv[2])*.85)});detTile.push(i);
  }
  /* pebbles and grass clumps share one index space for clearDetail */
  const pebI=[],grI=[];list.forEach((it,i)=>(it.peb?pebI:grI).push(i));
  const pc=chunkInst(pebbleGeo(),rockMat(),pebI.map(i=>list[i]),{cell:WW}),gc=chunkInst(tuftGeo(),fogify(new THREE.MeshStandardMaterial({envMapIntensity:.2,color:0xffffff,roughness:1,vertexColors:true})),grI.map(i=>list[i]),{cell:WW});
  const where=[];pebI.forEach((i,j)=>where[i]=[pc,j]);grI.forEach((i,j)=>where[i]=[gc,j]);
  detM={set(i,m){const w=where[i];if(w)w[0].set(w[1],m)}};
  /* barrels and crates: small, non-blocking, cleared when a building goes on top */
  const far=(x,y)=>BASES.every(b=>Math.hypot(x-b[0],y-b[1])>13);
  const barrels=[],crates=[],BC=[[.5,.2,.14],[.32,.37,.22],[.62,.5,.16]];
  for(let n=0;n<60*MW*MH/4096;n++){
    const tx=1+(vr()*(MW-2)|0),ty=1+(vr()*(MH-2)|0),i=ty*MW+tx;if(ter[i]||occ[i]||cry[i]>0||!far(tx,ty))continue;
    const cnt=2+(vr()*3|0),isB=vr()<.6;
    for(let k=0;k<cnt;k++){const x=(tx+.2+vr()*.6)*T,z=(ty+.2+vr()*.6)*T;_p.set(x,hAt(x,z),z);
      _e.set(isB&&vr()<.2?Math.PI/2:0,vr()*6.28,0);_q.setFromEuler(_e);_s.set(1,1,1);_m.compose(_p,_q,_s);
      const c=isB?BC[(vr()*3)|0]:[.42,.31,.2];(isB?barrels:crates).push({m:_m.clone(),tile:i,col:new THREE.Color(c[0],c[1],c[2])})}
  }
  addScatter(new THREE.CylinderGeometry(2,2,5,12).translate(0,2.5,0),barrels,true,MT.plate2.map,MT.plate2.normalMap);
  addScatter(new THREE.BoxGeometry(5,5,5).translate(0,2.5,0),crates,true,TEX.concrete,TEX.concreteN);
  /* bushes and shrubs, thicker near forests */
  const bush=[],M=curMap,BCOL=M.tree==='pine'?[[.62,.66,.68],[.12,.2,.15]]:M.tree==='dead'?[[.36,.33,.21],[.42,.37,.24]]:[[.13,.22,.08],[.18,.26,.1]];
  for(let n=0,BA=MW*MH/4096;n<900*BA&&bush.length<420*BA;n++){
    const tx=1+(vr()*(MW-2)|0),ty=1+(vr()*(MH-2)|0),i=ty*MW+tx;if(ter[i]||occ[i]||cry[i]>0||!far(tx,ty)||inPlaza(tx,ty))continue;
    let nearF=false;for(let dy=-2;dy<=2&&!nearF;dy++)for(let dx=-2;dx<=2;dx++){const j=(ty+dy)*MW+tx+dx;if(j>=0&&j<ter.length&&ter[j]===3){nearF=true;break}}
    if(!nearF&&vr()<.6)continue;
    const x=(tx+vr())*T,z=(ty+vr())*T,sc=2.4+vr()*3.2;_p.set(x,hAt(x,z)+sc*.3,z);_q.setFromEuler(_e.set(0,vr()*6.28,0));_s.set(sc*2.6,sc*1.6,sc*2.2);_m.compose(_p,_q,_s);
    const c=BCOL[(vr()*2)|0],v=.85+vr()*.3;bush.push({m:_m.clone(),tile:i,col:new THREE.Color(c[0]*v,c[1]*v,c[2]*v)});
  }
  const ci=chunkInst(foliageGeo(),fmat(),bush,{cell:WW});scat.push({ci,tile:bush.map(b=>b.tile)});
}
function addScatter(geo,list,shadow,map,nmap){
  const ci=chunkInst(geo,fogify(new THREE.MeshStandardMaterial({envMapIntensity:.4,color:0xffffff,roughness:.7,metalness:.25,map:map||null,normalMap:nmap||null})),list,{cast:!!shadow,cell:WW});
  scat.push({ci,tile:list.map(i=>i.tile)});return ci;
}
function buildTrees(){
  const M=curMap,TC=treeCollector();
  for(let i=0;i<MW*MH;i++){
    if(ter[i]!==3)continue;const tx=i%MW,ty=(i/MW)|0,n=1+(vr()*2|0);
    for(let k=0;k<n;k++){
      const x=(tx+.2+vr()*.6)*T,z=(ty+.2+vr()*.6)*T,sc=.8+vr()*.5;
      _p.set(x,hAt(x,z),z);_q.setFromEuler(_e.set(0,vr()*6.28,0));_s.set(sc,sc,sc);TC.B.compose(_p,_q,_s);treeParts(M,TC.B,TC.push,vr);
    }
  }
  buildTreeSet(TC.out,{cast:true});
}
/* Blender props (see /blender/props.py) once loaded: one instanced batch per prop type */
const RUIN_P=['p_ruin_house','p_pillbox','p_traps','p_fuel_depot','p_water_tower'],RUIN_W=[.3,.2,.15,.15,.2];
function propM(x,z,sink,s){const y=Math.min(hAt(x-12,z-12),hAt(x+12,z-12),hAt(x-12,z+12),hAt(x+12,z+12),hAt(x,z))-(sink||0);
  _p.set(x,y,z);_q.setFromEuler(_e.set(0,vr()*6.28,0));_s.set(s||1,s||1,s||1);return {m:_m.compose(_p,_q,_s).clone()}}
function buildRuins(){
  const grp=new THREE.Group(),useP=RUIN_P.every(k=>GLB.scene[k]),lists=RUIN_P.map(()=>[]);
  for(let i=0;i<MW*MH;i++){
    if(ter[i]!==4)continue;const x=(i%MW+.5)*T,z=((i/MW|0)+.5)*T,kind=(vr()*3)|0;
    if(useP){let r=vr(),k=0;while(k<RUIN_W.length-1&&(r-=RUIN_W[k])>0)k++;lists[k].push(propM(x,z,.3,.92+vr()*.16));continue}
    const sub=new THREE.Group();sub.position.set(x,hAt(x,z),z);sub.rotation.y=vr()*6.28;
    if(kind===0){P(sub,G.box(20,13,3),MT.concrete,-2,6.5,-6,0,0,(vr()-.5)*.1);P(sub,G.box(3,9,14),MT.concrete,8,4.5,0);P(sub,G.box(8,3,6),MT.concrete,-6,1.5,6,.3,.5,.2);P(sub,G.box(5,3,5),MT.concrete,2,1.5,4,.2,.9,.1)}
    else if(kind===1){P(sub,G.box(22,7,14),MT.rust,0,4.5,0,0,0,.08);P(sub,G.dome(5),MT.rust,2,8,0,0,0,0,1.2,.6,1);P(sub,G.cylx(1,14),MT.rust,10,10,0,0,.3,-.3);
      P(sub,G.whl(3,3),MT.dark,-7,2.6,-7.5);P(sub,G.whl(3,3),MT.dark,6,2.6,7.5,0,0,.4)}
    else{for(let k=0;k<6;k++)P(sub,G.box(4+(vr()*5|0),3+(vr()*3|0),4+(vr()*5|0)),vr()<.5?MT.concrete:MT.plate2,(vr()-.5)*20,1.5,(vr()-.5)*20,vr(),vr()*3,vr()*.5)}
    sub.updateMatrix();for(const c of [...sub.children]){c.applyMatrix4(sub.matrix);grp.add(c)}
  }
  bake(grp);grp.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});world.add(grp);
  if(useP)RUIN_P.forEach((k,j)=>glbScatter(k,lists[j]));
}
let waterTex=null,waterAnim=false,shoreTex=null;
/* photo water (two drifting layers + bump for moving reflections) and photo ice for frozen maps */
const WTU={uWT:{value:null},uWN:{value:null},uIT:{value:null},uIN:{value:null},uWTime:{value:0},uWOn:{value:0}};
(()=>{const L=new THREE.TextureLoader(),src={uWT:'tex/water_d.jpg',uWN:'tex/water_n.jpg',uIT:'tex/ice_d.jpg',uIN:'tex/ice_n.jpg'},ks=Object.keys(src);let n=0;
  for(const k of ks){const t=L.load(src[k],()=>{if(++n===ks.length)WTU.uWOn.value=1});t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;WTU[k].value=t}})();
function waterMat(M){
  const m=new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:M.waterOp,roughness:M.ice?.32:.1,metalness:M.ice?.05:.12,envMapIntensity:M.ice?.6:.55,depthWrite:false});
  const tint=new THREE.Color(M.water),ice=M.ice?1:0;
  m.onBeforeCompile=sh=>{cfCompile(sh);Object.assign(sh.uniforms,WTU,{uShore:{value:shoreTex},uWTint:{value:new THREE.Vector3(tint.r,tint.g,tint.b)},uIce:{value:ice}});
    sh.fragmentShader='uniform sampler2D uWT,uWN,uIT,uIN,uShore;uniform float uWTime,uWOn,uIce;uniform vec3 uWTint;\n'+sh.fragmentShader
    .replace('#include <map_fragment>',`#include <map_fragment>
 float wD=texture2D(uShore,vCfW.xz/uCfSize).r;
 vec2 wUV=vCfW.xz/230.,wO1=vec2(uWTime*.010,uWTime*.004),wO2=vec2(-uWTime*.006,uWTime*.009),wUV2=mat2(.8,-.6,.6,.8)*wUV*1.37+vec2(.31,.67);
 vec3 wC;
 if(uIce>.5){wC=mix(texture2D(uIT,wUV*1.4).rgb,texture2D(uIT,wUV2*.9).rgb,.35)*vec3(1.02,1.05,1.1);}
 else{wC=(texture2D(uWT,wUV+wO1).rgb+texture2D(uWT,wUV2+wO2).rgb)*.5;wC*=mix(vec3(1.),uWTint/vec3(.311,.423,.561),.45);
   wC=mix(wC*1.05+vec3(.02,.05,.04),wC*.62,smoothstep(.0,.6,wD));}
 float wF=uIce>.5?0.:smoothstep(.16,.02,wD)*smoothstep(.25,.6,dot(texture2D(uWT,wUV*2.3+wO2*1.5).rgb,vec3(.33)));
 diffuseColor.rgb=mix(diffuseColor.rgb*uWTint,mix(wC,vec3(.86,.9,.92),wF*.7),uWOn);
 diffuseColor.a=mix(diffuseColor.a,uIce>.5?.97:clamp(mix(.45,.94,smoothstep(.0,.45,wD))+wF*.5,0.,1.),uWOn);`)
    .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 if(uWOn>.5){vec3 n1,n2;
  if(uIce>.5){n1=texture2D(uIN,wUV*1.4).xyz*2.-1.;n2=n1;}
  else{n1=texture2D(uWN,wUV+wO1).xyz*2.-1.;n2=texture2D(uWN,wUV2+wO2).xyz*2.-1.;n2.xy=n2.xy*mat2(.8,-.6,.6,.8);}
  vec3 wn=normalize(n1+n2);wn.xy*=uIce>.5?.8:1.3;
  vec3 tx=(viewMatrix*vec4(1.,0.,0.,0.)).xyz,tz=(viewMatrix*vec4(0.,0.,1.,0.)).xyz;
  tx=normalize(tx-normal*dot(normal,tx));tz=normalize(tz-normal*dot(normal,tz));
  normal=normalize(tx*wn.x+tz*wn.y+normal*wn.z);}`)};
  m.customProgramCacheKey=()=>'cfwater';
  return m;
}
function buildWater(){
  waterTex=null;if(shoreTex){shoreTex.dispose();shoreTex=null}if(!ter.some(t=>t===2))return;const M=curMap;
  /* depth map: how far the river bed sits below the water line (shallows are lighter and see-through, foam at the shore) */
  const R=256,c=document.createElement('canvas');c.width=c.height=R;const x=c.getContext('2d'),img=x.createImageData(R,R);
  for(let j=0;j<R;j++)for(let i=0;i<R;i++){const d=Math.max(0,Math.min(1,(-2.6-hAt((i+.5)/R*WW,(j+.5)/R*WH))/9)),o=(j*R+i)*4;img.data[o]=img.data[o+1]=img.data[o+2]=d*255;img.data[o+3]=255}
  x.putImageData(img,0,0);shoreTex=new THREE.CanvasTexture(c);shoreTex.flipY=false;shoreTex.minFilter=shoreTex.magFilter=THREE.LinearFilter;shoreTex.generateMipmaps=false;
  waterAnim=!M.ice;
  const wm=new THREE.Mesh(new THREE.PlaneGeometry(WW,WH),waterMat(M));
  wm.rotation.x=-Math.PI/2;wm.position.set(WW/2,-2.6,WH/2);wm.receiveShadow=true;wm.renderOrder=2;world.add(wm);
}
/* ---------- bridges ---------- */
function buildBridges(){
  if(!BRIDGES.length)return;
  const grp=new THREE.Group(),bx=new THREE.BoxGeometry(1,1,1),cy=new THREE.CylinderGeometry(1,1.15,1,10);
  const add=(geo,m,x,y,z,sx,sy,sz,ry,rz)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.order='YZX';o.rotation.y=ry||0;o.rotation.z=rz||0;grp.add(o);return o};
  for(const b of BRIDGES){
    const yaw=-Math.atan2(b.dz,b.dx),px=-b.dz,pz=b.dx,N=14,P=t=>[b.ax+b.dx*b.len*t,b.yAt(t),b.az+b.dz*b.len*t];
    for(let i=0;i<N;i++){
      const t0=i/N,t1=(i+1)/N,a=P(t0),c=P(t1),hl=b.len/N,pit=Math.atan2(c[1]-a[1],hl),L=Math.hypot(hl,c[1]-a[1])+.6;
      const mx=(a[0]+c[0])/2,my=(a[1]+c[1])/2,mz=(a[2]+c[2])/2,mid=t0>.1&&t1<.9;
      add(bx,MT.concrete,mx,my-1.3,mz,L,2.6,b.w,yaw,pit);
      add(bx,MT.plate,mx,my+.05,mz,L,.3,b.w-5,yaw,pit);
      if(mid){add(bx,MT.rust,mx,my-4.2,mz,L,3.4,b.w*.62,yaw,pit);
        for(const sd of [-1,1]){const o=b.w/2-1.1;add(bx,MT.steel,mx+px*o*sd,my+3.6,mz+pz*o*sd,L,.9,.9,yaw,pit);
          add(bx,MT.dark,mx+px*o*sd,my+1.8,mz+pz*o*sd,1,3.6,1,yaw,0)}}
    }
    const nP=Math.max(2,Math.round(b.len/T/2.6));
    for(let k=1;k<nP;k++){const t=k/nP,p=P(t);
      for(const sd of [-1,1]){const o=b.w/2-3.4;add(cy,MT.concrete,p[0]+px*o*sd,(p[1]-2.6-12)/2,p[2]+pz*o*sd,2.3,p[1]-2.6+12,2.3)}
      add(bx,MT.concrete,p[0],p[1]-3.6,p[2],3,2.4,b.w*.9,yaw,0)}
    for(const t of [0,1]){const p=P(t);add(bx,MT.concrete,p[0],p[1]-3,p[2],6,6,b.w+3,yaw,0)}
  }
  bake(grp);grp.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true}});world.add(grp);
}
/* ---------- weather: night lighting, storm particles and lightning ---------- */
let WXF=1,wxPts=null,wxU=null,wxFlash=0,wxNext=8;const WXB={hemi:.5,sun:1};
const wxKind=()=>curMap.storm||(curMap.ice?'snow':(curMap.key==='dunes'||curMap.key==='canyon')?'sand':'rain');
Object.assign(SFX,{thunder:(t,v)=>{const d=dst(.5*(v||1),0,.7);nz(t,.08,'highpass',2200,900,.4,0,d);nz(t,3.2,'lowpass',620,32,1,.5,d);tn(t,2.2,'sine',46,22,.8,d);
  for(let i=0;i<6;i++)nz(t+.2+Math.random()*1.6,.3,'lowpass',380,60,.4,0,d)}});
function buildWeather(){
  if(wxPts){scene.remove(wxPts);wxPts.geometry.dispose();wxPts.material.dispose();wxPts=null;wxU=null}
  hemi.intensity=WXB.hemi;sun.intensity=WXB.sun;wxFlash=0;
  if(pickWx!=='storm'||!renderer)return;
  const kind=wxKind(),N=kind==='snow'?3400:kind==='sand'?4200:2800,BX=1700,BY=560,BZ=1700;
  const pos=new Float32Array(N*3),rnd=new Float32Array(N);
  for(let i=0;i<N;i++){pos[i*3]=Math.random()*BX;pos[i*3+1]=Math.random()*BY;pos[i*3+2]=Math.random()*BZ;rnd[i]=Math.random()}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('rnd',new THREE.BufferAttribute(rnd,1));
  const P={snow:{vel:[38,-70,22],col:0xffffff,size:5,op:.9,sw:16},sand:{vel:[340,-30,120],col:0xe6c48e,size:9,op:.7,sw:30},rain:{vel:[70,-950,36],col:0xc4d4e4,size:10,op:.5,sw:0}}[kind];
  wxU={uT:{value:0},uC:{value:new THREE.Vector3()},uB:{value:new THREE.Vector3(BX,BY,BZ)},uV:{value:new THREE.Vector3(...P.vel)},uS:{value:P.size*Math.min(2,renderer.getPixelRatio())},
    uCol:{value:new THREE.Color(P.col)},uOp:{value:P.op},uSw:{value:P.sw},uRain:{value:kind==='rain'?1:kind==='sand'?2:0}};
  const m=new THREE.ShaderMaterial({uniforms:wxU,transparent:true,depthWrite:false,
    vertexShader:`attribute float rnd;uniform float uT,uS,uSw;uniform vec3 uC,uB,uV;varying float vA;
      void main(){vec3 p=position+uV*uT*(.75+rnd*.5);p.x+=sin(uT*1.3+rnd*40.)*uSw;p.z+=cos(uT*1.1+rnd*30.)*uSw;
        vec3 o=uC-uB*.5;p=mod(p-o,uB)+o;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;
        gl_PointSize=min(64.,uS*(600./max(1.,-mv.z))*(.6+rnd*.8));
        float e=min(min(p.x-o.x,o.x+uB.x-p.x),min(p.z-o.z,o.z+uB.z-p.z));vA=clamp(e/160.,0.,1.)*clamp((p.y-o.y)/50.,0.,1.);}`,
    fragmentShader:`uniform vec3 uCol;uniform float uOp,uRain;varying float vA;
      void main(){vec2 c=gl_PointCoord-.5;float a=uRain>1.5?(1.-smoothstep(.15,.5,abs(c.x)))*(1.-smoothstep(.03,.1,abs(c.y))):uRain>.5?(1.-smoothstep(.03,.08,abs(c.x)))*(1.-smoothstep(.25,.5,abs(c.y))):1.-smoothstep(.15,.5,length(c));
        a*=uOp*vA;if(a<.01)discard;gl_FragColor=vec4(uCol,a);}`});
  wxPts=new THREE.Points(g,m);wxPts.frustumCulled=false;wxPts.renderOrder=20;scene.add(wxPts);
}
function updWeather(dt){
  if(!wxU)return;
  wxU.uT.value+=dt;wxU.uC.value.set(cam.x,camH+250,cam.y);
  if(wxKind()!=='rain')return;
  wxNext-=dt;if(wxNext<=0){wxNext=7+Math.random()*12;wxFlash=1;const v=.5+Math.random()*.5;setTimeout(()=>sfx('thunder'),300+Math.random()*1400)}
  if(wxFlash>0){wxFlash=Math.max(0,wxFlash-dt*2.6);const f=wxFlash*(wxFlash>.55||(wxFlash>.25&&wxFlash<.4)?1:.25);hemi.intensity=WXB.hemi*(1+f*2.6);sun.intensity=WXB.sun*(1+f*1.2)}
}

let envDone=false;
function makeEnv(){
  if(envDone||!renderer)return;envDone=true;
  try{const pm=new THREE.PMREMGenerator(renderer),es=new THREE.Scene(),geo=new THREE.SphereGeometry(100,32,16),p=geo.attributes.position,col=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){const y=p.getY(i)/100,t=Math.max(0,y),g=Math.max(0,-y);col[i*3]=.55+.25*t-.4*g;col[i*3+1]=.56+.3*t-.42*g;col[i*3+2]=.55+.42*t-.44*g}
    geo.setAttribute('color',new THREE.BufferAttribute(col,3));es.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.BackSide})));
    const sm=new THREE.Mesh(new THREE.SphereGeometry(10,12,8),new THREE.MeshBasicMaterial({color:0xffffff}));sm.position.set(-45,60,35);es.add(sm);
    scene.environment=pm.fromScene(es,.03).texture;pm.dispose()}catch(e){}
}
function applyBiome(){
  if(MT.found){const d=curMap.dirt;MT.found.color.setRGB(d[0]/255*.62,d[1]/255*.62,d[2]/255*.62)}
  makeEnv();
  const M=curMap,hz=new THREE.Color(M.ga[0]/255,M.ga[1]/255,M.ga[2]/255).lerp(new THREE.Color(M.hemi[0]),.38).multiplyScalar(.66);
  scene.background.copy(hz);scene.fog.color.copy(hz);if(outPlane)outPlane.material.color.copy(hz);
  hemi.color.setHex(M.hemi[0]);hemi.groundColor.setHex(M.hemi[1]);hemi.intensity=M.hemi[2]*.7;sun.color.setHex(M.sun[0]);sun.intensity=M.sun[1]*1.2;CFT.value.set(...M.fogT);
  WXF=1;renderer.toneMappingExposure=1.18;if(crysM)crysM.material.emissiveIntensity=.62;
  if(pickWx==='night'){hz.lerp(new THREE.Color(0x0e1a30),.72).multiplyScalar(.55);hemi.color.lerp(new THREE.Color(0x6f88c8),.75);hemi.groundColor.multiplyScalar(.4);hemi.intensity*=.5;
    sun.color.setHex(0xa8bcff);sun.intensity*=.36;CFT.value.set(.82,.9,1.15,.34);renderer.toneMappingExposure=1.08;if(crysM)crysM.material.emissiveIntensity=1.25;WXF=.9}
  else if(pickWx==='storm'){const k=wxKind(),tc=new THREE.Color(k==='snow'?0xc8d2dc:k==='sand'?0xb08a5c:0x6a7682);hz.lerp(tc,.62);
    hemi.intensity*=.85;sun.intensity*=k==='sand'?.62:.45;hemi.color.lerp(tc,.3);WXF=k==='rain'?.6:k==='sand'?.46:.52}
  {const v=document.getElementById('wxVeil');if(v)v.className=pickWx==='storm'?'wx-'+wxKind():pickWx==='night'?'wx-night':''}
  scene.background.copy(hz);scene.fog.color.copy(hz);if(outPlane)outPlane.material.color.copy(hz);
  WXB.hemi=hemi.intensity;WXB.sun=sun.intensity;
  if(typeof postGrade==='function')postGrade();
}
function clearDetail(b){
  if(!detM)return;const inB=t=>{const x=t%MW,y=(t/MW)|0;return x>=b.tx&&x<b.tx+b.w&&y>=b.ty&&y<b.ty+b.h};
  for(const sc of scat)for(let i=0;i<sc.tile.length;i++)if(inB(sc.tile[i]))sc.ci.set(i,zeroM);
  for(let i=0;i<detTile.length;i++)if(inB(detTile[i]))detM.set(i,zeroM);
}
/* crystal fields: only tiles whose remembered amount changed are rewritten */
function refreshInst(){
  if(!crysM||!cryMem)return;
  if(!crysLast||crysLast.length!==cryMem.length)crysLast=new Int16Array(cryMem.length).fill(-1);
  let n=0;
  for(const i of crysList){
    const a=cryMem[i],q=a<=0?0:Math.ceil(a/20);
    if(crysLast[i]===q){n+=CPER;continue}crysLast[i]=q;
    /* shards disappear one by one as the tile is mined, the big centre crystal last */
    const f=Math.min(1,a/(cryMax?cryMax[i]||700:700)),shown=a<=0?0:Math.max(1,Math.ceil(CPER*f));
    for(let k=0;k<CPER;k++,n++)crysM.set(n,k>=shown?zeroM:crysMat(i,k,a,_m));
  }
}
function clampCam(){cam.x=Math.max(0,Math.min(WW,cam.x));cam.y=Math.max(0,Math.min(WH,cam.y))}
let camH=0;
function updateCamera(){
  const cp=Math.cos(PITCH),sp=Math.sin(PITCH);camH+=(hAt(cam.x,cam.y)-camH)*.15;
  camera.position.set(cam.x+Math.sin(yaw)*camDist*cp,camDist*sp+camH,cam.y+Math.cos(yaw)*camDist*cp);
  camera.lookAt(cam.x,camH,cam.y);scene.fog.near=camDist*1.7*WXF;scene.fog.far=(camDist*4.2+700)*WXF;camera.aspect=W/H;
  /* desktop: centre the 3D view in the area left of the command sidebar */
  if(DESK&&state!=='menu')camera.setViewOffset(W,H,155,0,W,H);else if(camera.view&&camera.view.enabled)camera.clearViewOffset();
  camera.updateProjectionMatrix();camera.updateMatrixWorld();
  {const sc=sun.shadow.camera,se=Math.max(680,Math.ceil(camDist*1.3/80)*80);if(sc.right!==se){sc.left=sc.bottom=-se;sc.right=sc.top=se;sc.far=Math.max(2400,se*3);sc.updateProjectionMatrix()}}
  sun.position.set(cam.x-300,650+camH,cam.y+260);sun.target.position.set(cam.x,camH,cam.y);sun.target.updateMatrixWorld();
}
const dying=[],debris=[];
const DG=new THREE.BoxGeometry(1,1,1);
function spawnDebris(x,y,z,n,sp,size,mats){
  for(let i=0;i<n&&debris.length<160;i++){
    const m=new THREE.Mesh(DG,mats[(vr()*mats.length)|0]),sz=size*(.5+vr());
    m.scale.set(sz,sz*.6,sz*.8);m.position.set(x+(vr()-.5)*size,y,z+(vr()-.5)*size);m.castShadow=true;world.add(m);
    const a=vr()*6.28,v=sp*(.4+vr()*.8);
    debris.push({m,vx:Math.cos(a)*v,vz:Math.sin(a)*v,vy:sp*(.8+vr()*1.2),rx:(vr()-.5)*14,rz:(vr()-.5)*14,life:2.5+vr()*2,sz});
  }
}
function updDebris(dt){
  for(let i=debris.length-1;i>=0;i--){
    const d=debris[i],m=d.m;d.vy-=520*dt;m.position.x+=d.vx*dt;m.position.y+=d.vy*dt;m.position.z+=d.vz*dt;
    const gy=hAt(m.position.x,m.position.z)+d.sz*.3;
    if(m.position.y<gy){m.position.y=gy;d.vy=d.vy<-40?-d.vy*.3:0;d.vx*=.6;d.vz*=.6;d.rx*=.5;d.rz*=.5}
    m.rotation.x+=d.rx*dt;m.rotation.z+=d.rz*dt;d.life-=dt;
    if(d.life<0){m.scale.multiplyScalar(.9);if(m.scale.x<.3){world.remove(m);debris.splice(i,1)}}
  }
}
/* burnt copy of a material: same shader (no new compile), darkened, lights out */
const burntCache=new Map(),RUBBLE_T=40,_noE=[0,1,2,3,4,5].map(()=>new THREE.Color(0,0,0)),_ash=new THREE.Color(.16,.15,.14);
function burnt(m){
  if(!m)return MT.char;if(Array.isArray(m))return m.map(burnt);let b=burntCache.get(m);if(b)return b;
  b=m.clone();b.onBeforeCompile=m.onBeforeCompile;b.customProgramCacheKey=m.customProgramCacheKey;
  if(b.color)b.color.lerp(_ash,.55).multiplyScalar(.5);if(b.emissive)b.emissive.setRGB(0,0,0);if('emissiveIntensity' in b)b.emissiveIntensity=0;
  /* merged meshes carry team colour / glow per vertex: wash those out too (same shader, own uniforms) */
  if(String(m.customProgramCacheKey&&m.customProgramCacheKey()).startsWith('uber')){const ob=m.onBeforeCompile;b.onBeforeCompile=sh=>{ob(sh);sh.uniforms.uPulse={value:0};sh.uniforms.uFE={value:_noE};
    sh.uniforms.uFC={value:sh.uniforms.uFC.value.map(c=>c.clone().lerp(_ash,.7))}}}
  b.userData={...m.userData,burnt:true};burntCache.set(m,b);return b;
}
/* a destroyed building keeps its own model: burnt, sagging, a few pieces knocked askew. Its ground pad stays put. */
function bldRubble(r,d){
  const g=r.g,pads=[];
  g.traverse(o=>{if(!o.isMesh)return;if(o.userData.decal){pads.push(o);return}o.material=burnt(o.material)});
  for(const o of pads)entGroup.attach(o);d.pads=pads;
  const h=(BTOP[d.type]||40);d.sink=h*.3;d.rx=(vr()<.5?-1:1)*(.05+vr()*.07);d.rz=(vr()-.5)*.16;
  /* knock some of the smaller parts (chimneys, dishes, tanks, cranes...) out of line */
  const box=new THREE.Box3(),kids=g.children.filter(o=>!o.userData.decal),sz=kids.map(o=>box.setFromObject(o).getSize(new THREE.Vector3()).length()),big=Math.max(1,...sz);
  d.parts=[];kids.forEach((o,i)=>{if(sz[i]>big*.6||vr()<.3)return;d.parts.push({o,r0x:o.rotation.x,r0z:o.rotation.z,y0:o.position.y,rx:(vr()<.5?-1:1)*(.25+vr()*.45),rz:(vr()-.5)*.6,dy:h*(.1+vr()*.25)})});
}
function startDeath(r){
  const e=r.e;if(e.silent){entGroup.remove(r.g);return}
  if(!r.g.visible){entGroup.remove(r.g);return}
  if(e.sold){dying.push({g:r.g,e,t:0,k:'b',sold:true,y0:r.g.position.y});return}
  {const dl=[];r.g.traverse(o=>{if(o.name==='dome')dl.push(o)});for(const o of dl)o.parent.remove(o)}
  const d={g:r.g,e,t:0,k:e.k,type:e.type,fall:vr()<.5?1:-1,tilt:(vr()-.5)*.35,tur:null,y0:r.g.position.y,x0:r.g.position.x,z0:r.g.position.z};
  if(e.k==='b')bldRubble(r,d);else r.g.traverse(o=>{if(o.isMesh)o.material=MT.char});
  if(e.k==='u'){
    if(e.type==='tank'||e.type==='harv'||e.type==='htank'||e.type==='mlrs'){
      if(r.turret){const t=r.turret;entGroup.attach(t);d.tur={m:t,vx:(vr()-.5)*50,vz:(vr()-.5)*50,vy:130+vr()*60,sp:(vr()-.5)*10}}
      spawnDebris(e.x,d.y0+8,e.y,7,120,5,[MT.char,MT.steel,TD[sides[e.side].col]]);
    }else spawnDebris(e.x,d.y0+6,e.y,3,60,2.4,[MT.char,MT.skin]);
  }else{
    spawnDebris(e.x,d.y0+20,e.y,8+e.w*e.h,170,5,[burnt(MT.plate2),burnt(MT.steel),MT.char,burnt(TD[sides[e.side].col]||MT.gun)]);
  }
  dying.push(d);
}
function updDying(dt){
  for(let i=dying.length-1;i>=0;i--){
    const d=dying[i],g=d.g;d.t+=dt;
    const rm=()=>{entGroup.remove(g);g.traverse(o=>{if(o.userData.decal)o.geometry.dispose()});for(const o of d.pads||[]){entGroup.remove(o);o.geometry.dispose()}if(d.tur)entGroup.remove(d.tur.m);dying.splice(i,1)};
    if(d.k==='u'){
      if(d.type==='tank'||d.type==='harv'||d.type==='htank'||d.type==='mlrs'){
        g.rotation.z=d.tilt*Math.min(1,d.t*3);
        if(d.tur){const t=d.tur,m=t.m,gy=hAt(m.position.x,m.position.z)+8;t.vy-=360*dt;
          if(m.position.y>gy||t.vy>0){m.position.x+=t.vx*dt;m.position.y+=t.vy*dt;m.position.z+=t.vz*dt;m.rotation.y+=t.sp*dt}else m.position.y=gy}
        if(d.t<6&&vr()<dt*7)fxs.push({t:'smoke',x:d.e.x+(vr()-.5)*10,y:d.e.y+(vr()-.5)*10,age:0,life:1.1,r:6});
        if(d.t>9)g.position.y-=dt*6;
        if(d.t>12)rm();
      }else{
        g.rotation.z=d.fall*Math.min(1,d.t/.3)*1.45;
        if(d.t>2)g.position.y-=dt*4;
        if(d.t>4)rm();
      }
    }else if(d.sold){
      g.position.y=d.y0-d.t*d.t*9;g.scale.y=Math.max(.05,1-d.t*.35);if(d.t>2.6)rm();
    }else{
      /* the building itself sags, leans and loses pieces, then stays as a burnt shell before sinking away */
      if(d.t<RUBBLE_T&&(d.chk=(d.chk||0)-dt)<=0){d.chk=.5;const o=d.e;if(blds.some(b=>!b.dead&&b!==o&&b.tx<o.tx+o.w&&b.tx+b.w>o.tx&&b.ty<o.ty+o.h&&b.ty+b.h>o.ty))d.t=RUBBLE_T}
      const k=Math.min(1,d.t/1.6),s=k*k*(3-2*k),sh=(1-k)*3.5;
      g.position.set(d.x0+(vr()-.5)*sh,d.y0-d.sink*s-(d.t>RUBBLE_T?(d.t-RUBBLE_T)*5:0),d.z0+(vr()-.5)*sh);
      g.rotation.x=d.rx*s;g.rotation.z=d.rz*s;g.scale.y=1-.36*s;
      for(const p of d.parts){p.o.rotation.x=p.r0x+p.rx*s;p.o.rotation.z=p.r0z+p.rz*s;p.o.position.y=p.y0-p.dy*s}
      if(d.t<10&&vr()<dt*(d.t<3?10:4))fxs.push({t:'smoke',x:d.e.x+(vr()-.5)*d.e.w*T*.6,y:d.e.y+(vr()-.5)*d.e.h*T*.6,age:0,life:1.6,r:9});
      if(d.t>RUBBLE_T+4)rm();
    }
  }
}
/* soft contact shadows under units and buildings: one instanced set of quads */
let aoM=null,aoN=0;
function aoInit(){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d'),g=x.createRadialGradient(32,32,0,32,32,32);
  g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(.5,'rgba(0,0,0,.6)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
  aoM=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,color:0x000000,opacity:.42,fog:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),700);
  aoM.frustumCulled=false;aoM.renderOrder=1;aoM.count=0;scene.add(aoM)}
function aoAdd(x,y,z,sx,sz,ang){if(aoN>=700)return;_q.setFromEuler(_e.set(0,ang||0,0));_m.compose(_p.set(x,y,z),_q,_s.set(sx,1,sz));aoM.setMatrixAt(aoN++,_m)}
function syncEntities(){
  const alive=new Set();if(!aoM&&renderer)aoInit();aoN=0;
  updDying(fdt);updDebris(fdt);
  {const pv=.8+.2*Math.sin(performance.now()/380);for(const m of TG)m.emissiveIntensity=pv;if(typeof UB_PULSE!=='undefined')UB_PULSE.value=pv}
  for(const e of units){
    alive.add(e.id);let r=ents.get(e.id);if(!r){r=modelUnit(e);ents.set(e.id,r);entGroup.add(r.g)}
    const v=seenBy0(e);r.g.visible=v;if(!v)continue;
    const ud=UDEF[e.type],now=performance.now()/1000,inf=ud.armor==='inf';
    const mv=r.px===undefined?0:Math.hypot(e.x-r.px,e.y-r.py);r.px=e.x;r.py=e.y;
    const moving=fdt>0&&mv/fdt>6;r.mf=(r.mf||0)+((moving?1:0)-(r.mf||0))*Math.min(1,fdt*8);r.ph=(r.ph||0)+mv*.3;
    if(r.c0!==undefined&&e.cool>r.c0+.05)r.rc=1;r.c0=e.cool;r.rc=Math.max(0,(r.rc||0)-fdt*5);
    const hover=false;let y=gH(e.x,e.y);
    {const LB=e.docked&&e.ref&&!e.ref.dead?e.ref:(e.exitT>0&&e.exitB&&!e.exitB.dead?e.exitB:null);
      if(LB){const lz=refLz(LB,e.x,e.y),ed=BDEF[LB.type].h*T/2,lift=(LB.type==='barracks'?3:GLB.scene.refinery?.3:3.6)*Math.max(0,Math.min(1,(ed+5-lz)/6));y=Math.max(y,footY(LB)+lift)}}
    if(inf){y+=Math.abs(Math.sin(r.ph))*.7*r.mf;if(r.legL){const sw=Math.sin(r.ph)*.75*r.mf;r.legL.rotation.z=sw;r.legR.rotation.z=-sw}if(r.gun)r.gun.position.x=-r.rc*1.4}
    else if(hover)y+=1.2+Math.sin(now*2.6+e.id)*.8;
    else{y+=Math.sin(r.ph*3)*.22*r.mf;if(e.type==='buggy')y+=Math.abs(Math.sin(r.ph*1.7))*.7*r.mf}
    r.g.position.set(e.x,y,e.y);
    {const d=ud.r*(inf?2.2:2.9);if(!e.cloaked)aoAdd(e.x,gH(e.x,e.y)+.6,e.y,d*(inf?1:1.3),d,-e.ang)}
    r.g.rotation.y=-(inf||(!r.turret&&e.type!=="harv")?e.tang:e.ang);
    r.g.rotation.z=(inf?0:-r.rc*.05)+(hover?Math.sin(now*1.7+e.id)*.03:0);
    if(r.turret){r.turret.rotation.y=-angd(e.ang,e.tang);r.turret.position.x=r.tx0-r.rc*2.2}
    if(!inf&&!hover&&state==='play'&&r.mf>.5&&vr()<fdt*5)fxs.push({t:'dust',x:e.x-Math.cos(e.ang)*12,y:e.y-Math.sin(e.ang)*12,h:2,age:0,life:1,r:5});
    if(r.cm){const op=e.cloaked?.32+.06*Math.sin(now*6):1;for(const m of r.cm){m.opacity=op;m.depthWrite=op>.9}}
    if(r.bin){const f=e.cargo/UDEF.harv.cap;r.bin.scale.y=.01+f*7;r.bin.position.y=12.6+f*3.5}
  }
  for(const e of blds){
    alive.add(e.id);let r=ents.get(e.id);
    if(!r){r=modelBld(e);const fy=footY(e);r.g.position.set(e.x,fy,e.y);r.g.add(bldDecal(e,fy));r.g.rotation.y=-(e.rot||0)*Math.PI/2;ents.set(e.id,r);entGroup.add(r.g)}
    const v=e.side===ME||visNow(e);r.g.visible=v;if(!v)continue;
    aoAdd(e.x,footY(e)+.5,e.y,e.w*T*1.22,e.h*T*1.22,0);
    if(r.turret)r.turret.rotation.y=-e.tang;
    if(r.crane){const busy=sides[e.side]&&sides[e.side].q.b.length&&!sides[e.side].low;r.cph+=fdt*(busy?1.6:.35);r.crane.rotation.y=-.25+Math.sin(r.cph)*(busy?.33:.12)}
    if(r.fans.length&&!(sides[e.side]&&sides[e.side].low))for(const fn of r.fans)fn.rotation.y+=fdt*9;
    if(r.doors.length){if(e.doorT>0)e.doorT-=fdt;const t2=e.doorT>0?e.doorT:0,op=Math.max(0,Math.min(1,(2.4-t2)/.4,t2/.5));
      r.doors.forEach((d,i)=>{const o=(r.doors.length<2||i===(e.doorI||0))?op:0;d.scale.y=1-.9*o})}
    if(r.domes.length){const on=!(sides[e.side]||{}).low;e.sfl=Math.max(0,(e.sfl||0)-fdt);for(const d of r.domes){d.visible=on;if(d.geometry.type==='SphereGeometry')d.material.opacity=.11+e.sfl*.5+.03*Math.sin(performance.now()/500)}}
    if(r.dish&&e.side>=0)r.dish.rotation.y+=fdt*.7;if(r.spin)r.spin.rotation.y+=fdt*(e.side>=0?1.4:.4);
    for(const gm of r.glow){gm.color.setHex((sides[e.side]||{}).low?0x7a2a20:0xffc94a);gm.emissive.setHex((sides[e.side]||{}).low?0x301008:0xffa020)}
    const stm=r.g.userData.steam;
    if(state==='play'&&fdt>0&&stm&&stm.length&&vr()<fdt*1.6){const sp=stm[(vr()*stm.length)|0];_v3.set(sp[0],sp[1],sp[2]);r.g.localToWorld(_v3);fxs.push({t:'steam',x:_v3.x,y:_v3.z,h:_v3.y-hAt(_v3.x,_v3.z),age:0,life:2.4,r:6})}
  }
  if(aoM){aoM.count=aoN;aoM.instanceMatrix.needsUpdate=true}
  for(const [id,r] of ents)if(!alive.has(id)){ents.delete(id);startDeath(r)}
  for(const [id,m] of memB){
    let g=memG.get(id);
    if(!g){g=fromTmpl('b:'+m.type+':'+skinOf(m.side),()=>buildBld(m.type,skinOf(m.side)));g.position.set(m.x,footY(m),m.y);g.rotation.y=-m.rot*Math.PI/2;memG.set(id,g);entGroup.add(g)}
    g.visible=!visNow(m);
  }
}
/* worn ground around each building: compacted gravel inside the footprint, scuffed earth fading out past the walls.
   The patch follows the terrain, so the building reads as standing on the ground rather than on a platform. */
const decalCache={};
function decalMat(wu,hu,m){
  const key=curMap.key+':'+wu+'x'+hu;if(decalCache[key])return decalCache[key];
  const S=256,c=document.createElement('canvas');c.width=c.height=S;const x=c.getContext('2d'),img=x.createImageData(S,S),D=img.data;
  const d=curMap.dirt,gv=curMap.ice?[150,156,162]:[128,122,110],TW=wu+2*m,TH=hu+2*m;
  const hs=(i,j)=>{const n=Math.sin(i*127.1+j*311.7)*43758.5453;return n-Math.floor(n)};
  const vn=(u,v)=>{const i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j,a=hs(i,j),b=hs(i+1,j),cc=hs(i,j+1),dd=hs(i+1,j+1),su=fu*fu*(3-2*fu),sv=fv*fv*(3-2*fv);return a+(b-a)*su+(cc-a)*sv+(a-b-cc+dd)*su*sv};
  for(let j=0;j<S;j++)for(let i=0;i<S;i++){
    const lx=(i/S-.5)*TW,lz=(j/S-.5)*TH,ox=Math.max(0,Math.abs(lx)-wu/2),oz=Math.max(0,Math.abs(lz)-hu/2),out=Math.hypot(ox,oz)/m;
    const n=vn(i/9,j/9)*.6+vn(i/3,j/3)*.4,edge=out+(n-.5)*.55;
    const inside=1-Math.min(1,Math.max(0,(edge+.15)/.3));
    let a=edge<1?Math.pow(1-Math.max(0,edge),1.4):0;a=Math.min(1,a*(.62+n*.5));
    const sp=hs(i*3.1,j*7.3),dark=.62+n*.3+(sp>.93?.22:sp<.06?-.2:0),o=(j*S+i)*4;
    for(let k=0;k<3;k++)D[o+k]=Math.max(0,Math.min(255,(d[k]*(1-inside*.6)+gv[k]*inside*.6)*dark));
    D[o+3]=a*215;
  }
  x.putImageData(img,0,0);const t=new THREE.CanvasTexture(c);t.anisotropy=4;
  return decalCache[key]=fogify(new THREE.MeshStandardMaterial({map:t,transparent:true,depthWrite:false,roughness:1,metalness:0,envMapIntensity:.1,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));
}
function bldDecal(e,y0){
  const D=BDEF[e.type],wu=D.w*T,hu=D.h*T,m=Math.min(18,Math.max(10,wu*.2)),nx=Math.ceil((wu+2*m)/6),nz=Math.ceil((hu+2*m)/6);
  const geo=new THREE.PlaneGeometry(wu+2*m,hu+2*m,nx,nz);geo.rotateX(-Math.PI/2);
  const p=geo.attributes.position,th=-(e.rot||0)*Math.PI/2,c=Math.cos(th),sn=Math.sin(th);
  for(let i=0;i<p.count;i++){const lx=p.getX(i),lz=p.getZ(i),wx=e.x+lx*c+lz*sn,wz=e.y-lx*sn+lz*c;p.setY(i,hAt(wx,wz)-y0+.35)}
  geo.computeVertexNormals();
  const o=new THREE.Mesh(geo,decalMat(wu,hu,m));o.receiveShadow=true;o.renderOrder=1;o.userData.decal=true;return o;
}
/* buildings settle into the ground: halfway between the lowest and highest point under them */
function footY(e){const x0=e.tx*T,z0=e.ty*T,x1=(e.tx+e.w)*T,z1=(e.ty+e.h)*T,hs=[hAt(x0,z0),hAt(x1,z0),hAt(x0,z1),hAt(x1,z1),hAt(e.x,e.y)];return (Math.max(...hs)+Math.min(...hs))/2-.15}
/* projectile looks: ballistic (tracers, shells, missiles, grenades) and energy (bolts, orbs, crystal lances) */
const PG={tr:new THREE.CylinderGeometry(.5,.5,1,5).rotateZ(Math.PI/2),shell:new THREE.CylinderGeometry(.9,.9,1,6).rotateZ(Math.PI/2),
  msl:(()=>{const a=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,7,8).rotateZ(Math.PI/2)),b=new THREE.Mesh(new THREE.ConeGeometry(.75,2.2,8).rotateZ(-Math.PI/2).translate(4.6,0,0)),
    c=new THREE.Mesh(new THREE.BoxGeometry(2,.15,2.6).translate(-2.6,0,0)),e=new THREE.Mesh(new THREE.BoxGeometry(2,2.6,.15).translate(-2.6,0,0));return mergeMeshes([a,b,c,e])})(),
  gr:new THREE.SphereGeometry(1.5,8,6),orb:new THREE.SphereGeometry(2.4,10,8),bolt:new THREE.CylinderGeometry(.5,.5,1,6).rotateZ(Math.PI/2)};
const PM={tr:new THREE.MeshBasicMaterial({color:0xffd27a,fog:false}),shell:new THREE.MeshBasicMaterial({color:0xfff1b0}),msl:mat(0xd8dcd6,{metalness:.5,roughness:.4}),gr:new THREE.MeshBasicMaterial({color:0x2c3226})};
const boltMats={};
function boltMat(c){return boltMats[c]||(boltMats[c]=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(1.15),fog:false}))}
const _dir=new THREE.Vector3(),_X=new THREE.Vector3(1,0,0);
function projLook(p){
  const w=p.wt;
  if(p.beam)return null;
  if(p.laser){
    if(w==='grenade'||w==='shell')return {g:PG.orb,m:boltMat(p.col),s:[1,1,1],glow:9};
    if(p.loft)return {g:PG.bolt,m:boltMat(p.col),s:[15,2.6,2.6],glow:11,lance:true};
    if(w==='rocket')return {g:PG.bolt,m:boltMat(p.col),s:[14,2.2,2.2],glow:10};
    return {g:PG.bolt,m:boltMat(p.col),s:[12,1.4,1.4],glow:6};
  }
  if(w==='rocket')return {g:PG.msl,m:PM.msl,s:[1.35,1.35,1.35],trail:true,flame:true};
  if(w==='grenade')return {g:PG.gr,m:PM.gr,s:[1,1,1],trail:.4};
  if(w==='shell')return {g:PG.shell,m:PM.shell,s:[3.4,1,1],trail:.5};
  if(w==='cannon'||w==='tcannon')return {g:PG.shell,m:PM.shell,s:[6,1,1],warm:6};
  if(w==='snipe')return {g:PG.tr,m:PM.tr,s:[20,.9,.9],warm:3};
  return {g:PG.tr,m:PM.tr,s:[12,1,1],warm:3};
}
function syncProj(){
  const live=new Set(projs);
  for(const p of projs){
    if(p.beam)continue;
    let m=projM.get(p);
    if(!m){const L=projLook(p);if(!L)continue;m=new THREE.Mesh(L.g,L.m);m.scale.set(...L.s);m.userData.L=L;world.add(m);projM.set(p,m)}
    const L=m.userData.L,t=p.tgt,rem=t?Math.hypot(t.x-p.x,t.y-p.y):0,pr=Math.min(1,Math.max(0,1-rem/p.d0));
    let x=p.x,z=p.y,h=p.h0+(p.h1-p.h0)*pr;
    if(p.wt==='shell'||p.wt==='grenade')h+=Math.sin(Math.PI*pr)*p.d0*(p.wt==='grenade'?.3:.35);
    if(p.loft){/* vertical launch: climbs almost straight up, then dives onto the target */
      const e=pr*pr*(3-2*pr);x=p.x0+(p.x-p.x0)*e;z=p.y0+(p.y-p.y0)*e;h+=Math.sin(Math.PI*Math.min(1,pr*1.15))*(70+p.d0*.3)}
    const y=h+gH(x,z);
    if(m.userData.px!==undefined){_dir.set(x-m.userData.px,y-m.userData.py,z-m.userData.pz);if(_dir.lengthSq()>.01)m.quaternion.setFromUnitVectors(_X,_dir.normalize())}
    m.userData.px=x;m.userData.py=y;m.userData.pz=z;m.position.set(x,y,z);
    if(fdt>0&&fxs.length<500){p.n=(p.n||0)+1;
      if(L.trail&&p.n%3===0&&vr()<(L.trail===true?1:L.trail*1.5))fxs.push({t:'trail',x,y:z,hy:y,age:0,life:L.trail===true?.9:.5,r:L.trail===true?4.4:2.4});
      if(L.flame)fxs.push({t:'flame',x,y:z,hy:y,age:0,life:.06,r:3});
      if(L.glow){fxs.push({t:'glowp',x,y:z,hy:y,col:p.col,age:0,life:.16,r:L.glow});fxs.push({t:'flame',x,y:z,hy:y,age:0,life:.04,r:L.glow*.35,white:true})}
      if(L.warm)fxs.push({t:'flame',x,y:z,hy:y,age:0,life:.05,r:L.warm*.6});
    }
  }
  for(const [p,m] of projM)if(!live.has(p)){world.remove(m);projM.delete(p)}
}
/* energy beams: an outer coloured shaft and a white core, faded out over their short life */
const beamPool=[];const beamGeo=new THREE.CylinderGeometry(1,1,1,8,1,true),_Y=new THREE.Vector3(0,1,0);
function getBeam(i){let b=beamPool[i];if(!b){const o=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,fog:false})),
  c=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));c.scale.set(.4,1.01,.4);c.renderOrder=7;o.add(c);o.renderOrder=6;fxGroup.add(o);b=beamPool[i]=o}return b}
const glowTex=(()=>{const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.4,'rgba(255,255,255,.6)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);return new THREE.CanvasTexture(c)})();
const ringGeo=new THREE.RingGeometry(.86,1,32).rotateX(-Math.PI/2);
function getSpr(i){let s=sprPool[i];if(!s){s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,depthWrite:false}));fxGroup.add(s);sprPool[i]=s}return s}
function getRing(pool,i,col){let r=pool[i];if(!r){r=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,depthTest:false,color:col||0xffffff}));r.renderOrder=10;fxGroup.add(r);pool[i]=r}return r}
function syncFx(){
  let si=0,ri=0;
  let bi=0;
  for(const f of fxs){
    if(f.age<0)continue;const k=f.age/f.life;
    if(f.t==='beam'){if(vis[ti(f.x,f.y)]!==2&&vis[ti(f.x1,f.y1)]!==2)continue;
      const bm=getBeam(bi++),y0=gH(f.x,f.y)+f.h,y1=gH(f.x1,f.y1)+f.h1;_dir.set(f.x1-f.x,y1-y0,f.y1-f.y);const L=_dir.length();
      bm.visible=true;bm.position.set((f.x+f.x1)/2,(y0+y1)/2,(f.y+f.y1)/2);bm.quaternion.setFromUnitVectors(_Y,_dir.normalize());
      const w=f.w*1.3*(1-k*.6);bm.scale.set(w,L,w);bm.material.color.set(f.col);bm.material.opacity=.8*(1-k*k);bm.children[0].material.opacity=.9*(1-k);continue}
    if(f.t==='ping'){
      const r=getRing(ringPool,ri++);r.visible=true;r.material.color.set(f.col);r.material.opacity=1-k;
      const d=6+f.r*k*1.6;r.scale.set(d,1,d);r.position.set(f.x,gH(f.x,f.y)+3,f.y);continue;
    }
    if(vis[ti(f.x,f.y)]!==2)continue;
    const s=getSpr(si++),m=s.material;s.visible=true;
    if(f.t==='boom'){m.blending=THREE.AdditiveBlending;m.color.setHex(0xff9a3c);m.opacity=1-k;const d=f.r*(1+2*k)*1.4;s.scale.set(d,d,1);s.position.set(f.x,gH(f.x,f.y)+10+k*14,f.y)}
    else if(f.t==='dust'){m.blending=THREE.NormalBlending;const dc=curMap.dirt;m.color.setRGB(dc[0]/200,dc[1]/200,dc[2]/200);m.opacity=.38*(1-k);const d=f.r*(2+3*k);s.scale.set(d,d,1);s.position.set(f.x,gH(f.x,f.y)+f.h+f.age*6,f.y)}
    else if(f.t==='steam'){m.blending=THREE.NormalBlending;m.color.setHex(0xe8eef0);m.opacity=.34*(1-k);const d=f.r*(2+4*k);s.scale.set(d,d,1);s.position.set(f.x,gH(f.x,f.y)+f.h+f.age*16,f.y)}
    else if(f.t==='smoke'){m.blending=THREE.NormalBlending;m.color.setHex(0x9aa09c);m.opacity=.45*(1-k);const d=f.r*(2+3*k);s.scale.set(d,d,1);s.position.set(f.x,gH(f.x,f.y)+12+f.age*22,f.y)}
    else if(f.t==='trail'){m.blending=THREE.NormalBlending;m.color.setHex(0xd8dcd8);m.opacity=.7*(1-k);const d=f.r*(1.4+3*k);s.scale.set(d,d,1);s.position.set(f.x,f.hy+f.age*6,f.y)}
    else if(f.t==='puff'){m.blending=THREE.NormalBlending;m.color.setHex(0xb4b8b2);m.opacity=.55*(1-k);const d=f.r*(1.2+2.6*k);s.scale.set(d,d,1);s.position.set(f.x,gH(f.x,f.y)+f.h+f.age*8,f.y)}
    else if(f.t==='flame'){m.blending=THREE.AdditiveBlending;m.color.setHex(f.white?0xffffff:0xffb050);m.opacity=1;const d=f.r*2.2;s.scale.set(d,d,1);s.position.set(f.x,f.hy,f.y)}
    else if(f.t==='glowp'){m.blending=THREE.NormalBlending;m.color.set(f.col);m.opacity=.7*(1-k);const d=f.r*(1.6-k*.6);s.scale.set(d,d,1);s.position.set(f.x,f.hy,f.y)}
    else{m.blending=THREE.AdditiveBlending;if(f.col)m.color.set(f.col);else m.color.setHex(0xffe08a);m.opacity=1-k;const d=f.r*2.4;s.scale.set(d,d,1);s.position.set(f.x,gH(f.x,f.y)+(f.h!=null?f.h:11),f.y)}
  }
  for(;bi<beamPool.length;bi++)beamPool[bi].visible=false;
  for(;si<sprPool.length;si++)sprPool[si].visible=false;
  for(;ri<ringPool.length;ri++)ringPool[ri].visible=false;
}
const phEl=$('#placeHint'),repHintEl=$('#repHint');let exitMk=null;
/* rendered cameos/portraits: a small second renderer draws each model once, cached as an image */
let thR=null;const thCache={};
const whiteTex=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1,THREE.RGBAFormat);whiteTex.needsUpdate=true;
const thScene=new THREE.Scene();thScene.add(new THREE.HemisphereLight(0xdfe8ff,0x30302a,.95));
{const a=new THREE.DirectionalLight(0xfff0d8,1.15);a.position.set(1.2,2,1.6);thScene.add(a);const b=new THREE.DirectionalLight(0x7fb6ff,.7);b.position.set(-1.5,1,-1.2);thScene.add(b)}
const thCam=new THREE.PerspectiveCamera(28,1,1,5000);
function thumb(type,side,size){
  const key=type+':'+side+':'+size;if(thCache[key]!==undefined)return thCache[key];
  try{
    if(!thR){thR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});thR.setClearColor(0x000000,0);thR.toneMapping=THREE.ACESFilmicToneMapping;thR.toneMappingExposure=1.2}
    thR.setPixelRatio(1);thR.setSize(size,size,false);
    const isB=!!BDEF[type],g=isB?fromTmpl('b:'+type+':'+side,()=>buildBld(type,side)):fromTmpl('u:'+type+':'+side,()=>buildUnit(type,side));
    {const dl=[];g.traverse(o=>{if(o.name==='dome')dl.push(o)});for(const o of dl)o.parent.remove(o)}
    const box=new THREE.Box3().setFromObject(g);box.min.y=Math.max(box.min.y,isB?-3:0);
    const c=box.getCenter(new THREE.Vector3()),r=box.getSize(new THREE.Vector3()).length()/2;
    const dir=new THREE.Vector3(1.25,.95,1.1).normalize();
    thCam.position.copy(c).addScaledVector(dir,r/Math.sin(THREE.MathUtils.degToRad(14))*.95);thCam.lookAt(c);thCam.updateProjectionMatrix();
    thScene.add(g);const prev=CFU.value,pe=CFE.value;CFU.value=whiteTex;CFE.value=1;thR.render(thScene,thCam);CFU.value=prev;CFE.value=pe;thScene.remove(g);
    return thCache[key]=thR.domElement.toDataURL('image/png');
  }catch(err){return thCache[key]=''}
}
function applyThumbs(){for(const t in btn){const im=btn[t].querySelector('img');const u=thumb(t,skinOf(ME),180);if(u)im.src=u;
  btn[t].hidden=def(t).fac!=null&&sides[ME].fac!==def(t).fac;
  if(UDEF[t]){const n=nm(t,ME);btn[t].querySelector('.nm').textContent=n;btn[t].setAttribute('aria-label',(btn[t].getAttribute('aria-label')||'').replace(/^[^.]*\./,n+'.'))}}}
const selMat=new THREE.MeshBasicMaterial({color:0x8dff9f,transparent:true,opacity:.95,depthTest:false,depthWrite:false});
function getSelBox(i){
  let b=selBoxes[i];
  if(!b){b=new THREE.Group();for(let k=0;k<4;k++){const m=new THREE.Mesh(G.box(1,1,1),selMat);m.renderOrder=10;b.add(m)}fxGroup.add(b);selBoxes[i]=b}
  return b;
}
function syncSel(){
  let ri=0,bi=0;
  for(const e of sel){
    if(e.dead||!seenBy0(e))continue;
    if(e.k==='u'){
      const r=getRing(selRings,ri++);r.material.color.setHex(0x8dff9f);r.material.opacity=.95;r.visible=true;
      const d=UDEF[e.type].r+5;r.scale.set(d,1,d);r.position.set(e.x,gH(e.x,e.y)+2.5,e.y);
    }else{
      const g=getSelBox(bi++),hw=e.w*T/2+3,hh=e.h*T/2+3,c=g.children;g.visible=true;g.position.set(e.x,(ents.get(e.id)?ents.get(e.id).g.position.y:0)+3,e.y);
      c[0].scale.set(hw*2,1.2,2);c[0].position.set(0,0,-hh);c[1].scale.set(hw*2,1.2,2);c[1].position.set(0,0,hh);
      c[2].scale.set(2,1.2,hh*2);c[2].position.set(-hw,0,0);c[3].scale.set(2,1.2,hh*2);c[3].position.set(hw,0,0);
    }
  }
  for(;ri<selRings.length;ri++)selRings[ri].visible=false;
  for(;bi<selBoxes.length;bi++)selBoxes[bi].visible=false;
}
/* weapon range of selected defenses (and of a defense being placed): a soft disc plus a crisp edge that follows the ground */
const rangeRings=[],RSEG=96;
function getRange(i){
  let r=rangeRings[i];if(r)return r;
  const mk=(n,op)=>new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:op,depthWrite:false,depthTest:false,fog:false});
  const fill=new THREE.BufferGeometry(),edge=new THREE.BufferGeometry(),fp=new Float32Array((RSEG+1)*3),ep=new Float32Array(RSEG*2*3),fi=[],ei=[];
  for(let k=0;k<RSEG;k++){const a=k+1,b=(k+1)%RSEG+1;fi.push(0,b,a);const o=k*2,q=((k+1)%RSEG)*2;ei.push(o,q,o+1,q,q+1,o+1)}
  fill.setAttribute('position',new THREE.BufferAttribute(fp,3));fill.setIndex(fi);edge.setAttribute('position',new THREE.BufferAttribute(ep,3));edge.setIndex(ei);
  const g=new THREE.Group(),fm=new THREE.Mesh(fill,mk(0,.1)),em=new THREE.Mesh(edge,mk(0,.95));fm.renderOrder=8;em.renderOrder=9;fm.frustumCulled=em.frustumCulled=false;g.add(fm,em);
  fxGroup.add(g);return rangeRings[i]=r={g,fm,em,key:''};
}
function drapeRange(r,cx,cz,R,col){
  r.g.visible=true;r.fm.material.color.setHex(col);r.em.material.color.setHex(col);
  const key=cx+','+cz+','+R;if(r.key===key)return;r.key=key;
  const fp=r.fm.geometry.attributes.position,ep=r.em.geometry.attributes.position,w=Math.max(2,R*.014);
  fp.setXYZ(0,cx,hAt(cx,cz)+2,cz);
  for(let k=0;k<RSEG;k++){const a=k/RSEG*Math.PI*2,c=Math.cos(a),s=Math.sin(a),x=cx+c*R,z=cz+s*R,y=hAt(x,z)+2.2;
    fp.setXYZ(k+1,x,y,z);ep.setXYZ(k*2,cx+c*(R-w),y,cz+s*(R-w));ep.setXYZ(k*2+1,cx+c*(R+w),y,cz+s*(R+w))}
  fp.needsUpdate=ep.needsUpdate=true;
}
function rangeOf(t){const d=BDEF[t];return d&&d.range?d.range*T+8:t==='shield'?SHIELD_R:0}
function syncRange(){
  let n=0;
  if(state==='play'){
    for(const e of sel){if(e.dead||e.k!=='b'||!seenBy0(e))continue;const R=rangeOf(e.type);if(!R)continue;
      drapeRange(getRange(n++),e.x,e.y,R,ally(ME,e.side)?(sides[e.side].low?0xffb020:0x8dff9f):0xff6a50)}
    if(place&&mouse.in&&rangeOf(place.t)){const sp=placeSpot(mouse.x,mouse.y,place.t,place.rot);if(sp){const d=dims(place.t,place.rot);
      drapeRange(getRange(n++),(sp.tx+d.w/2)*T,(sp.ty+d.h/2)*T,rangeOf(place.t),0x9fd4ff)}}
  }
  for(;n<rangeRings.length;n++){rangeRings[n].g.visible=false;rangeRings[n].key=''}
}
let ghostCache={},ghostShown=null;
/* nothing from a match (selection, ranges, placement ghost, build zone) may linger over the menu backdrop */
function hideGameFx(){
  for(const r of selRings)r.visible=false;for(const b of selBoxes)b.visible=false;for(const r of rangeRings){r.g.visible=false;r.key=''}
  if(typeof ghost!=='undefined'&&ghost)ghost.visible=false;if(typeof ghostShown!=='undefined'&&ghostShown){ghostShown.g.visible=false;ghostShown=null}
  if(typeof exitMk!=='undefined'&&exitMk)exitMk.visible=false;if(typeof zoneG!=='undefined'&&zoneG)zoneG.visible=false;
}

function ghostModel(t){
  if(ghostCache[t])return ghostCache[t];
  const f0=skinOf(ME),g=fromTmpl('b:'+t+':'+f0,()=>buildBld(t,f0)),mats=[];
  g.traverse(o=>{if(o.name==='dome'){o.visible=false;return}if(o.isMesh){const m=o.material.clone();m.transparent=true;m.opacity=.78;o.material=m;o.castShadow=false;mats.push(m)}});
  g.visible=false;world.add(g);return ghostCache[t]={g,mats};
}
/* dashed outline of the build zone around each of your yards, shown while placing a structure */
let zoneG=null,zoneKey='';
function syncZone(){
  const ys=yardsOf(ME),key=ys.map(b=>b.id).join(',');
  if(!zoneG||key!==zoneKey||zoneG.parent!==world){if(zoneG&&zoneG.parent)zoneG.parent.remove(zoneG);zoneKey=key;zoneG=new THREE.Group();
    const mat=new THREE.LineDashedMaterial({color:0x8dff9f,dashSize:14,gapSize:9,transparent:true,opacity:.9,depthTest:false,fog:false});
    const fill=new THREE.MeshBasicMaterial({color:0x8dff9f,transparent:true,opacity:.1,depthWrite:false,depthTest:false,fog:false});
    for(const b of ys){const cx=(b.tx+b.w/2)*T,cy=(b.ty+b.h/2)*T,R=BUILD_R*T,x0=Math.max(T,cx-R),x1=Math.min(WW-T,cx+R),y0=Math.max(T,cy-R),y1=Math.min(WH-T,cy+R),pts=[];
      const edge=(ax,ay,bx,by)=>{const n=Math.ceil(Math.hypot(bx-ax,by-ay)/16);for(let i=0;i<n;i++){const x=ax+(bx-ax)*i/n,y=ay+(by-ay)*i/n;pts.push(new THREE.Vector3(x,hAt(x,y)+2.5,y))}};
      edge(x0,y0,x1,y0);edge(x1,y0,x1,y1);edge(x1,y1,x0,y1);edge(x0,y1,x0,y0);pts.push(pts[0].clone());
      const ln=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat);ln.computeLineDistances();ln.renderOrder=9;zoneG.add(ln);
      const pg=new THREE.PlaneGeometry(x1-x0,y1-y0,Math.ceil((x1-x0)/T),Math.ceil((y1-y0)/T));pg.rotateX(-Math.PI/2);pg.translate((x0+x1)/2,0,(y0+y1)/2);
      const pp=pg.attributes.position;for(let i=0;i<pp.count;i++)pp.setY(i,hAt(pp.getX(i),pp.getZ(i))+1.5);const fm=new THREE.Mesh(pg,fill);fm.renderOrder=8;zoneG.add(fm)}
    world.add(zoneG)}
  zoneG.visible=!!place;
}
function syncGhost(){
  syncZone();
  phEl.hidden=!place;repHintEl.hidden=mode!=='repair';$('#sellHint').hidden=mode!=='sell';$('#riftHint').hidden=mode!=='rift';
  if(exitMk)exitMk.visible=false;
  if(ghostShown&&(!place||ghostShown!==ghostCache[place.t])){ghostShown.g.visible=false;ghostShown=null}
  if(!place||!mouse.in){ghost.visible=false;if(ghostShown)ghostShown.g.visible=false;return}
  const sp=placeSpot(mouse.x,mouse.y,place.t,place.rot);if(!sp){ghost.visible=false;return}
  const d=dims(place.t,place.rot),ok=validPlace(ME,place.t,sp.tx,sp.ty,0,place.rot);
  const cx=(sp.tx+d.w/2)*T,cz=(sp.ty+d.h/2)*T,gy=footY({tx:sp.tx,ty:sp.ty,w:d.w,h:d.h,x:cx,y:cz});
  ghost.visible=true;ghost.material.color.setHex(ok?0x5fd68a:0xff5b44);
  ghost.scale.set(d.w*T,2,d.h*T);ghost.position.set(cx,gy+1.5,cz);
  const gm=ghostModel(place.t);ghostShown=gm;gm.g.visible=true;
  gm.g.position.set(cx,gy,cz);gm.g.rotation.y=-place.rot*Math.PI/2;
  for(const m of gm.mats){m.emissive.setHex(ok?0x000000:0x8a1206);m.opacity=ok?.82:.6}
  if(exitMk&&(place.t==='barracks'||place.t==='factory'||place.t==='refinery')){
    const dp=doorPt({tx:sp.tx,ty:sp.ty,w:d.w,h:d.h,rot:place.rot}),dv=DOOR[place.rot],ex=dp[0]*T+dv[0]*8,ez=dp[1]*T+dv[1]*8,pl=1+.12*Math.sin(performance.now()/180);
    exitMk.visible=true;exitMk.position.set(ex,hAt(ex,ez)+2,ez);exitMk.rotation.y=-Math.atan2(dv[1],dv[0]);exitMk.scale.set(pl*1.5,1,pl*1.5);
  }
}
const WRENCH=new Path2D('M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z');
function hpBarO(x,y,w,f){
  ox.fillStyle='rgba(0,0,0,.7)';ox.fillRect(x-1,y-1,w+2,5);
  ox.fillStyle=f>.55?'#5fd68a':f>.25?'#ffb020':'#ff5b44';ox.fillRect(x,y,w*f,3);
}
function drawOverlay(){
  ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,W,H);
  if(state==='menu')return;
  for(const list of [units,blds])for(const e of list){
    if(!seenBy0(e)||(e.k==='b'&&e.side!==ME&&!visNow(e)))continue;
    const s=sel.includes(e);if(!s&&e.hp>=e.mhp)continue;
    const rr_=ents.get(e.id),top=(e.k==='u'?(rr_&&rr_.top||20):BTOP[e.type]+6)+(rr_?rr_.g.position.y:0);
    const p=toScreen(e.x,top+4,e.y);if(p.behind)continue;
    const w=e.k==='u'?26:Math.max(34,e.w*T*.55);hpBarO(p.x-w/2,p.y-4,w,Math.max(0,e.hp/e.mhp));
  }
  for(const b of blds){
    if(!b.repairing||b.dead||(b.side!==ME&&!visNow(b)))continue;const rr_=ents.get(b.id);
    const p=toScreen(b.x,BTOP[b.type]+(rr_?rr_.g.position.y:0)+22,b.y);if(p.behind)continue;
    const bob=Math.sin(performance.now()/220)*3;ox.save();ox.translate(p.x-12,p.y-12+bob);ox.scale(1,1);
    ox.fillStyle='rgba(10,15,13,.75)';ox.beginPath();ox.arc(12,12,15,0,6.3);ox.fill();ox.strokeStyle='#e6b043';ox.lineWidth=1.5;ox.stroke();
    ox.fillStyle='#e6b043';ox.fill(WRENCH);ox.restore();
  }
  /* rally flags */
  /* rally flags: shown only while their barracks / war factory is selected */
  for(const b of blds){if(!isProd(b)||!b.rally||!sel.includes(b))continue;const rp=toScreen(b.rally.x,hAt(b.rally.x,b.rally.y),b.rally.y);if(rp.behind)continue;const hot=true;
    if(hot){const bp=toScreen(b.x,footY(b)+6,b.y);ox.save();ox.setLineDash([5,5]);ox.strokeStyle='rgba(255,210,122,.7)';ox.lineWidth=1.5;ox.beginPath();ox.moveTo(bp.x,bp.y);ox.lineTo(rp.x,rp.y);ox.stroke();ox.restore()}
    ox.save();ox.translate(rp.x,rp.y);ox.globalAlpha=hot?1:.75;ox.strokeStyle='#1a1405';ox.lineWidth=3;ox.beginPath();ox.moveTo(0,0);ox.lineTo(0,-22);ox.stroke();ox.strokeStyle='#ffd27a';ox.lineWidth=1.6;ox.stroke();
    ox.fillStyle='#ffd27a';ox.beginPath();ox.moveTo(0,-22);ox.lineTo(13,-17.5);ox.lineTo(0,-13);ox.closePath();ox.fill();ox.strokeStyle='#1a1405';ox.lineWidth=1;ox.stroke();
    ox.fillStyle='rgba(255,210,122,.35)';ox.beginPath();ox.ellipse(0,0,7,3,0,0,6.3);ox.fill();ox.restore()}
  /* capture signal: three stacked chevrons stepping downward over buildings an engineer can take */
  {const engs=sel.filter(e=>e.k==='u'&&!e.dead&&e.side===ME&&e.type==='eng');
    if(engs.length&&state==='play'){
      const hov=ptrMouse&&mouse.in?pickScreen(mouse.x,mouse.y,e=>e.k==='b'&&e.side!==ME&&!e.dead):null,tgts=new Set(engs.map(e=>e.cap).filter(Boolean)),now2=performance.now()/1000;
      for(const b of blds){
        if(b.dead||!BDEF[b.type].cap||ally(ME,b.side)||!seenBy0(b))continue;const rr_=ents.get(b.id),hot=b===hov||tgts.has(b),sc=hot?1.45:1.1;
        const p=toScreen(b.x,BTOP[b.type]+(rr_?rr_.g.position.y:0)+20,b.y);if(p.behind||p.x<-30||p.y<-30||p.x>W+30||p.y>H+30)continue;
        ox.save();ox.translate(p.x,p.y);ox.scale(sc,sc);
        for(let i=0;i<3;i++){const ph=(now2*1.6+i/3)%1,y=-14+i*9+ph*6,a=(hot?1:.75)*Math.sin(Math.PI*ph);
          ox.globalAlpha=Math.max(0,a);ox.beginPath();ox.moveTo(-9,y);ox.lineTo(9,y);ox.lineTo(0,y+8);ox.closePath();
          ox.fillStyle=b.side<0?'#8dff9f':'#5fd68a';ox.fill();ox.lineWidth=1.6;ox.strokeStyle='rgba(4,20,10,.85)';ox.stroke()}
        ox.restore();
      }
    }}
  if(drag&&(!drag.touch||drag.box)&&!place&&Math.hypot(drag.x-drag.sx,drag.y-drag.sy)>5){
    ox.strokeStyle='#8dff9f';ox.lineWidth=1;ox.fillStyle='rgba(141,255,159,.1)';
    ox.fillRect(drag.sx,drag.sy,drag.x-drag.sx,drag.y-drag.sy);ox.strokeRect(drag.sx+.5,drag.sy+.5,drag.x-drag.sx,drag.y-drag.sy);
  }
}
/* the sun's shadow map is re-rendered every other frame (every third on slow devices) */
function shadowTick(){const sm=renderer.shadowMap;if(sm.autoUpdate)sm.autoUpdate=false;sm.needsUpdate=fcount%(lowFx?3:2)===0}
function draw(){
  if(!renderer)return;
  if(!world){renderScene();return}
  updWeather(state==='menu'?Math.min(.05,fdt||.016):fdt);
  if(state==='menu'){yaw+=fdt*.05;updateCamera();syncEntities();shadowTick();renderScene();ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,ov.width,ov.height);return}
  if(waterAnim)WTU.uWTime.value+=fdt;
  updateCamera();syncEntities();syncProj();syncFx();syncSel();syncRange();syncGhost();
  cvs.style.cursor=place?'copy':mode==='amove'?'crosshair':mode==='repair'||mode==='sell'?'pointer':'default';
  shadowTick();renderScene();
  drawOverlay();if(fcount%3===0)drawMini();
}
function drawMini(){
  const S=mm.width/MW;
  {const r=sides[ME].low?0:Math.round(yaw/(Math.PI/2))*(Math.PI/2);if(r!==mmRot){mmRot=r;mm.style.transform=`rotate(${r}rad)`}}
  if(sides[ME].low){
    mx.fillStyle='#050807';mx.fillRect(0,0,mm.width,mm.height);
    for(let i=0;i<500;i++){mx.fillStyle=`rgba(${120+Math.random()*80|0},${130+Math.random()*80|0},${120+Math.random()*60|0},${Math.random()*.18})`;mx.fillRect(Math.random()*mm.width,Math.random()*mm.height,2,1)}
    const cx=mm.width/2,cy=mm.height/2-14;mx.save();mx.translate(cx,cy);
    mx.fillStyle='#e6b043';mx.beginPath();mx.moveTo(4,-26);mx.lineTo(-14,4);mx.lineTo(-1,4);mx.lineTo(-6,26);mx.lineTo(14,-6);mx.lineTo(1,-6);mx.closePath();mx.fill();
    mx.strokeStyle='#ff5b44';mx.lineWidth=5;mx.beginPath();mx.arc(0,0,30,0,6.3);mx.moveTo(-21,-21);mx.lineTo(21,21);mx.stroke();mx.restore();
    if(((performance.now()/450)|0)%2===0){mx.fillStyle='#ff6a50';mx.font='700 18px Rajdhani,Arial Narrow,sans-serif';mx.textAlign='center';mx.fillText('LOW POWER',cx,cy+56)}
    return;
  }
  mx.imageSmoothingEnabled=false;mx.drawImage(mmTerrain,0,0,mm.width,mm.height);
  for(let i=0;i<MW*MH;i++)if(cryMem[i]>0){mx.fillStyle='#c46bff';mx.fillRect((i%MW)*S,((i/MW)|0)*S,S,S)}
  for(const b of blds)if(b.side===ME){mx.fillStyle=TCOL(ME);mx.fillRect(b.tx*S,b.ty*S,b.w*S,b.h*S)}
  for(const m of memB.values()){mx.fillStyle=TCOL(m.side);mx.fillRect(m.tx*S,m.ty*S,m.w*S,m.h*S)}
  for(const u of units)if(seenBy0(u)){mx.fillStyle=TCOL(u.side);mx.fillRect(u.x/T*S-1,u.y/T*S-1,3,3)}
  mx.imageSmoothingEnabled=true;mx.drawImage(fogC,0,0,mm.width,mm.height);
  alerts=alerts.filter(a=>time-a.t<12);
  for(const a of alerts){const ax=a.x/T*S,ay=a.y/T*S,k=((time-a.t0)*1.4)%1;
    mx.strokeStyle=`rgba(255,80,60,${1-k})`;mx.lineWidth=2;mx.beginPath();mx.arc(ax,ay,4+k*12,0,6.3);mx.stroke();
    mx.fillStyle='#ff4a36';mx.beginPath();mx.moveTo(ax,ay-9);mx.lineTo(ax+6,ay+2);mx.lineTo(ax-6,ay+2);mx.closePath();mx.fill();
    mx.fillStyle='#fff';mx.fillRect(ax-.8,ay-6,1.6,4);mx.fillRect(ax-.8,ay-1.2,1.6,1.6)}
  const cs=[[0,0],[W,0],[W,H],[0,H]].map(c=>screenToWorld(c[0],c[1])||{x:cam.x,y:cam.y});
  mx.strokeStyle='#fff';mx.lineWidth=1;mx.beginPath();cs.forEach((c,i)=>{const px=c.x/T*S,py=c.y/T*S;i?mx.lineTo(px,py):mx.moveTo(px,py)});mx.closePath();mx.stroke();
}
/* ---------- set dressing: a ruined city around the battlefield and burnt-out wrecks inside it ---------- */
let FACADE=null;
function facadeTex(){if(FACADE)return FACADE;
  FACADE=mkTex(x=>{speck(x,'#cfccc4',.12,4000);
    for(let f=0;f<4;f++){const y0=f*64;x.fillStyle='rgba(0,0,0,.22)';x.fillRect(0,y0+58,256,6);x.fillStyle='rgba(255,255,255,.12)';x.fillRect(0,y0+56,256,2);
      for(let w=0;w<4;w++){const wx=12+w*62,wy=y0+14,r=Math.random();
        x.fillStyle='rgba(60,58,52,.9)';x.fillRect(wx-3,wy-3,40,36);
        x.fillStyle=r<.18?'#0b0c0d':r<.3?'rgba(70,64,48,1)':'#1d252c';x.fillRect(wx,wy,34,30);
        if(r>=.3){x.fillStyle='rgba(150,180,200,.18)';x.fillRect(wx+2,wy+2,14,26);x.fillStyle='rgba(0,0,0,.5)';x.fillRect(wx+16,wy,2,30)}
        if(r<.18){x.fillStyle='rgba(0,0,0,.35)';x.beginPath();x.moveTo(wx-6,wy-4);x.lineTo(wx+40,wy-4);x.lineTo(wx+30,wy-26);x.lineTo(wx+6,wy-20);x.fill()}}}
    grime(x,.55)});
  return FACADE}
function buildCity(){
  if(GFX==='low')return;
  const M=curMap,grp=new THREE.Group(),tint=M.ice?0xd8dde2:['dunes','canyon','bowl'].includes(M.key)?0xd2c2a4:0xc4c2b8;
  const fac=fogify(new THREE.MeshStandardMaterial({color:tint,map:facadeTex(),normalMap:TEX.concreteN,normalScale:new THREE.Vector2(.4,.4),roughness:.9,metalness:0,envMapIntensity:.3}));
  const roof=MT.plate,placed=[],N=Math.round(18*MW/64);
  for(let k=0,tries=0;k<N&&tries<600;tries++){
    const side=(vr()*4)|0,along=-160+vr()*(WW+320),d=55+vr()*230,w=70+vr()*90,dp=60+vr()*80;let h=50+vr()*110;
    const [x,z,ry]=side===ME?[along,-d,0]:side===1?[along,WH+d,0]:side===2?[-d,along,Math.PI/2]:[WW+d,along,Math.PI/2];
    const r=Math.hypot(w,dp)/2;if(placed.some(p=>Math.hypot(p[0]-x,p[1]-z)<p[2]+r+24))continue;placed.push([x,z,r]);k++;
    /* sample the ground under the whole footprint: the block starts below its lowest point so no side hangs in the air */
    let lo=1e9,hi=-1e9;for(let a=-1;a<=1;a+=.5)for(let b=-1;b<=1;b+=.5){const lx=a*w/2,lz=b*dp/2,cr=Math.cos(ry),sr=Math.sin(ry),gh=outH(x+lx*cr+lz*sr,z-lx*sr+lz*cr);lo=Math.min(lo,gh);hi=Math.max(hi,gh)}
    if(hi-lo>40)continue;
    const y=lo-6;h+=hi-lo;const geo=new THREE.BoxGeometry(w,h,dp),uv=geo.attributes.uv;
    for(let f=0;f<6;f++){const sw=f<2?dp:w,sh=f===2||f===3?dp:h;for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*sw/64,uv.getY(i)*sh/64)}}
    const b=new THREE.Mesh(geo,[fac,fac,roof,roof,fac,fac]);b.position.set(x,y+h/2,z);b.rotation.y=ry;b.castShadow=b.receiveShadow=true;grp.add(b);
    const top=new THREE.Group();top.position.set(x,y+h,z);top.rotation.y=ry;grp.add(top);
    if(vr()<.45){/* collapsed corner: a broken slab and rubble */
      P(top,G.box(w*.4,8,dp*.5),MT.concrete,w*.25,-4,dp*.2,.25,0,.18);for(let q=0;q<4;q++)P(top,G.box(6+vr()*8,4+vr()*4,6+vr()*8),MT.concrete,(vr()-.5)*w*.6,1,(vr()-.5)*dp*.6,vr(),vr()*3,vr())}
    else{P(top,G.box(w-6,2,dp-6),MT.plate2,0,1,0);P(top,G.box(10,6,8),MT.steel,-w*.25,4,-dp*.2);P(top,G.cyl(5,5,9,12),MT.rust,w*.25,6.5,dp*.15)}
  }
  bake(grp);world.add(grp);
}
function buildWrecks(){
  const grp=new THREE.Group(),far=(x,y)=>BASES.every(b=>Math.hypot(x-b[0],y-b[1])>14),N=Math.round(7*MW*MH/4096);
  const useW=GLB.scene.p_wreck_tank&&GLB.scene.p_wreck_truck,wl=[[],[]];
  for(let n=0,tries=0;n<N&&tries<300;tries++){const tx=2+(vr()*(MW-4)|0),ty=2+(vr()*(MH-4)|0),i=ty*MW+tx;
    if(ter[i]||occ[i]||cry[i]>0||!far(tx,ty)||inPlaza(tx,ty))continue;n++;
    if(useW){wl[vr()<.6?0:1].push(propM((tx+.5)*T,(ty+.5)*T,.2,1));continue}
    const x=(tx+.5)*T,z=(ty+.5)*T,w=new THREE.Group();w.position.set(x,hAt(x,z),z);w.rotation.y=vr()*6.28;
    const tank=vr()<.65;
    if(tank){for(const sd of [-1,1])P(w,G.box(30,6,6),MT.dark,0,3,sd*8,0,0,sd*.04);P(w,G.box(28,7,13),MT.char,0,7,0,.06,0,.03);
      P(w,G.box(13,5,11),MT.char,-2,13,1,0,.6+vr(),0);P(w,G.cylx(1.2,16),MT.rust,8,13,2,0,.5,-.18);P(w,G.box(6,3,4),MT.rust,10,3,9,.4,.3,.6)}
    else{P(w,G.box(20,6,10),MT.rust,0,4,0,.05,0,.1);P(w,G.box(9,5,9),MT.char,6,9,0,0,0,-.08);for(const [a,b] of [[-7,-5],[-7,5],[7,-5],[7,5]])P(w,G.whl(2.6,2),MT.dark,a,2.2,b)}
    w.updateMatrix();for(const c of [...w.children]){c.applyMatrix4(w.matrix);grp.add(c)}
  }
  bake(grp);grp.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true});world.add(grp);
  if(useW){glbScatter('p_wreck_tank',wl[0]);glbScatter('p_wreck_truck',wl[1])}
  /* telegraph poles alongside every road */
  if(GLB.scene.p_pole&&curLayout){const L=[],seen=new Set();
    for(let c=0;c<4;c++){const pts=curLayout.road.map(([x,y])=>cornerXY(c,x,y));let carry=0;
      for(let k=1;k<pts.length;k++){const [ax,ay]=pts[k-1],[bx,by]=pts[k],l=Math.hypot(bx-ax,by-ay);if(l<.01)continue;const dx=(bx-ax)/l,dy=(by-ay)/l;
        for(let d=carry;d<l;d+=3.8){const tx=ax+dx*d-dy*1.6,ty=ay+dy*d+dx*1.6,ix=tx|0,iy=ty|0,j=iy*MW+ix,key=Math.round(tx/2)+','+Math.round(ty/2);
          if(ix<1||iy<1||ix>=MW-1||iy>=MH-1||ter[j]||cry[j]>0||inPlaza(tx,ty)||BASES.some(b=>Math.hypot(tx-b[0],ty-b[1])<8)||seen.has(key))continue;
          seen.add(key);const x=tx*T,z=ty*T;_p.set(x,hAt(x,z)-.3,z);_q.setFromEuler(_e.set((vr()-.5)*.06,Math.atan2(-dy,dx)+Math.PI/2,(vr()-.5)*.06));_s.set(1,1,1);L.push({m:_m.compose(_p,_q,_s).clone()})}
        carry=(carry-l)%3.8;if(carry<0)carry+=3.8}}
    glbScatter('p_pole',L)}
}
