'use strict';
/* ---------- 3D rendering ---------- */
let renderer=null,fdt=0;
try{renderer=new THREE.WebGLRenderer({canvas:cvs,antialias:true,powerPreference:'high-performance'})}catch(err){renderer=null}
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a0f0d);
scene.fog=new THREE.Fog(0x0a0f0d,950,2500);
const camera=new THREE.PerspectiveCamera(42,1,30,6000);
const PITCH=.95;
const hemi=new THREE.HemisphereLight(0xcfe0ff,0x3a3a28,.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d2,.95);
if(renderer){
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  sun.castShadow=true;const sms=TOUCH?1024:2048;sun.shadow.mapSize.set(sms,sms);sun.shadow.normalBias=.6;
  Object.assign(sun.shadow.camera,{left:-680,right:680,top:680,bottom:-680,near:50,far:2400});sun.shadow.bias=-.0006;
}
scene.add(sun,sun.target);
const fxGroup=new THREE.Group();scene.add(fxGroup);

const gcache={};
/* segment counts scale with size: small parts are seen from far away and need few facets */
const rseg=(r,a,b,c,d)=>r<1.5?a:r<4?b:r<10?c:d;
const gk=(k,f)=>gcache[k]||(gcache[k]=f());
/* smooth normals that keep hard edges sharper than `deg` */
function creased(geo,deg){
  geo=geo.index?geo.toNonIndexed():geo;
  const p=geo.attributes.position,n=p.count,fn=new Float32Array(n*3),A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3();
  for(let i=0;i<n;i+=3){A.fromBufferAttribute(p,i);B.fromBufferAttribute(p,i+1);C.fromBufferAttribute(p,i+2);
    C.sub(B);B.sub(A);C.cross(B).normalize().negate();for(let k=0;k<3;k++){fn[(i+k)*3]=C.x;fn[(i+k)*3+1]=C.y;fn[(i+k)*3+2]=C.z}}
  const map=new Map(),key=i=>Math.round(p.getX(i)*100)+','+Math.round(p.getY(i)*100)+','+Math.round(p.getZ(i)*100);
  for(let i=0;i<n;i++){const k=key(i);let l=map.get(k);if(!l)map.set(k,l=[]);l.push(i)}
  const out=new Float32Array(n*3),ct=Math.cos(deg*Math.PI/180);
  for(const l of map.values())for(const i of l){
    let x=0,y=0,z=0;const ax=fn[i*3],ay=fn[i*3+1],az=fn[i*3+2];
    for(const j of l){const bx=fn[j*3],by=fn[j*3+1],bz=fn[j*3+2];if(ax*bx+ay*by+az*bz>=ct){x+=bx;y+=by;z+=bz}}
    const L=Math.hypot(x,y,z)||1;out[i*3]=x/L;out[i*3+1]=y/L;out[i*3+2]=z/L;
  }
  geo.setAttribute('normal',new THREE.BufferAttribute(out,3));return geo;
}
function scaleUV(g,k){const uv=g.attributes.uv;if(uv){for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*k,uv.getY(i)*k)}return g}
function rrect(w,d,r){const s=new THREE.Shape(),x=-w/2,y=-d/2;r=Math.max(.01,Math.min(r,w/2,d/2));
  s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);
  s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s}
const G={
  /* bevelled, rounded box (falls back to a plain box when very thin) */
  box:(w,h,d)=>gk('b'+w+','+h+','+d,()=>{
    const m=Math.min(w,h,d);if(m<2.4)return new THREE.BoxGeometry(w,h,d);
    const b=Math.min(1.8,m/4.5),sw=w-2*b,sd=d-2*b,dep=h-2*b,lo=m<6;
    const g=new THREE.ExtrudeGeometry(rrect(sw,sd,b*.8),{depth:Math.max(.01,dep),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:lo?1:2,curveSegments:lo?2:3});
    g.translate(0,0,-dep/2);g.rotateX(-Math.PI/2);scaleUV(g,1/22);return creased(g,38)}),
  cyl:(a,b,h,s)=>{s=s||rseg(Math.max(a,b),10,16,24,32);return gk('c'+a+','+b+','+h+','+s,()=>new THREE.CylinderGeometry(a,b,h,s))},
  cylx:(a,h,s)=>gk('x'+a+','+h+','+(s||16),()=>creased(new THREE.CylinderGeometry(a,a,h,s||16).rotateZ(Math.PI/2),50)),
  whl:(r,w)=>gk('w'+r+','+w,()=>creased(new THREE.CylinderGeometry(r,r,w,rseg(r,10,14,18,20)).rotateX(Math.PI/2),50)),
  sph:(r)=>gk('s'+r,()=>new THREE.SphereGeometry(r,rseg(r,8,12,18,24),rseg(r,6,8,12,16))),
  dome:(r)=>gk('d'+r,()=>new THREE.SphereGeometry(r,rseg(r,10,16,24,32),rseg(r,4,6,9,12),0,Math.PI*2,0,Math.PI/2)),
  /* half cylinder lying along z, arch upward, flat on y=0 */
  arch:(r,len)=>gk('a'+r+','+len,()=>creased(new THREE.CylinderGeometry(r,r,len,rseg(r,10,14,20,28),1,false,Math.PI/2,Math.PI).rotateX(Math.PI/2),40)),
  /* upright half-ring (rib) in the x/y plane */
  rib:(r,t)=>gk('r'+r+','+t,()=>new THREE.TorusGeometry(r,t,6,rseg(r,10,14,20,24),Math.PI)),
  ring:(r,t)=>gk('o'+r+','+t,()=>new THREE.TorusGeometry(r,t,6,rseg(r,16,24,32,44)).rotateX(Math.PI/2)),
  cone:(r,h,s)=>gk('k'+r+','+h+','+(s||4),()=>new THREE.ConeGeometry(r,h,s||4)),
  conex:(r,h,s)=>gk('kx'+r+','+h+','+(s||4),()=>new THREE.ConeGeometry(r,h,s||4).rotateZ(-Math.PI/2)),
  prof:(name,pts,d)=>gk('p'+name+d,()=>{const sh=new THREE.Shape();pts.forEach((p,i)=>i?sh.lineTo(p[0],p[1]):sh.moveTo(p[0],p[1]));
    return creased(scaleUV(new THREE.ExtrudeGeometry(sh,{depth:d-1.6,bevelEnabled:true,bevelThickness:.8,bevelSize:.8,bevelSegments:2}).translate(0,0,-(d-1.6)/2),1/22),38)})
};
/* map memory: everything outside current vision is drawn desaturated, using a per-tile visibility texture */
const visC=document.createElement('canvas');visC.width=MW;visC.height=MH;const visX=visC.getContext('2d');let visImg=visX.createImageData(MW,MH);
function visResize(){visC.width=MW;visC.height=MH;visImg=visX.createImageData(MW,MH);visX.fillStyle='#000';visX.fillRect(0,0,MW,MH);CFZ.value.set(WW,WH);visTex.dispose();visTex.needsUpdate=true}
visX.fillStyle='#000';visX.fillRect(0,0,MW,MH);
const visTex=new THREE.CanvasTexture(visC);visTex.flipY=false;visTex.minFilter=visTex.magFilter=THREE.LinearFilter;visTex.generateMipmaps=false;
const CFS={value:1.12},CFZ={value:new THREE.Vector2(WW,WH)},CFU={value:visTex},CFT={value:new THREE.Vector4(1,1.02,1.05,.5)};
/* fog of war outside the map: 0 = unseen (in a match), 1 = lit (menu backdrop, build-menu pictures) */
const CFE={value:1};
function cfCompile(sh){
  sh.uniforms.uCfVis=CFU;sh.uniforms.uCfTint=CFT;sh.uniforms.uSat=CFS;sh.uniforms.uCfSize=CFZ;sh.uniforms.uCfEdge=CFE;
  sh.vertexShader='varying vec3 vCfW;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vec4 cfp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n cfp=instanceMatrix*cfp;\n#endif\n vCfW=(modelMatrix*cfp).xyz;');
  sh.fragmentShader='uniform float uSat;\nuniform float uCfEdge;\nuniform vec2 uCfSize;\nuniform sampler2D uCfVis;\nuniform vec4 uCfTint;\nvarying vec3 vCfW;\n'+sh.fragmentShader.replace('#include <dithering_fragment>',
    '{float sl=dot(gl_FragColor.rgb,vec3(.299,.587,.114));gl_FragColor.rgb=max(mix(vec3(sl),gl_FragColor.rgb,uSat),0.);}\n vec2 cfuv=vCfW.xz/uCfSize;float cfv=texture2D(uCfVis,cfuv).r;\n vec2 cfd=min(cfuv,1.-cfuv)*uCfSize/32.;cfv=mix(min(cfv,uCfEdge),cfv,clamp(min(cfd.x,cfd.y)+1.,0.,1.));\n float cfl=dot(gl_FragColor.rgb,vec3(.299,.587,.114));\n gl_FragColor.rgb=mix(vec3(pow(cfl,1.35))*uCfTint.rgb*uCfTint.a+.015,gl_FragColor.rgb,cfv);\n#include <dithering_fragment>');
}
function fogify(m){m.onBeforeCompile=cfCompile;return m}
/* photo-scanned ground (CC0 texture sets from Poly Haven): leafy mud (A) and dry cracked mud (B), colour + normal maps */
const GTU={uGA:{value:null},uGNA:{value:null},uGB:{value:null},uGNB:{value:null},uGOn:{value:0},
  uGMeanA:{value:new THREE.Vector3(.395,.329,.2)},uGMeanB:{value:new THREE.Vector3(.812,.662,.506)}};
(()=>{const L=new THREE.TextureLoader(),src={uGA:'tex/leaf_d.jpg',uGNA:'tex/leaf_n.jpg',uGB:'tex/crack_d.jpg',uGNB:'tex/crack_n.jpg'},keys=Object.keys(src);let n=0;
  for(const k of keys){const t=L.load(src[k],()=>{if(++n===keys.length)GTU.uGOn.value=1},undefined,()=>console.warn('ground texture missing: '+src[k]));
    t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;GTU[k].value=t}})();
/* o.mask: per-map canvas texture (r = photo amount, g = cracked-mud share); o.raw: 0 = keep map colours, 1 = photo colours;
   o.w: overall strength; o.crack: cracked-mud share when there is no mask; o.ns: bump strength */
function groundify(m,o){o=o||{};
  const gU={uGMask:{value:o.mask||TEX.gdet},uGCfg:{value:new THREE.Vector4(o.mask?1:0,o.raw||0,o.w==null?1:o.w,o.crack||0)},uGNs:{value:o.ns==null?1:o.ns}};m.userData.gU=gU;
  m.onBeforeCompile=sh=>{cfCompile(sh);sh.uniforms.uDet={value:TEX.gdet};Object.assign(sh.uniforms,GTU,m.userData.gU);
    sh.fragmentShader='uniform sampler2D uDet,uGA,uGNA,uGB,uGNB,uGMask;\nuniform float uGOn,uGNs;\nuniform vec3 uGMeanA,uGMeanB;\nuniform vec4 uGCfg;\n'+sh.fragmentShader
    .replace('#include <map_fragment>',`#include <map_fragment>
 vec3 cfD1=texture2D(uDet,vCfW.xz/88.).rgb,cfD2=texture2D(uDet,vCfW.xz/330.+.37).rgb;
 vec4 cfGM=uGCfg.x>.5?texture2D(uGMask,vCfW.xz/uCfSize):vec4(1.,uGCfg.w,0.,1.);
 float cfGW=cfGM.r*uGCfg.z*uGOn,cfGC=uGCfg.x>.5?cfGM.g:uGCfg.w;
 float cfGB=smoothstep(-.25,.25,sin(vCfW.x/173.+1.3)*sin(vCfW.z/211.)+sin((vCfW.x+vCfW.z)/97.)*.5);
 mat2 cfR=mat2(.8,-.6,.6,.8);vec2 cfUA=vCfW.xz/118.,cfUB=vCfW.xz/150.,cfUA2=cfR*cfUA*.61+.37,cfUB2=cfR*cfUB*.61+.37;
 vec3 cfPh=mix(mix(texture2D(uGA,cfUA).rgb,texture2D(uGA,cfUA2).rgb,cfGB),mix(texture2D(uGB,cfUB).rgb,texture2D(uGB,cfUB2).rgb,cfGB),cfGC),cfMn=mix(uGMeanA,uGMeanB,cfGC);
 vec3 cfPt=diffuseColor.rgb*(.74+cfD2*.52);
 float cfPl=dot(cfPt,vec3(.299,.587,.114))/dot(cfMn,vec3(.299,.587,.114));
 vec3 cfPhoto=mix(cfPt*pow(cfPh/cfMn,vec3(.85)),cfPh*cfPl,uGCfg.y);
 diffuseColor.rgb=mix(cfPt*(.42+cfD1*1.16),cfPhoto*(.9+cfD1*.2),cfGW);`)
    .replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 if(cfGW>.002){
  vec3 cfA1=texture2D(uGNA,cfUA).xyz*2.-1.,cfA2=texture2D(uGNA,cfUA2).xyz*2.-1.,cfB1=texture2D(uGNB,cfUB).xyz*2.-1.,cfB2=texture2D(uGNB,cfUB2).xyz*2.-1.;
  cfA2.xy=cfA2.xy*cfR;cfB2.xy=cfB2.xy*cfR;
  vec3 cfTn=mix(mix(cfA1,cfA2,cfGB),mix(cfB1,cfB2,cfGB),cfGC);cfTn.xy*=uGNs*cfGW;
  vec3 cfTx=(viewMatrix*vec4(1.,0.,0.,0.)).xyz,cfTz=(viewMatrix*vec4(0.,0.,1.,0.)).xyz;
  cfTx=normalize(cfTx-normal*dot(normal,cfTx));cfTz=normalize(cfTz-normal*dot(normal,cfTz));
  normal=normalize(cfTx*cfTn.x+cfTz*cfTn.y+normal*max(cfTn.z,.05));
 }`)};return m}
/* how each map uses the photo ground: raw = how much of the photo's own colour shows through */
const GPHOTO={valley:{raw:.55},delta:{raw:.55},cross:{raw:.55},dunes:{raw:.5},bowl:{raw:.5},canyon:{raw:.25},frost:{raw:0,w:.5,ns:.7}};
const mat=(c,o)=>fogify(new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:.6,metalness:.25,flatShading:false,envMapIntensity:.6},o||{})));
/* procedural surface textures (greyscale, tinted by each material's colour) */
const ANISO=renderer?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;
/* drawn in 256-unit coordinates onto a 512 canvas for crisper detail */
function mkTex(draw){const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.scale(2,2);draw(x);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=ANISO;return t}
/* tangent-space normal map from a texture's brightness (seams and grooves read as real relief) */
function nrmMap(src,str){
  const c=src.image,w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,o=document.createElement('canvas');o.width=w;o.height=h;
  const ox=o.getContext('2d'),id=ox.createImageData(w,h),D=id.data,L=new Float32Array(w*h);
  for(let i=0;i<w*h;i++)L[i]=(d[i*4]+d[i*4+1]+d[i*4+2])/765;
  for(let y=0;y<h;y++){const ym=((y-1+h)%h)*w,yp=((y+1)%h)*w,y0=y*w;
    for(let x=0;x<w;x++){const xm=(x-1+w)%w,xp=(x+1)%w,dx=(L[y0+xp]-L[y0+xm])*str,dy=(L[yp+x]-L[ym+x])*str,l=Math.sqrt(dx*dx+dy*dy+1),i=(y0+x)*4;
      D[i]=(-dx/l*.5+.5)*255;D[i+1]=(dy/l*.5+.5)*255;D[i+2]=(1/l*.5+.5)*255;D[i+3]=255}}
  ox.putImageData(id,0,0);const t=new THREE.CanvasTexture(o);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=ANISO;return t}
/* fine grain plus a few soft mottles, instead of coarse random blocks */
function speck(x,base,amt,n){x.fillStyle=base;x.fillRect(0,0,256,256);
  for(let i=0;i<n*1.6;i++){x.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},${Math.random()*amt*.55})`;const s=.5+Math.random()*.9;x.fillRect(Math.random()*256,Math.random()*256,s,s)}
  for(let i=0;i<10;i++){const px=Math.random()*256,py=Math.random()*256,r=18+Math.random()*50,g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${Math.random()<.5?'0,0,0':'255,255,255'},${amt*.35})`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}}
function grime(x,a){const gr=x.createLinearGradient(0,256,0,150);gr.addColorStop(0,`rgba(40,32,24,${a})`);gr.addColorStop(1,'rgba(40,32,24,0)');x.fillStyle=gr;x.fillRect(0,0,256,256);
  for(let i=0;i<14;i++){const sx=Math.random()*256,sw=2+Math.random()*6,sg=x.createLinearGradient(0,0,0,256);sg.addColorStop(0,'rgba(0,0,0,.09)');sg.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=sg;x.fillRect(sx,0,sw,120+Math.random()*130)}}
const TEX={
  panel:mkTex(x=>{speck(x,'#e8e8e8',.12,4500);
    x.lineWidth=2;for(const [a,b,c,d] of [[0,64,256,64],[0,160,256,160],[96,0,96,64],[180,64,180,160],[60,160,60,256],[200,160,200,256]]){x.strokeStyle='rgba(0,0,0,.38)';x.beginPath();x.moveTo(a,b);x.lineTo(c,d);x.stroke();x.strokeStyle='rgba(255,255,255,.3)';x.beginPath();x.moveTo(a+1,b+1);x.lineTo(c+1,d+1);x.stroke()}
    x.fillStyle='rgba(0,0,0,.35)';for(let i=0;i<256;i+=16){for(const yy of [58,70,154,166])x.fillRect(i+4,yy,2,2)}grime(x,.4)}),
  concrete:mkTex(x=>{speck(x,'#dcdcd6',.14,6000);
    for(let i=0;i<30;i++){const px=Math.random()*256,py=Math.random()*256,r=10+Math.random()*40,g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${Math.random()<.5?'60,55,48':'255,255,250'},.12)`);g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)}
    x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=1;for(let i=0;i<5;i++){let px=Math.random()*256,py=Math.random()*256,a=Math.random()*6.28;x.beginPath();x.moveTo(px,py);for(let k=0;k<6;k++){a+=(Math.random()-.5);px+=Math.cos(a)*12;py+=Math.sin(a)*12;x.lineTo(px,py)}x.stroke()}
    x.strokeStyle='rgba(0,0,0,.2)';x.lineWidth=2;x.strokeRect(1,1,254,254);grime(x,.3)}),
  ceram:mkTex(x=>{speck(x,'#f6f7f6',.06,2500);x.strokeStyle='rgba(0,0,0,.16)';x.lineWidth=1.5;
    for(let r=0;r<6;r++)for(let c=0;c<6;c++){const cx=c*48+(r%2)*24,cy=r*42,R=26;x.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;x.lineTo(cx+Math.cos(a)*R,cy+Math.sin(a)*R)}x.closePath();x.stroke()}grime(x,.18)})
};
TEX.brick=mkTex(x=>{speck(x,'#d8d2cc',.1,3000);x.fillStyle='rgba(0,0,0,.32)';
  for(let r=0;r<16;r++){x.fillRect(0,r*16,256,2);for(let c=0;c<8;c++)x.fillRect(((c*32+(r%2)*16)%256),r*16,2,16)}
  for(let i=0;i<60;i++){x.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,240,220'},${Math.random()*.12})`;x.fillRect((Math.random()*8|0)*32,(Math.random()*16|0)*16,32,16)}grime(x,.45)});
TEX.gdet=(()=>{const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');x.fillStyle='#808080';x.fillRect(0,0,512,512);
  const wrap=(fn)=>{for(const ox of [-512,0,512])for(const oy of [-512,0,512]){x.save();x.translate(ox,oy);fn();x.restore()}};
  for(let i=0;i<26000;i++){const v=Math.random()<.5?0:255;x.fillStyle=`rgba(${v},${v},${v},${Math.random()*.09})`;x.fillRect(Math.random()*512,Math.random()*512,1+Math.random()*2,1+Math.random()*2)}
  for(let i=0;i<60;i++){const px=Math.random()*512,py=Math.random()*512,r=20+Math.random()*70,a=Math.random()<.5?'0,0,0':'255,255,255',al=.04+Math.random()*.05;
    wrap(()=>{const g=x.createRadialGradient(px,py,0,px,py,r);g.addColorStop(0,`rgba(${a},${al})`);g.addColorStop(1,`rgba(${a},0)`);x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2)})}
  for(let i=0;i<900;i++){const px=Math.random()*512,py=Math.random()*512,rx=1+Math.random()*3.2,ry=rx*(.5+Math.random()*.5),an=Math.random()*3,l=150+Math.random()*80|0;
    wrap(()=>{x.fillStyle='rgba(0,0,0,.28)';x.beginPath();x.ellipse(px+1,py+1.2,rx,ry,an,0,6.3);x.fill();x.fillStyle=`rgb(${l},${l},${l-8})`;x.beginPath();x.ellipse(px,py,rx,ry,an,0,6.3);x.fill()})}
  x.lineCap='round';for(let i=0;i<40;i++){let px=Math.random()*512,py=Math.random()*512,a=Math.random()*6.3;const pts=[[px,py]];for(let j=0;j<7;j++){a+=(Math.random()-.5)*1.2;px+=Math.cos(a)*(6+Math.random()*10);py+=Math.sin(a)*(6+Math.random()*10);pts.push([px,py])}
    wrap(()=>{x.strokeStyle='rgba(0,0,0,.22)';x.lineWidth=.8+Math.random();x.beginPath();pts.forEach((p,k)=>k?x.lineTo(p[0],p[1]):x.moveTo(p[0],p[1]));x.stroke()})}
  for(let i=0;i<500;i++){const px=Math.random()*512,py=Math.random()*512,l=3+Math.random()*6,a=-Math.PI/2+(Math.random()-.5)*1.4;
    wrap(()=>{x.strokeStyle=`rgba(${Math.random()<.5?'40,40,30':'200,200,170'},.22)`;x.lineWidth=1;x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke()})}
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;return t})();
TEX.rock=mkTex(x=>{speck(x,'#c4c0b8',.16,5000);for(let i=0;i<22;i++){const y=Math.random()*256,h=2+Math.random()*7;x.fillStyle=`rgba(${Math.random()<.5?'0,0,0':'255,250,240'},${.05+Math.random()*.1})`;x.fillRect(0,y,256,h)}
  x.strokeStyle='rgba(0,0,0,.3)';for(let i=0;i<12;i++){let px=Math.random()*256,py=Math.random()*256;x.lineWidth=.6+Math.random();x.beginPath();x.moveTo(px,py);for(let j=0;j<5;j++){px+=(Math.random()-.5)*30;py+=Math.random()*24;x.lineTo(px,py)}x.stroke()}});
TEX.haz=(()=>{const c=document.createElement('canvas');c.width=512;c.height=64;const x=c.getContext('2d');x.fillStyle='#e8b52a';x.fillRect(0,0,512,64);x.fillStyle='#16181a';
  for(let i=-1;i<9;i++){x.beginPath();x.moveTo(i*64,64);x.lineTo(i*64+32,64);x.lineTo(i*64+64,0);x.lineTo(i*64+32,0);x.closePath();x.fill()}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t})();
TEX.grid=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.fillStyle='#86c4f2';x.fillRect(0,0,256,256);
  for(let i=0;i<256;i+=4){x.fillStyle=`rgba(255,255,255,${Math.random()*.08})`;x.fillRect(0,i,256,4)}x.fillStyle='#2c5d86';for(let i=0;i<=256;i+=21){x.fillRect(i-1.5,0,3,256);x.fillRect(0,i-1.5,256,3)}
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t})();
const MT={
  char:mat(0x1b1d1a,{roughness:1,metalness:0}),steel:mat(0x6a736f,{metalness:.6,roughness:.4}),gun:mat(0x2a2f31,{metalness:.55,roughness:.45}),
  dark:mat(0x141718,{metalness:.3,roughness:.7}),plate:mat(0x2b302e,{roughness:.85}),plate2:mat(0x3d4542,{metalness:.4,roughness:.55}),
  yellow:mat(0xc99a2a),skin:mat(0xc9b08a),door:mat(0x0b0d0e),orange:mat(0xff8a3d,{emissive:0xff5a00,emissiveIntensity:1.1}),
  crys:mat(0xb45cf0,{emissive:0x7a2bd0,emissiveIntensity:.8,flatShading:true,roughness:.25}),spike:mat(0x9aa29e,{metalness:.85,roughness:.25})
};
Object.assign(MT,{lamp:mat(0xfff2c8,{emissive:0xffd890,emissiveIntensity:1.6}),concrete:mat(0x8e8f88,{roughness:.92,metalness:0,side:THREE.DoubleSide}),rust:mat(0x6e4430,{roughness:.9,metalness:.3}),
  ceram:mat(0x7d8986,{roughness:.38,metalness:.2}),sand:mat(0x8b7b57,{roughness:1,metalness:0}),olive:mat(0x4d5636,{roughness:.8,metalness:.05}),brass:mat(0xc8a048,{roughness:.35,metalness:.8}),gold:mat(0xa88444,{roughness:.35,metalness:.7}),osuit:mat(0xd8641e,{roughness:.7,metalness:.05}),visor:mat(0x6cff6a,{emissive:0x1f8a24,emissiveIntensity:.8,roughness:.1,metalness:.3}),blackpad:mat(0x26292b,{roughness:.75,metalness:.35}),brick:mat(0x8a4a38,{roughness:.95,metalness:0}),pool:mat(0x8a34d8,{emissive:0x4a0ea0,emissiveIntensity:.75,roughness:.12,metalness:.15}),canopy:mat(0x16242e,{metalness:.9,roughness:.08,envMapIntensity:1.3}),
  haz:mat(0xffffff,{map:TEX.haz,roughness:.55,metalness:.2}),win:mat(0xffffff,{map:TEX.grid,emissive:0x5aa0e0,emissiveMap:TEX.grid,emissiveIntensity:.55,roughness:.25,metalness:.1}),
  pad:mat(0x979891,{roughness:.85,metalness:.05}),crane:mat(0xf0b419,{roughness:.42,metalness:.3})});
MT.found=mat(0x5e4e3c,{roughness:1,metalness:0});
Object.assign(MT,{gdome:mat(0xc4e6f6,{metalness:.35,roughness:.05,flatShading:true,envMapIntensity:1.8,emissive:0x1c3c52,emissiveIntensity:.3}),gwire:mat(0xeef6ff,{wireframe:true,metalness:.2,roughness:.4}),statue:mat(0x5d6d68,{metalness:.55,roughness:.45})});
G.chamf=(w,h,d)=>{const c=Math.min(h,w)*.22;return G.prof('ch'+w+'x'+h,[[-w/2,0],[w/2,0],[w/2,h-c],[w/2-c,h],[-w/2+c,h],[-w/2,h-c]],d)};
G.cylS=(a,b,h,n)=>gk('S'+a+','+b+','+h+','+n,()=>creased(new THREE.CylinderGeometry(a,b,h,n),30));
G.cool=(r,h)=>gk('cool'+r+','+h,()=>new THREE.LatheGeometry([[r,0],[r*.9,h*.2],[r*.76,h*.48],[r*.7,h*.7],[r*.74,h*.88],[r*.8,h]].map(p=>new THREE.Vector2(p[0],p[1])),rseg(r,12,16,22,28)));
G.vase=(r,h)=>gk('vase'+r+','+h,()=>new THREE.LatheGeometry([[0,0],[r*.85,0],[r,h*.2],[r*.95,h*.55],[r*.7,h*.85],[r*.35,h],[0,h]].map(p=>new THREE.Vector2(p[0],p[1])),rseg(r,12,16,22,28)));
G.oct=r=>gk('oct'+r,()=>new THREE.OctahedronGeometry(r,0));
const TM=COLORS.map(F=>mat(F.hex,{emissive:F.em,emissiveIntensity:.22,roughness:.45,metalness:.3}));
const TD=COLORS.map(F=>mat(F.dark,{metalness:.45,roughness:.5}));
const TG=COLORS.map(F=>mat(F.gl,{emissive:F.ge,emissiveIntensity:1.4}));
for(const m of [MT.plate2,MT.gun,MT.steel,MT.door,MT.dark,...TD])m.map=TEX.panel;
for(const m of [MT.plate,MT.concrete,MT.sand])m.map=TEX.concrete;MT.pad.map=TEX.panel;MT.blackpad.map=TEX.panel;MT.crane.map=TEX.panel;
MT.ceram.map=TEX.ceram;MT.brick.map=TEX.brick;MT.brickD=mat(0x55585a,{roughness:.92,metalness:.05});MT.brickD.map=TEX.brick;MT.rust.map=TEX.concrete;
TEX.panelN=nrmMap(TEX.panel,6);TEX.concreteN=nrmMap(TEX.concrete,4);TEX.rockN=nrmMap(TEX.rock,7);TEX.ceramN=nrmMap(TEX.ceram,4);TEX.brickN=nrmMap(TEX.brick,5);
{const N={[TEX.panel.uuid]:[TEX.panelN,.55],[TEX.concrete.uuid]:[TEX.concreteN,.45],[TEX.ceram.uuid]:[TEX.ceramN,.4],[TEX.brick.uuid]:[TEX.brickN,.6]};
  for(const m of [...Object.values(MT),...TD,...TM]){const n=m.map&&N[m.map.uuid];if(n){m.normalMap=n[0];m.normalScale=new THREE.Vector2(n[1],n[1])}}}
for(const m of TM){m.map=TEX.panel;m.normalMap=TEX.panelN;m.normalScale=new THREE.Vector2(.35,.35)}
function part(geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;return o}
function P(g,geo,m,x,y,z,rx,ry,rz,sx,sy,sz){const o=part(geo,m,x,y,z);if(rx||ry||rz)o.rotation.set(rx||0,ry||0,rz||0);if(sx)o.scale.set(sx,sy||sx,sz||sx);g.add(o);return o}
const BTOP={shield:44,spike:80,radar:42,yard:50,power:42,refinery:50,barracks:38,factory:42,turret:32,guard:32,missile:26,tech:50};
const UTOP={gren:22,htank:32,mlrs:28,stank:24,rift:22,tank:28,harv:26,rifle:20,rocket:22,sniper:22,eng:21,buggy:20,arty:30};

/* merge each group's static parts per material, so a model costs a few draw calls */
function mergeMeshes(list){
  let total=0;
  const geos=list.map(m=>{m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();if(!g.attributes.normal)g.computeVertexNormals();g.applyMatrix4(m.matrix);total+=g.attributes.position.count;return g});
  const pos=new Float32Array(total*3),nrm=new Float32Array(total*3),uvs=new Float32Array(total*2);let o=0,ou=0;
  for(const g of geos){const n=g.attributes.position.count;pos.set(g.attributes.position.array,o);nrm.set(g.attributes.normal.array,o);
    if(g.attributes.uv)uvs.set(g.attributes.uv.array.subarray(0,n*2),ou);o+=n*3;ou+=n*2;g.dispose()}
  const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.BufferAttribute(pos,3));out.setAttribute('normal',new THREE.BufferAttribute(nrm,3));out.setAttribute('uv',new THREE.BufferAttribute(uvs,2));return out;
}
function bake(grp){
  const by=new Map();
  for(const c of grp.children){if(!c.isMesh||c.userData.keep)continue;const k=c.material.uuid;if(!by.has(k))by.set(k,[]);by.get(k).push(c)}
  for(const list of by.values()){
    if(list.length<2)continue;
    const m=new THREE.Mesh(mergeMeshes(list),list[0].material);m.castShadow=m.receiveShadow=true;
    for(const c of list)grp.remove(c);grp.add(m);
  }
}
const tmpl={};
function fromTmpl(key,build){
  if(!tmpl[key]){const g=build(),subs=[],f=+key.split(':')[2]||0;g.traverse(o=>{if(o.isGroup)subs.push(o)});
    subs.forEach(s=>{if(typeof uberize==='function')try{uberize(s,f)}catch(e){console.warn(e)}bake(s)});tmpl[key]=g}
  return tmpl[key].clone();
}
function spikes(g,pts,r,h,tilt){for(const p of pts)P(g,G.cone(r,h,4),MT.spike,p[0],p[1],p[2],p[3]||0,0,p[4]||0)}
function edgeGlow(g,w,h,y,s){
  P(g,G.box(w,.8,.8),TG[s],0,y,h/2);P(g,G.box(w,.8,.8),TG[s],0,y,-h/2);
  P(g,G.box(.8,.8,h),TG[s],w/2,y,0);P(g,G.box(.8,.8,h),TG[s],-w/2,y,0);
}
