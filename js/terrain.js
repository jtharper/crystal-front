'use strict';
/* ---------- terrain height ---------- */
let hmap=null,HILLS=[],BRIDGES=[];
/* walkable height: the ground, or a bridge deck where one spans water */
function deckAt(x,z){let best=-1e9;for(const b of BRIDGES){const px=x-b.ax,pz=z-b.az,t=(px*b.dx+pz*b.dz)/b.len;if(t<-.02||t>1.02)continue;
  if(Math.abs(px*b.dz-pz*b.dx)>b.hw+6)continue;best=Math.max(best,b.yAt(Math.max(0,Math.min(1,t))))}return best}
const gH=(x,z)=>BRIDGES.length?Math.max(hAt(x,z),deckAt(x,z)):hAt(x,z);
/* high ground: standing well above a target extends weapon range */
const HG_H=14,HG_B=1.25,hiMul=(a,t)=>hAt(a.x,a.y)-hAt(t.x,t.y)>HG_H?HG_B:1,hiScan=a=>hAt(a.x,a.y)>HG_H?HG_B:1;
function makeNoise(G){
  const gv=[];for(let i=0;i<(G+2)*(G+2);i++)gv.push(rng());
  const sm=t=>t*t*(3-2*t);
  return (x,y)=>{const fx=x/MW*G,fy=y/MH*G,ix=Math.floor(fx),iy=Math.floor(fy),tx=sm(fx-ix),ty=sm(fy-iy);
    const a=gv[iy*(G+2)+ix],b=gv[iy*(G+2)+ix+1],c=gv[(iy+1)*(G+2)+ix],d=gv[(iy+1)*(G+2)+ix+1];
    return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty};
}
function genHeights(clear){
  const n1=makeNoise(7),n2=makeNoise(16);hmap=new Float32Array((MW+1)*(MH+1));
  for(let j=0;j<=MH;j++)for(let i=0;i<=MW;i++){
    const R4=(fn,o)=>fn(i,j,o)+fn(MW-i,j,o)+fn(i,MH-j,o)+fn(MW-i,MH-j,o);
    let h=R4((a,b)=>Math.max(0,n1(a,b)-.45))*40+(R4(n2)-2)*2;
    let d=1e9;for(const c of clear)d=Math.min(d,Math.hypot(i-c[0],j-c[1])-c[2]);
    let m=Math.max(0,Math.min(1,d/7));m=m*m*(3-2*m);
    let wf=0,rf=0;for(const [a,b] of [[i-1,j-1],[i,j-1],[i-1,j],[i,j]]){const x=Math.max(1,Math.min(MW-2,a)),y=Math.max(1,Math.min(MH-2,b)),t=ter[y*MW+x];if(t===2||t===5)wf+=.25;else if(t===1)rf+=.25}
    let hh=0,ht=0;for(const [cx,cy,r,H,rp] of HILLS){const dd=Math.hypot(i-cx,j-cy);let w=0;if(rp&&dd>.01)for(const [ux,uy] of rp){const da=Math.acos(Math.max(-1,Math.min(1,((i-cx)*ux+(j-cy)*uy)/dd)));w=Math.max(w,Math.max(0,Math.min(1,(.5-da)/.28)))}
      const out=r+.8+w*2.6,inn=r-.4;let t=Math.max(0,Math.min(1,(out-dd)/(out-inn)));t=t*t*(3-2*t);if(H*t>hh){hh=H*t;ht=t}}
    hmap[j*(MW+1)+i]=(Math.max(0,h)*m*(1-wf)-9*wf)*(1-.8*ht)+hh+(curMap.ridgeH||0)*rf*rf*(1-ht);
  }
}
function hAt(x,z){
  if(!hmap)return 0;
  let fx=x/T,fy=z/T;fx=Math.max(0,Math.min(MW-.001,fx));fy=Math.max(0,Math.min(MH-.001,fy));
  const ix=fx|0,iy=fy|0,tx=fx-ix,ty=fy-iy,W1=MW+1;
  const a=hmap[iy*W1+ix],b=hmap[iy*W1+ix+1],c=hmap[(iy+1)*W1+ix],d=hmap[(iy+1)*W1+ix+1];
  return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
}
