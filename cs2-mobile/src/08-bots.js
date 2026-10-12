// ---------------- bot AI
function perceive(b){
  if(G.clock<b.blindUntil){b.target=null;return;}
  let best=null,bd=1e9;
  for(const o of G.ents){
    if(!o.alive||!foe(b,o))continue;const d=d2(b,o);if(d>b.sk.see)continue;
    if(!canSee(b,o))continue;
    if(G.mode!=='ffa'&&b.team===G.player.team)o.spotT=G.clock+.3;
    const sc=d*(Math.abs(angDiff(b.yaw,Math.atan2(o.z-b.z,o.x-b.x)))>1.4?1.6:1);
    if(sc<bd){bd=sc;best=o;}
  }
  if(best!==b.target){
    if(best){const behind=Math.abs(angDiff(b.yaw,Math.atan2(best.z-b.z,best.x-b.x)))>1.4;b.seenFor=(behind?-.35:0)-Math.random()*.12;b.reAim=0;
      if(!isDM()&&b.team==='CT'&&G.bomb.state!=='planted'){for(const m of G.ents)if(m!==b&&!m.isPlayer&&m.alive&&m.team==='CT'&&!m.target&&Math.random()<STYLE[S.style].rot)m.hunt={x:best.x,z:best.z,until:G.clock+10,start:G.clock+rnd(.5,2.5)};}
    }else if(b.target&&b.target.alive)b.lostAt=G.clock;
    b.target=best;
  }
  if(best)b.lastKnown={x:best.x,z:best.z,t:G.clock};
}
function botGoal(b){
  const bomb=G.bomb,C=G.clock;b.wantAct=null;
  if(isDM()){
    if(b.hunt&&C<b.hunt.until&&C>=(b.hunt.start||0)){if(d2(b,b.hunt)<2)b.hunt=null;else return b.hunt;}
    if(!b.roam||d2(b,b.roam)<2.5||C>b.roamUntil){const t=pick(FLOOR);b.roam={x:tc(t[0]),z:tc(t[1])};b.roamUntil=C+rnd(10,18);}
    return b.roam;
  }
  const carrier=bomb.state==='carried'&&bomb.carrier===b;
  if(b.team==='CT'&&bomb.state==='planted'){if(d2(b,bomb)<1.3)b.wantAct='defuse';return{x:bomb.x,z:bomb.z};}
  if(!b.primary&&!carrier){let best=null,bd=25;for(const d of G.drops){const dd=d2(b,d);if(dd<bd){bd=dd;best=d;}}if(best)return best;}
  if(b.hunt&&C<b.hunt.until&&!carrier&&C>=(b.hunt.start||0)){if(d2(b,b.hunt)<2)b.hunt=null;else return b.hunt;}
  if(b.team==='T'){
    if(bomb.state==='dropped'){let nb=null,nd=1e9;for(const t of G.ents)if(t.alive&&t.team==='T'&&!t.isPlayer){const dd=d2(t,bomb);if(dd<nd){nd=dd;nb=t;}}if(nb===b)return{x:bomb.x,z:bomb.z};}
    if(bomb.state==='planted'){
      if(!b.guard){for(let k=0;k<30;k++){const tx=Math.floor(bomb.x/TILE)+Math.round(rnd(-5,5)),ty=Math.floor(bomb.z/TILE)+Math.round(rnd(-5,5));
        if(!solid(tx,ty)&&los(tc(tx),tc(ty),bomb.x,bomb.z)){b.guard={x:tc(tx),z:tc(ty)};break;}}if(!b.guard)b.guard={x:bomb.x,z:bomb.z};}
      if(d2(b,b.guard)<1.5){b.lookAt={x:bomb.x,z:bomb.z};b.lookUntil=C+1;}
      return b.guard;
    }
    if(G.rt<G.tGo&&ROUND_TIME-(G.rt-FREEZE)>35)return null;
    if(!b.route){const site=G.siteTarget,r=pick(ROUTES[site]),[a,bb,w,h]=SITES[site];
      const pts=floorTiles(a+1,bb+1,w-2,h-2),pt=pick(pts);
      b.route=[{x:tc(r[0]),z:tc(r[1])},{x:tc(pt[0]),z:tc(pt[1])}];b.utilThrown=false;}
    if(b.route.length>1&&d2(b,b.route[0])<3){b.route.shift();if(!b.utilThrown){b.utilThrown=true;botUtility(b,b.route[0]);}}
    if(carrier&&b.route.length===1&&inSite(b.x,b.z)&&d2(b,b.route[0])<4)b.wantAct='plant';
    return b.route[0];
  }
  if(b.pusher&&G.rt>FREEZE+10&&!b.pushSpot){const r=pick(ROUTES[pick(['A','B'])]);b.pushSpot={x:tc(r[0]),z:tc(r[1])};}
  const spot=b.pushSpot||b.holdSpot;
  if(d2(b,spot)<1.5&&C>b.lookUntil){const ts=MAP.spawn.T;b.lookAt=b.pushSpot?{x:tc(ts[0]+ts[2]/2),z:tc(ts[1]+ts[3]/2)}:b.holdLook;b.lookUntil=C+.5;}
  return spot;
}
function botNav(b,goal){
  if(!goal)return[0,0];
  if(d2(b,goal)<.6){b.path=null;return[0,0];}
  const gx=Math.floor(goal.x/TILE),gy=Math.floor(goal.z/TILE),key=gx+','+gy;
  if(b.pathKey!==key||!b.path||b.repath){b.path=findPath(Math.floor(b.x/TILE),Math.floor(b.z/TILE),gx,gy);b.pathKey=key;b.repath=false;
    if(b.path.length)b.path[b.path.length-1]={x:goal.x,z:goal.z};else b.path=[{x:goal.x,z:goal.z}];}
  while(b.path.length&&Math.hypot(b.path[0].x-b.x,b.path[0].z-b.z)<.6)b.path.shift();
  while(b.path.length>1&&walkClear(b.x,b.z,b.path[1].x,b.path[1].z))b.path.shift();
  if(!b.path.length)return[0,0];
  const n=b.path[0],dx=n.x-b.x,dz=n.z-b.z,L=Math.hypot(dx,dz)||1;return[dx/L,dz/L];
}
function lobAngle(d){const v=16.5,s=clamp(GRAV*d/(v*v),0,1);return .5*Math.asin(s)-.12;}
function botThrow(b,type,pt){
  if(S.nades!=='on'||!b.nades[type]||G.phase!=='live')return false;
  const d=Math.hypot(pt.x-b.x,pt.z-b.z);if(d<4||d>30)return false;
  const prev=b.slot,prevSel=b.nadeSel;
  b.yaw=Math.atan2(pt.z-b.z,pt.x-b.x);b.pitch=lobAngle(d);
  b.slot='grenade';b.nadeSel=type;b.fireCd=0;b.reloadT=0;
  const ok=tryFire(b);
  if(prev!=='grenade')b.slot=prev;b.nadeSel=prevSel;b.fireCd=.6;b.nadeCd=G.clock+4;
  return ok;
}
function botUtility(b,toward){
  if(S.nades!=='on')return;
  if(b.nades.flash&&Math.random()<.6)botThrow(b,'flash',{x:lerp(b.x,toward.x,.7),z:lerp(b.z,toward.z,.7)});
  else if(b.nades.smoke&&Math.random()<.5)botThrow(b,'smoke',{x:lerp(b.x,toward.x,.8),z:lerp(b.z,toward.z,.8)});
}
function botUpdate(b,dt){
  b.percT-=dt;if(b.percT<=0){b.percT=.1+Math.random()*.05;perceive(b);}
  if(b.target&&!b.target.alive)b.target=null;
  if(b.target&&G.clock<b.target.protectUntil&&isDM())b.target=null;
  const tgt=b.target;
  if(G.phase==='freeze'){return[0,0,0];}
  const blind=G.clock<b.blindUntil;
  if(blind){b.yaw+=Math.sin(G.clock*3+b.id)*dt*1.5;b.crouch=false;return[-Math.cos(b.yaw)*.5,-Math.sin(b.yaw)*.5,.6];}
  const w=curW(b),def=WPN[w.key];
  if(b.slot==='grenade'){b.slot=b.primary?'primary':b.secondary?'secondary':'knife';}
  if(b.reloadT<=0&&!def.melee&&w.mag===0){
    if(tgt&&b.slot==='primary'&&b.secondary&&b.secondary.mag>0&&d2(b,tgt)<25)switchTo(b,'secondary');
    else if(w.res>0)startReload(b);
    else if(b.slot==='primary'&&b.secondary)switchTo(b,'secondary');else switchTo(b,'knife');
  }
  if(!tgt&&b.slot!=='primary'&&b.primary&&(b.primary.mag>0||b.primary.res>0))switchTo(b,'primary');
  if(!tgt&&b.slot==='knife'&&b.secondary&&b.secondary.mag+b.secondary.res>0)switchTo(b,'secondary');
  if(!tgt&&!def.melee&&b.reloadT<=0&&w.mag<(def.mag||0)*.4&&w.res>0)startReload(b);
  const goal=botGoal(b);
  const ninja=b.act&&b.act.type==='defuse'&&(G.bomb.timer<b.act.need-b.act.t+1.5);
  if(b.wantAct&&(!tgt||ninja)&&G.phase==='live'){if(b.wantAct==='plant'?canPlant(b):canDefuse(b))startAct(b,b.wantAct);}
  else if(b.act&&tgt&&!ninja)b.act=null;
  if(b.act){if(tgt)aimAt(b,tgt,dt);b.crouch=b.act.type==='defuse';return[0,0,0];}
  let mx=0,mz=0,run=1;
  if(tgt){
    const dx=tgt.x-b.x,dz=tgt.z-b.z,d=Math.hypot(dx,dz);
    b.seenFor+=dt;
    const on=aimAt(b,tgt,dt);
    const firing=b.seenFor>b.sk.react&&on;
    if(def.sniper)b.scoped=true;
    if(firing&&b.burstCd<=0){
      if(def.melee){if(d<1.6)tryFire(b);}
      else if(tryFire(b)&&def.auto){b.burst++;if(b.burst>=(d>40?3:d>20?5:12)){b.burst=0;b.burstCd=rnd(.15,.32);}}
    }
    b.strafeT-=dt;if(b.strafeT<=0){b.strafeT=rnd(.3,.9);b.strafeDir=Math.random()<.5?-1:1;b.stopShoot=Math.random()<b.sk.stop;b.crouch=b.stopShoot&&Math.random()<b.sk.crouch&&!def.melee;}
    if(def.melee){const v=botNav(b,tgt);mx=v[0];mz=v[1];b.crouch=false;}
    else if(!(b.stopShoot&&firing)&&!def.sniper){mx=-dz/d*b.strafeDir;mz=dx/d*b.strafeDir;run=.8;}
    if(def.pellets&&d>12&&!b.stopShoot){mx+=dx/d*.7;mz+=dz/d*.7;}
    if(b.reloadT>0){mx-=dx/d*.8;mz-=dz/d*.8;b.crouch=false;}
    b.lookAt={x:tgt.x,z:tgt.z};b.lookUntil=G.clock+2;
    b.hunt={x:tgt.x,z:tgt.z,until:G.clock+5};
  }else{
    b.seenFor=0;b.burst=0;b.crouch=false;b.scoped=false;
    if(b.lastKnown&&b.nades.he&&G.clock>b.nadeCd&&G.clock-b.lastKnown.t<3&&G.clock-b.lastKnown.t>.6&&Math.random()<.02)botThrow(b,'he',b.lastKnown);
    if(!isDM()&&b.team==='CT'&&G.bomb.state==='planted'&&b.nades.smoke&&G.clock>b.nadeCd){const d=d2(b,G.bomb);if(d>9&&d<22&&Math.random()<.03)botThrow(b,'smoke',G.bomb);}
    const v=botNav(b,goal);mx=v[0];mz=v[1];
    let face=null;
    if(b.lookAt&&(G.clock<b.lookUntil||(!mx&&!mz)))face=Math.atan2(b.lookAt.z-b.z,b.lookAt.x-b.x);
    else if(mx||mz)face=Math.atan2(mz,mx);
    if(face!==null)b.yaw=turn(b.yaw,face,dt*5);
    b.pitch*=.9;
    if(isDM()||(b.hunt&&G.clock<b.hunt.until))run=1;else if(b.team==='T'&&b.route&&b.route.length===1&&S.style!=='aggressive')run=.85;
  }
  b.burstCd-=dt;
  b.stuckT+=dt;if(b.stuckT>.7){if((mx||mz)&&Math.hypot(b.x-b.lx,b.z-b.lz)<.25){b.repath=true;b.nudge={x:rnd(-1,1),z:rnd(-1,1),t:G.clock+.35};}b.stuckT=0;b.lx=b.x;b.lz=b.z;}
  if(b.nudge&&G.clock<b.nudge.t){mx+=b.nudge.x;mz+=b.nudge.z;}
  const L=Math.hypot(mx,mz);if(L>1){mx/=L;mz/=L;}
  return[mx,mz,run];
}
function aimAt(b,t,dt){
  const dx=t.x-b.x,dz=t.z-b.z,d=Math.hypot(dx,dz);
  b.reAim-=dt;if(b.reAim<=0){b.aimHead=Math.random()<b.sk.hs;b.reAim=rnd(.4,.9);}
  const th=t.y+(b.aimHead?1.67:1.2)-CROUCH_DROP*t.crouchV;
  const wantYaw=Math.atan2(dz,dx),wantPitch=Math.atan2(th-eyeH(b),d);
  const err=b.sk.err*Math.exp(-Math.max(0,b.seenFor)*1.6)+b.sk.err*.15;
  const ey=Math.sin(G.clock*3.1+b.id*2.3)*err,ep=Math.sin(G.clock*2.3+b.id)*err*.5;
  b.yaw=turn(b.yaw,wantYaw+ey,b.sk.turn*dt);b.pitch+=clamp(wantPitch+ep-b.pitch,-b.sk.turn*dt,b.sk.turn*dt);
  return Math.abs(angDiff(b.yaw,wantYaw))<Math.max(.025,.5/d)+b.sk.err*.4;
}
