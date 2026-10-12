// ---------------- main update
function update(dt){
  G.clock+=dt;G.rt+=dt;
  if(G.mode==='defuse'){
    if(G.phase==='freeze'&&G.rt>=FREEZE){G.phase='live';showMsg('Go go go',1.2);}
    if(G.phase==='live'&&G.bomb.state!=='planted'&&G.rt-FREEZE>=ROUND_TIME)endRound('CT','time');
    if(G.phase==='end'){G.endT-=dt;if(G.endT<=0){if(G.score.T>=G.winRounds||G.score.CT>=G.winRounds)return matchOver();newRound();}}
  }else{
    G.matchT-=dt;checkDMEnd();if(G.state!=='play')return;
    for(const e of G.ents)if(!e.alive&&G.clock>=e.respawnAt)spawnDM(e);
  }
  for(const e of G.ents){
    if(!e.alive)continue;
    commonUpdate(e,dt);
    const[mx,mz,run]=e.isPlayer?playerUpdate(e,dt):botUpdate(e,dt);
    moveEnt(e,mx,mz,run,dt);
  }
  separate();bombUpdate(dt);updateNades(dt);
  for(let i=SMOKES.length-1;i>=0;i--)if(G.clock>SMOKES[i].t1)SMOKES.splice(i,1);
  G.shake=Math.max(0,G.shake-dt*1.5);
}

// ---------------- rendering
const camLook=new THREE.Vector3();let deathCam=null;
function render(dt){
  renderer.clear();
  const aspect=innerWidth/innerHeight;
  if(G.state==='menu'){
    const t=performance.now()/1000*.05;camera.position.set(WW/2+Math.cos(t)*WW*.36,30,WH/2+Math.sin(t)*WH*.38);camera.fov=58;camera.aspect=aspect;camera.updateProjectionMatrix();
    camera.lookAt(WW/2,0,WH/2);skyFollow();updateFx(dt);renderer.render(scene,camera);return;
  }
  const p=G.player,v=viewer();
  for(const e of G.ents){const m=e.model;if(!m)continue;m.visible=e!==v&&(e.alive||!!m.userData.dead);if(m.visible)animateModel(e,dt);
    if(m.visible&&isDM()&&e.alive&&G.clock<e.protectUntil)m.visible=(G.clock*10|0)%2===0;}
  for(const d of G.drops)d.mesh.rotation.y+=dt*.6;
  const sh=G.shake*.15;
  if(v){
    deathCam=null;
    const bob=v.y<=v.ground+.01?Math.sin(VM.bobT*2)*.025*Math.min(1,v.moving/4):0;
    camera.position.set(v.x+rnd(-sh,sh),eyeH(v)+bob+rnd(-sh,sh),v.z+rnd(-sh,sh));
    camera.rotation.y=-v.yaw-PI/2;camera.rotation.x=v.pitch+v.punch*.6;camera.rotation.z=VM.swayX*.3;
    const zoom=v.scoped?WPN[curKey(v)].zoom||1:1,hf=S.fov*zoom*PI/180;
    camera.fov=clamp(2*Math.atan(Math.tan(hf/2)/aspect)*180/PI,8,95);
  }else{ // death cam: watch the killer from above the body
    if(!deathCam)deathCam={x:p.x,z:p.z,h:EYE};
    deathCam.h=Math.min(4.2,deathCam.h+dt*3);
    const k=p.killer&&p.killer.alive?p.killer:null;
    camera.position.set(deathCam.x,deathCam.h,deathCam.z);
    if(k)camLook.lerp(new THREE.Vector3(k.x,eyeH(k),k.z),Math.min(1,dt*4));else camLook.set(p.x+Math.cos(p.yaw)*5,0,p.z+Math.sin(p.yaw)*5);
    camera.lookAt(camLook);camera.fov=clamp(2*Math.atan(Math.tan(S.fov*PI/360)/aspect)*180/PI,40,95);
  }
  camera.aspect=aspect;camera.updateProjectionMatrix();
  skyFollow();updateFx(dt);
  renderer.render(scene,camera);
  if(v&&v.alive&&!(v.scoped&&WPN[curKey(v)].zoom)){
    animateVM(v,dt);renderer.clearDepth();vmCam.aspect=aspect;vmCam.updateProjectionMatrix();renderer.render(vmScene,vmCam);
  }
}
function skyFollow(){if(!skyMesh)return;skyMesh.position.copy(camera.position);const th=MAP.theme;
  sunSprite.position.set(camera.position.x+th.sunDir[0]*300,camera.position.y+330,camera.position.z+th.sunDir[1]*300);}

// ---------------- boot
function resize(){renderer.setSize(innerWidth,innerHeight,false);if(G.state==='menu')syncMenu();}
addEventListener('resize',resize);
loadMap(MAPS[S.map]?S.map:'dunes');S.map=MAPID;buildWorld();buildRadar();buildMapCards();syncMenu();resize();
let last=performance.now();
function frame(t){
  const dt=Math.min(.05,(t-last)/1000);last=t;
  if(G.state==='play')update(dt);
  render(G.state==='play'?dt:0);
  if(G.state==='play')hud(dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__cp={G,S,MAPS,loadMap,startMatch,WPN,update};
