'use strict';
/* ---------- faction emblems (original designs) ---------- */
function drawEmblem(x,fi,col,S){
  const D='#0b100d';x.save();x.translate(S/2,S/2);x.scale(S/2,S/2);x.lineJoin='round';x.lineCap='round';
  x.beginPath();x.arc(0,0,.95,0,7);x.fillStyle=D;x.fill();x.lineWidth=.08;x.strokeStyle=col;x.stroke();
  x.beginPath();x.arc(0,0,.82,0,7);x.lineWidth=.025;x.strokeStyle='rgba(255,255,255,.28)';x.stroke();
  x.fillStyle=col;x.strokeStyle=col;
  if(fi===0){ /* Vanguard: winged shield with chevrons */
    for(const sx of [-1,1])for(let i=0;i<3;i++){const y0=-.3+i*.16;x.beginPath();x.moveTo(sx*.28,y0);x.lineTo(sx*(.78-i*.1),y0-.2+i*.04);x.lineTo(sx*(.72-i*.1),y0-.06+i*.04);x.lineTo(sx*.28,y0+.11);x.closePath();x.fill()}
    x.beginPath();x.moveTo(-.33,-.52);x.lineTo(.33,-.52);x.lineTo(.33,.04);x.quadraticCurveTo(.3,.42,0,.64);x.quadraticCurveTo(-.3,.42,-.33,.04);x.closePath();x.fill();
    x.strokeStyle=D;x.lineWidth=.09;for(const yy of [-.02,.22]){x.beginPath();x.moveTo(-.19,yy+.1);x.lineTo(0,yy-.06);x.lineTo(.19,yy+.1);x.stroke()}
    x.fillStyle=D;x.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?.045:.11;x.lineTo(Math.cos(a)*r,-.3+Math.sin(a)*r)}x.closePath();x.fill();
  }else if(fi===1){ /* Iron Syndicate: spiked cog with a blade */
    const N=10;x.beginPath();for(let i=0;i<N*2;i++){const a=i*Math.PI/N-Math.PI/2,r=i%2?.5:.78;x.lineTo(Math.cos(a)*r,Math.sin(a)*r)}x.closePath();x.fill();
    x.fillStyle=D;x.beginPath();x.arc(0,0,.36,0,7);x.fill();
    x.fillStyle=col;x.beginPath();x.moveTo(0,-.31);x.lineTo(.11,-.02);x.lineTo(0,.31);x.lineTo(-.11,-.02);x.closePath();x.fill();
    x.lineWidth=.06;for(const sx of [-1,1]){x.beginPath();x.moveTo(sx*.17,-.12);x.lineTo(sx*.27,-.04);x.stroke()}
  }else{ /* Helix Collective: hexagon with double helix */
    x.lineWidth=.08;x.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;x.lineTo(Math.cos(a)*.66,Math.sin(a)*.66)}x.closePath();x.stroke();
    for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;x.beginPath();x.arc(Math.cos(a)*.66,Math.sin(a)*.66,.07,0,7);x.fill()}
    const st=a=>{x.beginPath();for(let t=-.44;t<=.441;t+=.02){const xx=a*.22*Math.sin((t+.44)*Math.PI*2.27);t===-.44?x.moveTo(xx,t):x.lineTo(xx,t)}x.stroke()};
    x.lineWidth=.025;for(let t=-.36;t<.4;t+=.12){const xx=.22*Math.sin((t+.44)*Math.PI*2.27);x.beginPath();x.moveTo(-xx,t);x.lineTo(xx,t);x.stroke()}
    x.lineWidth=.075;st(1);st(-1);
  }
  x.restore();
}
const embCache={};
function emblemURL(fi,ci){const k='u'+fi+'_'+ci;if(!embCache[k]){const c=document.createElement('canvas');c.width=c.height=96;drawEmblem(c.getContext('2d'),fi,COLORS[ci].col,96);embCache[k]=c.toDataURL()}return embCache[k]}
const EMT={};
function emblemMat(fi,ci){const k=fi*16+ci;if(!EMT[k]){const c=document.createElement('canvas');c.width=c.height=256;drawEmblem(c.getContext('2d'),fi,COLORS[ci].col,256);
  const t=new THREE.CanvasTexture(c);t.anisotropy=4;EMT[k]=mat(0xffffff,{map:t,emissive:0xffffff,emissiveMap:t,emissiveIntensity:.8,alphaTest:.5,roughness:.5,metalness:.1,polygonOffset:true,polygonOffsetFactor:-2})}return EMT[k]}
/* badge laid flat on a surface (ry rotates it on the surface) */
function emblem(g,f,x,y,z,r){
  P(g,G.cyl(r*1.04,r*1.04,3,40),MT.dark,x,y-1.3,z);
  P(g,new THREE.PlaneGeometry(r*2,r*2),emblemMat(f>>4,f&15),x,y+.26,z,-Math.PI/2,0,0);
}

/* ---------- faction model kits ---------- */
function kit(f){
  const st=f>>4,hull=st===2?MT.ceram:st===1?MT.gun:MT.plate2;
  return {st,hull,trim:TD[f&15],glow:TG[f&15],
    block(g,w,h,d,x,y,z,m,ry){m=m||hull;
      if(st===2)return P(g,G.dome(1),m,x,y,z,0,ry||0,0,w/2,h,d/2);
      if(st===1)return P(g,G.chamf(w,h,d),m,x,y,z,0,ry||0,0);
      return P(g,G.box(w,h,d),m,x,y+h/2,z,0,ry||0,0)},
    tier(g,r,h,x,y,z,m){m=m||hull;
      if(st===2)return P(g,G.dome(1),m,x,y,z,0,0,0,r,h,r);
      if(st===1)return P(g,G.cylS(r*.92,r,h,8),m,x,y+h/2,z,0,Math.PI/8,0);
      return P(g,G.cyl(r*.92,r,h,48),m,x,y+h/2,z)},
    tower(g,r,h,x,y,z,m){m=m||hull;
      if(st===2)return P(g,G.vase(r,h),m,x,y,z);
      if(st===1)return P(g,G.cylS(r,r*1.06,h,8),m,x,y+h/2,z,0,Math.PI/8,0);
      return P(g,G.cyl(r,r*1.04,h,40),m,x,y+h/2,z)}
  };
}
function pylon(g,x,y,z,H){
  for(const sx of [-1,1])for(const sz of [-1,1])P(g,new THREE.BoxGeometry(.8,H,.8),MT.steel,x+sx*1.9,y+H/2,z+sz*1.9,-sz*.11,0,sx*.11);
  for(const [yy,w] of [[H*.82,14],[H*.62,10]]){P(g,new THREE.BoxGeometry(w,.8,.8),MT.steel,x,y+yy,z);
    for(const sx of [-1,1])P(g,G.cyl(.45,.6,2.4,8),MT.ceram,x+sx*(w/2-.6),y+yy-1.4,z)}
  P(g,new THREE.BoxGeometry(.6,.6,5),MT.steel,x,y+H*.45,z);
}
function sandbags(g,x,z,n,ry){for(let i=0;i<n;i++){const a=ry||0,dx=Math.cos(a)*i*5.6,dz=-Math.sin(a)*i*5.6;P(g,G.box(5.4,2.8,3),MT.sand,x+dx,1.4+3,z+dz,0,a,0);P(g,G.box(5.4,2.6,3),MT.sand,x+dx+Math.cos(a)*2.7,4.1+3,z+dz-Math.sin(a)*2.7,0,a,0)}}

/* infantry with separate leg and weapon groups so they can animate */
function buildInf(g,type,st,s){
  const TDs=TD[s],GL=TG[s],eng=type==='eng',rk=type==='rocket',gr=type==='gren',sn=type==='sniper';
  const bx=(par,m,x,y,z,w,h,d,rx,ry,rz)=>P(par,new THREE.BoxGeometry(w,h,d),m,x,y,z,rx||0,ry||0,rz||0);
  const rb=(par,m,x,y,z,w,h,d,rx,ry,rz)=>P(par,G.box(w,h,d),m,x,y,z,rx||0,ry||0,rz||0);
  /* ---- faction / role palette ---- */
  let legM,bootM=MT.dark,kneeM,abdM,chestM,padM,armM,gloveM=MT.dark;
  if(st===0){
    if(eng){legM=MT.ceram;kneeM=TDs;abdM=MT.ceram;chestM=MT.gun;padM=TDs;armM=MT.ceram}
    else if(rk){legM=TDs;kneeM=MT.ceram;abdM=TDs;chestM=MT.ceram;padM=TDs;armM=TDs}
    else{legM=MT.olive;kneeM=MT.steel;abdM=MT.olive;chestM=TDs;padM=MT.steel;armM=MT.olive}
  }else if(st===1){
    if(eng){legM=TDs;kneeM=MT.gun;abdM=TDs;chestM=MT.ceram;padM=TDs;armM=MT.ceram;bootM=MT.gun}
    else{legM=MT.gun;kneeM=TDs;abdM=MT.dark;chestM=MT.gun;padM=MT.gun;armM=MT.gun}
  }else{
    if(eng){legM=TDs;kneeM=MT.dark;abdM=MT.ceram;chestM=TDs;padM=MT.ceram;armM=TDs}
    else if(rk){legM=MT.gun;kneeM=MT.gold;abdM=MT.gun;chestM=MT.gold;padM=TDs;armM=MT.gun}
    else{legM=MT.ceram;kneeM=MT.gold;abdM=MT.gun;chestM=MT.ceram;padM=MT.gold;armM=MT.ceram}
  }
  if(gr){[legM,kneeM,abdM,chestM,padM,armM]=st===0?[MT.olive,TDs,MT.olive,MT.gun,TDs,MT.olive]:st===1?[MT.dark,MT.gun,MT.dark,TDs,MT.gun,MT.dark]:[MT.gun,TDs,MT.ceram,MT.ceram,TDs,MT.gun]}
  if(sn){[legM,kneeM,abdM,chestM,padM,armM]=st===0?[MT.sand,MT.olive,MT.olive,MT.olive,MT.sand,MT.sand]:st===1?[MT.gun,MT.dark,MT.dark,MT.gun,TDs,MT.dark]:[MT.dark,MT.ceram,MT.dark,MT.dark,MT.ceram,MT.dark]}
  /* ---- legs (animated) ---- */
  for(const z of [-1.5,1.5]){const L=new THREE.Group();L.name=z<0?'legL':'legR';L.position.set(0,6.2,z);
    bx(L,legM,0,-1.6,0,2.1,3.4,2.1);bx(L,legM,.1,-4.2,0,1.8,2.4,1.8);rb(L,kneeM,.9,-3,0,.9,1.6,2);rb(L,bootM,.5,-5.6,0,3.1,1.3,2.2);g.add(L)}
  /* ---- body ---- */
  bx(g,abdM,0,6.8,0,2.6,1.6,4.2);bx(g,MT.dark,0,7.7,0,2.9,.5,4.3);rb(g,abdM,0,8.6,0,2.8,2,3.9);
  rb(g,chestM,.1,10.8,0,3.9,3.8,5.2);
  const pad=(z)=>{if(gr&&st!==2){rb(g,padM,0,12.1,z,2.9,1.5,2.4,z>0?.3:-.3,0,0);return}if(st===2&&!eng)P(g,G.dome(1.9),padM,0,12,z,0,0,0,1.1,.9,1.2);else rb(g,padM,0,12,z,2.9,1.6,2.4,z>0?.25:-.25,0,0)};
  pad(3.2);pad(-3.2);
  /* ---- arms ---- */
  const arm=(sh,el,hd)=>{ubeam(g,sh,el,.62,armM);ubeam(g,el,hd,.55,armM);P(g,G.sph(.62),gloveM,hd[0],hd[1],hd[2])};
  if(rk){arm([0,11.8,3.2],[1.4,10.6,3.5],[2.8,12.6,3.2]);arm([0,11.8,-3.2],[1.6,10.4,-2.6],[3.9,12.9,1.6])}
  else if(eng){arm([0,11.8,3.2],[.9,9.5,3.4],[3,9.6,1.8]);arm([0,11.8,-3.2],[.3,9.3,-3.5],[.4,7.2,-3.6])}
  else{arm([0,11.8,3.2],[.8,9.4,3.3],[2.7,9.7,1.7]);arm([0,11.8,-3.2],[1.8,10.5,-2.5],[4.8,10.3,.9])}
  /* ---- heads / helmets ---- */
  P(g,G.cyl(.75,.85,1,10),MT.skin,0,13.1,0);
  if(gr||sn){
    if(st===0&&gr){P(g,G.sph(1.55),MT.skin,.3,14.6,0);P(g,G.dome(2.25),TDs,0,14.9,0,0,0,0,1.1,1,1.1);bx(g,MT.dark,1.55,14.7,0,.6,1.3,3.6);P(g,G.ring(2.35,.3),MT.gun,0,14.9,0)}
    else if(st===0){P(g,G.sph(1.55),MT.skin,.3,14.6,0);P(g,G.cyl(3.4,3.4,.25,16),MT.sand,0,16,0);P(g,G.cyl(1.7,1.95,1.6,14),MT.sand,0,16.8,0);bx(g,MT.dark,1.6,14.9,-.7,.5,.6,.8)}
    else if(st===1&&gr){P(g,G.sph(2),MT.dark,0,14.9,0);P(g,G.dome(2.15),MT.gun,0,15.4,0);for(const z of [-.85,.85])P(g,G.sph(.45),GL,1.8,15.2,z);
      P(g,G.cylx(.7,1.6),MT.gun,2.3,13.9,0);for(const z of [-1,1])P(g,G.cyl(.55,.6,1.4,10),MT.gun,2.2,13.6,z*1.3,0,0,Math.PI/2.4)}
    else if(st===1){P(g,G.sph(1.6),MT.skin,.2,14.6,0);P(g,G.sph(1.9),TDs,-.2,16.1,0,0,0,.25,1.15,.4,1.1);bx(g,MT.dark,1.55,14.9,0,.4,.55,2.8)}
    else if(gr){P(g,G.sph(2.1),MT.ceram,0,14.9,0,0,0,0,1.15,1.05,1);P(g,G.ring(2.15,.32),GL,.3,14.9,0,0,0,Math.PI/2.2);P(g,G.dome(1.1),TDs,-.4,16.6,0,0,0,0,1.4,.5,1)}
    else{P(g,G.sph(1.9),MT.dark,0,15,0,0,0,0,1.3,1.05,.95);P(g,G.sph(.55),GL,2.2,15.2,.5);P(g,G.cyl(.08,.1,4,4),MT.steel,-1,17.6,-1,0,0,-.3)}
  }else if(st===0){
    if(eng){P(g,G.sph(2.15),MT.ceram,0,14.9,0);P(g,G.sph(1.7),MT.visor,.95,14.9,0,0,0,0,.7,.95,1.1);bx(g,TDs,-.4,16.9,0,2.6,.5,1)}
    else if(rk){P(g,G.sph(1.55),MT.skin,.3,14.6,0);P(g,G.dome(2.1),TDs,0,14.8,0,0,0,0,1.05,1,1.05);bx(g,MT.dark,1.6,14.9,0,.6,.9,3.2);P(g,G.ring(2.15,.2),MT.dark,0,14.8,0)}
    else{P(g,G.sph(1.55),MT.skin,.3,14.6,0);P(g,G.dome(2.15),MT.olive,0,14.9,0,0,0,0,1.08,.95,1.08);P(g,G.ring(2.25,.25),MT.olive,0,14.9,0);
      bx(g,MT.dark,1.45,15.6,0,.5,.8,3.4);for(const z of [-.75,.75])P(g,G.cyl(.55,.55,.4,10),MT.canopy,1.75,15.6,z,0,0,Math.PI/2)}
  }else if(st===1){
    if(rk){P(g,G.cyl(1.75,1.95,5,14),MT.dark,0,15.6,0);P(g,G.dome(1.75),MT.dark,0,18.1,0);for(const yy of [15.2,16.4])for(const z of [-.6,.6])P(g,G.sph(.3),GL,1.85,yy,z)}
    else if(eng){P(g,G.sph(1.6),MT.skin,.2,14.6,0);P(g,G.dome(1.8),MT.gun,0,15.4,0);P(g,G.cyl(2.3,2.3,.25,16),MT.gun,.4,15.4,0)}
    else{P(g,G.sph(2.05),MT.dark,0,14.9,0,0,0,0,1.05,1.1,1);for(const sd of [-1,1])bx(g,GL,1.85,15.1,sd*.65,.3,.4,1.5,sd*.5,0,0);bx(g,MT.gun,0,16.6,0,2.4,.5,.9)}
  }else{
    if(eng){P(g,G.sph(1.6),MT.skin,.2,14.6,0);P(g,G.dome(1.9),TDs,0,15.3,0);P(g,G.cyl(2.3,2.3,.25,16),TDs,.3,15.3,0);bx(g,MT.dark,0,17.2,0,2.2,.5,.6)}
    else{P(g,G.sph(2.05),MT.gun,0,14.9,0,0,0,0,1.1,1.05,1);bx(g,GL,1.95,15,0,.3,.45,2.6);P(g,G.dome(1.2),rk?TDs:MT.gold,-.2,16.4,0,0,0,0,1.3,.6,.9)}
  }
  /* ---- packs & gear ---- */
  if(gr){rb(g,st===2?MT.ceram:MT.dark,-2.9,10.6,0,1.8,4.4,3.8);for(let i=0;i<5;i++)P(g,G.sph(.55),st===1?TDs:st===2?GL:MT.olive,2.05,12.4-i*.75,-1.6+i*.8);
    if(st===0)P(g,G.cylx(1.3,2.2),MT.gun,-3.4,8,0,0,Math.PI/2,0)}
  else if(sn){const CM=st===0?MT.sand:st===1?MT.dark:MT.gun;bx(g,CM,-2.4,8.8,0,.5,8.4,5.8,0,0,-.1);if(st===0)for(let i=0;i<6;i++)bx(g,MT.olive,-2.6,6.2+i*1.3,(i%3-1)*1.6,.4,1.6,1.2,0,0,(i%2?.3:-.3));
    if(st===2)P(g,G.oct(.8),MT.crys,-2.8,12,0,0,0,0,1,1.7,1);if(st===1)bx(g,TDs,-2.7,12.6,0,.3,.8,5.8)}
  else if(st===0&&rk){for(const z of [-2.3,2.3]){rb(g,MT.ceram,-3.3,11.4,z,2.1,5.6,2.4);P(g,G.cyl(.8,1,1,10),MT.dark,-3.3,8.3,z)}rb(g,MT.gun,-2.4,10.8,0,1.6,3.6,2.2)}
  else if(st===0&&eng){rb(g,TDs,-3,10.6,0,2.2,5,4);bx(g,MT.steel,-4.15,10.6,0,.2,3.2,2.4)}
  else if(st===0){rb(g,MT.olive,-2.8,10.4,0,1.8,4.2,3.6);for(const sd of [-1,1])bx(g,MT.brass,2.05,10.8,0,.3,.7,6.4,sd*.75,0,0)}
  else if(st===1&&rk){P(g,G.cone(1.5,.3,3),TDs,2.1,10.8,0,0,0,-Math.PI/2);rb(g,MT.dark,-2.8,10.6,0,1.8,4.6,3.6)}
  else if(st===1&&eng){for(const z of [-1.1,1.1])bx(g,TDs,1.98,10.4,z,.2,3.6,.6);bx(g,MT.gun,0,7.7,0,3,.6,4.4)}
  else if(st===1){bx(g,TDs,.1,12.4,0,4,.4,5.3);rb(g,MT.dark,-2.8,10.4,0,1.8,4.4,3.6)}
  else if(st===2&&rk){for(const z of [-2.4,2.4]){rb(g,MT.gun,-2.9,14.2,z,2.2,6.4,2.2);for(const yy of [16.4,17.4])P(g,G.sph(.38),GL,-2.9,yy+.1,z+(yy>17?.5:-.5))}}
  else if(st===2&&eng){for(const z of [-1.1,1.1])bx(g,MT.dark,2,10.4,z,.2,3.6,.5);bx(g,MT.dark,0,7.7,0,3,.6,4.4)}
  else{bx(g,TDs,2.05,10.8,0,.2,2.4,3);P(g,G.oct(.9),MT.crys,-2.6,11.4,0,0,0,0,1,1.7,1)}
  /* ---- weapons (recoil group) ---- */
  const W=new THREE.Group();W.name='gun';g.add(W);
  if(gr){
    if(st===0){P(W,G.cylx(1.25,5.5),MT.gun,6,10,1.2);P(W,G.cylx(2,2.6),TDs,2.6,10,1.2);for(let i=0;i<6;i++){const a=i*1.047;P(W,G.cylx(.35,2.7),MT.dark,2.6,10+Math.cos(a)*1.6,1.2+Math.sin(a)*1.6)}bx(W,MT.olive,-.2,9.2,1.2,2.6,1.4,1)}
    else if(st===1){P(W,G.cylx(1.5,8),MT.dark,5.4,10.2,1.2);P(W,G.cylx(1.8,.8),TDs,9.2,10.2,1.2);bx(W,MT.gun,2.2,8.6,1.2,2.4,2.6,1.4);bx(W,MT.gun,-.4,9.6,1.2,2.4,1.2,1)}
    else{rb(W,MT.ceram,3.6,9.9,1.2,6,2.4,2);P(W,G.ring(1.3,.35),GL,7.4,9.9,1.2,0,0,Math.PI/2);P(W,G.sph(1),GL,7.2,9.9,1.2);bx(W,TDs,3,11.3,1.2,3.4,.4,.8)}
  }else if(sn){
    if(st===0){bx(W,MT.olive,4,9.9,1.2,8,1.3,1.1);P(W,G.cylx(.32,9),MT.dark,12.4,10,1.2);P(W,G.cylx(.6,4.4),MT.dark,4.4,11.3,1.2);P(W,G.cylx(.75,.4),MT.win,6.6,11.3,1.2);
      for(const z of [-.5,.5])beam_(W,[14,9.6,1.2+z],[15.2,7,1.2+z*2.4],.12,MT.steel)}
    else if(st===1){bx(W,MT.gun,4,9.9,1.2,8,1.3,1.1);P(W,G.cylx(.3,11),MT.steel,13.4,10,1.2);P(W,G.cylx(.6,4.4),MT.dark,19.6,10,1.2);P(W,G.cylx(.55,4),MT.dark,4.4,11.3,1.2);bx(W,TDs,1,9,1.2,1.6,1.8,.9)}
    else{rb(W,MT.ceram,4.6,9.9,1.2,8.4,1.6,1.3);for(const y of [9.5,10.3])bx(W,MT.gun,12.4,y,1.2,8,.25,.7);for(const x of [9.6,12,14.4])P(W,G.ring(.75,.2),GL,x,9.9,1.2,0,0,Math.PI/2);P(W,G.sph(.45),GL,4.4,11.2,1.2)}
  }else if(eng){
    if(st===2)rb(W,TDs,.4,6.2,-3.7,3.6,2.4,1.6);else rb(W,MT.gun,.4,6.2,-3.7,3.6,2.4,1.6);
    bx(W,MT.steel,.4,7.6,-3.7,1.8,.3,.4);rb(W,MT.gun,3.6,9.6,1.6,1.8,1.2,1.2);P(W,G.sph(.32),GL,4.6,9.9,1.6);
  }else if(rk){
    if(st===0){P(W,G.cylx(1.15,9.5),MT.gun,1.6,13.5,3.6);P(W,G.cylx(1.35,.8),TDs,5.8,13.5,3.6);P(W,G.cylx(1.4,1),MT.dark,-3,13.5,3.6);bx(W,MT.dark,2,15,3.6,1.6,.9,.8)}
    else if(st===1){bx(W,MT.gun,1.4,13.6,3.6,10.5,2.3,2.3);bx(W,TDs,3,13.6,3.6,1,2.5,2.5);P(W,G.cyl(1.2,1.7,1.4,10),MT.dark,7.2,13.6,3.6,0,0,-Math.PI/2)}
    else{P(W,G.cylx(1.1,6),MT.ceram,4.4,9.8,3.6);P(W,G.sph(.75),GL,7.6,9.8,3.6);P(W,G.cylx(1.3,.6),TDs,2.2,9.8,3.6)}
  }else{
    if(st===0){bx(W,MT.gun,3.2,9.8,1.2,5.6,1.8,1.4);P(W,G.cylx(.62,3),MT.dark,7.2,10,1.2);P(W,G.cylx(.3,4.5),MT.steel,10.4,10,1.2);bx(W,MT.olive,2.6,8.4,1.2,1.8,1.6,1.2);
      for(let i=0;i<4;i++)bx(W,MT.brass,1.4-i*.4,8.2-i*.5,1.9,.4,.6,.3)}
    else if(st===1){bx(W,MT.gun,4,9.9,1.2,8.4,1.6,1.3);bx(W,MT.dark,8.8,9.9,1.2,1.6,1.1,1.1);bx(W,MT.dark,3,11,1.2,2.2,.6,.6);bx(W,TDs,1.6,8.9,1.2,1.4,1.6,1)}
    else{rb(W,MT.ceram,4,9.9,1.2,6.4,1.9,1.5);P(W,G.cylx(.5,3),MT.gun,8.4,9.9,1.2);P(W,G.oct(.6),MT.crys,10.2,9.9,1.2,0,0,0,1.6,1,1);bx(W,GL,3.4,10.9,1.2,3,.25,.5)}
  }
  return g;
}
function buildBuggy(g,st,s){
  if(st===2){P(g,G.dome(1),MT.ceram,0,4,0,0,0,0,12,4.5,8);P(g,G.dome(1),TD[s],-1,7.6,0,0,0,0,6,2,5);
    for(const [x,z] of [[-7,-6],[-7,6],[7,-6],[7,6]]){P(g,G.cyl(2,2.2,1.4,20),MT.gun,x,3,z);P(g,G.cyl(1.5,1.5,.5,20),TG[s],x,2.1,z)}}
  else{
    for(const x of [-7,7])for(const z of [-7,7])P(g,G.whl(3,2.8),MT.dark,x,3,z);
    if(st===1){P(g,G.prof('bug',[[-10,0],[9,0],[12,2.5],[8,5.5],[-9,5.5],[-11,3]],12),TD[s],0,3,0);for(let z=-4;z<=4;z+=4)P(g,G.conex(.9,3.5,4),MT.spike,12.5,4.5,z)}
    else{P(g,G.box(20,5,12),TD[s],0,5.5,0);P(g,G.box(7,2.4,11),MT.gun,7,8.6,0,0,0,-.3)}
    for(const z of [-4.5,4.5])P(g,new THREE.BoxGeometry(.5,6,.5),MT.steel,-3,11,z);
    P(g,new THREE.BoxGeometry(.5,.5,9.5),MT.steel,-3,14,0);P(g,new THREE.BoxGeometry(8,.5,.5),MT.steel,1,14,-4.5);P(g,new THREE.BoxGeometry(8,.5,.5),MT.steel,1,14,4.5);
  }
  return buildBuggyTurret(g,st,s);
}
function buildBuggyTurret(g,st,s){
  const t=new THREE.Group();t.name='turret';t.position.set(-1,st===2?9.8:9,0);
  P(t,G.cyl(1.6,1.8,2,12),MT.gun,0,1,0);P(t,G.cylx(.5,9),MT.steel,5,2.2,-.8);P(t,G.cylx(.5,9),MT.steel,5,2.2,.8);P(t,G.box(4,2.6,3.6),st===2?MT.ceram:MT.gun,1,2.2,0);
  if(st===2)P(t,G.sph(.7),TG[s],9.6,2.2,0);
  g.add(t);return g;
}
function buildArty(g,st,s){
  if(st===2){P(g,G.dome(1),MT.ceram,0,4,0,0,0,0,19,6,12);P(g,G.dome(1),TD[s],0,4,0,Math.PI,0,0,18,2.4,11);
    for(const [x,z] of [[-12,-9],[-12,9],[12,-9],[12,9]]){P(g,G.cyl(3,3.3,2,20),MT.gun,x,2.8,z);P(g,G.cyl(2.3,2.3,.5,20),TG[s],x,1.7,z)}}
  else{
    for(const z of [-12,12]){P(g,st===1?G.prof('atrk',[[-18,0],[18,0],[20,3],[18,7],[-18,7],[-20,3]],6):G.box(38,7,7),MT.dark,0,st===1?0:3.6,z);for(let i=-3;i<=3;i++)P(g,G.whl(2.6,7.4),MT.gun,i*5.5,3.4,z)}
    if(st===1)P(g,G.chamf(34,7,20),MT.gun,-2,6,0);else P(g,G.box(34,7,20),MT.gun,-2,9.5,0);
    P(g,new THREE.BoxGeometry(3,1,22),MT.steel,-20,3,0,0,0,.5);
    if(st===1)for(const z of [-6,6])P(g,G.cone(1.1,6,4),MT.spike,-14,14,z,0,0,.9);
  }
  return buildArtyTurret(g,st,s);
}
function buildArtyTurret(g,st,s){
  const t=new THREE.Group();t.name='turret';t.position.y=13;
  P(t,st===1?G.cylS(7,7.6,4,8):G.cyl(7,7.6,4,24),TD[s],0,2,0);
  const bar=new THREE.Group();bar.position.set(4,4.5,0);bar.rotation.z=.35;
  P(bar,st===2?G.cylx(1.6,24):G.cylx(1.9,26),st===2?MT.ceram:MT.steel,13,0,0);
  P(bar,st===2?G.conex(2.2,5,6):G.cylx(2.6,4),st===2?MT.crys:MT.gun,st===2?27:26,0,0);
  P(bar,G.box(6,4.6,6),TD[s],1,0,0);
  t.add(bar);g.add(t);return g;
}
/* ---------- raider buggies: one original design per faction ---------- */
function ubeam(g,a,b,r,m){const v=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=v.length();
  const o=part(G.cyl(r,r,+L.toFixed(1),8),m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());g.add(o);return o}
function bigTire(g,x,z,r,w,hub){P(g,G.whl(r,w),MT.dark,x,r,z);for(let i=0;i<10;i++){const a=i*.628;P(g,new THREE.BoxGeometry(1,.5,w+.2),MT.gun,x+Math.cos(a)*(r+.05),r+Math.sin(a)*(r+.05),z,0,0,a)}
  P(g,G.whl(r*.55,w+.4),hub||MT.steel,x,r,z);P(g,G.whl(r*.2,w+.8),MT.gun,x,r,z)}
/* Vanguard "Pathfinder": low wedge chassis, bubble canopy, rear gun pod, balloon tyres */
function buggyVanguard(g,s,f){
  for(const x of [-8,8])for(const z of [-8,8])bigTire(g,x,z,3.9,4.2,TD[s]);
  P(g,G.box(20,2,9),MT.gun,0,4,0);
  P(g,G.sh('vbug',sh=>{sh.moveTo(-11,0);sh.lineTo(10,0);sh.lineTo(15,1.4);sh.lineTo(13.5,2.6);sh.lineTo(1,5.2);sh.lineTo(-9,5.6);sh.lineTo(-11.5,3);sh.closePath()},10.4,1),TD[s],0,4.4,0);
  for(const sd of [-1,1]){P(g,G.prof('vfl',[[-12,0],[11,0],[14,1],[3,3.4],[-9,3.4]],2.2),TD[s],0,6.6,sd*6.2);
    for(let i=0;i<4;i++)P(g,new THREE.BoxGeometry(3,.35,.3),MT.dark,-3+i*.6,8.4-i*.55,sd*7.35);P(g,G.sph(.55),MT.lamp,13.6,6.2,sd*3.4)}
  P(g,G.sph(3),MT.canopy,3.4,9.4,0,0,0,0,1.5,.72,1);P(g,G.ring(3.1,.3),MT.gun,3.4,9.3,0,0,0,0,1.48,1,1);
  P(g,new THREE.BoxGeometry(5,.4,.5),MT.dark,-4,10.4,-3);P(g,new THREE.BoxGeometry(5,.4,.5),MT.dark,-4,10.4,3);
  uEmblem(g,f,8.6,8.25,0,1.6);
  const t=new THREE.Group();t.name='turret';t.position.set(-5,10.4,0);
  P(t,G.box(5,2,5),MT.gun,0,1,0);P(t,G.box(7,2.8,3.2),TD[s],1.6,3.2,0);P(t,G.cylx(.45,9),MT.steel,8.6,3.2,0);P(t,G.cylx(.8,2),MT.gun,12.6,3.2,0);
  P(t,G.box(2.4,1.6,1.6),MT.dark,-1.8,3.2,1.9);g.add(t);return g;
}
/* Iron Syndicate "Marauder": rugged off-road cab, chunky tyres, grille + spiked bumper, roof machine gun */
function buggySyndicate(g,s,f){
  for(const x of [-8,8])for(const z of [-8.4,8.4])bigTire(g,x,z,4.2,4.6,MT.steel);
  for(const x of [-8,8])for(const z of [-5,5])ubeam(g,[x,4.2,z*1.2],[x*.6,7,z*.6],.4,MT.dark);
  P(g,G.sh('sbug',sh=>{sh.moveTo(-11,0);sh.lineTo(9,0);sh.lineTo(12.5,2.4);sh.lineTo(11.5,4.6);sh.lineTo(4,5.4);sh.lineTo(.6,9.4);sh.lineTo(-6.5,9.8);sh.lineTo(-10.5,7.2);sh.lineTo(-11.5,4);sh.closePath()},10.2,1.1),TD[s],0,4.6,0);
  for(const sd of [-1,1]){P(g,new THREE.BoxGeometry(5,2.6,.3),MT.door,-2.6,11.4,sd*5.15);P(g,new THREE.BoxGeometry(3.2,.6,4.6),MT.gun,-4,13.2,sd*3);
    ubeam(g,[-9,8,sd*5.4],[-12.4,8,sd*5.4],.55,MT.dark)}
  P(g,new THREE.BoxGeometry(.3,3,8),MT.door,3.6,12,0,0,0,-.85);
  P(g,G.box(2,4,8),MT.gun,12.8,6.4,0);for(let i=0;i<5;i++)P(g,new THREE.BoxGeometry(.3,3,.5),MT.steel,13.9,6.4,-3.2+i*1.6);
  P(g,G.box(1.4,1.6,12),MT.dark,14.4,4,0);for(let z=-4.5;z<=4.5;z+=3)P(g,G.conex(.6,2.6,4),MT.spike,16.2,4,z);
  for(const z of [-3.6,3.6])P(g,G.sph(.6),MT.lamp,13.7,9,z);
  uEmblem(g,f,7.6,10.05,0,1.7);
  const t=new THREE.Group();t.name='turret';t.position.set(-3,14.4,0);
  P(t,G.cyl(2.2,2.4,1,16),MT.gun,0,.5,0);P(t,G.box(4.4,2.2,2.6),MT.gun,.8,2,0);P(t,G.cylx(.38,10),MT.steel,8,2.2,0);P(t,G.cylx(.6,1.6),MT.dark,12.6,2.2,0);
  P(t,new THREE.BoxGeometry(.5,3,4.6),TD[s],3.4,2.6,0);P(t,G.box(2,1.8,1.6),MT.dark,-.4,1.8,-2.3);g.add(t);return g;
}
/* Helix "Hornet": open dune buggy with roll cage, coil-spring struts, twin rocket pods */
function buggyHelix(g,s,f){
  for(const x of [-8,8])for(const z of [-8,8]){bigTire(g,x,z,3.5,3.6,MT.steel);const zz=z*.62;
    ubeam(g,[x,3.5,z*.86],[x*.82,8.6,zz],.32,MT.steel);for(let i=0;i<4;i++)P(g,G.ring(.75,.22),TG[s],x*.91+(x*.82-x*.91)*.0,4.6+i*.95,z*.86+(zz-z*.86)*(i/4))}
  P(g,G.box(22,1.6,8.4),MT.gun,0,5,0);
  P(g,G.sh('hbug',sh=>{sh.moveTo(2,0);sh.lineTo(10,0);sh.quadraticCurveTo(14,.4,13.4,2.4);sh.lineTo(8,4.4);sh.lineTo(2,4.6);sh.closePath()},9.4,1),TD[s],0,5.8,0);
  P(g,G.box(9,3.6,8.6),TD[s],-6.5,7.6,0);for(let i=0;i<5;i++)P(g,new THREE.BoxGeometry(.4,.3,7.4),MT.dark,-10+i*1.6,9.55,0);
  for(const sd of [-1,1]){ubeam(g,[7,6.4,sd*4.2],[1,12.4,sd*4],.35,MT.steel);ubeam(g,[1,12.4,sd*4],[-9,12.4,sd*4],.35,MT.steel);ubeam(g,[-9,12.4,sd*4],[-11,7.4,sd*4.2],.35,MT.steel);
    P(g,new THREE.BoxGeometry(9,4,.2),MT.dark,-2,9.6,sd*4.3);P(g,G.sph(.6),MT.lamp,1.2,13.2,sd*3)}
  ubeam(g,[1,12.4,-4],[1,12.4,4],.35,MT.steel);ubeam(g,[-9,12.4,-4],[-9,12.4,4],.35,MT.steel);
  P(g,G.oct(1.1),MT.crys,-11.4,9.6,0,0,0,0,1,1.6,1);uEmblem(g,f,8.4,10.65,0,1.5);
  const t=new THREE.Group();t.name='turret';t.position.set(-4,13.2,0);
  P(t,G.box(4,1.4,4),MT.gun,0,.7,0);
  for(const z of [-2.4,2.4]){P(t,G.box(9,3.6,4.2),TD[s],1,3.4,z);P(t,new THREE.BoxGeometry(.8,3.8,4.4),TG[s],0,3.4,z);
    for(const yy of [-.9,.9])for(const zz of [-1.1,0,1.1])P(t,G.cylx(.42,.4),MT.door,5.6,3.4+yy,z+zz)}
  g.add(t);return g;
}

/* ---------- faction signature models ---------- */
function buildStank(g,s,f){
  for(const z of [-10.5,10.5]){tread(g,0,z,32,6.4,7.6);roadWheels(g,z,5,24,2.4,8.4);
    P(g,G.prof('stskirt',[[-17,0],[15,0],[19,2.4],[15,5.2],[-15,5.2],[-18,2.4]],8.6),MT.dark,0,4.6,z)}
  P(g,G.prof('sthull',[[-16,0],[14,0],[20,2.6],[10,7.4],[-12,7.8],[-17,4]],15),MT.gun,0,5,0);
  P(g,G.prof('stglac',[[0,0],[8,0],[2,4.4]],13.6),TD[s],9,8.6,0);
  for(const z of [-1,1]){P(g,new THREE.BoxGeometry(22,.35,.35),TG[s],-1,10,z*7.6);P(g,new THREE.BoxGeometry(3,.5,4),MT.dark,-14,13.2,z*3.6)}
  const t=new THREE.Group();t.name='turret';t.position.set(-2,13.4,0);
  P(t,G.prof('sttur',[[-9,0],[7,0],[11,1.8],[6,4.6],[-6,5],[-10,2.4]],11),MT.dark,0,0,0);
  P(t,new THREE.BoxGeometry(16,.4,11.4),TD[s],0,2.2,0);
  for(const z of [-1.6,1.6]){P(t,G.cylx(.75,18),MT.steel,17,2.6,z);P(t,G.cylx(1,2.4),MT.dark,26,2.6,z)}
  P(t,G.sph(.6),TG[s],8.6,3.4,0);uEmblem(t,f,-3,5.25,0,1.9);g.add(t);
}
function buildShieldGen(g,s,f,k,top){
  /* octagonal emitter plinth, coil column, three support pylons, and the dome it projects */
  P(g,G.cyl(7,8.5,6,24),MT.plate2,0,top+7,0);
  P(g,G.cyl(3.4,4.2,22,20),MT.gun,0,top+20,0);for(const y of [14,19,24])P(g,G.ring(4.4,.9),TG[s],0,top+y,0);
  P(g,G.sph(4.6),TG[s],0,top+34,0);P(g,G.ring(6.2,.5),MT.steel,0,top+34,0);P(g,G.ring(6.2,.5),MT.steel,0,top+34,0,Math.PI/2,0,0);
  for(let a=0;a<3;a++){const an=a*2.094+.5;const bx=Math.cos(an)*19,bz=Math.sin(an)*19;
    P(g,G.box(4,3,4),MT.gun,bx,top+5.5,bz);
    const v=new THREE.Vector3(-bx,26,-bz),L=v.length(),o=part(G.cyl(.8,1,+L.toFixed(1),8),MT.steel,bx/2,top+7+13,bz/2);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());g.add(o)}
  P(g,G.box(7,5,5),MT.plate2,14,top+4.5+2.5,12);P(g,new THREE.BoxGeometry(4,1,.3),TG[s],14,top+7,14.6);
  const dm=new THREE.Mesh(new THREE.SphereGeometry(SHIELD_R,40,14,0,Math.PI*2,0,Math.PI/2),new THREE.MeshBasicMaterial({color:COLORS[s].gl,transparent:true,opacity:.07,depthWrite:false,side:THREE.DoubleSide}));
  dm.name='dome';dm.userData.keep=true;dm.renderOrder=5;g.add(dm);
  const rg=new THREE.Mesh(new THREE.TorusGeometry(SHIELD_R,1.2,6,96).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:COLORS[s].gl,transparent:true,opacity:.45,depthWrite:false}));
  rg.name='dome';rg.userData.keep=true;rg.position.y=1.5;g.add(rg);
}

/* ---------- armour kit for vehicles ---------- */
G.sh=(name,build,d,bev)=>gk('sh'+name+'_'+d,()=>{const sh=new THREE.Shape();build(sh);bev=bev||1.2;
  return creased(scaleUV(new THREE.ExtrudeGeometry(sh,{depth:Math.max(.2,d-2*bev),bevelEnabled:true,bevelThickness:bev,bevelSize:bev*.8,bevelSegments:3,curveSegments:10}).translate(0,0,-Math.max(.2,d-2*bev)/2),1/22),40)});
/* rubber track belt with sloped ends, tread cleats on top */
function beam_(g,a,b,r,m){const v=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=v.length(),o=part(G.cyl(r,r,+L.toFixed(2),6),m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());g.add(o);return o}
function tread(g,x,z,len,hh,w){const r=hh*.5;
  P(g,G.prof('tr'+len+'_'+hh,[[-len/2+r,0],[len/2-r,0],[len/2,r],[len/2-r*.7,hh],[-len/2+r*.7,hh],[-len/2,r]],w),MT.dark,x,0,z);
  for(let i=-len/2+r;i<=len/2-r;i+=2.2)P(g,new THREE.BoxGeometry(.7,.35,w+.6),MT.gun,x+i,hh+.75,z)}
function roadWheels(g,z,n,span,r,w){for(let i=0;i<n;i++){const x=-span/2+i*span/(n-1);P(g,G.whl(r,w),MT.gun,x,r+.6,z);P(g,G.whl(r*.45,w+.5),MT.steel,x,r+.6,z)}}
function uEmblem(t,f,x,y,z,r){P(t,new THREE.PlaneGeometry(r*2,r*2),emblemMat(f>>4,f&15),x,y,z,-Math.PI/2,0,Math.PI/2)}
function vents(g,x,y,z,len,wid,n){P(g,new THREE.BoxGeometry(len,.3,wid),MT.dark,x,y,z);for(let i=0;i<n;i++)P(g,new THREE.BoxGeometry(.35,.25,wid*.9),MT.steel,x-len/2+(i+.5)*len/n,y+.2,z)}

/* Vanguard: broad slab-armoured battle tank, armoured track pods, short heavy gun */
function tankVanguard(g,s,f){
  for(const z of [-11,11]){const o=Math.sign(z);
    tread(g,0,z,34,7,8);roadWheels(g,z,5,25,2.6,9);P(g,G.whl(1.8,9.4),MT.steel,15.2,4.2,z);P(g,G.whl(1.8,9.4),MT.steel,-15.2,4.2,z);
    P(g,G.box(28,4.6,10.4),TD[s],-2,7.9,z);P(g,G.box(9,3.8,10),TD[s],13.4,7.2,z,0,0,-.42);
    vents(g,-5,12.6,z,11,4.6,5);P(g,G.box(6,1.6,10.6),MT.gun,-14,12.2,z);
    P(g,new THREE.BoxGeometry(20,.5,.3),MT.yellow,-3,9.4,z+o*5.32);
    for(const x of [-12,-4,4])P(g,new THREE.BoxGeometry(3.2,2.4,.3),MT.dark,x,10.2,z+o*5.28);
    P(g,G.sph(.85),MT.lamp,16.6,8.3,z-o*2.6)}
  P(g,G.box(28,7,13),MT.gun,-1,5.5,0);P(g,G.box(10,2.4,12.6),TD[s],11,10.3,0,0,0,-.33);
  for(const z of [-3.5,3.5])P(g,G.cylx(.9,3),MT.dark,-15.6,11,z);
  const t=new THREE.Group();t.name='turret';t.position.set(-1,12.4,0);
  P(t,G.prof('vtur',[[-9.5,0],[6,0],[10,2.4],[8.4,6],[-6.5,6.6],[-10,3.4]],15.5),TD[s],0,0,0);
  P(t,G.box(12,1.2,11),MT.gun,-1.5,6.6,0);
  P(t,G.cyl(2.4,2.6,1.8,20),MT.gun,-4,8,-3.4);P(t,G.ring(2.5,.3),MT.steel,-4,8.9,-3.4);
  P(t,G.box(4.2,3,3.6),MT.gun,1.6,8,3.4);P(t,G.sph(.8),TG[s],3.8,8.2,3.4);
  P(t,G.box(4.4,4.6,6.4),MT.gun,10.4,3.4,0);P(t,G.cylx(1.75,16),MT.steel,19.5,3.6,0);P(t,G.cylx(2,1.4),MT.yellow,23,3.6,0);
  P(t,G.cylx(2.5,4.4),MT.gun,28.5,3.6,0);P(t,new THREE.BoxGeometry(1.2,1,5.6),MT.dark,29.5,3.6,0);
  for(const z of [-1,1])P(t,new THREE.BoxGeometry(4,1.4,.4),MT.dark,-1,4.2,z*7.85);
  uEmblem(t,f,-5,7.25,2.4,2.4);P(t,G.cyl(.14,.2,12,4),MT.steel,-8.5,12,5.6);
  g.add(t);
}
/* Iron Syndicate: heavy assault tank, doubled tracks each side, twin long cannons, ram plow */
function tankSyndicate(g,s,f){
  for(const sd of [-1,1]){
    for(const zz of [7.2,13.2]){const z=sd*zz;tread(g,0,z,36,7.4,5.6);roadWheels(g,z,6,28,2.4,6.6)}
    P(g,G.prof('skirt',[[-17,0],[15,0],[18.5,3],[15.5,6],[-16,6],[-18.5,3]],1.4),TD[s],0,4,sd*16.6);
    for(const x of [-11,-3,5,13])P(g,G.cyl(.55,.55,.6,8),MT.steel,x,7.1,sd*17.4,Math.PI/2,0,0);
    P(g,G.box(34,2.2,13.4),MT.gun,0,8.6,sd*10.2);P(g,new THREE.BoxGeometry(28,.5,2),TD[s],-2,9.9,sd*15.3)}
  P(g,G.prof('shull',[[-16,0],[13,0],[18.5,3.2],[13,8],[-14,8],[-17,4.5]],15),MT.gun,0,6,0);
  P(g,G.prof('plow',[[0,0],[3,0],[6,6.4],[3,6.4]],30),TD[s],17,1.6,0);
  for(let z=-12;z<=12;z+=4)P(g,G.conex(.9,4,4),MT.spike,23.4,4.4,z);
  vents(g,-11,14.9,0,8,9,6);for(const z of [-5,5])P(g,G.cyl(1.1,1.3,4,10),MT.dark,-15,16,z);
  const t=new THREE.Group();t.name='turret';t.position.set(-1,14.4,0);
  P(t,G.prof('stur',[[-12,0],[8,0],[11.5,3],[8.5,7.2],[-9.5,7.2],[-12.5,3.6]],17.5),TD[s],0,0,0);
  P(t,G.prof('stur2',[[-8,0],[4,0],[6,2.6],[-7,2.6]],11),MT.gun,-1,8,0);
  for(const z of [-3,3]){P(t,G.box(6,3.4,2.6),MT.gun,11.6,3.6,z);P(t,G.cylx(1.25,26),MT.steel,25,3.7,z);P(t,G.cylx(1.6,1.2),MT.dark,18,3.7,z);
    P(t,G.box(4.4,2.6,2.6),MT.gun,38.6,3.7,z);P(t,new THREE.BoxGeometry(.6,1.8,1.8),MT.dark,40.9,3.7,z)}
  P(t,G.box(9,4,4.4),MT.gun,-2,4.4,-11);for(const y of [3.4,5.4])for(const z of [-12,-10])P(t,G.conex(.8,1.8,6),MT.orange,2.9,y,z);
  P(t,G.sph(.8),TG[s],9.6,6.4,6);P(t,G.sph(.8),TG[s],9.6,6.4,-6);
  for(const [x,y,z,rx,rz] of [[-11,7.6,-6,0,.9],[-11,7.6,6,0,.9],[-7,8.6,-8,-.5,.4],[-7,8.6,8,.5,.4]])P(t,G.cone(1,5.4,4),MT.spike,x,y,z,rx,0,rz);
  uEmblem(t,f,-3,11.45,0,2.6);
  g.add(t);
}
/* Helix Collective: sleek sculpted armour, exposed road wheels, very long rail cannon, light cluster */
function helixTracks(g,s,len,zs){
  for(const z of [-zs,zs]){const o=Math.sign(z);
    tread(g,0,z,len,7,7.4);roadWheels(g,z,4,len-12,3,8.4);
    P(g,G.sh('hfend'+len,sh=>{const L=len/2+.6;sh.moveTo(-L+1,0);sh.lineTo(L-5,0);sh.quadraticCurveTo(L+.6,0,L+.6,2.4);sh.lineTo(L-3,4);sh.lineTo(-L+3,4);sh.quadraticCurveTo(-L,4,-L,1.8);sh.closePath()},9,1.2),TD[s],0,7.6,z);
    P(g,new THREE.BoxGeometry(len*.55,.4,.3),TG[s],-1,9.4,z+o*4.55);P(g,new THREE.BoxGeometry(len*.5,.5,4.6),MT.gun,-2,12.85,z);for(const x of [-8,-3,2])P(g,new THREE.BoxGeometry(.4,.3,4.8),MT.dark,x,13.15,z);P(g,G.box(len*.45,1.2,7.8),MT.gun,-2,4.6,z)}
}
function tankHelix(g,s,f){
  helixTracks(g,s,32,10.5);
  P(g,G.sh('hxhull',sh=>{sh.moveTo(-15,0);sh.lineTo(12,0);sh.quadraticCurveTo(19,1,18,4.6);sh.lineTo(11,8.4);sh.lineTo(-11,8.8);sh.quadraticCurveTo(-16,8.6,-16,5);sh.closePath()},14,1.6),TD[s],0,5,0);
  for(const z of [-3.2,0,3.2])P(g,G.sph(.95),MT.orange,17.9,7.4,z);P(g,new THREE.BoxGeometry(.5,1,9),MT.dark,18.4,9.2,0,0,0,-.6);
  vents(g,-10,15.1,0,6,8,5);
  const t=new THREE.Group();t.name='turret';t.position.set(-1.5,14,0);
  P(t,G.sh('hxtur',sh=>{sh.moveTo(-10,0);sh.lineTo(7,0);sh.quadraticCurveTo(11,.4,10.4,3.2);sh.lineTo(6.5,6.6);sh.lineTo(-7,7);sh.quadraticCurveTo(-11,6.6,-11,3.4);sh.closePath()},12.4,1.6),TD[s],0,0,0);
  P(t,G.box(6,4,6),MT.gun,11,3.4,0);P(t,G.cylx(1.25,30),MT.steel,27,3.6,0);
  for(const x of [16,22,28])P(t,G.cylx(1.6,1.1),TG[s],x,3.6,0);
  P(t,G.box(5.6,2.8,3.4),MT.gun,43.5,3.6,0);for(const z of [-1.2,1.2])P(t,new THREE.BoxGeometry(2.4,.5,.5),MT.dark,44,3.6,z*1.4);
  P(t,G.cyl(2,2.2,1.4,18),MT.gun,-3,8.5,-2.6);P(t,G.box(9,.6,4),MT.gun,-1,8.4,-2.6);P(t,G.oct(1.6),MT.crys,-10.5,5.4,0,0,0,0,1,1.7,1);
  P(t,G.box(3.4,1.8,2.4),MT.gun,3.5,8.4,3.4);P(t,G.sph(.6),MT.lamp,5.3,8.4,3.4);
  uEmblem(t,f,-2.5,8.32,3,2.3);g.add(t);
}
function harvHelix(g,s){
  helixTracks(g,s,32,11.5);
  P(g,G.sh('hxhv',sh=>{sh.moveTo(-15,0);sh.lineTo(13,0);sh.quadraticCurveTo(17,0,17,4);sh.lineTo(15,9);sh.lineTo(-15,9);sh.closePath()},20,1.6),MT.gun,0,5,0);
  P(g,G.whl(4.2,22),MT.steel,18.4,5,0);for(let z=-9;z<=9;z+=4.5)P(g,G.oct(1.5),MT.crys,22,5,z,0,0,0,1.8,1,1);
  P(g,G.sh('hxcab',sh=>{sh.moveTo(-5,0);sh.lineTo(4,0);sh.quadraticCurveTo(7,0,6.4,3.4);sh.lineTo(3,8);sh.lineTo(-5,8);sh.closePath()},10,1.2),TD[s],8,14,-5);
  P(g,new THREE.BoxGeometry(.3,3,7),MT.win,13.2,18.6,-5,0,0,-.55);
  for(const z of [-7.8,7.8])P(g,G.box(18,6.6,2.4),TD[s],-5,16.4,z);P(g,G.box(2.4,6.6,17.8),TD[s],-14.2,16.4,0);
  P(g,G.cyl(1.4,1.8,10,16),MT.dark,2,19,8.6);P(g,G.ring(1.7,.4),MT.orange,2,24,8.6);
  addBin(g,-5);
}
function artyHelix(g,s){
  helixTracks(g,s,38,11.5);
  P(g,G.sh('hxart',sh=>{sh.moveTo(-18,0);sh.lineTo(15,0);sh.quadraticCurveTo(20,.5,19,4);sh.lineTo(14,7.6);sh.lineTo(-16,7.6);sh.quadraticCurveTo(-19,7,-18.6,3.6);sh.closePath()},16,1.6),MT.gun,0,5,0);
  for(const z of [-3,3])P(g,G.sph(.9),MT.orange,19.2,7,z);
  for(const z of [-9,9])P(g,new THREE.BoxGeometry(4,1,2.2),MT.steel,-20,3,z,0,0,.5);
}

/* Blender model per vehicle type and faction [Vanguard, Syndicate, Helix]; emblem spots fixed for the first models,
   read from 'emblem'/'emblemT' empties for the rest */
const GMK={tank:['tank_v','tank_s','tank_h'],htank:['htank_v','htank_s','htank_h'],mlrs:['mlrs_v','mlrs_s','mlrs_h'],buggy:['buggy_v','buggy_s','buggy_h'],
  arty:['arty_v','arty_s','arty_h'],harv:['harv_v','harv_s','harv_h'],stank:[null,'stank_s',null]};
const GEMB={tank_v:[1,-6.2,5.87,0,1.9],htank_v:[1,-8.5,7.27,0,2.4],mlrs_v:[0,11.4,14.75,0,1.6],buggy_v:[0,-10.4,10.1,0,1.5],arty_v:[1,1.5,8.67,0,2.2],
  harv_v:[0,8.6,20.62,6,2.1],tank_s:[1,1,8.45,3,2],tank_h:[1,-1,7.2,0,2.2]};
const GER={htank_s:3,mlrs_s:1.8,buggy_s:1.6,arty_s:2.2,harv_s:2.2,stank_s:1.8,htank_h:2.6,mlrs_h:2.2,buggy_h:1.4,arty_h:2.2,harv_h:2.2};
function buildUnit(type,f){
  const g=new THREE.Group(),st=f>>4,s=f&15;
  {const ur=UDEF[type].r+3;P(g,G.ring(ur,.55),TG[s],0,.5,0)}
  /* Blender infantry (see /blender/infantry.py): legs swing from the hips, the gun group recoils */
  {const ik='inf_'+type+'_'+'vsh'[st];if(GLB.scene[ik]){glbInto(g,ik,f,0,['legL','legR','gun']);return g}}
  if(type==='rifle'||type==='rocket'||type==='sniper'||type==='eng'||type==='gren')return buildInf(g,type,st,s);
  /* Blender-made vehicles (see /blender), one per faction; the code-built versions are used until a model has loaded */
  {const key=(GMK[type]||[])[st];
   if(key&&GLB.scene[key]){const pts=glbInto(g,key,f,0,['turret'])||{},t=g.getObjectByName('turret'),E=GEMB[key];
    if(E)uEmblem(E[0]&&t?t:g,f,E[1],E[2],E[3],E[4]);
    else if(pts.emblemT&&t)uEmblem(t,f,pts.emblemT[0]-t.position.x,pts.emblemT[1]-t.position.y+.08,pts.emblemT[2]-t.position.z,GER[key]||2);
    else if(pts.emblem)uEmblem(g,f,pts.emblem[0],pts.emblem[1]+.08,pts.emblem[2],GER[key]||2);
    if(type==='harv')addBin(g,-5.6);return g}}
  if(type==='htank'){if(st===1)htankSyndicate(g,s,f);else if(st===2)htankHelix(g,s,f);else htankVanguard(g,s,f);return g}
  if(type==='mlrs'){if(st===1)mlrsSyndicate(g,s,f);else if(st===2)mlrsHelix(g,s,f);else mlrsVanguard(g,s,f);return g}
  if(type==='tank'){if(st===1)tankSyndicate(g,s,f);else if(st===2)tankHelix(g,s,f);else tankVanguard(g,s,f);return g}
  if(type==='stank'){buildStank(g,s,f);return g}
  if(type==='rift'){buildInf(g,'rifle',2,s);P(g,G.ring(4,.45),TG[s],-3.6,13,0,0,0,Math.PI/2);P(g,G.oct(1.3),MT.crys,-3.6,13,0,0,0,0,1,1.6,1);
    P(g,G.cyl(.25,.25,16,6),MT.steel,1.2,8,-3.8);P(g,G.oct(1.1),MT.crys,1.2,16.6,-3.8,0,0,0,1,1.8,1);return g}
  if(type==='buggy'){if(st===1)return buggySyndicate(g,s,f);if(st===2)return buggyHelix(g,s,f);return buggyVanguard(g,s,f)}
  if(st===2){if(type==='harv'){harvHelix(g,s);return g}if(type==='arty'){artyHelix(g,s);return buildArtyTurret(g,st,s)}}
  if(type==='buggy')return buildBuggy(g,st,s);
  if(type==='arty')return buildArty(g,st,s);
  if(st===1)return buildUnitSyn(type,s,g);
  if(st===2)return buildUnitHelix(type,s,g);
  if(type==='harv'){

    for(const z of [-12,12]){
      P(g,G.box(32,7,7),MT.dark,0,3.6,z);
      for(let i=-2;i<=2;i++)P(g,G.whl(2.9,7.6),MT.gun,i*6,3.4,z);
    }
    P(g,G.box(30,9,20),MT.gun,-1,9,0);
    P(g,G.whl(4.2,24),MT.steel,17,5,0);
    for(let z=-9;z<=9;z+=4.5)P(g,G.conex(1.3,4.5,8),MT.spike,21.2,5,z);
    P(g,G.box(10,9,11),TD[s],9,17.6,-5);P(g,G.box(2.2,3.6,9),TG[s],13.5,18.6,-5);
    for(const z of [-7.6,7.6])P(g,G.box(18,6.6,2.6),MT.gun,-5,16.6,z);
    P(g,G.box(2.6,6.6,17.8),MT.gun,-14.2,16.6,0);
    P(g,G.cyl(1.6,2,12,20),MT.dark,2,20,7.5);P(g,G.ring(1.9,.5),MT.orange,2,26,7.5);
    addBin(g,-5);
  }else{
    const rk=type==='rocket';
    P(g,G.cyl(1.1,1.2,6,12),MT.dark,0,3,-1.5);P(g,G.cyl(1.1,1.2,6,12),MT.dark,0,3,1.5);
    P(g,G.cyl(2.9,3.3,6.4,20),TD[s],0,9,0);
    P(g,G.box(2.4,4.4,5.4),MT.gun,2.2,9.6,0);
    for(const z of [-3.6,3.6])P(g,G.dome(2.3),TD[s],0,11.4,z,0,0,0,1,.8,1);
    P(g,G.sph(2.6),MT.gun,0,14.4,0);
    P(g,G.box(1.4,1.2,3.6),TG[s],2.2,14.4,0);
    P(g,G.box(2.8,4.8,4.8),MT.dark,-3.3,10,0);
    if(rk){P(g,G.cylx(2,14),MT.gun,1.5,14.8,-4.4);P(g,G.conex(2,3.6,16),MT.orange,10.3,14.8,-4.4)}
    else{P(g,G.cylx(.8,11),MT.gun,5.8,10,2.6);P(g,G.box(4,2.6,1.6),MT.dark,1.6,9,2.6)}
  }
  return g;
}
function addBin(g,x){const bin=part(G.box(16,1,13),MT.crys,x,13,0);bin.name='bin';bin.userData.keep=true;bin.scale.y=.01;g.add(bin)}
/* Iron Syndicate: angular, spiked, heavy */
function buildUnitSyn(type,s,g){
  if(type==='tank'){
    for(const z of [-11,11]){
      P(g,G.prof('trk',[[-15,0],[15,0],[17,3],[15,7],[-15,7],[-17,3]],6),MT.dark,0,0,z);
      for(let i=-2;i<=2;i++)P(g,G.whl(2.6,6.6),MT.gun,i*6,3.4,z);
      P(g,new THREE.BoxGeometry(32,1.2,7.4),TD[s],0,7.8,z);
    }
    P(g,G.prof('hull',[[-14,0],[12,0],[17,3.5],[11,8],[-12,8],[-15,5]],17),MT.gun,0,3,0);
    P(g,new THREE.BoxGeometry(9,1.2,16),TD[s],12.5,9.6,0,0,0,-.55);
    P(g,new THREE.BoxGeometry(1.4,1.2,3),TG[s],16.6,6.6,-5);P(g,new THREE.BoxGeometry(1.4,1.2,3),TG[s],16.6,6.6,5);
    const t=new THREE.Group();t.name='turret';t.position.y=11;
    P(t,G.prof('tur',[[-9,0],[7,0],[10,3],[6,6.5],[-7,6.5],[-10,3]],14),TD[s],0,0,0);
    P(t,new THREE.BoxGeometry(1.2,1.6,7),TG[s],9.6,3.6,0);
    for(const z of [-2.4,2.4]){P(t,G.cylx(1.2,20),MT.steel,17,3.2,z);P(t,new THREE.BoxGeometry(3,2.4,2.4),MT.gun,27,3.2,z)}
    for(const [x,y,z,rx,rz] of [[-9,7.5,-5,0,.9],[-9,7.5,5,0,.9],[-5,8,-6.5,-.5,.4],[-5,8,6.5,.5,.4]])P(t,G.cone(1.1,6,4),MT.spike,x,y,z,rx,0,rz);
    g.add(t);
  }else if(type==='harv'){
    for(const z of [-12,12]){
      P(g,G.prof('trk',[[-15,0],[15,0],[17,3],[15,7],[-15,7],[-17,3]],6),MT.dark,0,0,z);
      for(let i=-2;i<=2;i++)P(g,G.whl(2.6,6.6),MT.gun,i*6,3.4,z);
    }
    P(g,G.prof('hvh',[[-15,0],[13,0],[15,4],[13,9],[-15,9]],20),MT.gun,0,3,0);
    P(g,G.box(4,7,26),TD[s],16,6,0);
    for(let z=-10;z<=10;z+=4)P(g,G.conex(1.5,6,4),MT.spike,20.5,4,z);
    P(g,G.prof('cab',[[-5,0],[5,0],[6.5,4],[3,8],[-5,8]],10),TD[s],8,12,-5);
    P(g,new THREE.BoxGeometry(1,2,8),TG[s],12.6,16.6,-5,0,0,-.4);
    for(const z of [-7.8,7.8])P(g,new THREE.BoxGeometry(18,7,1.4),MT.gun,-5,15.5,z);
    P(g,new THREE.BoxGeometry(1.4,7,15),MT.gun,-14,15.5,0);
    addBin(g,-5);
  }else{
    const rk=type==='rocket';
    P(g,new THREE.BoxGeometry(2,6,1.8),MT.dark,0,3,-1.6);P(g,new THREE.BoxGeometry(2,6,1.8),MT.dark,0,3,1.6);
    P(g,new THREE.BoxGeometry(5,6,6.4),TD[s],0,9,0);P(g,new THREE.BoxGeometry(1.2,4,5),MT.gun,2.8,9.6,0);
    for(const z of [-3.8,3.8]){P(g,new THREE.BoxGeometry(3.6,1.8,2.8),TD[s],0,12.4,z);P(g,G.cone(.7,3,4),MT.spike,0,14.6,z)}
    P(g,new THREE.BoxGeometry(4.2,3.6,4),MT.gun,0,14.4,0);P(g,new THREE.BoxGeometry(.8,1,3.4),TG[s],2.2,14.6,0);
    P(g,new THREE.BoxGeometry(2.6,4.6,4.6),MT.dark,-3.4,10,0);
    if(rk){P(g,new THREE.BoxGeometry(14,3.6,3.6),MT.gun,1.5,14.6,-4.2);P(g,G.conex(1.6,3.4,6),MT.orange,10.2,14.6,-4.2)}
    else{P(g,new THREE.BoxGeometry(11,1.6,1.4),MT.gun,5.5,10,2.6);P(g,new THREE.BoxGeometry(3,2.6,1.2),MT.dark,1.5,8.8,2.6)}
  }
  return g;
}
/* Helix Collective: smooth ceramic hover-tech with crystal emitters */
function buildUnitHelix(type,s,g){
  const hv=4;
  const pads=(pts,r)=>{for(const [x,z] of pts){P(g,G.cyl(r,r*1.1,2,24),MT.gun,x,hv-1.2,z);P(g,G.cyl(r*.75,r*.75,.6,24),TG[s],x,hv-2.4,z)}};
  if(type==='tank'){
    P(g,G.dome(1),TD[s],0,hv,0,0,0,0,17,7,12);P(g,G.dome(1),MT.ceram,-2,hv+5.4,0,0,0,0,10,2.6,8);
    P(g,G.dome(1),TD[s],0,hv,0,Math.PI,0,0,16,2.4,11);
    pads([[-10,-9],[-10,9],[9,-9],[9,9]],3.4);
    for(const z of [-1,1])P(g,new THREE.BoxGeometry(22,.8,.8),TG[s],-1,hv+2.6,z*11.3);
    const t=new THREE.Group();t.name='turret';t.position.y=hv+5.4;
    P(t,G.sph(5.6),TD[s],0,1.4,0,0,0,0,1.25,.75,1);
    for(const z of [-2.6,2.6]){P(t,G.cylx(1,13),MT.ceram,9,2,z);P(t,G.conex(1.8,4.4,6),MT.crys,17.4,2,z)}
    P(t,G.sph(1.2),TG[s],5.4,3.6,0);
    g.add(t);
  }else if(type==='harv'){
    P(g,G.dome(1),TD[s],0,hv,0,0,0,0,17,9,13);P(g,G.dome(1),MT.ceram,4,hv+7,6,0,0,0,7,2.4,5);
    P(g,G.dome(1),TD[s],0,hv,0,Math.PI,0,0,16,2.6,12);
    pads([[-10,-10],[-10,10],[10,-10],[10,10]],3.6);
    P(g,G.dome(5),TD[s],15,hv+4,0,0,0,-Math.PI/2);P(g,G.sph(1.6),TG[s],20.4,hv+4,0);
    P(g,G.sph(4),TD[s],8,hv+8,-6,0,0,0,1,.75,1);P(g,new THREE.BoxGeometry(1,1.4,5),TG[s],11.6,hv+9,-6);
    for(const z of [-7,7])P(g,G.box(16,4,2.4),MT.ceram,-5,13.5,z);
    addBin(g,-5);
  }else{
    const rk=type==='rocket';
    P(g,G.cyl(.9,1.1,6.5,12),MT.ceram,0,3.2,-1.4);P(g,G.cyl(.9,1.1,6.5,12),MT.ceram,0,3.2,1.4);
    P(g,G.cyl(2.4,3,7,20),MT.ceram,0,9.6,0);P(g,new THREE.BoxGeometry(5.2,1.4,1.2),TD[s],.4,10.6,0,0,0,.5);
    for(const z of [-3.2,3.2])P(g,G.sph(1.6),TD[s],0,12.8,z);
    P(g,G.sph(2.3),TD[s],0,15.4,0,0,0,0,1,1.3,1);P(g,G.ring(2.35,.38),TG[s],0,15.6,0);
    P(g,G.oct(1.8),MT.crys,-3.2,11.4,0,0,0,0,1,1.8,1);
    if(rk){P(g,G.cylx(2.1,10),TD[s],1,15.8,-4.2);P(g,G.conex(2.1,4,6),MT.crys,8,15.8,-4.2)}
    else{P(g,G.cylx(.6,10),MT.ceram,5.5,10,2.6);P(g,G.sph(.9),TG[s],10.8,10,2.6)}
  }
  return g;
}

/* ---------- buildings: same function everywhere, styled per faction ---------- */
function lamp(g,x,y,z){P(g,G.cyl(.35,.45,11,6),MT.steel,x,y+5.5,z);P(g,new THREE.BoxGeometry(2.8,.6,1),MT.steel,x+1.2,y+11,z);P(g,G.sph(.75),MT.lamp,x+2.4,y+10.4,z)}
function roofUnits(g,x,y,z,w,d){P(g,G.box(6,3.2,4.4),MT.steel,x-w*.22,y+1.6,z-d*.2);P(g,G.cyl(1.4,1.4,1,16),MT.dark,x-w*.22,y+3.6,z-d*.2);
  P(g,G.cyl(1,1.2,3,12),MT.steel,x+w*.25,y+1.5,z+d*.18);P(g,G.cyl(1.6,1.6,.5,12),MT.steel,x+w*.25,y+3.2,z+d*.18);P(g,G.box(4,2.4,3),MT.steel,x+w*.1,y+1.2,z-d*.25)}
function ladder(g,x,y,z,h,ry){const grp=new THREE.Group();grp.position.set(x,y,z);grp.rotation.y=ry||0;
  for(const s2 of [-1,1])P(grp,new THREE.BoxGeometry(.3,h,.3),MT.steel,s2*1.1,h/2,0);for(let yy=1.5;yy<h;yy+=2)P(grp,new THREE.BoxGeometry(2.2,.25,.25),MT.steel,0,yy,0);
  grp.updateMatrix();for(const c of [...grp.children]){c.applyMatrix4(grp.matrix);g.add(c)}}
const LAMPS={tech:[],guard:[],missile:[],power:[],refinery:[],barracks:[],factory:[],yard:[],turret:[]};
function buildBld(type,f){
  const g=new THREE.Group(),d=BDEF[type],w=d.w*T,h=d.h*T,ty=3,k=kit(f),s=f&15,st=k.st,PT=ty+4;
  const gm=mat(0xffc94a,{emissive:0xffa020,emissiveIntensity:1.3});gm.userData.glow=true;
  const steam=[];
  /* no platforms: each structure stands on the ground itself. `drop` lowers the old plinth-top level to ground level. */
  let drop=0;
  /* faction finish: walls per faction, roofs + trim in team colour */
  const W=st===2?MT.ceram:st===1?MT.gun:MT.plate2,TB=TD[s],R=TD[s],PAD=st===1?MT.blackpad:st===2?MT.ceram:MT.pad;
  const deco=(x,y,z,sc)=>{
    if(st===1){P(g,G.cone(1.4*sc,8*sc,4),MT.spike,x-2.6*sc,y+4*sc,z);P(g,G.cone(1.4*sc,10*sc,4),MT.spike,x+2.6*sc,y+5*sc,z)}
    else if(st===2){P(g,G.oct(3*sc),MT.crys,x,y+5*sc,z,0,0,0,1,2,1);P(g,G.oct(2*sc),MT.crys,x+3.4*sc,y+3*sc,z+1.4*sc,0,0,.4,1,1.8,1)}
    else{P(g,G.cyl(.5*sc,.7*sc,12*sc,8),MT.steel,x,y+6*sc,z);P(g,G.sph(1.3*sc),TG[s],x,y+12.5*sc,z)}};
  /* ---- realism kit ---- */
  const slab=r=>{P(g,new THREE.ExtrudeGeometry(rrect(w-4,h-4,r+2),{depth:1.4,bevelEnabled:false,curveSegments:8}).rotateX(-Math.PI/2),MT.gun,0,ty,0);
    P(g,scaleUV(new THREE.ExtrudeGeometry(rrect(w-8,h-8,r),{depth:2.4,bevelEnabled:true,bevelThickness:.8,bevelSize:.8,bevelSegments:2,curveSegments:8}).rotateX(-Math.PI/2),1/30),PAD,0,ty+.8,0)};
  const bar=(x,y,z,bw,bh,bd,m,ry)=>P(g,new THREE.BoxGeometry(bw,bh,bd),m,x,y,z,0,ry||0,0);
  const box=(x,y,z,bw,bh,bd,m,ry)=>P(g,G.box(bw,bh,bd),m,x,y+bh/2,z,0,ry||0,0);
  const UP=new THREE.Vector3(0,1,0);
  const beam=(a,b,r,m,sq)=>{const v=new THREE.Vector3(b[0]-a[0],b[1]-a[1],b[2]-a[2]),L=v.length();
    const o=part(sq?new THREE.BoxGeometry(r*2,L,r*2):G.cyl(r,r,+L.toFixed(1),10),m,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2);o.quaternion.setFromUnitVectors(UP,v.normalize());g.add(o);return o};
  const seams=list=>{for(const [x,z,sw,sd] of list)bar(x,PT+.1,z,sw,.3,sd,MT.dark)};
  const hall=(x,z,bw,bd,bh,y0)=>{y0=y0==null?PT:y0;box(x,y0,z,bw,bh,bd,W);bar(x,y0+1.4,z,bw+.5,2.8,bd+.5,TB);
    bar(x,y0+bh+.5,z,bw+.9,1,bd+.9,MT.steel);bar(x,y0+bh+1.1,z,bw-1.2,.5,bd-1.2,R);return y0+bh+1.35};
  const winZ=(x,y,zf,ww,wh,n)=>{bar(x,y,zf+.15,ww,wh,.3,MT.win);bar(x,y+wh/2+.35,zf+.4,ww+.8,.7,.8,MT.steel);bar(x,y-wh/2-.35,zf+.4,ww+.8,.7,.8,MT.steel);
    for(let i=0;i<=(n||0)+1;i++)bar(x-ww/2+i*ww/((n||0)+1),y,zf+.35,.4,wh,.5,MT.steel)};
  const winX=(xf,y,z,ww,wh,n,sg)=>{sg=sg||1;bar(xf+.15*sg,y,z,.3,wh,ww,MT.win);bar(xf+.4*sg,y+wh/2+.35,z,.8,.7,ww+.8,MT.steel);bar(xf+.4*sg,y-wh/2-.35,z,.8,.7,ww+.8,MT.steel);
    for(let i=0;i<=(n||0)+1;i++)bar(xf+.35*sg,y,z-ww/2+i*ww/((n||0)+1),.5,wh,.4,MT.steel)};
  const rollDoor=(x,y,zf,dw,dh)=>{bar(x,y+dh/2,zf+.3,dw,dh,.6,MT.door);for(let yy=1.1;yy<dh-.4;yy+=1.4)bar(x,y+yy,zf+.66,dw-.4,.2,.15,MT.steel);
    for(const sx of [-1,1])bar(x+sx*(dw/2+.7),y+dh/2,zf+.5,1.4,dh+.4,1.2,MT.crane);bar(x,y+dh+.9,zf+.5,dw+2.8,1.4,1.2,MT.haz)};
  const hazG=(x,y,z,len,wid,alongZ)=>bar(x,y+.13,z,len,.26,wid,MT.haz,alongZ?Math.PI/2:0);
  const fanU=(x,y,z,r)=>{P(g,G.cyl(r,r,1.2,24),MT.dark,x,y+.6,z);P(g,G.ring(r,.35),MT.steel,x,y+1.2,z);
    const fn=new THREE.Group();fn.name='fan';fn.position.set(x,y+1.25,z);
    for(let b=0;b<5;b++)P(fn,new THREE.BoxGeometry(r*.85,.18,r*.32),MT.steel,Math.cos(b*1.2566)*r*.42,0,-Math.sin(b*1.2566)*r*.42,0,b*1.2566,.35);
    P(fn,G.cyl(r*.22,r*.22,.5,10),MT.gun,0,.1,0);g.add(fn)};
  const acUnit=(x,y,z)=>{box(x,y,z,7,3.2,5,MT.steel);fanU(x-1.4,y+3.2,z,1.7);for(let i=0;i<4;i++)bar(x+3.55,y+.7+i*.6,z,.2,.3,4,MT.dark)};
  const vent=(x,y,z)=>{P(g,G.cyl(.7,.7,3,10),MT.steel,x,y+1.5,z);P(g,G.cyl(1.1,1.1,.5,10),MT.steel,x,y+3.1,z)};
  const rail=(pts,y,hh)=>{hh=hh||3;for(let i=1;i<pts.length;i++){const [ax,az]=pts[i-1],[bx,bz]=pts[i],L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.round(L/4.5));
      for(let j=0;j<=n;j++){if(j===0&&i>1)continue;bar(ax+(bx-ax)*j/n,y+hh/2,az+(bz-az)*j/n,.3,hh,.3,MT.steel)}
      beam([ax,y+hh,az],[bx,y+hh,bz],.16,MT.steel);beam([ax,y+hh*.5,az],[bx,y+hh*.5,bz],.12,MT.steel)}};
  const bags=(x,z,n,ry)=>{const a=ry||0;for(let i=0;i<n;i++){const dx=Math.cos(a)*i*5.6,dz=-Math.sin(a)*i*5.6;P(g,G.box(5.4,2.6,3),MT.sand,x+dx,PT+1.3,z+dz,0,a,0);P(g,G.box(5.4,2.4,3),MT.sand,x+dx+Math.cos(a)*2.7,PT+3.8,z+dz-Math.sin(a)*2.7,0,a,0)}};
  const stack=(x,z,r,hh)=>{P(g,G.cyl(r*.88,r,hh,20),MT.dark,x,PT+hh/2,z);for(let y=6;y<hh-2;y+=7)P(g,G.ring(r*.95,.35),MT.steel,x,PT+y,z);
    P(g,G.ring(r*.9,.6),MT.orange,x,PT+hh,z);steam.push([x,PT+hh+1,z]);ladder(g,x+r+.4,PT,z,hh-2,Math.PI/2)};
  const transformer=(x,z)=>{box(x,PT+.8,z,6,6,4.6,MT.steel);for(const sx of [-1,1])for(let i=0;i<3;i++)bar(x+sx*3.25,PT+3.8,z-1.5+i*1.5,.5,5,.3,MT.dark);
    for(const dx of [-1.8,0,1.8]){P(g,G.cyl(.45,.6,3,8),MT.ceram,x+dx,PT+8.3,z);P(g,G.sph(.6),MT.ceram,x+dx,PT+9.9,z)}};
  switch(type){
    case 'power':{
      /* Blender model (see /blender/power_plant.py) when loaded */
      const gp=GLB.scene.power&&glbInto(g,'power',f,0);
      if(gp){
        for(const k of ['steam1','steam2','steam3'])if(gp[k])steam.push(gp[k]);
        for(const k of ['emblem1','emblem2'])if(gp[k])emblem(g,f,gp[k][0],gp[k][1]+.45,gp[k][2],3.4);
        const TT=[[-1,38.4,-7,8.6]];
        if(st===1)for(const [x,y,z,r] of TT)for(let a=0;a<4;a++){const an=a*Math.PI/2+.4;P(g,G.cone(1.1,5,4),MT.spike,x+Math.cos(an)*r,y+1.8,z+Math.sin(an)*r,Math.sin(an)*.4,0,-Math.cos(an)*.4)}
        if(st===2)for(const [x,y,z,r] of TT){P(g,G.oct(1.7),MT.crys,x+r*.95,y-7,z,0,0,0,1,1.9,1);P(g,G.oct(1.2),MT.crys,x-r*.7,y-4,z-r*.7,0,.5,0,1,1.8,1)}
        break}
      /* one compact plant: three cooling towers clustered round a reactor, looping coolant pipes */
      const TW=st===1?MT.brickD:st===2?MT.ceram:MT.concrete,top=ty+4.5;
      drop=top;
      const TWS=[[-16,1],[16,1],[0,-16.5]],TR=9.6,TH=21;
      for(const [x,z] of TWS){
        P(g,G.cool(TR,TH),TW,x,top,z);P(g,G.cyl(TR*.7,TR*.7,.6,28),MT.dark,x,top+TH*.86,z);
        P(g,G.ring(TR*.8,.7),MT.gun,x,top+TH-.4,z);P(g,G.ring(TR*.77,.45),TB,x,top+TH-2.4,z);P(g,G.ring(TR*.99,.6),MT.gun,x,top+.6,z);
        for(let a=0;a<6;a++){const an=a*1.047+.5;bar(x+Math.cos(an)*TR*.98,top+1.6,z+Math.sin(an)*TR*.98,1.6,3.2,1.6,MT.gun)}
        steam.push([x,top+TH+1,z])}
      /* reactor core */
      const CZ=7;P(g,G.cyl(8,8.6,4,28),MT.gun,0,top+2,CZ);
      P(g,G.cyl(6.8,7.4,13,28),TB,0,top+10.5,CZ);for(let a=0;a<12;a++)bar(Math.cos(a*.5236)*7.2,top+10.5,CZ+Math.sin(a*.5236)*7.2,.8,13,.8,MT.steel);
      for(const y of [6,15])P(g,G.ring(7.3,.5),MT.gun,0,top+y,CZ);P(g,G.ring(7.15,.7),k.glow,0,top+10.5,CZ);
      P(g,G.dome(6.8),MT.gun,0,top+17,CZ,0,0,0,1,.55,1);P(g,G.cyl(2,2.4,3,16),MT.steel,0,top+20.6,CZ);P(g,G.sph(1.3),TG[s],0,top+22.6,CZ);
      for(const [x,z] of TWS){const a=Math.atan2(z-CZ,x),L=Math.hypot(x,z-CZ)-TR*.8-7;bar(Math.cos(a)*(7+L/2),top+2.5,CZ+Math.sin(a)*(7+L/2),L+2,5,6,W,-a)}
      /* coolant pipes looping from the core over into each tower */
      TWS.forEach(([x,z],i)=>{for(const off of [-1,1]){const a=Math.atan2(z-CZ,x),pa=a+off*.32,sx=Math.cos(pa)*7.6,sz=CZ+Math.sin(pa)*7.6,ex=x-Math.cos(a)*TR*.72+Math.cos(pa+Math.PI/2)*off*1.6,ez=z-Math.sin(a)*TR*.72+Math.sin(pa+Math.PI/2)*off*1.6;
        const key='cp'+i+off,pts=[[sx,top+9+off*2,sz],[sx*1.3,top+20+off*1.5,CZ+(sz-CZ)*1.3],[(sx+ex)/2,top+24+off,(sz+ez)/2],[ex,top+14+off*1.5,ez]];
        P(g,gk(key,()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p))),24,1.05,8,false)),off>0?MT.gun:MT.steel,0,0,0)}});
      /* front entrance + control box */
      bar(0,top+3,17,10,6,5,W);bar(0,top+2.8,19.6,5,5.2,.4,MT.door);bar(0,top+6.4,19.8,6,.8,.5,gm);
      emblem(g,f,-14,top,19,3.4);emblem(g,f,14,top,19,3.4);
      if(st===1)for(const [x,z] of TWS){P(g,G.cone(1.1,5,4),MT.spike,x+TR*.55,top+TH-.2,z,0,0,-.4);P(g,G.cone(1.1,5,4),MT.spike,x-TR*.55,top+TH-.2,z,0,0,.4)}
      if(st===2)for(const [x,z] of TWS)P(g,G.oct(1.6),MT.crys,x,top+TH*.55,z+(z>0?TR*.74:-TR*.74),0,0,0,1,1.8,1);
      if(st===0)P(g,G.cyl(.3,.4,10,6),MT.steel,4,top+22,CZ+3);
      break}
    case 'refinery':{
      /* Blender model (see /blender/refinery.py) when loaded: drive-in bay sized for the harvesters */
      const gr=GLB.scene.refinery&&glbInto(g,'refinery',f,0);
      if(gr){
        for(const k of ['steam1','steam2'])if(gr[k])steam.push(gr[k]);
        if(gr.emblem1)emblem(g,f,gr.emblem1[0],gr.emblem1[1]+.1,gr.emblem1[2],5);
        if(st===1&&gr.vat)for(let a=0;a<12;a++){const an=a*.5236;P(g,G.cone(1,4.6,4),MT.spike,gr.vat[0]+Math.cos(an)*15.4,gr.vat[1]+2.6,gr.vat[2]+Math.sin(an)*15.4)}
        if(st===2&&gr.silo){P(g,G.oct(2.2),MT.crys,gr.silo[0],gr.silo[1]+3.4,gr.silo[2],0,0,0,1,1.8,1);
          for(let a=0;a<3;a++)P(g,G.oct(1.3),MT.crys,gr.silo[0]+Math.cos(a*2.09)*5,gr.silo[1]-1.2,gr.silo[2]+Math.sin(a*2.09)*5,0,a,0,1,1.7,1)}
        break}
      /* one integrated plant: crystal vat, storage drum, twin-stack processing tower, harvester ramp */
      const top=ty+3.6;
      drop=top;
      /* vat */
      const vx=18,vz=4,VR=22.5;
      P(g,G.cyl(VR,VR+1.4,9,56),st===1?MT.gun:W,vx,top+4.5,vz);P(g,G.cyl(VR+1.5,VR+1.5,2,56),MT.haz,vx,top+2.6,vz);
      P(g,G.ring(VR-.4,1.3),MT.steel,vx,top+9.6,vz);P(g,G.ring(VR-2.6,.8),TB,vx,top+9.8,vz);
      P(g,G.cyl(VR-1.2,VR-1.2,.6,56),MT.pool,vx,top+9.3,vz);P(g,G.ring(VR-3.4,.5),k.glow,vx,top+9.7,vz);
      for(let i=0;i<8;i++)P(g,G.oct(1.6+(i%3)*.5),MT.crys,vx+Math.cos(i*.8)*(5+i*1.4),top+9.8,vz+Math.sin(i*.8)*(5+i*1.4),0,i,0,1,1.7,1);
      for(let a=0;a<14;a++){const an=a*.4488;bar(vx+Math.cos(an)*(VR+1.2),top+5.6,vz+Math.sin(an)*(VR+1.2),2.2,6,2.2,MT.gun,-an)}
      /* storage drum */
      const dx=-24,dz=-11,DR=12;
      P(g,G.cyl(DR,DR,13,40),W,dx,top+6.5,dz);P(g,G.cyl(DR+.1,DR+.1,2.2,40),TB,dx,top+3,dz);P(g,G.cyl(DR+.05,DR+.05,1.6,40,true),MT.win,dx,top+9,dz);
      P(g,G.ring(DR,.6),MT.steel,dx,top+13,dz);P(g,G.cyl(DR-1,DR-1,.6,40),R,dx,top+13.2,dz);emblem(g,f,dx+2,top+13.5,dz+2,4.4);acUnit(dx-5,top+13.2,dz-4);
      bar((dx+vx)/2-4,top+4,dz+1,16,8,12,W);bar((dx+vx)/2-4,top+8.2,dz+1,16.4,.6,12.4,MT.steel);
      /* processing tower + twin stacks */
      const px=-8,pz=-19;box(px,top,pz,22,15,13,W);bar(px,top+1.4,pz,22.5,2.8,13.5,TB);bar(px,top+15.4,pz,22.8,.8,13.8,MT.steel);
      bar(px,top+11,pz+6.7,18,2.6,.3,MT.win);bar(px,top+6.5,pz+6.7,14,1,.4,gm);
      for(const x of [px-5.5,px+5]){P(g,G.cyl(2.6,2.9,26,22),MT.steel,x,top+28,pz-1);for(const y of [24,34])P(g,G.cyl(2.75,2.75,2.8,22),TB,x,top+y,pz-1);
        P(g,G.ring(2.6,.5),MT.dark,x,top+41,pz-1);steam.push([x,top+42,pz-1])}
      beam([px+8,top+12,pz+4],[vx-8,top+9.5,vz-12],1.4,MT.crys);beam([px+10,top+8,pz+3],[vx-12,top+7,vz-10],1,MT.steel);
      /* drive-in harvester bay: flat deck between lit walls, intake hood at the back, entry ramp */
      const rx=-22,rz=16;
      bar(rx,top+.12,rz+1,23,.24,28,MT.plate2);P(g,G.prof('rentr',[[-6,0],[0,0],[0,3.6]],23),MT.plate2,rx,ty,31,0,Math.PI/2,0);
      for(let i=0;i<4;i++)for(const sd of [-1,1])bar(rx+sd*2.8,top+.32,8+i*5,6,.2,1.1,MT.yellow,sd*.55);
      for(const sd of [-1,1]){bar(rx+sd*12.8,top+3.5,rz+1,1.8,7,28,TB);bar(rx+sd*12.8,top+7.1,rz+1,2,.5,28,MT.steel);for(let i=0;i<4;i++)bar(rx+sd*12.8,top+7.5,5+i*7,1.2,.4,1.6,gm)}
      bar(rx,top+5,1.2,24,10,3.4,W);bar(rx,top+3,3,15,5.6,.4,MT.door);bar(rx,top+8.8,3.1,17,1.2,.5,MT.haz);
      hazG(rx,ty,37.6,23,1.2);
      beam([rx+9,top+6,0],[vx-17,top+6,vz-8],1.3,MT.steel);
      if(st===1){for(let a=0;a<10;a++){const an=a*.628;P(g,G.cone(1,4.6,4),MT.spike,vx+Math.cos(an)*(VR+1.6),top+10.6,vz+Math.sin(an)*(VR+1.6))}}
      if(st===2){P(g,G.oct(2),MT.crys,dx,top+15.6,dz-6,0,0,0,1,1.8,1);P(g,G.oct(1.4),MT.crys,px+9,top+17,pz,0,0,0,1,1.8,1)}
      if(st===0)P(g,G.cyl(.3,.4,10,6),MT.steel,dx-6,top+18.4,dz+5);
      break}
    case 'barracks':{
      /* twin ribbed troop halls with sloped entrance frames, rear bunker, scaffold stair tower, flag */
      const top=ty+3,n0=g.children.length;
      drop=top;
      /* rear bunker drum */
      P(g,G.cyl(9.4,10,7,32),TB,0,top+3.5,-19);P(g,G.dome(9.4),MT.gun,0,top+7,-19,0,0,0,1,.5,1);P(g,G.cyl(2.2,2.6,2.4,14),MT.steel,0,top+11.4,-19);
      for(let a=0;a<8;a++)bar(Math.cos(a*.785)*9.9,top+3.5,-19+Math.sin(a*.785)*9.9,.8,7,.8,MT.steel,-a*.785);
      for(const x of [-10,10]){
        P(g,G.arch(9.5,40),W,x,top,-1);
        for(let z=-19;z<=17;z+=6)P(g,G.rib(9.75,.5),MT.gun,x,top,z);
        P(g,new THREE.BoxGeometry(1.6,.6,40),TB,x,top+9.55,-1);
        for(const sd of [-1,1])P(g,new THREE.BoxGeometry(.5,1.6,40),TB,x+sd*9.45,top+.8,-1);
        P(g,new THREE.CircleGeometry(9.3,28,0,Math.PI),MT.plate2,x,top,19.05);
        P(g,G.prof('bdoor',[[-6.2,0],[6.2,0],[4.6,8.4],[-4.6,8.4]],2.6),TB,x,top,19.9);
        {const dr=new THREE.Group();dr.name='door';dr.position.set(x,top+6.6,21.5);P(dr,G.prof('bdin',[[-4.4,0],[4.4,0],[3.2,6.6],[-3.2,6.6]],.6),MT.door,0,-6.6,0);for(let yy=1;yy<6.4;yy+=1.3)P(dr,new THREE.BoxGeometry(7-yy*.35,.18,.2),MT.steel,0,yy-6.6,.45);g.add(dr)}
        bar(x,top+3.3,20.7,7.6,6.6,.3,MT.dark);
        bar(x,top+7.4,21.9,6,.7,.4,gm);
        bar(x,top+.15,25.5,9.6,.3,8,MT.plate2);hazG(x-5.2,top+.15,25.5,8,1,true);hazG(x+5.2,top+.15,25.5,8,1,true);
        for(let i=0;i<2;i++)for(const sd of [-1,1])bar(x+sd*1.8,top+.35,23.5+i*3,3.8,.2,.8,MT.steel,sd*.55);
      }
      /* scaffold stair tower */
      const sx=-25;
      for(const z of [-14,-2,10])for(const dx of [-1.8,1.8])bar(sx+dx,top+7.5,z,.7,15,.7,MT.rust);
      bar(sx,top+15.2,-2,4.6,.6,26,MT.rust);rail([[sx-2.3,-15],[sx-2.3,11]],top+15.5,2.6);
      for(const z of [-14,-2])for(const dx of [-1.8,1.8])beam([sx+dx,top,z],[sx+dx,top+14,z+12],.2,MT.rust);
      for(let i=0;i<8;i++)bar(sx,top+1.6+i*1.75,22-i*1.5,3.4,.3,1.2,MT.steel);
      beam([sx-1.7,top,23],[sx-1.7,top+15,10.5],.25,MT.rust);beam([sx+1.7,top,23],[sx+1.7,top+15,10.5],.25,MT.rust);
      /* flag with the faction emblem */
      P(g,G.cyl(.35,.45,24,8),MT.steel,22,top+12,-22);bar(26.6,top+20.6,-22,9,6,.25,TB);
      for(const sd of [-1,1])P(g,new THREE.PlaneGeometry(5.2,5.2),emblemMat(st,s),26.6,top+20.6,-22+sd*.16,0,sd>0?0:Math.PI,0);
      deco(st===2?0:10,top+9.6,-12,.55);
      /* scale the whole barracks up so it holds its own next to the other buildings: wider and much taller */
      {const bg=new THREE.Group();bg.position.y=top;bg.scale.set(1.2,1.5,1.2);for(const c of g.children.slice(n0)){c.position.y-=top;bg.add(c)}g.add(bg)}
      break}
    case 'factory':{
      /* armoured sloped assembly bunker under a heavy gantry crane */
      const top=ty+3.6;
      drop=top;
      P(g,G.prof('wfbody',[[-28,0],[30,0],[30,8],[22,19],[-12,17],[-28,3]],62),st===1?MT.gun:W,0,top,0,0,Math.PI/2,0);
      for(const sd of [-1,1]){bar(sd*31.4,top+9,-3,.5,2.6,44,TB);bar(sd*31.4,top+4.5,-1,.5,1.4,50,MT.haz);
        for(const z of [-18,-6,6])bar(sd*31.4,top+13,z,.4,3,7,MT.dark)}
      /* louvred armour on the sloped front, either side of the vehicle bay */
      for(const sd of [-1,1])for(let i=0;i<7;i++){const t2=i/6,zz=27-t2*14.5,yy=top+3+t2*13.4;P(g,new THREE.BoxGeometry(12,.5,1.7),MT.dark,sd*22.5,yy+.9,zz+.3,.72,0,0)}
      bar(0,top+6,25.8,28,12,5,MT.gun);bar(0,top+5.6,28.25,23,11,.2,MT.dark);
      {const dr=new THREE.Group();dr.name='door';dr.position.set(0,top+11.1,28.4);P(dr,new THREE.BoxGeometry(23,11,.4),MT.door,0,-5.5,.1);for(let yy=1.4;yy<11;yy+=1.6)P(dr,new THREE.BoxGeometry(22,.2,.15),MT.steel,0,yy-11.1,.38);g.add(dr)}
      bar(0,top+12.6,28.5,30,1.4,1,MT.haz);for(const sd of [-1,1])bar(sd*13.2,top+6,28.5,1.6,12,1,TB);
      bar(0,top+.2,36,26,.4,10,MT.plate2);hazG(-13.2,top+.2,36,10,1.1,true);hazG(13.2,top+.2,36,10,1.1,true);
      for(let i=0;i<3;i++)for(const sd of [-1,1])bar(sd*3,top+.45,33+i*3,6,.2,1,MT.yellow,sd*.55);
      /* deck: vents, hatches, emblem, stacked armour plates being loaded */
      vents(g,-14,top+18.6,4,12,7,6);vents(g,14,top+18.6,4,12,7,6);
      emblem(g,f,0,top+19.4,-4,5.6);
      for(let r=0;r<2;r++)for(const x of [-13,-1,11])box(x,top+19.2+r*4.4,-19-(r?0:0),10.5,4.2,8,r?TB:MT.gun);
      /* gantry crane */
      const GX=37,GY=top+42,gz1=10,gz2=-24;
      for(const x of [-GX,GX])for(const z of [gz1,gz2]){bar(x,top+21,z,2.6,42,2.6,MT.rust);bar(x,top+.6,z,5,1.2,5,MT.steel)}
      for(const x of [-GX,GX]){beam([x,top+3,gz1],[x,GY-4,gz2],.4,MT.rust);beam([x,top+3,gz2],[x,GY-4,gz1],.4,MT.rust);bar(x,GY,(gz1+gz2)/2,2.8,2.8,gz1-gz2+2.6,MT.rust)}
      for(const z of [gz1,gz2])bar(0,GY,z,GX*2+2.6,2.8,2.8,MT.rust);
      bar(0,GY+1.6,-7,GX*2,1,3,MT.gun);
      const cy=GY-1.6;bar(0,cy,-8,8,3,8,MT.gun);for(const sd of [-1,1])P(g,G.cyl(.25,.25,12,6),MT.steel,sd*1.6,cy-7.5,-8);
      bar(0,cy-13.5,-8,5,2,4,MT.gun);for(const sd of [-1,1]){beam([sd*2,cy-14,-8],[sd*4.6,cy-19.5,-8],.45,MT.steel);beam([sd*4.6,cy-19.5,-8],[sd*3,cy-23,-8],.4,MT.steel)}
      P(g,G.arch(5.5,22),MT.win,0,GY+2.1,-7,0,Math.PI/2,0);P(g,new THREE.BoxGeometry(23,.6,11.4),TB,0,GY+2,-7);
      for(const x of [-30,30])lamp(g,x,top,30);
      steam.push([24,top+20,-24],[-24,top+20,-24]);
      deco(24,top+18.6,-16,.7);
      break}
    case 'tech':{
      /* same poured foundation as the power plant / barracks, then one of three faction research centres */
      const top=ty+4.5;
      drop=top;
      const wallEmb=(x,y,z,sz,ry)=>P(g,new THREE.PlaneGeometry(sz,sz),emblemMat(st,s),x,y,z,0,ry||0,0);
      const ocyl=(r,hh,n)=>gk('oc'+r+','+hh+','+n,()=>new THREE.CylinderGeometry(r,r,hh,n,1,true));
      /* Vanguard: Blender research tower (see /blender/tech_vanguard.py) once loaded; radar and dish turn in-game */
      if(st===0&&GLB.scene.tech_v){drop=0;const gt=glbInto(g,'tech_v',f,0,['dish','spin']);
        if(gt.emblem1)emblem(g,f,gt.emblem1[0],gt.emblem1[1]+.1,gt.emblem1[2],5);if(gt.emblem2)emblem(g,f,gt.emblem2[0],gt.emblem2[1]+.1,gt.emblem2[2],3.6);
        break}
      if(st===0){
        /* Vanguard: a three-lobed lab under faceted glass domes, joined by service pipes */
        const LB=[[-9,-5,14],[12.5,3,11],[-3,15,8.5]],WH=9;
        P(g,G.cyl(10,10,WH,32),W,0,top+WH/2,4);P(g,G.cyl(9.6,9.6,.6,32),MT.dark,0,top+WH-.2,4);
        for(const [x,z,r] of LB){
          P(g,G.cyl(r,r+.7,WH,44),W,x,top+WH/2,z);P(g,G.cyl(r+.25,r+.6,1.8,44),TB,x,top+2.4,z);
          P(g,G.cyl(r-.3,r-.3,.6,44),MT.dark,x,top+WH-.1,z);P(g,G.ring(r+.1,.75),MT.ceram,x,top+WH+.1,z);
          P(g,G.cyl(r*.72,r*.78,2.2,36),MT.gold,x,top+WH+1,z);P(g,G.ring(r*.75,.45),MT.brass,x,top+WH+2.1,z);
          const dr=r*.66;P(g,gk('gdome'+dr,()=>new THREE.SphereGeometry(dr,14,6,0,Math.PI*2,0,Math.PI/2)),MT.gdome,x,top+WH+2,z);
          P(g,gk('gwire'+dr,()=>new THREE.SphereGeometry(dr+.08,14,6,0,Math.PI*2,0,Math.PI/2)),MT.gwire,x,top+WH+2,z);
          for(let a=0;a<6;a++){const an=a*1.047+.3;bar(x+Math.cos(an)*(r+.55),top+5,z+Math.sin(an)*(r+.55),1,6,1,MT.steel,-an)}
        }
        const [a,b,c]=LB,pipe=(p,q)=>{beam([p[0],top+WH+3,p[1]],[q[0],top+WH+3,q[1]],1.1,MT.ceram);
          for(const t of [.3,.7])P(g,G.cyl(1.5,1.5,1,12),MT.gold,p[0]+(q[0]-p[0])*t,top+WH+3,p[1]+(q[1]-p[1])*t,Math.PI/2,-Math.atan2(q[1]-p[1],q[0]-p[0])+Math.PI/2,0)};
        pipe(a,b);pipe(b,c);pipe(c,a);
        /* arched entrance in the front lobe */
        bar(c[0],top+2.6,c[1]+8.9,4.4,5.2,.5,MT.door);P(g,G.rib(2.4,.45),MT.ceram,c[0],top+5.2,c[1]+9.1);
        for(const sd of [-1,1])bar(c[0]+sd*2.4,top+2.6,c[1]+9.1,.9,5.2,.9,MT.ceram);bar(c[0],top+.2,c[1]+12.5,6,.4,6,MT.concrete);
        wallEmb(a[0]-2,top+5,a[1]+14.6,5.4);emblem(g,f,20,top,20,4);deco(22,top,-19,.6);
      }else if(st===1){
        /* Syndicate: a stern multi-storey ministry block, red-pillared wings and a parade plaza with a statue */
        const TX=2,TZ=-8,TW=26,TD2=20,THh=30,zf=TZ+TD2/2;
        box(TX,top,TZ,TW,THh,TD2,W);
        for(let fl=0;fl<5;fl++){const y=top+4+fl*5.3;winZ(TX,y,zf,TW-5,3,5);winX(TX+TW/2,y,TZ,TD2-5,3,3,1);winX(TX-TW/2,y,TZ,TD2-5,3,3,-1)}
        for(const [x,z] of [[-1,1],[1,1],[-1,-1],[1,-1]])bar(TX+x*(TW/2-.6),top+THh/2,TZ+z*(TD2/2-.6),2.6,THh+.6,2.6,TB);
        bar(TX,top+THh+.6,TZ,TW+1.2,1.2,TD2+1.2,MT.steel);bar(TX,top+THh+1.4,TZ,TW-2,.5,TD2-2,MT.dark);acUnit(TX-6,top+THh+1.6,TZ-3);vent(TX+7,top+THh+1.6,TZ-4);
        P(g,G.cyl(.35,.5,14,6),MT.steel,TX+8,top+THh+8,TZ+4);
        bar(TX,top+3,zf+1.6,9,6,3.2,W);bar(TX,top+2.6,zf+3.25,5,5,.3,MT.door);bar(TX,top+6.3,zf+3.4,10,.9,3.8,TB);bar(TX,top+5.8,zf+3.4,5.4,.4,.4,gm);
        wallEmb(TX,top+THh-4,zf+.5,6);
        const wing=(cx,cz,ww,dd,hh,r)=>{box(cx,top,cz,ww,hh,dd,W);P(g,G.cyl(r,r,hh,32),W,cx,top+hh/2,cz+dd/2);
          bar(cx,top+hh*.55,cz,ww+.4,2.2,dd+.2,MT.win);P(g,ocyl(r+.1,2.2,32),MT.win,cx,top+hh*.55,cz+dd/2);
          bar(cx,top+hh*.55+1.9,cz,ww+.6,1.4,dd+.4,TB);P(g,ocyl(r+.25,1.4,32),TB,cx,top+hh*.55+1.9,cz+dd/2);
          bar(cx,top+hh+.4,cz,ww+.8,.8,dd+.6,MT.steel);P(g,G.cyl(r+.4,r+.4,.8,32),MT.steel,cx,top+hh+.4,cz+dd/2)};
        wing(-17,-6,16,18,12,8);wing(19,-4,13,22,10,6.5);
        /* plaza + statue */
        bar(-5,top+.3,17,24,.6,14,MT.concrete);for(let i=0;i<4;i++)bar(-15+i*6.6,top+.65,17,.3,.1,13,MT.dark);
        const sx=-12,sz=17;box(sx,top+.6,sz,5,4,5,MT.concrete);bar(sx,top+4.9,sz,5.6,.6,5.6,MT.steel);
        const y0=top+5.2,SM=MT.statue;
        for(const dz of [-.7,.7])bar(sx,y0+2.6,sz+dz,1,5.2,.9,SM);bar(sx,y0+7.6,sz,1.6,5,2.6,SM);P(g,G.sph(1),SM,sx,y0+11,sz);
        beam([sx,y0+9.6,sz-1.4],[sx+.6,y0+14.5,sz-2.4],.45,SM);beam([sx,y0+9.6,sz+1.4],[sx+.4,y0+6.4,sz+1.8],.45,SM);
        beam([sx+.6,y0+11,sz-2.4],[sx+.6,y0+19,sz-2.4],.18,MT.steel);bar(sx+.6,y0+17.4,sz-4.6,.15,3,4.2,TB);
        lamp(g,6,top,23);lamp(g,-24,top,24);deco(TX-8,top+THh+1.6,TZ+5,.55);
      }else{
        /* Helix: a banded research spire with a domed cap, a machine annex and two walled specimen pens */
        const CX=9,CZ=-9,CR=10.5,CH=34;
        P(g,G.cyl(CR,CR+1,CH,40),W,CX,top+CH/2,CZ);
        for(const y of [5,22])P(g,G.cyl(CR+.25,CR+.25,3.6,40),TB,CX,top+y,CZ);
        P(g,ocyl(CR+.15,5,40),MT.win,CX,top+13.5,CZ);P(g,ocyl(CR+.18,2.4,40),MT.win,CX,top+28.5,CZ);
        for(let a=0;a<10;a++){const an=a*.628;bar(CX+Math.cos(an)*(CR+.5),top+13.5,CZ+Math.sin(an)*(CR+.5),.7,5.4,.7,MT.steel,-an)}
        P(g,G.ring(CR+.4,.6),MT.steel,CX,top+CH,CZ);P(g,G.dome(CR),MT.ceram,CX,top+CH,CZ,0,0,0,1,.62,1);P(g,G.ring(CR*.55,.5),k.glow,CX,top+CH+4.8,CZ);
        for(const dx of [-3,3]){P(g,G.cyl(.35,.5,11,6),MT.steel,CX+dx,top+CH+9,CZ);P(g,G.sph(.6),TG[s],CX+dx,top+CH+14.6,CZ)}
        /* front hall */
        const top2=hall(-6,9,30,20,8);winZ(-6,top+4.6,19,20,2.6,4);bar(-6,top+2.6,19.3,5,5.2,.4,MT.door);bar(-6,top+6.2,19.5,6,.6,.5,gm);
        wallEmb(CX,top+18,CZ+CR+.4,5.6);
        /* machine annex with cooling fans */
        box(-17,top,-13,13,10,13,MT.olive);bar(-17,top+1.2,-13,13.4,2.4,13.4,TB);fanU(-20,top+10,-16,2.4);fanU(-14,top+10,-10,2.4);
        for(let i=0;i<5;i++)bar(-10.4,top+3+i*1.2,-13,.3,.5,10,MT.dark);beam([-10.5,top+7,-11],[CX-CR,top+7,CZ+2],1.1,MT.steel);
        /* specimen pens */
        for(const [x,z] of [[-20,21],[19,20]]){P(g,gk('pen',()=>new THREE.CylinderGeometry(6.6,7,3.6,8,1,true)),MT.concrete,x,top+1.8,z);P(g,G.ring(6.7,.45),MT.steel,x,top+3.6,z);
          P(g,G.cyl(6.4,6.4,.3,8),MT.plate,x,top+.2,z);P(g,G.oct(1.6),MT.crys,x,top+2,z,0,0,0,1,1.8,1)}
        deco(-2,top2,4,.5);
      }
      break}
    case 'shield':{buildShieldGen(g,s,f,k,ty+.5);drop=ty+4.5;break}
    case 'spike':case 'radar':{
      /* neutral tech structures: grey until captured, then banded in the owner's colour */
      const NEU=f<0,TC=NEU?MT.steel:TD[s],GLW=NEU?MT.lamp:TG[s],top=ty+3;
      drop=top;
      if(type==='spike'){
        P(g,G.cylS(16.5,24,9,8),MT.plate2,0,top+4.5,0,0,Math.PI/8,0);
        for(let a=0;a<8;a++){const an=a*Math.PI/4;P(g,new THREE.BoxGeometry(.4,7.4,8),a%2?MT.win:MT.dark,Math.cos(an)*20.4,top+4.5,Math.sin(an)*20.4,0,-an,.66);
          if(a%2===0)for(let i=0;i<4;i++)P(g,new THREE.BoxGeometry(.3,.4,6.4),MT.steel,Math.cos(an)*(19.2+i*1.1),top+6.6-i*1.4,Math.sin(an)*(19.2+i*1.1),0,-an,.66)}
        for(let a=0;a<4;a++){const an=a*Math.PI/2+Math.PI/4;beam([Math.cos(an)*25,top,Math.sin(an)*25],[Math.cos(an)*25,top+12,Math.sin(an)*25],.9,MT.gun);beam([Math.cos(an)*25,top+12,Math.sin(an)*25],[Math.cos(an)*12,top+16,Math.sin(an)*12],.9,MT.gun)}
        P(g,G.cylS(16.6,16.6,1,8),MT.gun,0,top+9.5,0,0,Math.PI/8,0);
        P(g,G.cyl(6.4,7.4,8,18),MT.gun,0,top+14,0);P(g,G.cyl(7.6,7.6,2.4,18),MT.yellow,0,top+16,0);
        P(g,G.cyl(4.4,5.2,44,16),MT.gun,0,top+40,0);
        for(const [y,m] of [[22,TC],[27,MT.yellow],[34,MT.dark],[46,TC],[56,MT.dark]])P(g,G.cyl(5.1,5.1,2.4,16),m,0,top+y,0);
        for(const [y,a0,h] of [[31,0,7],[41,.8,6],[51,.25,6]])for(let kk=0;kk<2;kk++){const an=a0+kk*Math.PI;
          P(g,new THREE.BoxGeometry(.5,h,5),MT.win,Math.cos(an)*7.4,top+y,Math.sin(an)*7.4,0,-an,0);P(g,new THREE.BoxGeometry(2.2,.5,.5),MT.gun,Math.cos(an)*6,top+y,Math.sin(an)*6,0,-an,0)}
        P(g,G.cyl(5.4,4.6,3,16),MT.gun,0,top+63.5,0);P(g,G.cyl(3.6,3.6,5,16),MT.crys,0,top+67.5,0);P(g,G.dome(4.2),MT.gun,0,top+70,0,0,0,0,1,.7,1);
        for(let a=0;a<4;a++){const an=a*Math.PI/2;beam([Math.cos(an)*4.2,top+65,Math.sin(an)*4.2],[Math.cos(an)*6.2,top+72,Math.sin(an)*6.2],.4,MT.steel)}
        const sp=new THREE.Group();sp.name='spin';sp.position.set(0,top+76,0);
        P(sp,G.oct(2.2),MT.crys,0,0,0,0,0,0,1,1.9,1);for(let a=0;a<3;a++)P(sp,G.oct(1),MT.crys,Math.cos(a*2.1)*2.6,-1,Math.sin(a*2.1)*2.6,0,0,0,1,1.6,1);g.add(sp);
        P(g,G.ring(5.3,.4),GLW,0,top+61.6,0);
      }else{
        P(g,G.cylS(17,23,8,8),MT.plate2,0,top+4,0,0,Math.PI/8,0);
        for(let a=0;a<8;a++){const an=a*Math.PI/4;P(g,new THREE.BoxGeometry(.4,6.6,7.6),a%2?MT.yellow:TC,Math.cos(an)*20.1,top+4,Math.sin(an)*20.1,0,-an,.56)}
        P(g,G.cylS(17.2,17.2,1,8),MT.gun,0,top+8.4,0,0,Math.PI/8,0);
        bar(0,top+3.5,22,9,7,6,MT.plate2);bar(0,top+3,25.1,5,5.6,.4,MT.door);bar(0,top+6.6,25.2,6,.6,.5,GLW);
        P(g,G.cyl(2.4,2.6,8,14),MT.gun,15,top+12,-11);P(g,G.dome(2.4),MT.steel,15,top+16,-11);P(g,G.cyl(.2,.2,6,4),MT.steel,15,top+19,-11);
        P(g,G.cyl(4.6,5.6,9,16),MT.gun,0,top+13.5,0);P(g,G.ring(5.2,.5),GLW,0,top+16,0);
        const d=new THREE.Group();d.name='dish';d.position.set(0,top+18,0);
        P(d,G.box(8,6,7),MT.gun,-1,3,0);P(d,G.box(4,4,10),MT.plate2,-4,4,0);
        const disc=(x,y,z,r)=>{P(d,G.cyl(r,r*.9,1.2,32),MT.steel,x,y,z,0,0,Math.PI/2);P(d,G.cyl(r*.75,r*.75,1.3,24),MT.dark,x+.05,y,z,0,0,Math.PI/2);P(d,G.ring(r,.45),MT.gun,x+.2,y,z,0,0,Math.PI/2);
          for(const ang of [0,Math.PI/2])P(d,new THREE.BoxGeometry(.3,r*1.7,.3),MT.steel,x+.75,y,z,ang,0,0);P(d,G.cylx(.5,r*.5),MT.steel,x+r*.25,y,z)};
        disc(4.2,10,0,9.5);disc(3.4,4,-8.4,3.4);disc(3.4,4,8.4,3.4);g.add(d);
      }
      if(!NEU)emblem(g,f,-14,top+(type==='spike'?10:8.9),13,3.6);
      break}
    case 'turret':case 'guard':case 'missile':{
      /* ---- faction foundations ---- */
      const HX=st===2,ARM=HX?MT.ceram:MT.gun,ARD=HX?MT.gun:MT.dark,SPK=HX?MT.crys:MT.spike;
      let base;
      if(st===0){ /* Vanguard: sloped concrete bunker ringed with sandbags */
        P(g,G.cyl(15,15.5,1,24),MT.sand,0,.5,0);
        P(g,G.cylS(9.4,13.4,8,8),MT.concrete,0,4.6,0,0,Math.PI/8,0);P(g,G.cylS(9.6,9.6,1,8),MT.gun,0,9,0,0,Math.PI/8,0);
        for(let a=0;a<8;a++){const an=a*.785+.39;bar(Math.cos(an)*11.4,5.6,Math.sin(an)*11.4,.6,2.2,3,MT.dark,-an)}
        for(let a=0;a<10;a++){const an=a*.628;P(g,G.box(4.6,2.2,2.8),MT.sand,Math.cos(an)*14.2,1.6,Math.sin(an)*14.2,0,-an+Math.PI/2,0)}
        P(g,G.box(4,2.6,3),MT.gun,10.5,1.3+1,9,0,.6,0);base=9.5;
      }else if(st>=1){ /* Syndicate: black hexagonal armour plinth with red running lights */
        P(g,G.cylS(13.6,15,3,6),ARD,0,1.5,0);P(g,G.cylS(10,12.6,6,6),ARM,0,6,0);P(g,G.cylS(10.2,10.2,.8,6),k.glow,0,9.2,0);
        for(let a=0;a<6;a++){const an=a*1.047;bar(Math.cos(an)*12.1,5.4,Math.sin(an)*12.1,.4,1,3.4,k.glow,-an+Math.PI/2);P(g,G.cone(.9,4,4),SPK,Math.cos(an+.52)*14,4.4,Math.sin(an+.52)*14,0,0,0)}
        base=9.6;
      }
      const t=new THREE.Group();t.name='turret';
      if(type==='turret'){
        if(st===0){ /* concrete-bunker gun turret with ammo canister and whip antennas */
          t.position.y=base;
          P(t,G.cyl(6.4,7,2,20),ARM,0,1,0);
          P(t,G.prof('vgt',[[-7,0],[6,0],[8.5,2.6],[6.5,6.4],[-6,6.4],[-7.5,3.2]],12),TD[s],0,1.6,0);
          P(t,G.box(4.6,4.6,5.4),ARM,9.2,4.6,0);P(t,G.cylx(1.55,20),MT.steel,20,4.8,0);P(t,G.cylx(2.1,4),ARM,30.6,4.8,0);
          for(const sd of [-1,1])P(t,new THREE.BoxGeometry(2.6,.5,.4),ARD,31,4.8,sd*1.9);
          P(t,G.cyl(2.5,2.5,6,16),MT.steel,-4,11,0);P(t,G.cyl(2.6,2.6,1.6,16),TB,-4,10.4,0);P(t,G.cyl(1.8,1.8,.6,16),ARD,-4,14.2,0);
          P(t,G.box(3.4,1.8,3),MT.yellow,1.5,8.8,4.2);
          for(const z of [-3,-1.4]){P(t,G.cyl(.14,.2,12,4),MT.steel,-6.8,14,z);P(t,G.cone(.35,1.6,6),MT.yellow,-6.8,20.6,z)}
          uEmblem(t,f,2.2,8.85,-2.6,1.7);
        }else if(st>=1){ /* black armoured head, twin heavy barrels, red sensor eye */
          t.position.y=base;
          P(t,G.cylS(6,7,2.4,6),ARD,0,1.2,0);
          P(t,G.chamf(16,7,14),TD[s],0,2.2,0);P(t,new THREE.BoxGeometry(16.4,.6,14.4),k.glow,0,5.4,0);
          for(const z of [-2.6,2.6]){P(t,G.box(4,3.4,2.6),ARD,9.6,5.2,z);P(t,G.cylx(1.2,22),MT.steel,20,5.3,z);P(t,G.cylx(1.6,1.4),ARD,14,5.3,z);P(t,G.cylx(1.6,1.4),ARD,22,5.3,z);P(t,G.box(3.6,2.4,2.4),ARM,31,5.3,z)}
          P(t,G.cyl(2.2,2.2,.6,18),ARM,2,4.6,7.4,Math.PI/2,0,0);P(t,G.cyl(1.4,1.4,.7,18),k.glow,2,4.6,7.7,Math.PI/2,0,0);
          P(t,G.cone(.8,4,4),SPK,-7,9.6,-4,0,0,.6);P(t,G.cone(.8,4,4),SPK,-7,9.6,4,0,0,.6);
          uEmblem(t,f,-2,9.7,0,2.2);
        }
      }else if(type==='guard'){
        const gat=(p,x,y,z,r,L,m)=>{const gg=new THREE.Group();gg.position.set(x,y,z);for(let i=0;i<6;i++){const a=i*1.047;P(gg,G.cylx(r*.22,L),MT.steel,L/2,Math.cos(a)*r*.55,Math.sin(a)*r*.55)}
          P(gg,G.cylx(r*.75,1.2),m||ARM,1,0,0);P(gg,G.cylx(r*.75,1),ARM,L-.6,0,0);p.add(gg)};
        if(st===0){ /* tripod-mounted twin gatling with ammo belt */
          for(let a=0;a<3;a++){const an=a*2.094+.5;P(g,G.prof('tleg',[[0,0],[9,0],[1.5,4]],2.2),MT.plate2,Math.cos(an)*1,base,Math.sin(an)*1,0,-an,0)}
          P(g,G.cyl(2.6,3.6,8,16),MT.plate2,0,base+4,0);P(g,G.cyl(3.8,3.8,1.2,16),TB,0,base+8,0);
          t.position.y=base+8.8;
          P(t,G.box(6,4,9),MT.ceram,0,2.6,0);P(t,new THREE.BoxGeometry(6.2,1.4,9.2),TD[s],0,4.2,0);
          for(const z of [-5.6,5.6]){P(t,G.box(8,3.6,3.2),MT.ceram,2.4,2.6,z);P(t,new THREE.BoxGeometry(3,3.8,3.4),TD[s],1,2.6,z);gat(t,6.4,2.6,z,2.6,10,TD[s])}
          P(t,G.cyl(2.4,2.4,4.6,16),ARM,-5.4,2.6,0,Math.PI/2,0,0);
          for(let i=0;i<7;i++){const a=i/6*Math.PI;P(t,new THREE.BoxGeometry(1.4,.8,2.2),i%2?MT.yellow:ARD,-5.4-Math.sin(a)*4,2.6+Math.cos(a)*1.2,-3.6-i*.3)}
          uEmblem(t,f,0,5.05,0,1.8);
        }else if(st>=1){ /* black mech core with two rotary-cannon arms and red lights */
          P(g,G.cylS(3.4,4.6,10,6),ARM,0,base+5,0);for(const sd of [-1,1])bar(sd*3.3,base+5,0,.4,8,1.2,k.glow,0);
          t.position.y=base+10;
          P(t,G.chamf(8,6,8),TD[s],0,0,0);P(t,G.cyl(2.2,2.2,.6,16),k.glow,4.2,3,0,0,0,Math.PI/2);
          for(const z of [-6.4,6.4]){P(t,G.box(4,3,3),ARD,0,3,z*.7);P(t,G.chamf(8,5,4.4),TD[s],2,.6,z);
            P(t,G.cyl(2.6,2.6,1,6),ARD,1,3.1,z+Math.sign(z)*2.4,Math.PI/2,0,0);P(t,G.cyl(1.6,1.6,1.1,16),k.glow,1,3.1,z+Math.sign(z)*2.6,Math.PI/2,0,0);gat(t,5.6,3.1,z,2.8,11)}
          P(t,G.cone(.7,3.4,4),SPK,-3,6.6,0,0,0,.5);uEmblem(t,f,-1,6.85,0,1.7);
        }
      }else{ /* missile tower */
        if(st===0){ /* boxy rocket-pod launcher with corner lights */
          P(g,G.box(18,3,18),MT.plate2,0,base+1.5,0);for(const x of [-8,8])for(const z of [-8,8])P(g,G.sph(.8),TG[s],x,base+3.2,z);
          t.position.y=base+3;
          P(t,G.cyl(4.6,5,2,18),ARM,0,1,0);P(t,G.box(5,5,5),ARM,0,4.4,0);
          const pod=new THREE.Group();pod.position.set(1,9,0);pod.rotation.z=.18;
          P(pod,G.box(12,7,11),TD[s],0,0,0);P(pod,new THREE.BoxGeometry(12.2,1,11.2),MT.yellow,0,-2.6,0);
          for(let r=0;r<2;r++)for(let c=0;c<3;c++){P(pod,G.cylx(1.15,.5),MT.door,6.15,-1.2+r*2.6,-3.4+c*3.4);P(pod,G.conex(.8,1.4,8),MT.orange,6.2,-1.2+r*2.6,-3.4+c*3.4)}
          for(const sd of [-1,1])P(pod,G.box(10,5,1.2),ARM,-.6,0,sd*6.1);t.add(pod);
        }else if(st>=1){ /* black twin launch racks with red tubes */
          t.position.y=base;
          P(t,G.cylS(5,6,2.4,6),ARD,0,1.2,0);P(t,G.chamf(8,5,6),ARM,0,2.4,0);
          const pod=new THREE.Group();pod.position.set(0,8.4,0);pod.rotation.z=.28;
          for(const z of [-5,5]){P(pod,G.chamf(13,5.6,5.4),TD[s],0,-2.8,z);P(pod,new THREE.BoxGeometry(13.2,.5,5.6),k.glow,0,2.6,z);
            for(const yy of [-1.2,1.2])for(const zz of [-1.3,1.3])P(pod,G.conex(.9,2.2,6),k.glow,7.4,yy,z+zz)}
          P(pod,G.cone(.8,4,4),SPK,-6,3,0,0,0,.9);t.add(pod);
        }
      }
      g.add(t);break}
    case 'yard':{
      /* rounded landing slab (the only building that keeps a platform), hangar, slewing crane, cooling fans */
      P(g,new THREE.ExtrudeGeometry(rrect(92,92,32),{depth:1.4,bevelEnabled:false,curveSegments:10}).rotateX(-Math.PI/2),MT.gun,0,ty,0);
      P(g,scaleUV(new THREE.ExtrudeGeometry(rrect(88,88,30),{depth:2.4,bevelEnabled:true,bevelThickness:.8,bevelSize:.8,bevelSegments:2,curveSegments:10}).rotateX(-Math.PI/2),1/30),PAD,0,ty+.8,0);
      P(g,new THREE.ExtrudeGeometry(rrect(92.4,92.4,32.2),{depth:.5,bevelEnabled:false,curveSegments:10}).rotateX(-Math.PI/2),TB,0,ty+.6,0);
      drop=ty;
      for(const [x,z,w,d] of [[-6,0,.5,84],[0,-8,86,.5],[26,22,.5,40],[-26,-26,.5,36],[14,24,24,.5]])P(g,new THREE.BoxGeometry(w,.3,d),MT.dark,x,PT+.1,z);
      for(const [x,z] of [[-6,-30],[-6,10],[-6,32],[10,-8],[-30,-8],[30,-8],[26,10],[26,34]])P(g,new THREE.BoxGeometry(2.6,1,2.6),MT.steel,x,PT+.4,z);
      /* hangar */
      const hx=14,hz=-12,HB=PT+5;
      P(g,G.box(44,5,54),TD[s],hx,PT+2.5,hz);P(g,new THREE.BoxGeometry(44.4,1.4,1.2),MT.haz,hx,PT+4.2,hz+27.1);
      P(g,G.arch(19,50),TD[s],hx,HB,hz);
      for(const z of [-24,-12,0])P(g,G.rib(19.3,.55),MT.dark,hx,HB,hz+z);P(g,G.rib(19.6,1),MT.steel,hx,HB,hz-25);
      P(g,G.rib(19.5,1.7),MT.haz,hx,HB,hz+25.2);
      P(g,new THREE.CircleGeometry(18.6,40,0,Math.PI),MT.plate2,hx,HB,hz+24.9);
      P(g,new THREE.PlaneGeometry(22,13),MT.win,hx,HB+7.2,hz+25.1);
      for(const x of [-11.6,11.6])P(g,new THREE.BoxGeometry(1.2,14,1.2),MT.steel,hx+x,HB+7,hz+25.4);P(g,new THREE.BoxGeometry(24.4,1.2,1.2),MT.steel,hx,HB+14,hz+25.4);P(g,new THREE.BoxGeometry(24.4,1.2,1.2),MT.steel,hx,HB+.6,hz+25.4);
      P(g,new THREE.BoxGeometry(2.2,1,46),k.glow,hx,HB+19.1,hz-1);
      for(const z of [-30,-18,-6,6])P(g,new THREE.BoxGeometry(1.4,3,6),MT.steel,hx+22.4,PT+3.5,z);
      /* cooling fan unit */
      const fx=-22,fz=-27;
      P(g,G.box(30,11,17),TD[s],fx,PT+5.5,fz);for(let i=0;i<5;i++)P(g,new THREE.BoxGeometry(26,.6,.5),MT.steel,fx,PT+2+i*1.6,fz+8.6);
      for(const dx of [-7.5,7.5]){P(g,G.cyl(6.4,6.4,1.4,32),MT.dark,fx+dx,PT+11.3,fz);P(g,G.ring(6.4,.6),MT.steel,fx+dx,PT+12,fz);
        const fan=new THREE.Group();fan.name='fan';fan.position.set(fx+dx,PT+12,fz);
        for(let b=0;b<5;b++)P(fan,new THREE.BoxGeometry(5.4,.25,1.8),MT.steel,Math.cos(b*1.2566)*2.8,0,-Math.sin(b*1.2566)*2.8,0,b*1.2566,.35);
        P(fan,G.cyl(1.4,1.4,1,12),MT.gun,0,.2,0);g.add(fan)}
      P(g,G.cylx(1.4,10),MT.steel,fx+20,PT+4,fz+2);P(g,G.cylx(1,10),MT.steel,fx+20,PT+7,fz-2);
      /* slewing crane */
      const cx=-22,cz=20;
      P(g,G.cyl(12,13,4.4,40),MT.crane,cx,PT+2.2,cz);P(g,G.cyl(7.5,7.5,4.8,32),MT.gun,cx,PT+2.4,cz);P(g,G.ring(12.2,1.3),MT.crane,cx,PT+4.4,cz);
      for(let a=0;a<8;a++)P(g,new THREE.BoxGeometry(1.4,1.2,1.4),MT.dark,cx+Math.cos(a*.785)*12.6,PT+2,cz+Math.sin(a*.785)*12.6);
      const cr=new THREE.Group();cr.name='crane';cr.position.set(cx,PT+4.4,cz);cr.rotation.y=-.25;
      P(cr,G.cyl(5.2,6,3.6,24),MT.crane,0,1.8,0);P(cr,G.box(9,8,9),MT.crane,0,7,0);P(cr,G.box(7,6,8),MT.gun,-7,6,0);
      P(cr,G.whl(2.6,10.4),MT.steel,1,11,0);
      P(cr,G.box(4.6,25,4.6),MT.crane,6.5,22,0,0,0,-.4636);P(cr,G.cyl(.7,.7,15,8),MT.steel,6.4,19,3,0,0,-.42);
      P(cr,G.whl(2.8,6.4),MT.gun,12,33,0);
      P(cr,G.box(21,4.2,4.2),MT.crane,22,31,0,0,0,-.197);P(cr,G.whl(1.9,5.2),MT.steel,32,29,0);
      P(cr,new THREE.BoxGeometry(2.6,13,2.6),MT.crane,32,22.5,0);P(cr,new THREE.BoxGeometry(4.2,2,3.2),MT.gun,32,15.6,0);
      for(const sx of [-1,1])P(cr,new THREE.BoxGeometry(1,5,1.2),MT.gun,32+sx*1.6,12.8,0,0,0,sx*.32);
      P(cr,G.sph(.9),TG[s],1,15.4,3);
      g.add(cr);
      emblem(g,f,20,PT,26,9.5);
      deco(hx,HB+19,hz-18,.8);break}
  }
  for(const [x,z] of LAMPS[type]||[])lamp(g,x,PT,z);
  if(drop){for(const c of g.children)c.position.y-=drop;for(const p of steam)p[1]-=drop}
  /* earth-coloured footing below ground level: only shows where the building sits on a slope */
  if(!['turret','guard','missile','spike','radar'].includes(type))P(g,new THREE.BoxGeometry(w-8,30,h-8),MT.found,0,-15.6,0);
  g.userData.steam=steam;
  return g;
}
function modelUnit(u){
  const fu=skinOf(u.side),g=fromTmpl('u:'+u.type+':'+fu,()=>buildUnit(u.type,fu));g.userData.ent=u;
  const tu=g.getObjectByName('turret')||null;
  let cm=null;if(UDEF[u.type].stealth){cm=[];g.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.transparent=true;cm.push(o.material)}})}
  return {g,e:u,cm,turret:tu,tx0:tu?tu.position.x:0,bin:g.getObjectByName('bin')||null,legL:g.getObjectByName('legL'),legR:g.getObjectByName('legR'),gun:g.getObjectByName('gun'),top:UTOP[u.type]};
}
function modelBld(b){
  const fb=skinOf(b.side),g=fromTmpl('b:'+b.type+':'+fb,()=>buildBld(b.type,fb));g.userData.ent=b;
  const glow=[];g.traverse(o=>{if(o.isMesh&&o.material.userData.glow&&!glow.includes(o.material))glow.push(o.material)});
  const fans=[],doors=[];g.traverse(o=>{if(o.name==='fan')fans.push(o);if(o.name==='door')doors.push(o)});
  const dish=g.getObjectByName('dish')||null,spin=g.getObjectByName('spin')||null,domes=[];g.traverse(o=>{if(o.name==='dome')domes.push(o)});
  return {g,e:b,glow,turret:g.getObjectByName('turret')||null,crane:g.getObjectByName('crane')||null,fans,doors,dish,spin,domes,cph:0};
}
let outPlane=null,world=null,entGroup=null,rocksM=null,crysM=null,fogTex=null,groundTex=null,groundMaskTex=null,ghost=null,detM=null,detTile=[],detBase=[];
let rockBase=[],rockTile=[],rockCol=[],crysList=[];
const ents=new Map(),projM=new Map(),sprPool=[],ringPool=[],selRings=[],selBoxes=[];
const zeroM=new THREE.Matrix4().makeScale(0,0,0),tmpC=new THREE.Color();
/* free the GPU memory of a finished world: its terrain, scenery and textures (shared model parts are kept) */
function disposeWorld(w){
  const keepG=new Set(Object.values(gcache)),keepM=new Set([...Object.values(MT),...TD,...TM,...TG]),keepT=new Set(Object.values(TEX));
  for(const k in PG)keepG.add(PG[k]);for(const k in PM)keepM.add(PM[k]);for(const k in boltMats)keepM.add(boltMats[k]);keepG.add(DG);
  for(const k in tmpl)tmpl[k].traverse(o=>{if(o.isMesh){keepG.add(o.geometry);keepM.add(o.material)}});
  const geos=new Set(),mats=new Set();
  w.traverse(o=>{if(o===entGroup)return;if(!(o.isMesh||o.isLine||o.isPoints))return;let p=o;while(p){if(p===entGroup)return;p=p.parent}
    if(!keepG.has(o.geometry))geos.add(o.geometry);for(const m of [].concat(o.material))if(m&&!keepM.has(m))mats.add(m)});
  for(const g of geos)g.dispose();
  for(const m of mats){for(const k of ['map','normalMap','emissiveMap'])if(m[k]&&!keepT.has(m[k])&&m[k]!==visTex)m[k].dispose();m.dispose()}
}
function build3D(){
  if(world){scene.remove(world);try{disposeWorld(world)}catch(e){console.warn(e)}if(groundTex)groundTex.dispose();if(groundMaskTex)groundMaskTex.dispose()}
  ents.clear();projM.clear();memG.clear();ghostCache={};
  world=new THREE.Group();scene.add(world);
  groundTex=new THREE.CanvasTexture(terrain);groundTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
  groundTex.encoding=THREE.LinearEncoding;
  groundMaskTex=new THREE.CanvasTexture(groundMask);groundMaskTex.flipY=false;groundMaskTex.generateMipmaps=false;groundMaskTex.minFilter=groundMaskTex.magFilter=THREE.LinearFilter;
  const GP=Object.assign({},GPHOTO[curMap.key]||{raw:.4},{mask:groundMaskTex});
  const ground=new THREE.Mesh(terrainGeo(0,true),groundify(new THREE.MeshStandardMaterial({map:groundTex,vertexColors:true,roughness:.95,metalness:0,envMapIntensity:.12}),GP));
  ground.receiveShadow=true;world.add(ground);
  outPlane=new THREE.Mesh(new THREE.PlaneGeometry(WW*9,WH*9),new THREE.MeshBasicMaterial({color:curMap.sky}));
  outPlane.rotation.x=-Math.PI/2;outPlane.position.set(WW/2,-60,WH/2);world.add(outPlane);buildOutland();
  buildRocks();buildCrystals();buildDetail();buildTrees();buildRuins();buildWater();buildBridges();buildWrecks();applyBiome();buildWeather();
  entGroup=new THREE.Group();world.add(entGroup);
  ghost=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0x5fd68a,transparent:true,opacity:.35,depthWrite:false}));
  ghost.visible=false;world.add(ghost);
  {const mm_=new THREE.MeshBasicMaterial({color:0x8dff9f,transparent:true,opacity:.9,depthTest:false,depthWrite:false});
   exitMk=new THREE.Group();const r1=new THREE.Mesh(G.ring(7,.7),mm_),ar=new THREE.Mesh(G.conex(4,9,3),mm_),sh=new THREE.Mesh(new THREE.BoxGeometry(8,.8,2.4),mm_);
   ar.position.x=14;sh.position.x=6;ar.scale.y=.3;for(const o of [r1,ar,sh]){o.renderOrder=11;exitMk.add(o)}exitMk.visible=false;world.add(exitMk)}
}
/* ---------- heavy tanks: slow, twin-gunned, one original design per faction ---------- */
/* Vanguard "Citadel": long slab hull on wide armoured track pods, broad turret with twin guns and a roof missile pod */
function htankVanguard(g,s,f){
  for(const z of [-14,14]){const o=Math.sign(z);
    tread(g,0,z,42,8,10);roadWheels(g,z,6,32,2.9,11);P(g,G.whl(2,11.4),MT.steel,19,4.8,z);P(g,G.whl(2,11.4),MT.steel,-19,4.8,z);
    P(g,G.box(36,5.2,12.6),TD[s],-2,8.8,z);P(g,G.box(10,4.4,12.2),TD[s],16.8,8,z,0,0,-.42);
    vents(g,-8,14.1,z,14,5.8,6);P(g,G.box(7,1.8,12.8),MT.gun,-18,13.7,z);
    P(g,new THREE.BoxGeometry(26,.6,.3),MT.yellow,-4,10.6,z+o*6.42);
    for(const x of [-15,-6,3])P(g,new THREE.BoxGeometry(3.6,2.8,.3),MT.dark,x,11.4,z+o*6.38);
    P(g,G.sph(1),MT.lamp,20.6,9.2,z-o*3.2)}
  P(g,G.box(36,8,16),MT.gun,-1,6,0);P(g,G.box(12,2.8,15.6),TD[s],14,11.6,0,0,0,-.33);
  for(const z of [-4.5,4.5])P(g,G.cylx(1.1,3.6),MT.dark,-20,12.4,z);
  const t=new THREE.Group();t.name='turret';t.position.set(-3,14.2,0);
  P(t,G.prof('vhtur',[[-12.5,0],[8,0],[12.5,2.8],[10.5,7.4],[-8.5,8.2],[-13,4.2]],20),TD[s],0,0,0);
  P(t,G.box(16,1.4,14),MT.gun,-2,8.2,0);
  for(const z of [-4.2,4.2]){P(t,G.box(5,4.6,4),MT.gun,13,3.8,z);P(t,G.cylx(1.6,19),MT.steel,24,4,z);P(t,G.cylx(1.85,1.4),MT.yellow,28,4,z);P(t,G.cylx(2.3,4),MT.gun,33.8,4,z);P(t,new THREE.BoxGeometry(1.1,.9,4.6),MT.dark,34.8,4,z)}
  /* roof missile pod */
  P(t,G.box(8,4.4,7),MT.gun,-6,9.4,-3);for(let i=0;i<2;i++)for(let j=0;j<3;j++)P(t,G.cylx(.75,.6,10),MT.orange,-1.8,10.6+i*1.8,-5+j*2);
  P(t,G.cyl(2.2,2.4,1.6,18),MT.gun,0,9.6,4.4);P(t,G.ring(2.3,.3),MT.steel,0,10.4,4.4);P(t,G.sph(.85),TG[s],2.6,9.8,4.4);
  for(const z of [-1,1])P(t,new THREE.BoxGeometry(5,1.6,.4),MT.dark,-2,4.6,z*10.1);
  uEmblem(t,f,-8,8.95,4.6,2.6);P(t,G.cyl(.14,.2,13,4),MT.steel,-11,14,6.6);
  g.add(t);
}
/* Iron Syndicate "Juggernaut": four tracks a side, plated skirts, spiked dozer, huge twin-gun turret with an exhaust stack */
function htankSyndicate(g,s,f){
  for(const sd of [-1,1]){
    for(const zz of [8.4,15.2]){const z=sd*zz;tread(g,0,z,42,8,6.2);roadWheels(g,z,7,33,2.6,7.2)}
    P(g,G.prof('hskirt',[[-20,0],[18,0],[22,3.4],[18.5,7],[-19,7],[-22,3.4]],1.6),TD[s],0,4.4,sd*19);
    for(const x of [-14,-5,4,13])P(g,G.cyl(.6,.6,.7,8),MT.steel,x,8,sd*19.9,Math.PI/2,0,0);
    P(g,G.box(40,2.4,15),MT.gun,0,9.6,sd*11.8);P(g,new THREE.BoxGeometry(34,.6,2.2),TD[s],-2,11,sd*17.6)}
  P(g,G.prof('hshull',[[-19,0],[16,0],[22,3.6],[16,9.2],[-17,9.2],[-20,5]],18),MT.gun,0,6.6,0);
  P(g,G.prof('hplow',[[0,0],[3.4,0],[7,7.4],[3.4,7.4]],38),TD[s],20.5,1.6,0);
  for(let z=-16;z<=16;z+=4)P(g,G.conex(1,4.6,4),MT.spike,27.6,5,z);
  vents(g,-14,16.5,0,9,11,7);for(const z of [-6,6])P(g,G.cyl(1.3,1.5,5,10),MT.dark,-18,18,z);
  const t=new THREE.Group();t.name='turret';t.position.set(-2,16,0);
  P(t,G.prof('hstur',[[-14,0],[10,0],[14,3.4],[10.5,8.4],[-11.5,8.4],[-14.5,4.2]],21),TD[s],0,0,0);
  P(t,G.prof('hstur2',[[-9,0],[5,0],[7.5,3],[-8,3]],14),MT.gun,-1.5,9.4,0);
  for(const z of [-4,4]){P(t,G.box(7,4,3.2),MT.gun,14,4.2,z);P(t,G.cylx(1.45,30),MT.steel,30,4.3,z);P(t,G.cylx(1.9,1.4),MT.dark,22,4.3,z);
    P(t,G.box(5,3,3),MT.gun,45.4,4.3,z);P(t,new THREE.BoxGeometry(.7,2.1,2.1),MT.dark,48,4.3,z)}
  P(t,G.cyl(1.6,2,9,10),MT.dark,-11,12,-6);P(t,G.ring(1.8,.45),MT.orange,-11,16.5,-6);
  P(t,G.box(10,4.6,5),MT.gun,-3,5,-13.2);for(const y of [3.9,6.1])for(const z of [-14.4,-12])P(t,G.conex(.9,2,6),MT.orange,2.6,y,z);
  for(const z of [-7,7])P(t,G.sph(.85),TG[s],11.8,7.6,z);
  for(const [x,y,z,rx,rz] of [[-13,9,-7.5,0,.9],[-13,9,7.5,0,.9],[-8,10,-9.6,-.5,.4],[-8,10,9.6,.5,.4],[-3,10.4,-10,-.6,.2],[-3,10.4,10,.6,.2]])P(t,G.cone(1.1,6,4),MT.spike,x,y,z,rx,0,rz);
  uEmblem(t,f,-4,12.45,0,3);
  g.add(t);
}
/* Helix "Monolith": long sculpted hull on exposed wheels, twin rail cannons with charge rings, crystal reactor behind the turret */
function htankHelix(g,s,f){
  helixTracks(g,s,42,13.5);
  P(g,G.sh('hxhh',sh=>{sh.moveTo(-20,0);sh.lineTo(16,0);sh.quadraticCurveTo(24,1,23,5.4);sh.lineTo(15,9.6);sh.lineTo(-15,10);sh.quadraticCurveTo(-21,9.8,-21,5.4);sh.closePath()},19,1.8),TD[s],0,5.4,0);
  for(const z of [-5,-1.7,1.7,5])P(g,G.sph(1),MT.orange,23,8,z);P(g,new THREE.BoxGeometry(.5,1.2,13),MT.dark,23.6,10.2,0,0,0,-.6);
  vents(g,-14,17.3,0,7,11,6);
  const t=new THREE.Group();t.name='turret';t.position.set(-3,16.2,0);
  P(t,G.sh('hxhtur',sh=>{sh.moveTo(-13,0);sh.lineTo(9,0);sh.quadraticCurveTo(14,.5,13.4,3.8);sh.lineTo(8.5,8);sh.lineTo(-9,8.4);sh.quadraticCurveTo(-14,8,-14,4);sh.closePath()},17,1.8),TD[s],0,0,0);
  for(const z of [-3.6,3.6]){P(t,G.box(6,4.2,4.4),MT.gun,14,4,z);P(t,G.cylx(1.2,32),MT.steel,32,4.2,z);for(const x of [20,26,32,38])P(t,G.cylx(1.6,1),TG[s],x,4.2,z);
    P(t,G.box(5,2.8,3),MT.gun,49,4.2,z)}
  P(t,G.cyl(3,3.4,6,8),MT.gun,-10,10.6,0);P(t,G.oct(3),MT.crys,-10,15.6,0,0,0,0,1,1.8,1);for(let a=0;a<4;a++)P(t,G.cyl(.25,.25,6,4),MT.steel,-10+Math.cos(a*1.57)*2.6,15,Math.sin(a*1.57)*2.6);
  P(t,G.box(4,2,3),MT.gun,4,9,5);P(t,G.sph(.7),MT.lamp,6,9,5);
  uEmblem(t,f,-2,8.42,-3.6,2.6);g.add(t);
}
/* ---------- missile carriers: tank-hunters with a rotating launcher ---------- */
/* Vanguard "Javelin": six-wheeled armoured truck, cab up front, box launcher on a lifting mount */
function mlrsVanguard(g,s,f){
  for(const x of [-11,-1,11])for(const z of [-8.6,8.6])bigTire(g,x,z,3.6,3.8,TD[s]);
  P(g,G.box(30,3,13),MT.gun,0,5.2,0);
  P(g,G.sh('jcab2',sh=>{sh.moveTo(-3,0);sh.lineTo(5,0);sh.lineTo(7.4,2);sh.lineTo(6.6,5);sh.lineTo(2,7);sh.lineTo(-3,7.2);sh.closePath()},11,1),TD[s],11,6.6,0);
  P(g,new THREE.BoxGeometry(.3,2.4,8.4),MT.win,15.2,11.4,0,0,0,-.62);for(const sd of [-1,1])P(g,G.sph(.6),MT.lamp,17.8,8.4,sd*4);
  P(g,G.box(20,2.6,13.4),MT.plate2,-5,6.6,0);for(const sd of [-1,1]){P(g,new THREE.BoxGeometry(18,.5,.3),MT.yellow,-5,8,sd*6.8);P(g,G.box(20,1.6,1.4),TD[s],-5,9.2,sd*6.1)}
  uEmblem(g,f,12,13.85,0,1.6);
  const t=new THREE.Group();t.name='turret';t.position.set(-5,9.2,0);
  P(t,G.cyl(3.6,4,1.6,20),MT.gun,0,.8,0);for(const sd of [-1,1])P(t,G.box(2.4,4.4,1.4),MT.gun,0,3.2,sd*6.4);
  const L=new THREE.Group();L.position.set(0,5.6,0);L.rotation.z=.3;t.add(L);
  P(L,G.box(19,7.6,12.4),TD[s],-1,-3.8,0);P(L,G.box(19.4,1.2,12.8),MT.gun,-1,3.4,0);P(L,new THREE.BoxGeometry(.4,6.8,11.6),MT.dark,8.6,0,0);
  for(let i=0;i<2;i++)for(let j=0;j<4;j++){P(L,G.cylx(1.15,1,12),MT.dark,8.9,-1.8+i*3.6,-4.4+j*2.95);P(L,G.conex(.95,1.8,8),MT.orange,9.8,-1.8+i*3.6,-4.4+j*2.95)}
  for(const sd of [-1,1])P(L,new THREE.BoxGeometry(16,.5,.3),MT.yellow,-1,-2,sd*6.3);
  g.add(t);
}
/* Iron Syndicate "Hellstorm": half-track with a spiked cab and a tall eight-tube rocket rack */
function mlrsSyndicate(g,s,f){
  for(const z of [-8.6,8.6]){tread(g,-6,z,20,7,6.4);bigTire(g,12,z,3.8,4.4,MT.steel)}
  for(const z of [-8.6,8.6])for(let i=0;i<3;i++)P(g,G.whl(2.3,7),MT.gun,-13+i*7,3.4,z);
  P(g,G.prof('hsch',[[-17,0],[14,0],[17,2.6],[14,6],[-16,6],[-17.6,3]],13),MT.gun,0,4.6,0);
  P(g,G.prof('hscab',[[-4,0],[5,0],[7.6,3],[4,7.4],[-4,7.4]],12),TD[s],11,10.6,0);P(g,new THREE.BoxGeometry(.3,2.4,9),MT.win,16.2,15,0,0,0,-.75);
  for(let z=-5;z<=5;z+=2.5)P(g,G.conex(.8,3.4,4),MT.spike,19.6,7.6,z);
  for(const [x,y,z,rx,rz] of [[8,18.4,-4,-.4,.3],[8,18.4,4,.4,.3]])P(g,G.cone(.9,4.2,4),MT.spike,x,y,z,rx,0,rz);
  const t=new THREE.Group();t.name='turret';t.position.set(-7,10.6,0);
  P(t,G.cylS(4,4.4,2,8),MT.gun,0,1,0,0,Math.PI/8,0);P(t,G.box(4,5,9),TD[s],0,3.6,0);
  const L=new THREE.Group();L.position.set(0,7,0);L.rotation.z=.5;t.add(L);
  P(L,G.chamf(16,6.6,11),TD[s],0,-3.3,0);
  for(let i=0;i<2;i++)for(let j=0;j<4;j++){P(L,G.cylx(1.15,15,10),MT.dark,1,-1.6+i*3,-4.2+j*2.8);P(L,G.cylx(.8,.6,8),MT.orange,8.7,-1.6+i*3,-4.2+j*2.8)}
  P(L,new THREE.BoxGeometry(14,.6,11.4),MT.gun,0,1.7,0);P(L,G.sph(.7),TG[s],-6,2.4,4.6);
  uEmblem(g,f,-14,10.65,0,1.8);g.add(t);
}
/* Helix "Lance Battery": low sculpted hull on exposed wheels, a tilting pod of crystal-tipped lances */
function mlrsHelix(g,s,f){
  helixTracks(g,s,30,10);
  P(g,G.sh('hxml',sh=>{sh.moveTo(-15,0);sh.lineTo(12,0);sh.quadraticCurveTo(18,.6,17.2,4);sh.lineTo(11,7.4);sh.lineTo(-12,7.6);sh.quadraticCurveTo(-16,7.4,-16,4);sh.closePath()},14,1.6),TD[s],0,5,0);
  for(const z of [-3,3])P(g,G.sph(.9),MT.orange,17.4,7.2,z);
  const t=new THREE.Group();t.name='turret';t.position.set(-3,12.6,0);
  P(t,G.cyl(4.6,5,1.8,24),MT.gun,0,.9,0);P(t,G.ring(4.8,.35),TG[s],0,1.8,0);
  const L=new THREE.Group();L.position.set(0,2,0);L.rotation.z=.28;t.add(L);
  P(L,G.sh('hxpod',sh=>{sh.moveTo(-8,0);sh.lineTo(7,0);sh.quadraticCurveTo(10,.4,9.6,3);sh.lineTo(6,6);sh.lineTo(-7,6.2);sh.quadraticCurveTo(-9,6,-9,3);sh.closePath()},11,1.4),MT.gun,0,0,0);
  for(let i=0;i<3;i++)for(const z of [-2.8,2.8]){const x=-4.5+i*4.4;P(L,G.cyl(1,1.1,7,12),MT.ceram,x,9.4,z,0,0,-.2);P(L,G.cone(1,2.6,6),MT.crys,x-.8,14.2,z,0,0,-.2);P(L,G.ring(1.12,.28),TG[s],x-.2,8,z,0,0,-.2);P(L,G.ring(1.12,.28),TG[s],x-.5,11,z,0,0,-.2)}
  P(L,G.oct(1.4),MT.crys,7,5.4,0,0,0,0,1,1.6,1);
  uEmblem(g,f,-9,12.66,0,1.8);g.add(t);
}
