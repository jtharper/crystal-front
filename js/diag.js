'use strict';
/* ---------- performance diagnostics (F3 or ?perf in the address) + warnings when the browser has no GPU ---------- */
const DIAG={on:/[?&]perf\b/.test(location.search),el:null,last:performance.now(),acc:0,n:0,worst:0,hitch:0,hitchTot:0,t:0,gpu:'unknown',soft:false,fps:0};
(function(){
  try{const gl=renderer&&renderer.getContext(),ext=gl&&gl.getExtension('WEBGL_debug_renderer_info');
    DIAG.gpu=ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl?gl.getParameter(gl.RENDERER):'no WebGL';
    DIAG.soft=/swiftshader|llvmpipe|software|basic render|microsoft basic/i.test(DIAG.gpu)}catch(e){}
  if(DIAG.soft){
    /* the browser is drawing on the CPU: the game cannot run smoothly like this, so say so plainly and keep effects minimal */
    const w=document.createElement('div');w.id='gpuWarn';
    w.innerHTML='<b>Your browser is not using your graphics card</b> ('+DIAG.gpu.replace(/[<>&]/g,'')+'), so the game will be very slow.'+
      '<br>In Chrome or Edge: Settings &rsaquo; System &rsaquo; turn on <i>Use graphics acceleration when available</i>, then restart the browser. '+
      'Check <code>chrome://gpu</code> &mdash; WebGL should say &ldquo;Hardware accelerated&rdquo;. <button type="button">Dismiss</button>';
    Object.assign(w.style,{position:'fixed',left:'50%',top:'12px',transform:'translateX(-50%)',zIndex:9999,maxWidth:'640px',background:'rgba(60,10,6,.95)',color:'#ffe9e2',
      font:'13px/1.45 system-ui,sans-serif',padding:'10px 14px',borderRadius:'8px',border:'1px solid #ff6a4a',boxShadow:'0 6px 24px rgba(0,0,0,.5)'});
    w.querySelector('button').onclick=()=>w.remove();w.querySelector('button').style.cssText='margin-left:8px;padding:2px 10px;border-radius:4px;border:0;cursor:pointer';
    document.body.appendChild(w);
    if(typeof setGfx==='function'&&GFX!=='low')setGfx('low');
  }
})();
function diagToggle(on){DIAG.on=on==null?!DIAG.on:on;if(!DIAG.on&&DIAG.el){DIAG.el.remove();DIAG.el=null}}
addEventListener('keydown',e=>{if(e.key==='F3'){e.preventDefault();diagToggle()}});
/* called once per animation frame from main.js */
function diagFrame(now,jsMs){
  const dt=now-DIAG.last;DIAG.last=now;if(dt>0&&dt<5000){DIAG.acc+=dt;DIAG.n++;DIAG.worst=Math.max(DIAG.worst,dt);if(dt>100){DIAG.hitch++;DIAG.hitchTot++}}
  DIAG.js=(DIAG.js||0)*.9+jsMs*.1;
  if(now-DIAG.t<500)return;DIAG.t=now;DIAG.fps=DIAG.n?1000/(DIAG.acc/DIAG.n):0;
  if(DIAG.on){
    if(!DIAG.el){DIAG.el=document.createElement('pre');DIAG.el.id='diag';Object.assign(DIAG.el.style,{position:'fixed',left:'8px',bottom:'8px',zIndex:9998,margin:0,padding:'8px 10px',
      background:'rgba(0,0,0,.78)',color:'#cfe',font:'12px/1.35 ui-monospace,Consolas,monospace',borderRadius:'6px',pointerEvents:'none',whiteSpace:'pre'});document.body.appendChild(DIAG.el)}
    const i=renderer?renderer.info:null,pr=renderer?renderer.getPixelRatio():1;
    DIAG.el.textContent=`FPS ${DIAG.fps.toFixed(0)}   worst frame ${DIAG.worst.toFixed(0)} ms   freezes >100ms: ${DIAG.hitch} (total ${DIAG.hitchTot})
game code ${DIAG.js.toFixed(1)} ms/frame   graphics ${GFX}   pixel ratio ${pr.toFixed(2)}   ${W}x${H}
draw calls ${i?i.render.calls:'-'}   triangles ${i?(i.render.triangles/1000).toFixed(0)+'k':'-'}   shaders ${i?i.programs.length:'-'}   textures ${i?i.memory.textures:'-'}
GPU ${DIAG.gpu}${DIAG.soft?'  <-- SOFTWARE RENDERING':''}
units ${typeof units!=='undefined'&&units?units.length:0}   buildings ${typeof blds!=='undefined'&&blds?blds.length:0}   (F3 to hide)`}
  DIAG.acc=0;DIAG.n=0;DIAG.worst=0;DIAG.hitch=0;
}
/* compile every shader the match can need while it loads, instead of mid-battle (each first-time compile freezes the
   game for a moment, badly so on Windows where Chrome translates shaders for DirectX) */
function warmShaders(){
  if(!renderer||!world)return;const t0=performance.now();
  try{const g=new THREE.Group(),done=new Set();
    for(const sd of sides){const sk=skinOf(sd.id);if(done.has(sd.fac))continue;done.add(sd.fac);
      for(const t in UDEF){if(UDEF[t].fac!=null&&UDEF[t].fac!==sd.fac)continue;try{g.add(fromTmpl('u:'+t+':'+sk,()=>buildUnit(t,sk)))}catch(e){}}
      for(const t in BDEF){if(BDEF[t].fac!=null&&BDEF[t].fac!==sd.fac)continue;try{g.add(fromTmpl('b:'+t+':'+sk,()=>buildBld(t,sk)))}catch(e){}}}
    g.position.set(cam.x,hAt(cam.x,cam.y),cam.y);world.add(g);g.updateMatrixWorld(true);
    renderer.compile(scene,camera);world.remove(g);
  }catch(e){console.warn('shader warm-up skipped',e)}
  DIAG.warm=performance.now()-t0;
}
