// ---------------- audio (all synthesized, no files)
let AC=null,master=null,noiseBuf=null;
function audioInit(){
  if(AC){if(AC.resume)AC.resume();return;}
  try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.connect(AC.destination);setVolume();
    noiseBuf=AC.createBuffer(1,AC.sampleRate|0,AC.sampleRate);const d=noiseBuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}catch(e){AC=null;}
}
function setVolume(){if(master)master.gain.value=S.vol/10*.75;}
function listener(){return viewer()||G.player;}
function spatial(x,z,range=90){
  const v=G.state==='menu'?null:listener();if(!v||x===undefined)return{vol:1,pan:0};
  const dx=x-v.x,dz=z-v.z,d=Math.hypot(dx,dz);
  const vol=clamp(1-d/range,0,1)**1.6;
  return{vol,pan:d<1?0:clamp(Math.sin(angDiff(v.yaw,Math.atan2(dz,dx))),-1,1)*.8};
}
function outNode(pan){if(AC.createStereoPanner){const p=AC.createStereoPanner();p.pan.value=pan;p.connect(master);return p;}return master;}
function noiseBurst(o,t,freq,len,amp,type='lowpass',endF=220,off){
  const s=AC.createBufferSource();s.buffer=noiseBuf;const f=AC.createBiquadFilter();f.type=type;
  f.frequency.setValueAtTime(freq,t);f.frequency.exponentialRampToValueAtTime(endF,t+len);
  const g=AC.createGain();g.gain.setValueAtTime(amp,t);g.gain.exponentialRampToValueAtTime(.001,t+len);
  s.connect(f).connect(g).connect(o);s.start(t,off===undefined?Math.random()*.5:off);s.stop(t+len+.02);
}
function thump(o,t,f0,f1,len,amp){const os=AC.createOscillator(),g=AC.createGain();os.frequency.setValueAtTime(f0,t);os.frequency.exponentialRampToValueAtTime(f1,t+len);
  g.gain.setValueAtTime(amp,t);g.gain.exponentialRampToValueAtTime(.001,t+len);os.connect(g).connect(o);os.start(t);os.stop(t+len+.02);}
const SHOT_CAT={pistol:[3000,.12,.5],smg:[3400,.1,.45],heavy:[1800,.32,1],rifle:[2600,.22,.8],sniper:[2000,.55,1],melee:[5000,.06,.2]};
const SHOT_KEY={usp:[1500,.1,.25],deagle:[2200,.28,.9],m4:[3000,.18,.7],negev:[2500,.16,.7],ssg08:[2300,.4,.85]};
function sfxShot(k,x,z){
  if(!AC)return;const{vol,pan}=spatial(x,z,k==='knife'?20:110);if(vol<.01)return;
  const[f,len,amp]=SHOT_KEY[k]||SHOT_CAT[WPN[k].cat]||SHOT_CAT.pistol,t=AC.currentTime,o=outNode(pan);
  const far=1-Math.sqrt(vol);noiseBurst(o,t,f*lerp(1,.28,far),len*(1+far*.8),amp*vol);
  if(far>.3)noiseBurst(o,t+.06+far*.12,f*.25,len*1.6,amp*vol*.35);
  if(k!=='knife')thump(o,t,150,40,.13,amp*vol*.7);
}
function tone(freq,len,amp,type='sine',x,z){
  if(!AC)return;const{vol,pan}=spatial(x,z);if(vol<.01)return;const t=AC.currentTime;
  const os=AC.createOscillator(),g=AC.createGain();os.type=type;os.frequency.value=freq;g.gain.setValueAtTime(amp*vol,t);g.gain.exponentialRampToValueAtTime(.001,t+len);
  os.connect(g).connect(outNode(pan));os.start(t);os.stop(t+len+.02);
}
function sfxBoom(x,z,big){
  if(!AC)return;const{vol,pan}=spatial(x,z,big?400:140);if(vol<.01)return;const t=AC.currentTime,o=outNode(pan);
  const len=big?2.4:1.3;
  const s=AC.createBufferSource();s.buffer=noiseBuf;s.loop=true;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(big?900:1400,t);f.frequency.exponentialRampToValueAtTime(60,t+len);
  const g=AC.createGain();g.gain.setValueAtTime((big?1.3:1)*vol,t);g.gain.exponentialRampToValueAtTime(.001,t+len);s.connect(f).connect(g).connect(o);s.start(t);s.stop(t+len+.05);
  thump(o,t,90,30,.5,vol);
}
function sfxStep(x,z,soft){if(!AC)return;const{vol,pan}=spatial(x,z,30);if(vol<.02)return;const t=AC.currentTime;
  noiseBurst(outNode(pan),t,soft?700:1300,.07,(soft?.12:.22)*vol,'bandpass',400);}
function sfxClink(x,z){if(!AC)return;const{vol,pan}=spatial(x,z,35);if(vol<.02)return;const t=AC.currentTime,o=outNode(pan);
  const os=AC.createOscillator(),g=AC.createGain();os.type='triangle';os.frequency.setValueAtTime(rnd(1800,2600),t);g.gain.setValueAtTime(.18*vol,t);g.gain.exponentialRampToValueAtTime(.001,t+.12);os.connect(g).connect(o);os.start(t);os.stop(t+.13);}
function sfxSmoke(x,z){if(!AC)return;const{vol,pan}=spatial(x,z,60);if(vol<.02)return;const t=AC.currentTime;noiseBurst(outNode(pan),t,3000,2.5,.35*vol,'highpass',1500,0);}
function sfxRing(d){if(!AC)return;const t=AC.currentTime,os=AC.createOscillator(),g=AC.createGain();os.frequency.value=3400;
  g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);os.connect(g).connect(master);os.start(t);os.stop(t+d+.05);}
function sfxReload(){if(!AC)return;const t=AC.currentTime;[0,.45,.9].forEach((dt,i)=>noiseBurst(master,t+dt,i===2?2600:1800,.05,.18,'bandpass',900));}
function sfxDraw(){if(!AC)return;noiseBurst(master,AC.currentTime,2400,.08,.12,'bandpass',1200);}
function sfxHit(hs){tone(hs?1700:1100,.05,.12,'triangle');}
