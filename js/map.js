'use strict';
/* ---------- map ---------- */
/* hand-designed layouts: features are drawn in the bottom-left quarter and mirrored to all four corners
   unless marked once. t: 1 rock, 2 water/ice, 3 forest */
const LAYOUTS={
  valley:{feat:[
    {k:'line',once:1,t:2,w:3.4,gaps:[[.17,.05],[.5,.06],[.83,.05]],pts:[[32,0],[30,9],[33.5,18],[30.5,26],[32,32],[33.5,38],[30.5,46],[33,55],[32,64]]},
    {k:'blob',t:3,x:18,y:41,r:3.6},{k:'blob',t:3,x:25,y:58,r:2.6},{k:'blob',t:3,x:3,y:37,r:3},{k:'blob',t:3,x:13,y:61.5,r:2},
    {k:'blob',t:1,x:23,y:47,r:1.9},{k:'blob',t:1,x:12,y:33,r:1.7},{k:'line',t:1,w:1.6,pts:[[26,36],[27.5,40]]}],
   fields:[[16,52,3.2],[8,42,2.8],[24,32,2.6]]},
  dunes:{feat:[
    {k:'blob',t:1,x:20,y:44,r:3.4},{k:'blob',t:1,x:27,y:55,r:2.1},{k:'blob',t:1,x:12,y:33,r:2.5},{k:'blob',t:1,once:1,x:31.5,y:31.5,r:3.6},
    {k:'blob',t:2,x:31.5,y:49,r:2.2},{k:'blob',t:3,x:28.3,y:46.6,r:1.1},{k:'blob',t:3,x:5,y:30,r:1.7},{k:'blob',t:3,x:21,y:61,r:1.3}],
   fields:[[16,52,3.2],[9,42,2.8],[25,38,2.6],[31.5,25,2.2]]},
  frost:{feat:[
    {k:'blob',t:2,once:1,x:31.5,y:31.5,r:7.2},{k:'blob',t:3,x:3.5,y:31.5,r:3.6},{k:'blob',t:3,x:31.5,y:60.5,r:3.3},{k:'blob',t:3,x:20,y:47,r:2.5},
    {k:'line',t:1,w:2,pts:[[13,38],[19,33.5]]},{k:'blob',t:2,x:25,y:56,r:1.5},{k:'blob',t:1,x:27,y:44,r:1.5}],
   fields:[[16,52,3.2],[9,42,2.8],[22,31.5,2.4],[31.5,22,2.4]]},
  /* walled quarters with narrow gaps, a raised overlook in each quarter, a central mesa with four ramps */
  canyon:{feat:[
    {k:'line',t:1,w:3.2,pts:[[31.5,64],[31.5,41]],gaps:[[.5,.085]]},
    {k:'line',t:1,w:3.2,pts:[[-1,31.5],[22.5,31.5]],gaps:[[.56,.085]]},
    {k:'hill',x:21,y:44,r:3.8,h:36},{k:'ring',t:6,x:21,y:44,r:3.95,w:1.5,gaps:[[.41,.06],[.86,.06]]},
    {k:'hill',once:1,x:32,y:32,r:4.8,h:40},{k:'ring',once:1,t:6,x:32,y:32,r:4.95,w:1.5,gaps:[[.125,.05],[.375,.05],[.625,.05],[.875,.05]]},
    {k:'blob',t:1,x:13,y:37,r:1.6},
    {k:'line',t:1,w:1.8,pts:[[25,49],[27.5,46]]},{k:'blob',t:3,x:4,y:60,r:1.6},{k:'blob',t:3,x:28.5,y:38,r:1}],
   fields:[[15,53,3.1],[6.5,39.5,2.5],[25.5,56,2]],spike:[20,43],radars:[[31,31]],radarOnce:1,road:[[8.5,56],[13,50],[14.5,42],[19,37.5],[24,36],[28.5,35.5],[32,32]]},
  /* two rivers split the map into four islands; eight bridges are the only crossings */
  delta:{feat:[
    {k:'line',t:2,w:4.4,pts:[[31.5,65],[31.5,30]]},{k:'line',t:2,w:4.4,pts:[[-1,31.5],[30,31.5]]},
    {k:'bridge',x:32,y:50,dir:0,len:9,w:2.3},{k:'bridge',x:32,y:38.5,dir:0,len:8.5,w:1.7},
    {k:'bridge',x:13,y:32,dir:1,len:9,w:2.3},{k:'bridge',x:25.5,y:32,dir:1,len:8.5,w:1.7},
    {k:'blob',t:2,x:18.5,y:45.5,r:1.7},{k:'blob',t:3,x:3.5,y:40,r:2.8},{k:'blob',t:3,x:23.5,y:60.5,r:2.2},{k:'blob',t:3,x:27.5,y:42.5,r:1.4},
    {k:'blob',t:1,x:12,y:36,r:1.4},{k:'blob',t:1,x:26.5,y:55,r:1.3}],
   fields:[[15,53,3.1],[7,40,2.6],[22,38,2.3],[24,46.5,2.1]],spike:[14,40],radars:[[23,23]],road:[[8.5,56],[14,48],[21,41],[25.5,36],[25.5,28.5]]},
  /* 48x48 duel: two bases on the diagonal, radar outposts in the empty corners, mesas around a central rock */
  bowl:{feat:[
    {k:'blob',t:1,once:1,x:24,y:24,r:2.6},{k:'line',t:1,w:1.8,pts:[[12,26],[15,28.5]]},
    {k:'blob',t:3,x:3,y:45,r:1.5},{k:'blob',t:3,x:22.5,y:44.5,r:1.6},{k:'blob',t:2,x:23,y:38,r:1.4}],
   fields:[[15,38,2.8],[5,27,2.2],[18.5,24.5,1.9]],spike:[18,32],radars:[[7,9]],road:[[8.5,40],[12,33],[18,28.5],[24,24]]},
  /* 48x48 for three or four players: a raised centre overlook with four ramps, forests between the bases */
  cross:{feat:[
    {k:'hill',once:1,x:24,y:24,r:3.4,h:28},{k:'ring',once:1,t:6,x:24,y:24,r:3.55,w:1.4,gaps:[[.125,.06],[.375,.06],[.625,.06],[.875,.06]]},
    {k:'blob',t:3,x:2.5,y:27,r:1.8},{k:'blob',t:3,x:20,y:45,r:1.7},{k:'line',t:1,w:1.7,pts:[[12,27],[14.5,29.5]]},{k:'blob',t:1,x:23,y:40,r:1.3}],
   fields:[[15,38,2.8],[6,27.5,2],[17,29,1.7]],spike:[18,32],radars:[[23,23]],radarOnce:1,road:[[8.5,40],[12,34],[17,30],[24,24]]}
};
/* maps were laid out on a 64-tile grid (48 for the small ones). On today's bigger maps everything within K0 tiles of an edge
   keeps its place (bases, their home crystal fields, the start yard) and the middle stretches, so the battlefield between
   the bases grows while every base keeps the spacing it was balanced for. */
let curLayout=null;
function layoutOf(M){
  const B=M.base||64,K0=B>=64?20:16,H=B/2,k=(MW/2-K0)/(H-K0);
  const c=v=>{const d=Math.min(v,B-v),dn=d<=K0?d:K0+(d-K0)*k;return v<=H?dn:MW-dn};
  const rs=(x,y)=>Math.min(x,B-x,y,B-y)>K0?1+(k-1)*.45:1,P=([x,y])=>[c(x),c(y)],box2=([x,y])=>[Math.round(c(x+1)-1),Math.round(c(y+1)-1)];
  const L=LAYOUTS[M.key],feat=L.feat.map(F=>{const G=Object.assign({},F);
    if('x' in F){G.x=c(F.x);G.y=c(F.y);if(F.r&&F.k!=='bridge')G.r=F.r*rs(F.x,F.y)}
    if(F.pts)G.pts=F.pts.map(P);return G});
  return {feat,fields:L.fields.map(([x,y,r])=>[c(x),c(y),r*rs(x,y)]),spike:L.spike&&box2(L.spike),radars:L.radars&&L.radars.map(box2),radarOnce:L.radarOnce,
    road:(L.road||[[8.5,56],[14,47],[22,40],[32,32]].map(([x,y])=>[x*B/64,y*B/64])).map(P)};
}
function genMap(noPaint){
  const M=curMap,L=curLayout=layoutOf(M),AREA=MW*MH/((M.base||64)**2);
  ter=new Uint8Array(MW*MH);cry=new Float32Array(MW*MH);occ=new Uint8Array(MW*MH);
  const nE=makeNoise(14);
  const set=(x,y,t)=>{if(x<1||y<1||x>=MW-1||y>=MH-1)return;const i=y*MW+x;ter[i]=t;occ[i]=t?1:0};
  const blob=(cx,cy,r,t)=>{for(let y=Math.floor(cy-r-2);y<=cy+r+2;y++)for(let x=Math.floor(cx-r-2);x<=cx+r+2;x++){
    if(x<0||y<0||x>=MW||y>=MH)continue;if(Math.hypot(x+.5-cx,y+.5-cy)<r*(.78+nE(x,y)*.44))set(x,y,t)}};
  const line=(pts,w,t,gaps)=>{let Ltot=0;const seg=[];for(let i=1;i<pts.length;i++){const l=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);seg.push(l);Ltot+=l}
    let acc=0;for(let i=1;i<pts.length;i++){const [ax,ay]=pts[i-1],[bx,by]=pts[i],l=seg[i-1];
      for(let d=0;d<=l;d+=.3){const fr=(acc+d)/Ltot;if(gaps&&gaps.some(([g,gw])=>Math.abs(fr-g)<gw))continue;
        const px=ax+(bx-ax)*d/l,py=ay+(by-ay)*d/l,rr=w/2*(.85+nE(Math.max(0,Math.min(MW-1,px)),Math.max(0,Math.min(MH-1,py)))*.35);
        for(let y=Math.floor(py-rr);y<=py+rr;y++)for(let x=Math.floor(px-rr);x<=px+rr;x++)if(Math.hypot(x+.5-px,y+.5-py)<=rr)set(x,y,t)}
      acc+=l}};
  HILLS=[];BRIDGES=[];const pendB=[];
  for(const F of L.feat){
    const copies=F.once?[0]:[0,1,2,3];
    for(const c of copies){
      const tr=(x,y)=>F.once?[x,y]:cornerXY(c,x,y),trc=(x,y)=>F.once?[x,y]:[CORNERS[c][0]?MW-x:x,CORNERS[c][1]?MH-y:y];
      if(F.k==='blob'){const [x,y]=tr(F.x,F.y);blob(x,y,F.r,F.t)}
      else if(F.k==='hill'){const [x,y]=trc(F.x,F.y);if(!HILLS.some(h=>Math.hypot(h[0]-x,h[1]-y)<1))HILLS.push([x,y,F.r,F.h])}
      else if(F.k==='ring'){const [hx,hy]=trc(F.x,F.y),H=HILLS.find(h=>Math.hypot(h[0]-hx,h[1]-hy)<1);if(H&&!H[4])H[4]=(F.gaps||[]).map(([g])=>{const [px,py]=trc(F.x+Math.cos(g*Math.PI*2),F.y+Math.sin(g*Math.PI*2));return [px-hx,py-hy]});const pts=[];for(let k=0;k<=48;k++){const a=k/48*Math.PI*2;pts.push(trc(F.x+Math.cos(a)*F.r,F.y+Math.sin(a)*F.r))}line(pts,F.w,F.t,F.gaps)}
      else if(F.k==='bridge'){const h=F.len/2,a=trc(F.x-(F.dir?0:h),F.y-(F.dir?h:0)),b=trc(F.x+(F.dir?0:h),F.y+(F.dir?h:0)),mx=(a[0]+b[0])/2,my=(a[1]+b[1])/2;
        if(!pendB.some(p=>Math.hypot(p.mx-mx,p.my-my)<1.5))pendB.push({a,b,mx,my,w:F.w})}
      else line(F.pts.map(p=>tr(p[0],p[1])),F.w,F.t,F.gaps);
    }
  }
  /* filler for the stretched middle: mirrored copses and rock outcrops, kept off roads, fields, bases, hills and bridges */
  {const B=M.base||64,K0=B>=64?20:16,dry=['dunes','canyon','bowl'].includes(M.key),N=Math.round((B>=64?7:3)*(MW/B-1)/.25);
   const rd=L.road,segD=(x,y)=>{let m=1e9;for(let i=1;i<rd.length;i++){const [ax,ay]=rd[i-1],[bx,by]=rd[i],dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1)));m=Math.min(m,Math.hypot(x-ax-dx*t,y-ay-dy*t))}return m};
   const busy=(x,y,r)=>BASES.some(b=>Math.hypot(x-b[0],y-b[1])<13+r)||L.fields.some(f=>Math.hypot(x-f[0],y-f[1])<f[2]+3+r)||HILLS.some(h=>Math.hypot(x-h[0],y-h[1])<h[2]+2+r)||
     pendB.some(p=>Math.hypot(x-p.mx,y-p.my)<6+r)||segD(x,y)<2.6+r||Math.hypot(x-MW/2,y-MH/2)<5+r||openNot(x,y,r+2.5);
   const openNot=(x,y,R)=>{for(let j=Math.floor(y-R);j<=y+R;j++)for(let i=Math.floor(x-R);i<=x+R;i++){if(i<0||j<0||i>=MW||j>=MH)return true;if(ter[j*MW+i]&&Math.hypot(i+.5-x,j+.5-y)<=R)return true}return false};
   for(let n=0,t=0;n<N&&t<300;t++){const x=2+rng()*(MW/2-3),y=MH/2+1+rng()*(MH/2-3),r=1+rng()*1.4;
     if(Math.min(x,MH-y)<K0-4||busy(x,y,r))continue;n++;const tp=dry?(rng()<.75?1:3):(rng()<.6?3:1);
     for(let c=0;c<4;c++){const [a,b]=cornerXY(c,x,y);blob(a,b,r,tp)}}}
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(x<1||y<1||x>=MW-1||y>=MH-1){ter[y*MW+x]=1;occ[y*MW+x]=1}
  for(let i=0;i<MW*MH;i++){const x=i%MW,y=(i/MW)|0;if(!ter[i]&&rng()<.0035){set(x,y,1)}}
  const fields=[];
  for(const [x,y,r] of L.fields)for(let c=0;c<4;c++){const [a,b]=cornerXY(c,x,y);if(!fields.some(f=>Math.hypot(f[0]-a,f[1]-b)<1))fields.push([a,b,r])}
  const clear=[...BASES.map(b=>[b[0],b[1],10]),...fields.map(f=>[f[0],f[1],f[2]+1.8]),...HILLS.map(h=>[h[0]-.5,h[1]-.5,h[2]-1.1])];
  const inZone=(x,y,pad)=>clear.some(c=>Math.hypot(x-c[0],y-c[1])<c[2]+pad);
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++)if(inZone(x,y,0))set(x,y,0);
  /* bridges: water under the deck becomes tile 5 (walkable, not buildable); anything blocking the approaches is cleared */
  for(const p of pendB){const [ax,ay]=p.a,[bx,by]=p.b,len=Math.hypot(bx-ax,by-ay),dx=(bx-ax)/len,dy=(by-ay)/len;
    for(let d=-1.6;d<=len+1.6;d+=.2)for(let o=-p.w/2;o<=p.w/2;o+=.2){const x=Math.floor(ax+dx*d-dy*o),y=Math.floor(ay+dy*d+dx*o);if(x<1||y<1||x>=MW-1||y>=MH-1)continue;
      const i=y*MW+x;if(d>=0&&d<=len&&ter[i]===2){ter[i]=5;occ[i]=0}else if(ter[i]!==2&&ter[i]!==5){ter[i]=0;occ[i]=0}}
    BRIDGES.push({ax:ax*T,az:ay*T,bx:bx*T,bz:by*T,len:len*T,dx,dz:dy,hw:p.w/2*T,w:p.w*T})}
  for(let n=0,tries=0;n<Math.round(M.ruins*AREA*1.4)&&tries<800;tries++){
    const x=2+(rng()*(MW-4)|0),y=2+(rng()*(MH-4)|0),pts=[0,1,2,3].map(c=>cornerXY(c,x,y));
    if(pts.some(([a,b])=>ter[b*MW+a]||inZone(a,b,4)))continue;
    for(const [a,b] of pts){ter[b*MW+a]=4;occ[b*MW+a]=1}n++;
  }
  for(const [fx,fy,r] of fields)for(let y=Math.floor(fy-r-1);y<=fy+r+1;y++)for(let x=Math.floor(fx-r-1);x<=fx+r+1;x++){
    if(x<1||y<1||x>=MW-1||y>=MH-1)continue;
    if(Math.hypot(x-fx,y-fy)<r*(0.75+rng()*.35)&&!occ[y*MW+x])cry[y*MW+x]=450+rng()*350;
  }
  const B0=BASES,ent=B0.map(([bx,by])=>[bx+(bx<MW/2?4:-4),by+(by<MH/2?-3:3)]),seen=new Uint8Array(MW*MH),q=[ent[0][1]*MW+ent[0][0]];seen[q[0]]=1;
  while(q.length){const c=q.pop(),cx=c%MW,cy=(c/MW)|0;for(let k=0;k<4;k++){const nx=cx+DX[k],ny=cy+DY[k];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=ny*MW+nx;if(!occ[ni]&&!seen[ni]){seen[ni]=1;q.push(ni)}}}
  if(!ent.slice(1).every(([a,b])=>seen[b*MW+a])){for(const [bx,by] of ent)for(let t=0;t<=1;t+=.005){const cx=Math.round(bx+(MW/2-bx)*t),cy=Math.round(by+(MH/2-by)*t);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const x=cx+dx,y=cy+dy;if(x<1||y<1||x>=MW-1||y>=MH-1)continue;ter[y*MW+x]=0;occ[y*MW+x]=0}}}
  genHeights([...clear,...BRIDGES.flatMap(b=>[[b.ax/T,b.az/T,1.2],[b.bx/T,b.bz/T,1.2]])]);
  for(const b of BRIDGES){b.hA=Math.max(hAt(b.ax,b.az),0);b.hB=Math.max(hAt(b.bx,b.bz),0);b.yAt=t=>b.hA+(b.hB-b.hA)*t+5*Math.min(1,Math.min(t,1-t)/.17)}
  if(!noPaint)renderTerrain();
}
function renderTerrain(){
  const AR=MW*MH/4096;
  /* ground painted at 512px from layered value noise, then upscaled with fine detail on top */
  const salt=(rng()*1e9)|0,R=512,k=WW/R;
  const hash=(x,y)=>{let h=(x*374761393+y*668265263+salt)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296};
  const vn=(x,y)=>{const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy};
  const fbm=(x,y)=>vn(x,y)*.5+vn(x*2.03,y*2.03)*.25+vn(x*4.1,y*4.1)*.125+vn(x*8.3,y*8.3)*.125;
  const tileAt=(arr,u,v)=>{const x=Math.max(0,Math.min(MW-1,u|0)),y=Math.max(0,Math.min(MH-1,v|0));return arr[y*MW+x]};
  const dens=(arr,u,v,test)=>{let n=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(test(tileAt(arr,u+dx*.8,v+dy*.8)))n++;return n/9};
  const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)};
  const small=document.createElement('canvas');small.width=small.height=R;
  const sx=small.getContext('2d'),img=sx.createImageData(R,R),D=img.data;
  /* photo-ground mask: r = how much of the scanned ground texture shows, g = cracked mud vs leafy mud */
  groundMask=document.createElement('canvas');groundMask.width=groundMask.height=R;const mg=groundMask.getContext('2d'),mimg=mg.createImageData(R,R),MD=mimg.data,DRY=['dunes','canyon','bowl'].includes(curMap.key);
  const M=curMap,GA=M.ga,GB=M.gb,DIRT=M.dirt,MOSS=M.moss,GRAV=M.grav,CRY=[84,64,86],CLF=M.cliff||GRAV.map(c=>c*.72);
  for(let py=0;py<R;py++)for(let px=0;px<R;px++){
    const u=px*k/T,v=py*k/T;
    const n1=fbm(u/6,v/6),n2=fbm(u/1.6+40,v/1.6+40),n3=vn(u*1.3+90,v*1.3+90);
    let r=GA[0]+(GB[0]-GA[0])*n1,g=GA[1]+(GB[1]-GA[1])*n1,b=GA[2]+(GB[2]-GA[2])*n1;
    const dw=sm(.44,.68,n2*.65+n1*.35),mw=sm(.42,.25,n2);
    r+=(DIRT[0]-r)*dw;g+=(DIRT[1]-g)*dw;b+=(DIRT[2]-b)*dw;
    r+=(MOSS[0]-r)*mw*.7;g+=(MOSS[1]-g)*mw*.7;b+=(MOSS[2]-b)*mw*.7;
    const rk=dens(ter,u,v,t=>t===1);if(rk>0){const w=Math.min(1,rk*1.6)*(.75+n3*.25);r+=(GRAV[0]-r)*w;g+=(GRAV[1]-g)*w;b+=(GRAV[2]-b)*w}
    const cr=dens(cry,u,v,t=>t>0);if(cr>0){const w=cr*.55;r+=(CRY[0]-r)*w;g+=(CRY[1]-g)*w;b+=(CRY[2]-b)*w}
    const wt=dens(ter,u,v,t=>t===2||t===5);if(wt>0){const w=Math.min(1,wt*1.5);r+=(M.mud[0]-r)*w;g+=(M.mud[1]-g)*w;b+=(M.mud[2]-b)*w;
      if(wt<.8){const fw=.4*(1-Math.abs(wt-.35)/.45);if(fw>0){const fc=M.ice?[235,242,248]:[196,190,168];r+=(fc[0]-r)*fw;g+=(fc[1]-g)*fw;b+=(fc[2]-b)*fw}}}
    const ft=dens(ter,u,v,t=>t===3);if(ft>0){const w=Math.min(1,ft*1.3)*.85;r+=(M.floor[0]-r)*w;g+=(M.floor[1]-g)*w;b+=(M.floor[2]-b)*w}
    let cwv=0;{const X=u*T,Z=v*T,hv=hAt(X,Z),sl=Math.hypot(hAt(X+8,Z)-hAt(X-8,Z),hAt(X,Z+8)-hAt(X,Z-8))/16,cw=wt>0||hv<-.5?0:sm(.24,.55,sl);cwv=cw;
      if(cw>0){const sb=.72+.22*Math.sin(hv*.45+n3*1.6),w=cw*.92;r+=(CLF[0]*sb-r)*w;g+=(CLF[1]*sb-g)*w;b+=(CLF[2]*sb-b)*w}
      else if(hv>22){r*=1.07;g*=1.06;b*=1.04}}
    const ru=dens(ter,u,v,t=>t===4);if(ru>0){const w=ru*.9;r+=(GRAV[0]-r)*w;g+=(GRAV[1]-g)*w;b+=(GRAV[2]-b)*w}
    const sh=.9+n3*.2,i=(py*R+px)*4;D[i]=r*sh;D[i+1]=g*sh;D[i+2]=b*sh;D[i+3]=255;
    const pw=1-Math.min(1,Math.max(Math.min(1,rk*1.8),cr*.9,Math.min(1,wt*1.6),cwv*.85,ru*.9,ft*.4));
    MD[i]=pw*255;MD[i+1]=(DRY||M.ice?1:sm(.7,.95,dw)*.85)*255;MD[i+2]=0;MD[i+3]=255;
  }
  sx.putImageData(img,0,0);mg.putImageData(mimg,0,0);mg.setTransform(R/WW,0,0,R/WH,0,0);mg.globalCompositeOperation='multiply';
  terrain=document.createElement('canvas');terrain.width=WW;terrain.height=WH;
  const g=terrain.getContext('2d');g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';g.drawImage(small,0,0,WW,WH);
  for(let i=0;i<26000*AR;i++){const x=rng()*WW,y=rng()*WH;g.fillStyle=rng()<.55?'rgba(0,0,0,.10)':'rgba(255,250,220,.06)';g.fillRect(x,y,1+rng()*2.5,1+rng()*2)}
  g.lineCap='round';
  for(let i=0;i<M.blades*AR;i++){
    const x=rng()*WW,y=rng()*WH,t=tileAt(ter,x/T,y/T);if(t)continue;
    const l=3+rng()*5,a=-Math.PI/2+(rng()-.5)*1.2;g.strokeStyle=`rgba(${M.blade[0]+rng()*40|0},${M.blade[1]+rng()*40|0},${M.blade[2]+rng()*20|0},${.25+rng()*.25})`;g.lineWidth=1;
    g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();
  }
  for(let i=0;i<1400*AR;i++){
    const x=rng()*WW,y=rng()*WH;if(dens(ter,x/T,y/T,t=>t===1)<.1)continue;
    g.fillStyle=`rgba(${120+rng()*40|0},${118+rng()*35|0},${108+rng()*30|0},.55)`;g.beginPath();g.ellipse(x,y,1.5+rng()*3,1+rng()*2,rng()*3,0,6.3);g.fill();
  }
  for(let i=0;i<70*AR;i++){
    let x=rng()*WW,y=rng()*WH,a=rng()*6.28;g.strokeStyle='rgba(30,26,18,.18)';g.lineWidth=1+rng();g.beginPath();g.moveTo(x,y);
    for(let j=0;j<6;j++){a+=(rng()-.5)*1.1;x+=Math.cos(a)*(8+rng()*14);y+=Math.sin(a)*(8+rng()*14);g.lineTo(x,y)}g.stroke();
  }
  /* ---- ground detail: cracked earth, paved base plazas, roads, tyre tracks, scorch marks ---- */
  const dry=['dunes','canyon','bowl'].includes(M.key),paved=!dry&&!M.ice,openAt=(x,y)=>!tileAt(ter,x/T,y/T)&&!(tileAt(cry,x/T,y/T)>0);
  const nearBase=(x,y,r)=>BASES.some(([bx,by])=>Math.hypot(x/T-bx,y/T-by)<r);
  /* cracked, dried earth */
  for(let n=0,tries=0;n<(dry?38:16)*AR&&tries<600;tries++){const cx=rng()*WW,cy=rng()*WH;if(!openAt(cx,cy)||nearBase(cx,cy,9))continue;n++;
    const R=40+rng()*90,pts=[];for(let k=0;k<26;k++){const a=rng()*6.283,r=Math.sqrt(rng())*R;pts.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}
    g.lineCap='round';
    for(const [px,py] of pts){const nb=pts.map(q=>[q,Math.hypot(q[0]-px,q[1]-py)]).sort((a,b)=>a[1]-b[1]).slice(1,3);
      for(const [[qx,qy],dd] of nb){if(dd>R*.6)continue;const fade=1-Math.hypot(px-cx,py-cy)/R;
        g.strokeStyle=`rgba(28,20,12,${.18+.3*fade})`;g.lineWidth=.8+fade*1.2;g.beginPath();g.moveTo(px,py);
        const mx=(px+qx)/2+(rng()-.5)*8,my=(py+qy)/2+(rng()-.5)*8;g.lineTo(mx,my);g.lineTo(qx,qy);g.stroke();
        g.strokeStyle=`rgba(255,245,225,${.06*fade})`;g.lineWidth=1;g.beginPath();g.moveTo(px+1,py+1);g.lineTo(mx+1,my+1);g.lineTo(qx+1,qy+1);g.stroke()}}}
  /* paved plazas under each base: concrete slabs with joints, stains and wear */
  PLAZAS=[];
  for(const [bx,by] of BASES){const dx=bx<MW/2?1:-1,dy=by<MH/2?1:-1,cx=(bx+.5+dx*.6)*T,cy=(by+.5+dy*-.4)*T,hw=5.6*T,hh=5*T;
    PLAZAS.push([cx/T-5.6,cy/T-5,cx/T+5.6,cy/T+5]);
    mg.fillStyle='rgb(0,255,255)';mg.beginPath();mg.roundRect?mg.roundRect(cx-hw-4,cy-hh-4,hw*2+8,hh*2+8,28):mg.rect(cx-hw-4,cy-hh-4,hw*2+8,hh*2+8);mg.fill();
    g.save();g.beginPath();g.roundRect?g.roundRect(cx-hw,cy-hh,hw*2,hh*2,26):g.rect(cx-hw,cy-hh,hw*2,hh*2);
    g.shadowColor='rgba(0,0,0,.35)';g.shadowBlur=18;const cc=M.ice?[150,156,162]:dry?[146,134,116]:[124,124,118];g.fillStyle=`rgb(${cc})`;g.fill();g.shadowBlur=0;g.clip();
    for(let k=0;k<900;k++){const v=rng()<.5?0:255;g.fillStyle=`rgba(${v},${v},${v},${rng()*.07})`;g.fillRect(cx-hw+rng()*hw*2,cy-hh+rng()*hh*2,1+rng()*3,1+rng()*3)}
    for(let k=0;k<7;k++){const x=cx-hw+rng()*hw*2,y=cy-hh+rng()*hh*2,r=10+rng()*26,gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,'rgba(25,22,18,.32)');gr.addColorStop(1,'rgba(25,22,18,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2)}
    g.strokeStyle='rgba(40,38,34,.45)';g.lineWidth=1.4;for(let x=cx-hw;x<=cx+hw;x+=T*1.5){g.beginPath();g.moveTo(x,cy-hh);g.lineTo(x,cy+hh);g.stroke()}for(let y=cy-hh;y<=cy+hh;y+=T*1.5){g.beginPath();g.moveTo(cx-hw,y);g.lineTo(cx+hw,y);g.stroke()}
    g.strokeStyle='rgba(255,255,250,.12)';g.lineWidth=1;for(let x=cx-hw+1.5;x<=cx+hw;x+=T*1.5){g.beginPath();g.moveTo(x,cy-hh);g.lineTo(x,cy+hh);g.stroke()}
    g.strokeStyle='rgba(0,0,0,.14)';g.lineWidth=5;for(let k=0;k<5;k++){let x=cx-hw+rng()*hw*2,y=cy-hh+rng()*hh*2,a=rng()*6.28;g.beginPath();g.moveTo(x,y);for(let s2=0;s2<8;s2++){a+=(rng()-.5)*.5;x+=Math.cos(a)*16;y+=Math.sin(a)*16;g.lineTo(x,y)}g.stroke()}
    g.restore();g.strokeStyle='rgba(30,28,24,.55)';g.lineWidth=3;g.beginPath();g.roundRect?g.roundRect(cx-hw,cy-hh,hw*2,hh*2,26):g.rect(cx-hw,cy-hh,hw*2,hh*2);g.stroke()}
  /* roads: paved asphalt with worn edges and a centre line, or packed dirt with ruts */
  g.lineJoin='round';g.lineCap='round';mg.lineJoin='round';mg.lineCap='round';const gc=g;
  for(let c=0;c<4;c++){
    const rp=curLayout.road.map(([x,y],i,arr)=>{const j=i&&i<arr.length-1,[a,b]=cornerXY(c,x,y);return [(a+(j?(rng()-.5)*3:0))*T,(b+(j?(rng()-.5)*3:0))*T]});
    const road=(g=gc)=>{g.beginPath();g.moveTo(rp[0][0],rp[0][1]);for(let i=1;i<rp.length-1;i++){g.quadraticCurveTo(rp[i][0],rp[i][1],(rp[i][0]+rp[i+1][0])/2,(rp[i][1]+rp[i+1][1])/2)}g.lineTo(rp[rp.length-1][0],rp[rp.length-1][1])};
    road(mg);mg.strokeStyle=paved?'rgb(0,255,255)':'rgb(110,255,255)';mg.lineWidth=T*(paved?1.8:1.5);mg.stroke();
    if(paved){road();g.strokeStyle='rgba(150,148,140,.55)';g.lineWidth=T*1.75;g.stroke();road();g.strokeStyle='rgba(58,58,56,.9)';g.lineWidth=T*1.4;g.stroke();
      road();g.strokeStyle='rgba(80,80,76,.5)';g.lineWidth=T*.9;g.stroke();
      g.setLineDash([18,16]);road();g.strokeStyle='rgba(230,200,90,.55)';g.lineWidth=1.8;g.stroke();g.setLineDash([]);
}
    else{road();g.strokeStyle=M.edge;g.lineWidth=T*1.7;g.stroke();road();g.strokeStyle=M.road;g.lineWidth=T*1.15;g.stroke()}
    for(const o of [-6,6]){g.save();g.translate(o*.7,o*.7);road();g.strokeStyle=paved?'rgba(0,0,0,.18)':'rgba(0,0,0,.24)';g.lineWidth=3;g.stroke();g.restore()}
  }
  /* tyre tracks wandering across open ground */
  for(let n=0;n<(dry?42:28)*AR;n++){let x=rng()*WW,y=rng()*WH,a=rng()*6.283;const L=8+rng()*14,al=.08+rng()*.08;
    for(const o of [-5,5]){let px=x+Math.cos(a+1.57)*o,py=y+Math.sin(a+1.57)*o,aa=a;g.beginPath();g.moveTo(px,py);const r2=rng;
      for(let s2=0;s2<L;s2++){aa+=(Math.sin(s2*.7+n)*.12);px+=Math.cos(aa)*14;py+=Math.sin(aa)*14;g.lineTo(px,py)}
      g.strokeStyle=`rgba(20,16,10,${al})`;g.lineWidth=3.2;g.stroke()}}
  /* blast craters and scorch marks with soot streaks */
  for(let i=0;i<22*AR;i++){const x=rng()*WW,y=rng()*WH,r=10+rng()*24,gr=g.createRadialGradient(x,y,0,x,y,r);
    gr.addColorStop(0,'rgba(14,11,8,.6)');gr.addColorStop(.55,'rgba(26,20,14,.28)');gr.addColorStop(.85,'rgba(255,240,220,.08)');gr.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=gr;g.beginPath();g.arc(x,y,r,0,6.3);g.fill();
    g.strokeStyle='rgba(10,8,6,.18)';g.lineWidth=2;for(let k=0;k<9;k++){const a=rng()*6.283,l=r*(1.2+rng()*1.3);g.beginPath();g.moveTo(x+Math.cos(a)*r*.4,y+Math.sin(a)*r*.4);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}}
  mmTerrain=document.createElement('canvas');mmTerrain.width=MW;mmTerrain.height=MH;
  const m=mmTerrain.getContext('2d');
  for(let i=0;i<MW*MH;i++){m.fillStyle=M.mm[ter[i]]||M.mm[0];m.fillRect(i%MW,(i/MW)|0,1,1)}
}
/* top-down preview for the setup screen: the layout regenerated with a fixed seed, hill-shaded */
function mapPreview(mi,noBases){
  const keep=curMap,ks=MW,kl=curLayout;curMap=MAPS[mi];setMapSize(mapSize(curMap));seed(0x51ed+mi*977);genMap(true);
  const M=curMap,L=curLayout,S=3,N=MW*S,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),img=x.createImageData(N,N),D=img.data;
  const hx=h=>typeof h==='string'?[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]:[(h>>16)&255,(h>>8)&255,h&255];
  const GR=M.ga.map((v,i)=>(v+M.gb[i])/2),RK=M.rock.map(v=>v*215),WA=hx(M.water),FO=hx(M.mm[3]).map(v=>v*1.25),RU=M.grav,BR=[150,132,100],CL=M.cliff||M.grav.map(v=>v*.72),CR=[214,112,244];
  for(let py=0;py<N;py++)for(let px=0;px<N;px++){
    const u=(px+.5)/S,v=(py+.5)/S,i=(v|0)*MW+(u|0),t=ter[i],X=u*T,Z=v*T,h=hAt(X,Z);
    let C=t===1?RK:t===2?WA:t===3?FO:t===4?RU:t===5?BR:t===6?CL:GR;
    if(cry[i]>0)C=C.map((q,k)=>q*.25+CR[k]*.75);
    let sh=t===2?1:1+(hAt(X-10,Z-10)-hAt(X+10,Z+10))*.022+Math.max(0,h)*.005;if(t===1)sh*=.9+((px*7+py*13)%5)*.05;
    sh=Math.max(.5,Math.min(1.5,sh));const o=(py*N+px)*4;D[o]=C[0]*sh;D[o+1]=C[1]*sh;D[o+2]=C[2]*sh;D[o+3]=255;
  }
  x.putImageData(img,0,0);
  const dot=(tx,ty,r,fill,stroke)=>{x.beginPath();x.arc(tx*S,ty*S,r,0,6.3);x.fillStyle=fill;x.fill();if(stroke){x.lineWidth=2;x.strokeStyle=stroke;x.stroke()}};
  const SP=L.spike||[19,40];for(let k=0;k<4;k++){const [a,b]=cornerBox(k,SP[0],SP[1],2,2);x.save();x.translate((a+1)*S,(b+1)*S);x.rotate(Math.PI/4);x.fillStyle='#f3c8ff';x.strokeStyle='#5a1a78';x.lineWidth=1.5;x.fillRect(-3.5,-3.5,7,7);x.strokeRect(-3.5,-3.5,7,7);x.restore()}
  for(const [a,b] of L.radars||[[MW/2-1,17]])for(const [p,q] of L.radarOnce?[[a,b]]:[[a,b],cornerBox(1,a,b,2,2)]){x.fillStyle='#e8f4ff';x.strokeStyle='#1a3550';x.lineWidth=1.5;x.fillRect((p+1)*S-3.5,(q+1)*S-3.5,7,7);x.strokeRect((p+1)*S-3.5,(q+1)*S-3.5,7,7)}
  if(!noBases)BASES.forEach(([bx,by],k)=>mapCorners(curMap).includes(k)&&dot(bx+.5,by+.5,6.5,k?'rgba(20,24,22,.75)':'#f0b44a',k?'#e8e8e0':'#2a1c05'));
  curMap=keep;setMapSize(ks);curLayout=kl;return c.toDataURL();
}
