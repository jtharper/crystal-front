'use strict';
/* ---------- audio (synthesized, no files) ---------- */
let AC=null,master=null,noiseBuf=null,rvb=null,muted=false;const lastSnd={};
function audioInit(){
  if(!AC){
    try{
      AC=new (window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=muted?0:.55;
      const comp=AC.createDynamicsCompressor();comp.threshold.value=-16;comp.knee.value=8;comp.ratio.value=5;comp.attack.value=.002;comp.release.value=.22;master.connect(comp);comp.connect(AC.destination);
      rvb=AC.createConvolver();{const L=(AC.sampleRate*1.9)|0,ib=AC.createBuffer(2,L,AC.sampleRate);for(let c=0;c<2;c++){const d=ib.getChannelData(c);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3.4)*(i<AC.sampleRate*.012?i/(AC.sampleRate*.012):1)}rvb.buffer=ib}
      const rg=AC.createGain();rg.gain.value=.32;rvb.connect(rg);rg.connect(master);
      noiseBuf=AC.createBuffer(1,AC.sampleRate*1.5,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
      startAmbient();
    }catch(err){AC=null}
  }
  if(AC&&AC.state==='suspended')AC.resume();
}
function startAmbient(){
  const g=AC.createGain();g.gain.value=.07;const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=260;
  const lfo=AC.createOscillator(),lg=AC.createGain();lfo.frequency.value=.07;lg.gain.value=120;lfo.connect(lg);lg.connect(f.frequency);lfo.start();
  for(const fr of [55,82.4,110.3]){const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=fr;o.connect(f);o.start()}
  f.connect(g);g.connect(master);
}
function toggleMute(){
  muted=!muted;if(master)master.gain.value=muted?0:.55;if(muted&&'speechSynthesis' in window)try{speechSynthesis.cancel()}catch(e){}
  $('#muteBtn').textContent='Sound: '+(muted?'Off':'On');
}
function dst(v,p,wet){
  const g=AC.createGain();g.gain.value=v;const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.value=1600+17000*v*v;g.connect(lp);let n=lp;
  if(AC.createStereoPanner){const s=AC.createStereoPanner();s.pan.value=p||0;lp.connect(s);n=s}
  n.connect(master);
  if(rvb&&wet!==0){const sg=AC.createGain();sg.gain.value=(wet==null?.2:wet)*(1.5-v*.7);lp.connect(sg);sg.connect(rvb)}
  return g;
}
function nz(t,dur,type,f0,f1,gain,q,d){
  const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type;
  f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);if(q)f.Q.value=q;
  const g=AC.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  s.connect(f);f.connect(g);g.connect(d);s.start(t,Math.random()*.4);s.stop(t+dur+.05);
}
function tn(t,dur,type,f0,f1,gain,d){
  const o=AC.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  const g=AC.createGain();g.gain.setValueAtTime(gain,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);
  o.connect(g);g.connect(d);o.start(t);o.stop(t+dur+.05);
}
const shot=(t,d,pf,crack,body,thump)=>{nz(t,.016,'highpass',3400*pf,2200,crack,0,d);nz(t,.12,'bandpass',1150*pf,420*pf,body,1.3,d);tn(t,.07,'sine',190*pf,60,thump,d);nz(t+.01,.22,'lowpass',900,150,body*.25,0,d)};
const SFX={
  rifle:(t,v,p)=>{const d=dst(v,p,.28),n=1+(Math.random()*3|0);for(let i=0;i<n;i++)shot(t+i*.09+Math.random()*.012,d,.85+Math.random()*.3,.5,.45,.32)},
  mg:(t,v,p)=>{const d=dst(v,p,.3);for(let i=0;i<4;i++)shot(t+i*.066+Math.random()*.006,d,.75+Math.random()*.15,.45,.55,.45)},
  snipe:(t,v,p)=>{const d=dst(v,p,.55);nz(t,.03,'highpass',4200,2600,.95,0,d);nz(t,.3,'bandpass',950,280,.6,1,d);tn(t,.14,'sine',150,45,.55,d);nz(t+.06,.7,'lowpass',2200,250,.16,0,d)},
  laser:(t,v,p)=>{const d=dst(v,p,.25);tn(t,.09,'sawtooth',1900,420,.16,d);tn(t,.07,'sine',2600,900,.14,d)},
  lrocket:(t,v,p)=>{const d=dst(v,p,.35);tn(t,.28,'sawtooth',900,140,.2,d);nz(t,.25,'bandpass',2600,700,.18,2,d)},
  lorb:(t,v,p)=>{const d=dst(v,p,.4);tn(t,.3,'sine',320,90,.45,d);tn(t,.18,'triangle',1200,300,.12,d)},
  lbeam:(t,v,p)=>{const d=dst(v,p,.5);tn(t,.45,'sawtooth',220,60,.4,d);tn(t,.35,'sine',1400,180,.25,d);nz(t,.4,'bandpass',3000,600,.25,1.5,d)},
  gren:(t,v,p)=>{const d=dst(v,p,.35);nz(t,.03,'highpass',2400,1200,.35,0,d);tn(t,.16,'sine',150,55,.75,d);nz(t,.22,'bandpass',600,220,.4,1,d)},
  tank:(t,v,p)=>{const d=dst(v,p,.5);
    nz(t,.035,'highpass',3600,1500,1,0,d);nz(t,.75,'lowpass',4200,150,1.1,.7,d);tn(t,.6,'sine',105,28,1.35,d);tn(t,.2,'triangle',250,85,.35,d);
    nz(t+.1,1.1,'lowpass',650,55,.38,0,d);tn(t+.34,.07,'square',2350,2300,.035,d);tn(t+.35,.14,'triangle',3300,3200,.05,d)},
  arty:(t,v,p)=>{const d=dst(v,p,.7);nz(t,.05,'highpass',2600,1200,1,0,d);nz(t,1.2,'lowpass',3000,70,1.2,.6,d);tn(t,.9,'sine',75,22,1.5,d);nz(t+.15,1.6,'lowpass',450,40,.45,0,d)},
  drop:(t,v,p)=>{const d=dst(v,p,.3);tn(t,.55,'sine',1400,520,.18,d);nz(t,.5,'bandpass',900,400,.12,.4,d)},
  rocket:(t,v,p)=>{const d=dst(v,p,.4);nz(t,.04,'highpass',3000,1500,.55,0,d);tn(t,.06,'sine',210,80,.4,d);nz(t+.02,.95,'bandpass',500,2600,.5,1.1,d);nz(t+.02,.9,'lowpass',1300,260,.32,0,d)},
  hit:(t,v,p)=>{const d=dst(v,p,.15);nz(t,.05,'bandpass',2600+Math.random()*1200,1700,.22,3,d);tn(t,.04,'triangle',1700+Math.random()*900,1100,.05,d)},
  boomSmall:(t,v,p)=>{const d=dst(v,p,.55);nz(t,.04,'highpass',2500,1200,.8,0,d);nz(t,.85,'lowpass',2600,85,1,.6,d);tn(t,.55,'sine',85,26,1.15,d);
    for(let i=0;i<5;i++)nz(t+.12+Math.random()*.5,.05,'bandpass',1700+Math.random()*2000,900,.1,2,d)},
  boomBig:(t,v,p)=>{const d=dst(v,p,.75);nz(t,.06,'highpass',2000,900,1,0,d);nz(t,1.9,'lowpass',1800,38,1.3,.6,d);tn(t,1.3,'sine',60,20,1.6,d);nz(t+.25,1.7,'lowpass',480,38,.5,0,d);
    for(let i=0;i<9;i++)nz(t+.15+Math.random()*1.1,.06,'bandpass',1400+Math.random()*2600,800,.12,2,d)},
  radio:(t)=>{const d=dst(.35,0,0);tn(t,.035,'square',1850,1850,.04,d);nz(t,.07,'bandpass',2600,2600,.07,4,d)},
  click:(t)=>{const d=dst(.5,0,0);tn(t,.05,'square',1000,700,.12,d)},
  ack:(t)=>{const d=dst(.5,0,0);tn(t,.05,'square',700,700,.1,d);tn(t+.07,.05,'square',920,920,.1,d)},
  err:(t)=>{const d=dst(.6,0,0);tn(t,.18,'sawtooth',180,120,.22,d)},
  ready:(t)=>{const d=dst(.6,0,0);tn(t,.14,'triangle',660,660,.3,d);tn(t+.13,.2,'triangle',880,880,.3,d)},
  place:(t)=>{const d=dst(.8,0,.3);nz(t,.25,'lowpass',500,70,.8,0,d);tn(t,.3,'sine',95,40,.8,d);tn(t+.08,.05,'square',1400,1300,.04,d)},
  alert:(t)=>{const d=dst(.5,0,0);tn(t,.12,'sawtooth',520,520,.18,d);tn(t+.2,.12,'sawtooth',520,520,.18,d)},
  win:(t)=>{const d=dst(.7,0,.3);[392,494,587,784].forEach((f,i)=>tn(t+i*.16,.4,'triangle',f,f,.3,d))},
  lose:(t)=>{const d=dst(.7,0,.3);tn(t,.9,'sawtooth',300,70,.3,d)}
};
const MINI={drop:.3,laser:.06,lrocket:.1,lorb:.12,lbeam:.12,gren:.1,rifle:.07,mg:.14,snipe:.1,tank:.08,arty:.15,rocket:.1,hit:.05,boomSmall:.06,boomBig:.2,click:.03,ack:.08,radio:.3};
/* announcer voice (browser speech synthesis) */
let annV=null;const annLast={};
function pickVoice(){if(!('speechSynthesis' in window))return null;const vs=speechSynthesis.getVoices();if(!vs||!vs.length)return null;
  for(const r of [/Google UK English Male/i,/Daniel/i,/Microsoft (Guy|Ryan|George|Mark|David)/i,/Alex/i,/en[-_]GB/i,/en[-_]US/i,/^en/i]){const v=vs.find(v=>r.test(v.name)||r.test(v.lang));if(v)return v}return vs[0]}
if('speechSynthesis' in window){try{speechSynthesis.onvoiceschanged=()=>{annV=pickVoice()};annV=pickVoice()}catch(e){}}
function say(text,key,cd){
  if(muted||!('speechSynthesis' in window)||state!=='play')return;
  const now=performance.now()/1000;key=key||text;if(now-(annLast[key]||-99)<(cd==null?1.2:cd))return;annLast[key]=now;
  try{if(speechSynthesis.pending||speechSynthesis.speaking)speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text);if(!annV)annV=pickVoice();if(annV)u.voice=annV;u.rate=1.04;u.pitch=.72;u.volume=.95;
    sfx('radio');setTimeout(()=>{try{speechSynthesis.speak(u)}catch(e){}},90)}catch(e){}
}
function sfx(n,x,y){
  if(!AC||muted||AC.state!=='running')return;
  const t=AC.currentTime;if(t-(lastSnd[n]===undefined?-9:lastSnd[n])<(MINI[n]||.02))return;
  let v=1,p=0;
  if(x!==undefined){
    if(vis&&vis[ti(x,y)]!==2)return;
    v=Math.max(.12,1/(1+Math.hypot(x-cam.x,y-cam.y)/420));
    const sp=toScreen(x,10,y);p=Math.max(-.9,Math.min(.9,(sp.x-W/2)/(W/2)));
  }
  lastSnd[n]=t;SFX[n](t,v,p);
}
