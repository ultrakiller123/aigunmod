// ---------------- input
const keys={};const look={id:null,lx:0,ly:0};const mv={id:null,ox:0,oy:0,x:0,y:0};
let fireIds=new Set(),useHeld=false,useEdge=false,locked=false,mouseDown=false,jumpReq=false,crouchToggle=false;
const touchEl=$('touch');
function setDesk(on){document.body.classList.toggle('desk',on);}
setDesk(!isTouch);
const desk=()=>document.body.classList.contains('desk');
function lookDelta(dx,dy,mult=1){const p=G.player;if(!p||!p.alive||G.state!=='play')return;
  const z=p.scoped?(WPN[curKey(p)].zoom||1):1;const s=S.sens*.0007*mult*z;
  p.yaw+=dx*s;p.pitch=clamp(p.pitch-dy*s,-1.35,1.35);}
touchEl.addEventListener('pointerdown',ev=>{
  if(ev.pointerType==='mouse'){setDesk(true);if(G.state==='play'){if(!locked)requestLock();else if(ev.button===0)mouseDown=true;else if(ev.button===2)toggleScope();}return;}
  setDesk(false);ev.preventDefault();
  if(G.state!=='play')return;
  if(!G.player.alive){if(!isDM())cycleSpec();return;}
  if(ev.clientX<innerWidth*.42&&mv.id===null){mv.id=ev.pointerId;mv.ox=mv.x=ev.clientX;mv.oy=mv.y=ev.clientY;const s=$('stick');s.hidden=false;s.style.left=mv.ox+'px';s.style.top=mv.oy+'px';$('knob').style.transform='';}
  else if(look.id===null){look.id=ev.pointerId;look.lx=ev.clientX;look.ly=ev.clientY;}
  try{touchEl.setPointerCapture(ev.pointerId);}catch(e){}
});
touchEl.addEventListener('pointermove',ev=>{
  if(ev.pointerType==='mouse')return;
  if(ev.pointerId===mv.id){mv.x=ev.clientX;mv.y=ev.clientY;const dx=mv.x-mv.ox,dy=mv.y-mv.oy,L=Math.hypot(dx,dy),m=Math.min(L,50)/(L||1);$('knob').style.transform=`translate(${dx*m}px,${dy*m}px)`;}
  else if(ev.pointerId===look.id){lookDelta(ev.clientX-look.lx,ev.clientY-look.ly);look.lx=ev.clientX;look.ly=ev.clientY;}
});
const endTouch=ev=>{if(ev.pointerId===mv.id){mv.id=null;$('stick').hidden=true;}if(ev.pointerId===look.id)look.id=null;};
touchEl.addEventListener('pointerup',endTouch);touchEl.addEventListener('pointercancel',endTouch);
touchEl.addEventListener('contextmenu',e=>e.preventDefault());
const fireLook={};
for(const id of['bFire','bFireL']){const b=$(id);
  b.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();audioInit();fireIds.add(ev.pointerId);fireLook[ev.pointerId]=[ev.clientX,ev.clientY];b.classList.add('on');try{b.setPointerCapture(ev.pointerId);}catch(e){}});
  b.addEventListener('pointermove',ev=>{const l=fireLook[ev.pointerId];if(!l)return;lookDelta(ev.clientX-l[0],ev.clientY-l[1]);l[0]=ev.clientX;l[1]=ev.clientY;});
  const up=ev=>{fireIds.delete(ev.pointerId);delete fireLook[ev.pointerId];if(!fireIds.size)document.querySelectorAll('#bFire,#bFireL').forEach(x=>x.classList.remove('on'));};
  b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);}
function tapBtn(id,fn){$(id).addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();audioInit();fn();});}
tapBtn('bReload',()=>G.player.alive&&startReload(G.player));
tapBtn('bSwitch',()=>G.player.alive&&cycleWeapon(G.player));
tapBtn('bNade',()=>G.player.alive&&selectNade(G.player));
tapBtn('bScope',toggleScope);
tapBtn('bJump',()=>{jumpReq=true;});
tapBtn('bCrouch',()=>{crouchToggle=!crouchToggle;$('bCrouch').classList.toggle('on',crouchToggle);});
tapBtn('bBuy',()=>$('buy').hidden?openBuy():closeBuy());
tapBtn('bPause',pauseGame);
$('ammo').style.pointerEvents='auto';$('ammo').addEventListener('pointerdown',ev=>{ev.stopPropagation();VM.inspect=2.4;});
const ub=$('bUse');
ub.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();useHeld=true;useEdge=true;ub.classList.add('on');});
const uup=()=>{useHeld=false;ub.classList.remove('on');};ub.addEventListener('pointerup',uup);ub.addEventListener('pointercancel',uup);ub.addEventListener('pointerleave',uup);
$('bBuyClose').addEventListener('click',closeBuy);
$('buyList').addEventListener('click',ev=>{const b=ev.target.closest('.item');if(b)buyItem(b.dataset.k);});
$('top').addEventListener('click',()=>{if(G.state!=='play')return;const b=$('board');if(b.hidden){$('boardBody').innerHTML=boardHTML();b.hidden=false;}else b.hidden=true;});
$('board').addEventListener('click',()=>$('board').hidden=true);
function toggleScope(){const p=G.player;if(p&&p.alive&&WPN[curKey(p)].zoom&&p.reloadT<=0)p.scoped=!p.scoped;}
function requestLock(){try{const r=cv.requestPointerLock?cv.requestPointerLock():null;if(r&&r.catch)r.catch(()=>{});}catch(e){}}
function exitLock(){if(document.pointerLockElement)try{document.exitPointerLock();}catch(e){}}
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===cv;if(!locked)mouseDown=false;});
document.addEventListener('mousemove',ev=>{if(locked)lookDelta(ev.movementX,ev.movementY,.55);});
cv.addEventListener('mousedown',ev=>{if(!locked)return;if(ev.button===0)mouseDown=true;else if(ev.button===2)toggleScope();});
document.addEventListener('mouseup',ev=>{if(ev.button===0)mouseDown=false;});
cv.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',ev=>{if(G.state==='play'&&locked&&G.player.alive)cycleWeapon(G.player);},{passive:true});
addEventListener('keydown',ev=>{
  const k=ev.key.toLowerCase();if(keys[k]&&k!=='e')return;keys[k]=true;if(G.state==='menu')return;
  if(k==='tab'){ev.preventDefault();if(G.state==='play'){$('boardBody').innerHTML=boardHTML();$('board').hidden=false;}}
  if(G.state!=='play')return;setDesk(true);
  const p=G.player;
  if(k==='r'&&p.alive)startReload(p);
  if(k==='1'&&p.alive)switchTo(p,'primary');if(k==='2'&&p.alive)switchTo(p,'secondary');if(k==='3'&&p.alive)switchTo(p,'knife');
  if(k==='4'&&p.alive)selectNade(p);
  if(k==='q'&&p.alive)cycleWeapon(p);
  if(k==='f'&&p.alive)VM.inspect=2.4;
  if(k==='g'&&p.alive)dropCurrent(p);
  if(k==='u'&&G.mode!=='aim'){$('upOvl').hidden?openUpgrader():closeUpgrader();}
  if(k==='b'){$('buy').hidden?openBuy():(closeBuy(),requestLock());}
  if(k===' '){ev.preventDefault();jumpReq=true;}
  if(k==='e'){if(!useHeld)useEdge=true;useHeld=true;}
  if(k==='escape'&&!locked&&$('buy').hidden)pauseGame();
});
addEventListener('keyup',ev=>{const k=ev.key.toLowerCase();keys[k]=false;if(k==='e')useHeld=false;if(k==='tab')$('board').hidden=true;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseDown=false;fireIds.clear();useHeld=false;});
function cycleSpec(){const list=alive(G.player.team).length?alive(G.player.team):G.ents.filter(e=>e.alive);if(!list.length)return;const i=list.indexOf(G.spec);G.spec=list[(i+1)%list.length];}
function dropCurrent(p){
  if(p.slot==='primary'&&p.primary){dropWeapon(p,p.primary,true);p.primary=null;switchTo(p,p.secondary?'secondary':'knife');}
  else if(p.slot==='secondary'&&p.secondary){dropWeapon(p,p.secondary,true);p.secondary=null;switchTo(p,p.primary?'primary':'knife');}
  else if(G.bomb.carrier===p&&G.bomb.state==='carried'){G.bomb.state='dropped';G.bomb.carrier=null;G.bomb.x=p.x+Math.cos(p.yaw)*1.5;G.bomb.z=p.z+Math.sin(p.yaw)*1.5;}
}
function tryPickup(p){
  let best=null,bd=1.8;for(const d of G.drops){const dd=d2(p,d);if(dd<bd&&G.clock-d.t>.3){bd=dd;best=d;}}
  if(!best)return false;const def=WPN[best.key];
  const slotKey=def.slot;const cur=p[slotKey];if(cur)dropWeapon(p,cur,true);
  p[slotKey]={key:best.key,mag:best.mag,res:best.res};scene.remove(best.mesh);G.drops.splice(G.drops.indexOf(best),1);switchTo(p,slotKey);p.slot=slotKey;showMsg(`Picked up ${def.name}`,1.5);return true;
}

function playerUpdate(p,dt){
  if(!p.alive)return[0,0,1];
  let fwd=0,str=0;
  if(mv.id!==null){const dx=mv.x-mv.ox,dy=mv.y-mv.oy,L=Math.hypot(dx,dy);if(L>6){const m=Math.min(L,50)/50;str=dx/L*m;fwd=-dy/L*m;}}
  if(keys.w||keys.arrowup)fwd+=1;if(keys.s||keys.arrowdown)fwd-=1;if(keys.d||keys.arrowright)str+=1;if(keys.a||keys.arrowleft)str-=1;
  const L=Math.hypot(fwd,str);if(L>1){fwd/=L;str/=L;}
  const cy=Math.cos(p.yaw),sy=Math.sin(p.yaw);
  let mx=cy*fwd-sy*str,mz=sy*fwd+cy*str;
  const run=keys.shift?WALK:1;
  p.crouch=crouchToggle||!!keys.control||!!keys.c;
  const usable=canPlant(p)||canDefuse(p);
  if(useHeld&&usable){startAct(p,canPlant(p)?'plant':'defuse');mx=mz=0;}else if(p.act)p.act=null;
  if(useEdge&&!usable)tryPickup(p);useEdge=false;
  if(jumpReq&&p.y<=p.ground+.01&&!p.act&&G.phase!=='freeze'){p.vy=5.6;p.y+=.001;crouchToggle=false;$('bCrouch').classList.remove('on');}jumpReq=false;
  const firing=fireIds.size>0||mouseDown;
  if(firing&&!desk()&&S.assist==='on'){
    let best=null,bd=.07;for(const o of G.ents){if(!o.alive||!foe(p,o))continue;const d=d2(p,o);if(d>70||!canSee(p,o))continue;
      const da=angDiff(p.yaw,Math.atan2(o.z-p.z,o.x-p.x));if(Math.abs(da)<bd){bd=Math.abs(da);best=da;}}
    if(best!==null)p.yaw+=best*Math.min(1,dt*4);
  }
  if(firing){const def=WPN[curKey(p)];if(def.auto||def.melee||!p.semiLock){if(tryFire(p)&&!def.auto&&!def.melee&&mouseDown)p.semiLock=true;}}
  if(!mouseDown)p.semiLock=false;
  return[mx,mz,run];
}
