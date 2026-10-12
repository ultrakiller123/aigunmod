// ---------------- weapons handling
function eyeH(e){return e.y+EYE-CROUCH_DROP*e.crouchV;}
function spreadOf(e){
  const def=WPN[curKey(e)];if(def.melee||def.nade)return 0;
  const spd=Math.hypot(e.vx,e.vz)/SPEED,air=e.y>.05?.15:0;
  let base=def.sniper?(e.scoped||!e.isPlayer?def.scoped:def.spread):def.spread;
  if(def.zoom&&!def.sniper&&e.scoped)base*=.6;
  let s=base+def.move*clamp((spd-.3)/.7,0,1)+e.spray+air;
  if(e.crouchV>.5&&spd<.3)s*=.7;
  if(!e.isPlayer)s*=e.sk.acc;
  return s;
}
function startReload(e){const w=curW(e),def=WPN[w.key];if(def.melee||def.nade||e.reloadT>0||w.mag>=def.mag||w.res<=0)return;
  e.reloadT=def.reload;e.scoped=false;if(e===viewer())sfxReload();}
function switchTo(e,slot){
  if(e.slot===slot)return;
  if(slot==='primary'&&!e.primary)return;if(slot==='secondary'&&!e.secondary)return;if(slot==='grenade'&&!nadeCount(e))return;
  if(slot==='grenade'&&(!e.nadeSel||!e.nades[e.nadeSel]))e.nadeSel=NADES.find(k=>e.nades[k]>0);
  if(e.slot==='primary'||e.slot==='secondary')e.lastGun=e.slot;
  e.slot=slot;e.reloadT=0;e.fireCd=Math.max(e.fireCd,.4);e.scoped=false;e.act=null;
}
function cycleWeapon(e){const order=['primary','secondary','knife','grenade'].filter(s=>(s!=='primary'||e.primary)&&(s!=='secondary'||e.secondary)&&(s!=='grenade'||nadeCount(e)));
  const i=order.indexOf(e.slot);switchTo(e,order[(i+1)%order.length]);}
function selectNade(e){
  if(!nadeCount(e))return;
  if(e.slot!=='grenade'){switchTo(e,'grenade');return;}
  const i=NADES.indexOf(e.nadeSel);for(let k=1;k<=3;k++){const n=NADES[(i+k)%3];if(e.nades[n]>0){e.nadeSel=n;e.fireCd=Math.max(e.fireCd,.3);if(e===G.player)VM.key=null;return;}}
}
function afterThrow(e){
  if(e.nades[e.nadeSel]>0)return;
  const n=NADES.find(k=>e.nades[k]>0);
  if(n){e.nadeSel=n;return;}
  const back=e.lastGun==='primary'&&e.primary?'primary':e.secondary?'secondary':'knife';e.slot=back;e.fireCd=Math.max(e.fireCd,.4);
}
function tryFire(e){
  const w=curW(e),def=WPN[w.key];
  if(e.fireCd>0||e.reloadT>0||e.act||!e.alive||G.phase==='freeze')return false;
  e.lastShot=G.clock;e.protectUntil=0;if(e===G.player&&G.mode==='aim'&&!def.melee)G.shots++;
  const isV=e===viewer();
  if(def.melee){e.fireCd=def.rof;sfxShot('knife',e.x,e.z);if(isV){VM.knifeT=.3;VM.knifeSide*=-1;}
    for(const o of G.ents){if(!o.alive||!foe(e,o))continue;const d=d2(e,o);if(d>1.7)continue;
      const rel=angDiff(e.yaw,Math.atan2(o.z-e.z,o.x-e.x));if(Math.abs(rel)<.8){const back=Math.abs(angDiff(o.yaw,Math.atan2(o.z-e.z,o.x-e.x)))<.9;damage(o,e,'knife',false,back?180:def.dmg,{x:o.x,y:1.2,z:o.z});break;}}
    return true;}
  if(def.nade){e.fireCd=def.rof;throwNade(e,w.key);e.nades[w.key]--;if(isV)VM.throwT=.5;afterThrow(e);return true;}
  if(w.mag<=0){startReload(e);if(e===G.player)tone(1200,.04,.1,'square');return false;}
  w.mag--;e.fireCd=def.rof*(def.zoom&&!def.sniper&&e.scoped?1.12:1);
  const sp=spreadOf(e);
  const n=def.pellets||1;
  const pat=sprayOffset(def,e.sprayN),comp=e.isPlayer?0:e.sk.comp;
  for(let i=0;i<n;i++){const ps=def.pellets?def.spread*(e.isPlayer?1:e.sk.acc*.8)+sp*.25:sp;shoot(e,e.yaw+pat[0]*(1-comp)+gauss()*ps,e.pitch+pat[1]*(1-comp)+gauss()*ps*.6,def,i===0);}
  e.sprayN++;e.spray=Math.min(e.spray+def.recoil*(def.auto?.3:1),.09);e.punch=Math.min(e.punch+def.kick*.5,.2);
  if(isV&&!def.pellets||isV&&Math.random()<.5)ejectShell();
  sfxShot(w.key,e.x,e.z);noise(e,def.key==='usp'?25:65);
  if(isV){VM.kick=Math.min(.12,VM.kick+def.kick*1.4+.01);}
  if(d2(e,listener())<40){muzzleLight.position.set(e.x+Math.cos(e.yaw)*.9,eyeH(e)-.15,e.z+Math.sin(e.yaw)*.9);muzzleLight.intensity=2.2;}
  if(def.sniper&&e.isPlayer)e.scoped=false;
  if(w.mag===0&&w.res>0)setTimeout(()=>{if(e.alive&&curW(e)===w)startReload(e);},280);
  return true;
}
const tmpS=new THREE.Vector3();
function shoot(e,a,p,def,first){
  const dx=Math.cos(a),dz=Math.sin(a),tp=Math.tan(clamp(p,-1.45,1.45)),eye=eyeH(e);
  const floorT=tp<-1e-4?eye/-tp:1e9,pens=[];
  let tAcc=0,power=(def.pen||.5)*(def.pellets?.4:1),endT=260,nx=0,nz=0,ny=0;
  for(let pass=0;pass<4;pass++){
    const t=tAcc+rayGrid(e.x+dx*tAcc,e.z+dz*tAcc,dx,dz,260-tAcc);nx=RNX;nz=RNZ;
    if(floorT<t){endT=floorT;nx=0;nz=0;ny=1;break;}
    if(t>=259){endT=260;break;}
    const hx=e.x+dx*(t+.02),hz=e.z+dz*(t+.02),c=cell(Math.floor(hx/TILE),Math.floor(hz/TILE)),y=eye+tp*t;
    let ex=t;while(ex-t<7&&cell(Math.floor((e.x+dx*ex)/TILE),Math.floor((e.z+dz*ex)/TILE))===c)ex+=.12;
    if((c===2&&y>CRATE_H)||(c===3&&y>BARREL_H)){tAcc=ex+.01;continue;}
    const cost=c===1?.6:.35,thin=c!==1||ex-t<TILE*1.15+.3;
    if(thin&&power>cost&&(c!==1||def.pen>=.77)){power-=cost;pens.push({t:ex,mult:c===1?.35:.6});decal(e.x+dx*t,y,e.z+dz*t,nx,0,nz);decal(e.x+dx*ex,eye+tp*ex,e.z+dz*ex,-nx,0,-nz);
      puff(e.x+dx*ex,eye+tp*ex,e.z+dz*ex,0xb8a88a,.3,.4,.3,1.5);tAcc=ex+.01;continue;}
    endT=t;break;
  }
  let hit=null,hitT=endT,hitHead=false;
  for(const o of G.ents){
    if(!o.alive||!foe(e,o))continue;
    const fx=o.x-e.x,fz=o.z-e.z,tC=fx*dx+fz*dz;if(tC<0)continue;
    const px=fx-dx*tC,pz=fz-dz*tC,perp2=px*px+pz*pz;if(perp2>RAD*RAD)continue;
    const half=Math.sqrt(RAD*RAD-perp2),t0=Math.max(0,tC-half),t1=tC+half;if(t0>=hitT)continue;
    const top=o.y+BODY_H-CROUCH_DROP*o.crouchV,bot=o.y;
    let tt=null;const y0=eye+tp*t0,y1=eye+tp*t1;
    if(y0>=bot&&y0<=top)tt=t0;else if(y0>top&&y1<=top)tt=(top-eye)/tp;else if(y0<bot&&y1>=bot)tt=(bot-eye)/tp;
    if(tt===null||tt>=hitT)continue;
    const h=eye+tp*tt-o.y;hit=o;hitT=tt;hitHead=h>HEAD_Y-CROUCH_DROP*o.crouchV&&perp2<.24*.24;
  }
  const end={x:e.x+dx*hitT,y:eye+tp*hitT,z:e.z+dz*hitT};
  if(first||Math.random()<.35){
    let st;
    if(e===viewer()){camera.updateMatrixWorld();st=tmpS.set(.16,-.15,-.7).applyMatrix4(camera.matrixWorld);}
    else st={x:e.x+dx*.7-dz*.12,y:eye-.28,z:e.z+dz*.7+dx*.12};
    if(Math.random()<(def.pellets?.5:.85))tracer(st,end);
  }
  if(hit){
    let dmg=def.dmg;if(def.pellets)dmg*=clamp(1-hitT/28,.15,1);for(const pn of pens)if(pn.t<hitT)dmg*=pn.mult;
    damage(hit,e,def.key,hitHead,dmg,end);
  }else{
    const isFloor=ny===1;
    decal(end.x,end.y,end.z,nx,ny,nz);
    if(first||Math.random()<.3){puff(end.x,end.y,end.z,isFloor?0xcab79a:0xd8c7a6,.35,.55,.4,2);chips(end.x,end.y,end.z,nx,ny,nz,isFloor?0x8a7a60:0x9a8a70,3,2.5);}
  }
}
function damage(v,src,wk,hs,base,at){
  if(!v.alive||G.clock<v.protectUntil)return;
  let d=base*(hs?4:1);const pen=WPN[wk]&&WPN[wk].pen!==undefined?WPN[wk].pen:.5;
  if(v.armor>0&&(!hs||v.helmet)){const ab=d*(1-pen);v.armor=Math.max(0,v.armor-ab*.5);d*=pen;}
  d=Math.min(d,v.hp);v.hp-=d;v.tagUntil=G.clock+.35;
  if(src&&G.dmgLog){const k=src.id+'>'+v.id,r=G.dmgLog[k]||(G.dmgLog[k]={d:0,h:0,t:0});r.d+=d;if(G.clock-r.t>.05)r.h++;r.t=G.clock;}
  if(src===G.player&&G.mode==='aim'&&wk!=='molly')G.hits++;
  if(hs&&v.helmet&&v.armor>0&&v.hp>0&&wk!=='knife'&&at){tone(2700,.07,.18,'square',v.x,v.z);chips(at.x,at.y,at.z,0,1,0,0xffd060,4,2);}
  if(src){src.dmgDealt+=d;}
  if(at){puff(at.x,at.y,at.z,0x9a1010,.3,.35,.3,1.4,2);if(Math.random()<.4)bloodSplat(v.x+rnd(-.6,.6),v.z+rnd(-.6,.6));}
  if(src===G.player&&v!==G.player){const hm=$('hitm');hm.className='hud'+(hs?' hs':'');hm.style.opacity=1;hm._t=G.clock;if(G.clock-(hm._s||0)>.04){sfxHit(hs);hm._s=G.clock;}}
  if(src&&src!==v){v.hurtFrom={x:src.x,z:src.z,t:G.clock};}
  if(v===G.player){G.shake=Math.min(.25,G.shake+.08);v.punch+=.02;}
  if(v.isPlayer===false&&src&&!v.target){v.lookAt={x:src.x,z:src.z};v.lookUntil=G.clock+3;v.hunt={x:src.x,z:src.z,until:G.clock+6};v.yaw=turn(v.yaw,Math.atan2(src.z-v.z,src.x-v.x),.6);}
  if(v.hp<=0)kill(v,src,wk,hs);
}
const STREAK=['','','Double kill','Triple kill','Quad kill','Ace!'];
function kill(v,src,wk,hs){
  v.alive=false;v.hp=0;v.act=null;v.d++;v.diedAt=G.clock;v.killer=src;v.killWk=wk;v.scoped=false;
  if(G.mode==='aim'&&src===G.player){G.aimKills++;G.aimScore+=hs?200:100;if(hs)G.aimHS++;G.reacts.push(G.clock-v.bornAt);}
  if(src&&foe(src,v)){src.k++;if(hs)src.hsk++;src.roundKills++;src.money=Math.min(16000,src.money+(WPN[wk]&&WPN[wk].reward||300));
    if(G.mode==='tdm')G.score[src.team]++;
    if(src===G.player){const n=src.roundKills;notice(n>=5&&!isDM()?'Ace!':STREAK[Math.min(n,4)]||(hs?'Headshot':''),n>=2?'':'#e5534b');if(n>=2)tone(520+n*90,.25,.2,'triangle');}}
  if(src===G.player&&WPN[wk]){const it=equippedFor(wk);if(it&&it.st)it.kills++;}
  if(G.mode==='arms'&&src&&foe(src,v)){if(wk==='knife'&&v.arLevel>0)v.arLevel--;if(wk===AR[src.arLevel]||wk==='knife'&&AR[src.arLevel]==='knife'){src.arLevel++;
    if(src.arLevel>=AR.length){G.arWinner=src;feedPush(src,v,wk,hs);v.alive=false;matchOver();return;}giveArms(src);if(src===G.player)notice(`Level ${src.arLevel+1}: ${WPN[AR[src.arLevel]].name}`,'#6cc68a');}}
  if(hs&&v.model&&v.model.userData.helmet&&v.model.userData.helmet.visible){const hm=v.model.userData.helmet;hm.visible=false;const cl=new THREE.Mesh(hm.geometry,hm.material);cl.scale.copy(hm.scale);
    fling(cl,v.x,eyeH(v)+.15,v.z,Math.cos(v.yaw+PI)*rnd(1,3)+rnd(-1,1),rnd(3,5),Math.sin(v.yaw+PI)*rnd(1,3)+rnd(-1,1),5);}
  if(!isDM()){for(const m of G.ents)if(m!==v&&m.alive&&!m.isPlayer&&!foe(m,v)&&!m.target&&src&&d2(m,v)<30&&Math.random()<.65*STYLE[S.style].hunt)m.hunt={x:src.x,z:src.z,until:G.clock+8};
    if(src&&!src.isPlayer&&src.team===G.player.team&&!ffaLike()&&Math.random()<.5)radio(src,pick(['Got him!','One down.','Enemy down.','Tagged and bagged.']));
    if(v.team===G.player.team&&!v.isPlayer&&!ffaLike()){const left=alive(other(v.team)).length;if(left)setTimeout(()=>{const m=alive(v.team).find(x=>!x.isPlayer);if(m)radio(m,`${v.name} is down at ${locationName(v.x,v.z)||'their spot'}. ${left} left.`);},700);}}
  if(v.primary){dropWeapon(v,v.primary);v.primary=null;}
  if(G.bomb.state==='carried'&&G.bomb.carrier===v){G.bomb.state='dropped';G.bomb.x=v.x;G.bomb.z=v.z;G.bomb.carrier=null;if(v.team===G.player.team)showMsg('The bomb has been dropped',2);}
  if(v.model){const u=v.model.userData,from=src?Math.atan2(v.z-src.z,v.x-src.x):v.yaw+PI;const rel=angDiff(v.yaw,from);
    u.dead={t:0,dir:Math.abs(rel)>PI/2?1:-1,side:rnd(-1,1),push:from,hs};}
  bloodSplat(v.x,v.z);
  feedPush(src,v,wk,hs);
  if(isDM())v.respawnAt=G.clock+RESPAWN;
  if(v===G.player){G.spec=null;closeBuy();if(!isDM())exitLock();}
  checkElim();checkDMEnd();
}

// ---------------- grenades
function clearNades(){for(const n of G.nadesLive)scene.remove(n.mesh);G.nadesLive=[];}
function throwNade(e,type){
  const p=e.pitch+.12,sp=16.5,cp=Math.cos(p);
  const m=nadeMesh(type);m.scale.setScalar(1.3);scene.add(m);
  const n={type,owner:e,x:e.x+Math.cos(e.yaw)*.5,y:eyeH(e)-.1,z:e.z+Math.sin(e.yaw)*.5,
    vx:Math.cos(e.yaw)*cp*sp+e.vx*.5,vy:Math.sin(p)*sp+e.vy*.5,vz:Math.sin(e.yaw)*cp*sp+e.vz*.5,t:0,mesh:m,spin:rnd(5,12)};
  if(cell(Math.floor(n.x/TILE),Math.floor(n.z/TILE))!==0){n.x=e.x;n.z=e.z;}
  G.nadesLive.push(n);sfxDraw();
}
function nadeBlocked(x,y,z){const c=cell(Math.floor(x/TILE),Math.floor(z/TILE));return c===1||(c===2&&y<CRATE_H)||(c===3&&y<BARREL_H);}
function updateNades(dt){
  for(let i=G.nadesLive.length-1;i>=0;i--){const n=G.nadesLive[i];n.t+=dt;
    const steps=3,h=dt/steps;
    for(let s=0;s<steps;s++){
      n.vy-=GRAV*h;let nx=n.x+n.vx*h,ny=n.y+n.vy*h,nz=n.z+n.vz*h,bounced=false;
      if(ny<.06){ny=.06;if(Math.abs(n.vy)>1.2)bounced=true;n.vy=-n.vy*.35;n.vx*=.7;n.vz*=.7;if(Math.abs(n.vy)<.8)n.vy=0;}
      if(nadeBlocked(nx,ny,n.z)){n.vx=-n.vx*.45;nx=n.x;bounced=true;}
      if(nadeBlocked(nx,ny,nz)){n.vz=-n.vz*.45;nz=n.z;bounced=true;}
      if(ny<CRATE_H+.05&&n.y>=CRATE_H&&nadeBlocked(nx,ny,nz)){ny=CRATE_H+.05;n.vy=-n.vy*.3;}
      n.x=nx;n.y=ny;n.z=nz;
      if(bounced&&Math.hypot(n.vx,n.vz)>1)sfxClink(n.x,n.z);
    }
    if(n.y<=.07){n.vx*=Math.max(0,1-dt*3);n.vz*=Math.max(0,1-dt*3);}
    n.mesh.position.set(n.x,n.y,n.z);n.mesh.rotation.x+=n.spin*dt*Math.min(1,Math.hypot(n.vx,n.vz)/4);n.mesh.rotation.z+=n.spin*.6*dt;
    const spd=Math.hypot(n.vx,n.vy,n.vz);
    const go=n.type==='smoke'?(n.t>.8&&spd<.6)||n.t>3:n.type==='molly'?(n.y<=.08&&n.t>.12)||n.t>2.2:n.t>(n.type==='he'?1.6:1.45);
    if(go){detonate(n);scene.remove(n.mesh);G.nadesLive.splice(i,1);}
  }
}
function detonate(n){
  const v=listener();
  if(n.type==='he'){
    sfxBoom(n.x,n.z,false);boomLight.position.set(n.x,1.5,n.z);boomLight.intensity=4;
    for(let i=0;i<8;i++)puff(n.x+rnd(-1,1),n.y+rnd(0,1.5),n.z+rnd(-1,1),i%3?0x6a6258:0xffa040,rnd(1.2,2.4),rnd(.5,1.2),rnd(.5,2),2.5);
    chips(n.x,n.y+.3,n.z,0,1,0,0x444444,10,5);
    if(v){const d=Math.hypot(v.x-n.x,v.z-n.z);if(d<25)G.shake=Math.min(.6,G.shake+.5*(1-d/25));}
    for(const e of G.ents){if(!e.alive)continue;const d=Math.hypot(e.x-n.x,e.z-n.z);if(d>9||!los(n.x,n.z,e.x,e.z))continue;
      if(e!==n.owner&&!foe(n.owner,e))continue;
      damage(e,n.owner,'he',false,98*Math.pow(1-d/9,1.2),null);}
  }else if(n.type==='flash'){
    tone(2000,.15,.4,'square',n.x,n.z);boomLight.position.set(n.x,n.y+.5,n.z);boomLight.intensity=6;puff(n.x,n.y,n.z,0xffffff,3,.25,0,3);
    for(const e of G.ents){if(!e.alive)continue;const d=Math.hypot(e.x-n.x,e.z-n.z);if(d>32||!los(e.x,e.z,n.x,n.z))continue;
      const dir=Math.atan2(n.z-e.z,n.x-e.x),face=Math.cos(angDiff(e.yaw,dir));
      const amt=clamp(1-d/32,0,1)*(face>.5?1:face>0?.55:.2);if(amt<.05)continue;
      const dur=.4+amt*4.2;e.blindUntil=Math.max(e.blindUntil,G.clock+dur);e.blindAmt=amt;
      if(e===G.player&&amt>.3)sfxRing(dur);
      if(!e.isPlayer){e.target=null;}}
  }else if(n.type==='molly'){
    if(SMOKES.some(s=>Math.hypot(s.x-n.x,s.z-n.z)<s.r&&G.clock<s.t1)){puff(n.x,.5,n.z,0x888888,1.5,1,.8,2);return;}
    sfxBoom(n.x,n.z,false);startFire(n.x,n.z,n.owner);
  }else{
    for(const f of G.fires)if(Math.hypot(f.x-n.x,f.z-n.z)<6)f.t1=Math.min(f.t1,G.clock+.4);
    sfxSmoke(n.x,n.z);const s={x:n.x,z:n.z,r:4.6,t0:G.clock,t1:G.clock+17};SMOKES.push(s);smokeCloud(n.x,n.z,s.t0,s.t1);
  }
}

// ---------------- fire from molotovs
const flamePool=[];for(let i=0;i<70;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xff8a2a,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity:0}));s.visible=false;scene.add(s);flamePool.push({s,f:null,ox:0,oz:0,ph:0});}
const fireLight=new THREE.PointLight(0xff7a2a,0,16,2);scene.add(fireLight);
function clearFires(){if(G.fires)G.fires.length=0;for(const p of flamePool){p.s.visible=false;p.f=null;}}
function startFire(x,z,owner){
  // spread over walkable tiles around the impact point
  const f={x,z,r:3.4,t0:G.clock,t1:G.clock+7,owner,tick:0};G.fires.push(f);
  let n=0;for(const p of flamePool){if(p.f&&p.f.t1>G.clock)continue;if(n++>=22)break;
    let ox,oz;for(let k=0;k<6;k++){const a=rnd(0,TAU),r=Math.sqrt(Math.random())*f.r;ox=Math.cos(a)*r;oz=Math.sin(a)*r;if(!solid(Math.floor((x+ox)/TILE),Math.floor((z+oz)/TILE)))break;}
    p.f=f;p.ox=ox;p.oz=oz;p.ph=rnd(0,TAU);p.s.visible=true;}
}
function inFire(e){for(const f of G.fires)if(G.clock<f.t1&&Math.hypot(e.x-f.x,e.z-f.z)<f.r&&e.y<.6)return f;return null;}
function fireUpdate(dt){
  if(!G.fires)return;let near=null,nd=1e9;const L=listener();
  for(let i=G.fires.length-1;i>=0;i--){const f=G.fires[i];if(G.clock>f.t1){G.fires.splice(i,1);continue;}
    for(const e of G.ents){if(!e.alive||e.y>.6||Math.hypot(e.x-f.x,e.z-f.z)>f.r)continue;if(e!==f.owner&&!foe(f.owner,e))continue;damage(e,f.owner,'molly',false,34*dt,null);}
    if(L){const d=Math.hypot(L.x-f.x,L.z-f.z);if(d<nd){nd=d;near=f;}}
    f.tick-=dt;if(f.tick<=0){f.tick=.18;if(L&&Math.hypot(L.x-f.x,L.z-f.z)<35)sfxStep(f.x,f.z,true);}}
  for(const p of flamePool){if(!p.f)continue;if(G.clock>p.f.t1){p.s.visible=false;p.f=null;continue;}
    const age=G.clock-p.f.t0,life=clamp(Math.min(age*3,(p.f.t1-G.clock)*.8),0,1),fl=.75+Math.sin(G.clock*14+p.ph)*.25;
    p.s.position.set(p.f.x+p.ox,.45+fl*.35,p.f.z+p.oz);p.s.scale.set(1.3*fl*life+.01,1.9*fl*life+.01,1);p.s.material.opacity=.85*life;}
  if(near){fireLight.position.set(near.x,1.4,near.z);fireLight.intensity=2.2+Math.sin(G.clock*20)*.5;}else fireLight.intensity=0;
}
function fireCost(tx,ty){if(!G.fires||!G.fires.length)return 0;const x=tc(tx),z=tc(ty);for(const f of G.fires)if(Math.hypot(x-f.x,z-f.z)<f.r+1.2)return 40;return 0;}

// ---------------- hearing
function noise(e,range){
  for(const b of G.ents){
    if(b.isPlayer||!b.alive||!foe(b,e)||b.target)continue;
    const d=d2(b,e);if(d>range)continue;
    b.lookAt={x:e.x,z:e.z};b.lookUntil=G.clock+2.5;
    const busy=(G.bomb.carrier===b)||b.act||(b.team==='CT'&&G.bomb.state==='planted'&&!isDM());
    const p=(isDM()?.9:b.team==='CT'?(d<35?.6:.25):.5)*STYLE[S.style].hunt;
    if(!busy&&Math.random()<p)b.hunt={x:e.x+rnd(-3,3),z:e.z+rnd(-3,3),until:G.clock+7};
  }
}

// ---------------- bomb
const canPlant=e=>!isDM()&&e.alive&&e.team==='T'&&G.bomb.state==='carried'&&G.bomb.carrier===e&&!!inSite(e.x,e.z)&&G.phase==='live'&&e.y<.05;
const canDefuse=e=>!isDM()&&e.alive&&e.team==='CT'&&G.bomb.state==='planted'&&d2(e,G.bomb)<1.7&&G.phase==='live';
function startAct(e,type){if(e.act&&e.act.type===type)return;e.act={type,t:0,need:type==='plant'?3.2:(e.kit?5:10)};e.reloadT=0;e.scoped=false;
  if(type==='plant'&&e.team===G.player.team&&e!==G.player)showMsg(`${e.name} is planting`,1.5);
  if(type==='defuse'&&e===G.player)tone(700,.1,.15,'square');}
function actUpdate(e,dt){
  if(!e.act)return;
  if((e.act.type==='plant'&&!canPlant(e))||(e.act.type==='defuse'&&!canDefuse(e))){e.act=null;return;}
  e.act.t+=dt;
  if(e.act.t>=e.act.need){
    if(e.act.type==='plant'){const b=G.bomb;b.state='planted';b.x=e.x+Math.cos(e.yaw)*.5;b.z=e.z+Math.sin(e.yaw)*.5;b.timer=BOMB_TIME;b.beep=0;b.site=inSite(e.x,e.z);b.carrier=null;
      G.planted=true;e.money+=300;showMsg(`Bomb planted at ${b.site}`,3);tone(520,.3,.3,'square');
      if(G.player.team==='T'&&!e.isPlayer)radio(e,`Bomb planted at ${b.site}. Hold the site!`);else if(G.player.team==='CT'){const m=alive('CT').find(x=>!x.isPlayer);if(m)radio(m,`Bomb's down at ${b.site}, rotating!`);}
      for(const o of G.ents){o.hunt=null;o.repath=true;}}
    else{G.bomb.state='defused';if(!e.isPlayer&&e.team===G.player.team)radio(e,'Bomb defused!');e.money+=300;e.roundKills+=1;endRound('CT','defuse');}
    e.act=null;
  }
}
const bombMesh=new THREE.Group();bombMesh.add(box(.42,.16,.3,0x2a2a2a,0,.08,0));bombMesh.add(box(.3,.05,.2,0x8a1f1a,0,.18,0));bombMesh.add(box(.12,.06,.1,0x3a5a3a,-.1,.19,.05));
const bombLed=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),new THREE.MeshBasicMaterial({color:0xff2a1a}));bombLed.position.set(.12,.22,.05);bombMesh.add(bombLed);
bombMesh.visible=false;scene.add(bombMesh);
function bombUpdate(dt){
  const b=G.bomb;
  if(b.state==='dropped'){for(const e of G.ents)if(e.alive&&e.team==='T'&&d2(e,b)<1.1){b.state='carried';b.carrier=e;if(e===G.player)showMsg('You picked up the bomb',2);break;}}
  if(b.state==='planted'&&G.phase!=='end'){
    b.timer-=dt;b.beep-=dt;
    if(b.beep<=0){b.beep=clamp(b.timer/BOMB_TIME,.08,1)*.95;tone(1350,.09,.3,'sine',b.x,b.z);bombLed.material.color.setHex(0xff5030);bombLed._t=G.clock;}
    if(b.timer<=0)explode();
  }
  if(bombLed._t&&G.clock-bombLed._t>.1)bombLed.material.color.setHex(0x551010);
  bombMesh.visible=b.state==='planted'||b.state==='dropped';
  if(bombMesh.visible)bombMesh.position.set(b.x,0,b.z);
}
function explode(){
  const b=G.bomb;b.state='exploded';sfxBoom(b.x,b.z,true);G.shake=1;boomLight.position.set(b.x,3,b.z);boomLight.intensity=12;
  for(let i=0;i<22;i++)puff(b.x+rnd(-4,4),rnd(.5,5),b.z+rnd(-4,4),i%2?0xffa040:0x554433,rnd(3,7),rnd(.8,2),rnd(1,4),3);
  for(const e of G.ents){if(!e.alive)continue;const d=d2(e,b);if(d<26){e.hp-=500*Math.pow(1-d/26,1.6);if(e.hp<=0){e.hp=0;e.alive=false;e.d++;e.act=null;e.diedAt=G.clock;
    if(e.primary){dropWeapon(e,e.primary);e.primary=null;}if(e.model)e.model.userData.dead={t:0,dir:1,side:rnd(-1,1),push:Math.atan2(e.z-b.z,e.x-b.x)};feedPush(null,e,'bomb',false);}}}
  endRound('T','bomb');
}

// ---------------- movement and collision
function collide(e){
  const r=RAD,x0=Math.floor((e.x-r)/TILE),x1=Math.floor((e.x+r)/TILE),y0=Math.floor((e.z-r)/TILE),y1=Math.floor((e.z+r)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const c=cell(tx,ty);if(c===0)continue;
    if(c===2&&e.y>=CRATE_H-.05)continue;if(c===3&&e.y>=BARREL_H-.05)continue;
    const cx=clamp(e.x,tx*TILE,(tx+1)*TILE),cz=clamp(e.z,ty*TILE,(ty+1)*TILE),dx=e.x-cx,dz=e.z-cz,dd=dx*dx+dz*dz;
    if(dd<r*r){if(dd>1e-8){const d=Math.sqrt(dd);e.x+=dx/d*(r-d);e.z+=dz/d*(r-d);}else e.z-=r;}
  }
}
function groundAt(e){ // standing on crates or barrels after a jump
  let g=0;const r=RAD*.7;
  for(const[ox,oz]of[[0,0],[r,0],[-r,0],[0,r],[0,-r]]){const c=cell(Math.floor((e.x+ox)/TILE),Math.floor((e.z+oz)/TILE));if(c===2)g=Math.max(g,CRATE_H);else if(c===3)g=Math.max(g,BARREL_H);}
  return g;
}
function moveEnt(e,mx,mz,run,dt){
  const def=WPN[curKey(e)];
  let sp=SPEED*def.speed*run*(e.scoped?.55:1)*(e.isPlayer?1:.95)*(1-e.crouchV*.55)*(G.clock<e.tagUntil?.6:1)*(e.zombie?1.12:1);
  if(e.act||G.phase==='freeze'||!e.alive)sp=0;
  const air=e.y>e.ground+.05,k=air?2:14;
  e.vx+=(mx*sp-e.vx)*Math.min(1,dt*k);e.vz+=(mz*sp-e.vz)*Math.min(1,dt*k);
  e.x+=e.vx*dt;e.z+=e.vz*dt;collide(e);
  e.ground=groundAt(e);
  if(e.y>e.ground||e.vy>0){e.vy-=GRAV*dt;e.y+=e.vy*dt;if(e.y<=e.ground){e.y=e.ground;e.vy=0;}}
  else e.y=e.ground;
  e.moving=Math.hypot(e.vx,e.vz);
  e.crouchV+=((e.crouch?1:0)-e.crouchV)*Math.min(1,dt*10);
  if(!air&&e.moving>SPEED*.62&&e.crouchV<.3){e.stepAcc+=e.moving*dt;if(e.stepAcc>2.4){e.stepAcc=0;sfxStep(e.x,e.z,e===listener());if(!isDM()||Math.random()<.5)hearStep(e);}}
}
function hearStep(e){for(const b of G.ents){if(b.isPlayer||!b.alive||!foe(b,e)||b.target)continue;const d=d2(b,e);if(d>17)continue;
  b.lookAt={x:e.x,z:e.z};b.lookUntil=G.clock+2;if(Math.random()<.25*STYLE[S.style].hunt&&!b.act&&G.bomb.carrier!==b)b.hunt={x:e.x,z:e.z,until:G.clock+5};}}
function separate(){
  const a=G.ents;for(let i=0;i<a.length;i++){const p=a[i];if(!p.alive)continue;for(let j=i+1;j<a.length;j++){const q=a[j];if(!q.alive)continue;
    const dx=q.x-p.x,dz=q.z-p.z,dd=dx*dx+dz*dz,m=RAD*2;if(dd<m*m&&dd>1e-6){const d=Math.sqrt(dd),o=(m-d)/2;p.x-=dx/d*o;p.z-=dz/d*o;q.x+=dx/d*o;q.z+=dz/d*o;}}}
}
function commonUpdate(e,dt){
  e.fireCd-=dt;e.spray=Math.max(0,e.spray-dt*(e.isPlayer?.22:.3));e.punch*=Math.max(0,1-dt*8);
  {const def=WPN[curKey(e)];if(G.clock-e.lastShot>(def.rof||.1)*1.5)e.sprayN=Math.max(0,e.sprayN-dt*16);
   const pt=sprayOffset(def,e.sprayN);e.vpY=lerp(e.vpY||0,pt[0]*.5,Math.min(1,dt*18));e.vpP=lerp(e.vpP||0,pt[1]*.5,Math.min(1,dt*18));}
  if(e.reloadT>0){e.reloadT-=dt;if(e.reloadT<=0){e.reloadT=0;const w=curW(e),def=WPN[w.key];if(def.mag){const take=Math.min(def.mag-w.mag,w.res);w.mag+=take;w.res-=take;}}}
  actUpdate(e,dt);
  if(!e.primary&&e.alive)for(let i=0;i<G.drops.length;i++){const d=G.drops[i];if(G.clock-d.t>.8&&d2(e,d)<1.2){e.primary={key:d.key,mag:d.mag,res:d.res};scene.remove(d.mesh);G.drops.splice(i,1);switchTo(e,'primary');if(e===G.player)showMsg(`Picked up ${WPN[d.key].name}`,1.5);break;}}
}
