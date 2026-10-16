// ---------------- Retakes, Horde and Aim Training
function setupRetake(){
  // bomb is already down; Ts defend the site, CTs push in from spawn
  const site=pick(['A','B']),[a,b,w,h]=SITES[site],pts=shuffle(floorTiles(a+1,b+1,w-2,h-2)),bp=pts.pop();
  G.bomb={state:'planted',carrier:null,x:tc(bp[0]),z:tc(bp[1]),timer:BOMB_TIME+FREEZE,beep:0,site};G.planted=true;
  const inner=shuffle(floorTiles(a,b,w,h));
  for(const e of G.ents){
    applyLoadout(e,pick(['rifles','rifles','smgs','snipers','rifles']));
    if(e.team==='CT'){const h=pick(HOLDS[site]);e.holdSpot={x:tc(h[0]),z:tc(h[1])};e.holdLook={x:tc(h[2]),z:tc(h[3])};e.pusher=false;e.pushSpot=null;}
    if(e.team==='T'){const t=inner.pop();e.x=tc(t[0]);e.z=tc(t[1]);e.yaw=Math.atan2(WH/2-e.z,WW/2-e.x);e.guard={x:e.x,z:e.z};}
  }
  showMsg(`Retake: bomb planted at ${site}`,2.5);
}
// horde: waves of knife-wielding infected chase the humans
function startHorde(){
  G.wave=0;G.waveState='break';G.waveT=8;G.toSpawn=0;
  for(const e of G.ents){if(e.team!=='CT')continue;resetEnt(e);applyHumanHorde(e);}
  showMsg('Horde: survive the waves. Buy between waves.',3);
}
function applyHumanHorde(e){
  if(!e.secondary)e.secondary=gun('usp');if(!e.primary&&!e.isPlayer)e.primary=gun(pick(['m4','famas','mp9','ump','xm1014']));
  e.slot=e.primary?'primary':'secondary';e.lastGun=e.slot;e.armor=Math.max(e.armor,50);
  for(const w of[e.primary,e.secondary])if(w)w.res=WPN[w.key].res;
  const s=pick(SPAWN.CT);e.x=tc(s[0])+rnd(-.5,.5);e.z=tc(s[1])+rnd(-.5,.5);e.yaw=spawnFacing(e.x,e.z);
}
function spawnZombie(){
  const humans=G.ents.filter(e=>e.alive&&e.team==='CT');let best=null,bs=-1e9;
  for(let i=0;i<20;i++){const t=pick(FLOOR),x=tc(t[0]),z=tc(t[1]);let md=1e9,seen=false;
    for(const h of humans){const d=Math.hypot(h.x-x,h.z-z);md=Math.min(md,d);if(d<40&&los(x,z,h.x,h.z))seen=true;}
    const sc=(md>18?40:md)-(seen?50:0)-Math.abs(md-35)*.3;if(sc>bs){bs=sc;best=[x,z];}}
  const z=makeEnt(pick(['Infected','Walker','Rotter','Biter','Ghoul','Crawler']),'T',false);z.zombie=true;
  z.sk=DIFF[S.diffE];z.model=makeModel('Z',z.variant);resetEnt(z);
  z.primary=null;z.secondary=null;z.slot='knife';z.hp=100+G.wave*12;z.armor=0;z.x=best[0];z.z=best[1];z.money=0;
  G.ents.push(z);G.toSpawn--;
}
function hordeUpdate(dt){
  for(let i=G.ents.length-1;i>=0;i--){const e=G.ents[i];if(e.zombie&&!e.alive&&G.clock-e.diedAt>4){if(e.model)scene.remove(e.model);G.ents.splice(i,1);}}
  const humans=G.ents.filter(e=>e.team==='CT');
  if(!humans.some(e=>e.alive)){matchOver();return;}
  if(G.waveState==='break'){G.waveT-=dt;
    if(G.waveT<=0){G.wave++;G.waveState='fight';G.toSpawn=4+G.wave*3;G.spawnT=0;notice(`Wave ${G.wave}`,'#e5534b');tone(180,.8,.3,'sawtooth');closeBuy();}}
  else{
    G.spawnT-=dt;const live=G.ents.filter(e=>e.zombie&&e.alive).length;
    if(G.toSpawn>0&&live<Math.min(12,4+G.wave)&&G.spawnT<=0){spawnZombie();G.spawnT=rnd(.4,1.4);}
    if(G.toSpawn<=0&&live===0){G.waveState='break';G.waveT=10;notice(`Wave ${G.wave} cleared`,'#6cc68a');addPts(100+G.wave*40,'wave cleared');saveInv();tone(660,.5,.2,'triangle');
      for(const h of humans){h.money=Math.min(16000,h.money+1000+G.wave*250);if(!h.alive){resetEnt(h);applyHumanHorde(h);}else h.hp=Math.min(100,h.hp+30);}}
  }
}
// aim training: pop-up targets that never shoot back
function startAim(){
  G.aimT=60;G.aimScore=0;G.shots=0;G.hits=0;G.aimKills=0;G.aimHS=0;G.reacts=[];
  const p=G.player;resetEnt(p);applyLoadout(p,S.loadout==='buy'?'rifles':S.loadout);if(S.loadout==='knives')p.secondary=gun('deagle');
  p.slot=p.primary?'primary':'secondary';const s=pick(SPAWN.CT);p.x=tc(s[0]);p.z=tc(s[1]);p.yaw=spawnFacing(p.x,p.z);
  showMsg('Aim training: 60 seconds. Headshots score double.',2.5);
}
function spawnTarget(){
  const p=G.player;let pos=null;
  for(let i=0;i<40&&!pos;i++){const t=pick(FLOOR),x=tc(t[0]),z=tc(t[1]),d=Math.hypot(x-p.x,z-p.z);if(d>8&&d<38&&los(p.x,p.z,x,z))pos=[x,z];}
  if(!pos)return;
  let e=G.ents.find(o=>o.dummy&&!o.alive&&G.clock-o.diedAt>.3);
  if(!e){e=makeEnt('Target','T',false);e.dummy=true;e.model=makeModel('T',e.variant);G.ents.push(e);}
  resetEnt(e);e.primary=gun('ak');e.slot='primary';e.armor=0;e.helmet=false;e.x=pos[0];e.z=pos[1];e.yaw=Math.atan2(p.z-e.z,p.x-e.x);
  e.bornAt=G.clock;e.life=rnd(2.2,3.4);e.strafe=Math.random()<.5?0:Math.random()<.5?-1:1;e.crouch=Math.random()<.2;
}
function aimUpdate(dt){
  G.aimT-=dt;if(G.aimT<=0){matchOver();return;}
  const p=G.player;for(const w of[p.primary,p.secondary])if(w&&w.res<30)w.res=WPN[w.key].res;
  for(const e of G.ents)if(e.dummy&&e.alive&&G.clock-e.bornAt>e.life){e.alive=false;e.diedAt=G.clock;if(e.model)e.model.visible=false;}
  const live=G.ents.filter(e=>e.dummy&&e.alive).length;if(live<2&&Math.random()<dt*4)spawnTarget();
}
function dummyMove(b){
  b.yaw=Math.atan2(G.player.z-b.z,G.player.x-b.x);
  if(!b.strafe)return[0,0,0];if(Math.random()<.02)b.strafe*=-1;
  return[-Math.sin(b.yaw)*b.strafe,Math.cos(b.yaw)*b.strafe,.7];
}
