'use strict';
/* ---------- post-processing: ambient occlusion, bloom, colour grading, anti-aliasing ----------
   Quality levels: high = all effects, medium = bloom + grading + FXAA, low = plain render. */
const GFX_LEVELS=[['high','High'],['medium','Medium'],['low','Low']];
let GFX='high';try{GFX=localStorage.getItem('cf-gfx')||(TOUCH?'medium':'high')}catch(e){}
if(!GFX_LEVELS.some(g=>g[0]===GFX))GFX='high';
let composer=null,aoPass=null,bloomPass=null,gradePass=null,fxaaPass=null,postOK=false;

/* screen-space ambient occlusion from the depth buffer alone (no second scene render) */
const AOShader={
  uniforms:{tDiffuse:{value:null},tDepth:{value:null},uRes:{value:new THREE.Vector2(1,1)},uNear:{value:30},uFar:{value:6000},uProj:{value:1},uRadius:{value:22},uStrength:{value:.85}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`#include <packing>
    uniform sampler2D tDiffuse,tDepth;uniform vec2 uRes;uniform float uNear,uFar,uProj,uRadius,uStrength;varying vec2 vUv;
    float vz(vec2 uv){return -perspectiveDepthToViewZ(texture2D(tDepth,uv).x,uNear,uFar);}
    float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec4 col=texture2D(tDiffuse,vUv);float d=vz(vUv);
      if(d>uFar*.6){gl_FragColor=col;return;}
      /* local depth slope (per pixel) so flat or sloped ground never occludes itself */
      vec2 px=1./uRes;float dxa=vz(vUv+vec2(px.x,0.))-d,dxb=d-vz(vUv-vec2(px.x,0.)),dya=vz(vUv+vec2(0.,px.y))-d,dyb=d-vz(vUv-vec2(0.,px.y));
      vec2 g=vec2(abs(dxa)<abs(dxb)?dxa:dxb,abs(dya)<abs(dyb)?dya:dyb);
      float rpx=clamp(uRadius*uProj*.5*uRes.y/d,2.,48.),ang=hash(vUv*uRes)*6.2832,occ=0.;
      for(int i=0;i<8;i++){float fi=float(i),r=(fi+.5)/8.,a=ang+fi*2.39996;
        vec2 op=vec2(cos(a),sin(a))*rpx*r;float s=vz(vUv+op*px),dz=(d+dot(g,op))-s;
        occ+=smoothstep(.8,3.,dz)*(1.-smoothstep(uRadius*.6,uRadius*2.,dz));}
      float ao=1.-occ/8.*uStrength;
      gl_FragColor=vec4(col.rgb*mix(1.,ao,smoothstep(uFar*.6,uFar*.3,d)),col.a);}`
};
/* film-style grade: contrast, saturation, warm highlights / cool shadows, vignette */
const GradeShader={
  uniforms:{tDiffuse:{value:null},uContrast:{value:1.1},uSat:{value:1.06},uWarm:{value:.06},uVig:{value:.32},uLift:{value:.012}},
  vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform float uContrast,uSat,uWarm,uVig,uLift;varying vec2 vUv;
    void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
      c=(c-.5)*uContrast+.5;float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,uSat);
      c+=uWarm*vec3(.9,.45,-.25)*smoothstep(.45,1.,l);c+=uWarm*vec3(-.2,.05,.45)*(1.-smoothstep(0.,.4,l))*.6;
      vec2 q=vUv-.5;c*=1.-uVig*dot(q,q)*1.6;c+=uLift;
      gl_FragColor=vec4(clamp(c,0.,1.),1.);}`
};
class AOPass extends (THREE.ShaderPass||class{}){
  render(r,w,rb){this.uniforms.tDepth.value=rb.depthTexture;super.render(r,w,rb)}
}
function setupPost(){
  composer=null;aoPass=bloomPass=gradePass=fxaaPass=null;postOK=false;
  if(!renderer||GFX==='low'||!THREE.EffectComposer||!THREE.UnrealBloomPass||!THREE.FXAAShader)return;
  try{
    const ao=GFX==='high',mk=()=>{const t=new THREE.WebGLRenderTarget(1,1,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat});
      if(ao){t.depthTexture=new THREE.DepthTexture(1,1);t.depthTexture.type=THREE.UnsignedIntType}return t};
    composer=new THREE.EffectComposer(renderer,mk());composer.renderTarget2.dispose();composer.renderTarget2=mk();composer.readBuffer=composer.renderTarget2;
    composer.addPass(new THREE.RenderPass(scene,camera));
    if(GFX==='high'){aoPass=new AOPass(AOShader);composer.addPass(aoPass)}
    bloomPass=new THREE.UnrealBloomPass(new THREE.Vector2(256,256),.38,.5,.94);composer.addPass(bloomPass);
    gradePass=new THREE.ShaderPass(GradeShader);composer.addPass(gradePass);
    fxaaPass=new THREE.ShaderPass(THREE.FXAAShader);composer.addPass(fxaaPass);
    postOK=true;postResize();
  }catch(e){console.warn('post-processing unavailable',e);composer=null;postOK=false}
}
function postResize(){
  if(!composer)return;const pr=renderer.getPixelRatio();composer.setPixelRatio(pr);composer.setSize(W,H);
  if(fxaaPass)fxaaPass.material.uniforms.resolution.value.set(1/(W*pr),1/(H*pr));
  if(aoPass)aoPass.uniforms.uRes.value.set(W*pr,H*pr);
}
/* weather / night tweak the grade a little */
function postGrade(){
  if(!gradePass)return;const u=gradePass.uniforms;
  u.uWarm.value=pickWx==='night'?-.02:pickWx==='storm'?.02:.06;u.uSat.value=pickWx==='storm'?.96:1.06;u.uVig.value=pickWx==='night'?.45:.32;
  if(bloomPass){bloomPass.strength=pickWx==="night"?.7:.38;bloomPass.threshold=pickWx==="night"?.8:.94}
}
function renderScene(){
  if(postOK&&composer){
    if(aoPass){const u=aoPass.uniforms;u.uNear.value=camera.near;u.uFar.value=camera.far;u.uProj.value=camera.projectionMatrix.elements[5]}
    try{composer.render();return}catch(e){console.warn('post-processing failed, falling back',e);postOK=false}
  }
  renderer.render(scene,camera);
}
function setGfx(q){GFX=q;try{localStorage.setItem('cf-gfx',q)}catch(e){}setupPost();postGrade();
  const b=document.getElementById('escGfx');if(b)b.textContent='Graphics: '+GFX_LEVELS.find(g=>g[0]===GFX)[1]}
