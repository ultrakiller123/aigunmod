// ---------------- game state
const G={state:'menu',mode:'defuse',ents:[],player:null,bomb:{state:'none'},drops:[],nadesLive:[],clock:0,rt:0,phase:'freeze',score:{T:0,CT:0},streak:{T:0,CT:0},
  round:0,endT:0,spec:null,shake:0,planted:false,matchT:0,limit:0,winRounds:8};
let nextId=1;
const other=t=>t==='T'?'CT':'T';
const foe=(a,b)=>a!==b&&(G.mode==='ffa'||a.team!==b.team);
const alive=t=>G.ents.filter(e=>e.alive&&e.team===t);
const isDM=()=>G.mode!=='defuse';
function makeEnt(name,team,isPlayer){
  return{id:nextId++,name,team,isPlayer,variant:Math.random()*3|0,x:0,z:0,y:0,vy:0,vx:0,vz:0,yaw:0,pitch:0,hp:100,armor:0,helmet:false,kit:false,alive:true,
    primary:null,secondary:null,slot:'secondary',lastGun:'secondary',nades:{he:0,flash:0,smoke:0},nadeSel:null,fireCd:0,reloadT:0,spray:0,scoped:false,act:null,
    money:800,k:0,d:0,hsk:0,dmgDealt:0,roundKills:0,lastShot:-9,punch:0,crouch:false,crouchV:0,blindUntil:0,blindAmt:0,protectUntil:0,respawnAt:0,spawnT:0,diedAt:0,
    sk:DIFF.normal,target:null,seenFor:0,percT:Math.random()*.1,path:null,pathKey:'',repath:false,lookAt:null,lookUntil:0,strafeT:0,strafeDir:1,stopShoot:false,
    hunt:null,stuckT:0,lx:0,lz:0,nudge:null,route:null,holdSpot:null,holdLook:null,burst:0,burstCd:0,guard:null,spotT:0,model:null,aimHead:false,reAim:0,
    wantAct:null,moving:0,ground:0,stepAcc:0,nadeCd:0,lastKnown:null,roam:null,roamUntil:0,pusher:false,killer:null,hurtFrom:null};
}
function viewer(){
  if(G.state==='menu')return null;const p=G.player;if(p.alive)return p;
  if(isDM()||G.clock-p.diedAt<1.6)return null;
  if(!G.spec||!G.spec.alive){const mates=alive(p.team);G.spec=mates[0]||G.ents.find(e=>e.alive)||null;}
  return G.spec;
}
function curW(e){
  if(e.slot==='primary'&&e.primary)return e.primary;
  if(e.slot==='secondary'&&e.secondary)return e.secondary;
  if(e.slot==='grenade'&&e.nadeSel&&e.nades[e.nadeSel]>0)return NADEW[e.nadeSel];
  return KNIFE;
}
const curKey=e=>curW(e).key;
const nadeCount=e=>e.nades.he+e.nades.flash+e.nades.smoke;

// ---------------- match flow
function startMatch(){
  for(const e of G.ents)if(e.model)scene.remove(e.model);
  if(MAPID!==S.map)loadMap(S.map);
  buildWorld();
  G.ents=[];nextId=1;G.mode=S.mode;G.clock=0;G.bomb={state:'none'};
  G.drops.forEach(d=>scene.remove(d.mesh));G.drops=[];clearNades();SMOKES.length=0;resetPools();
  const names=shuffle(NAMES.slice()),side=S.side;
  const p=makeEnt('You',G.mode==='ffa'?pick(['T','CT']):side,true);G.player=p;G.ents.push(p);
  if(G.mode==='ffa'){const n=Math.max(1,S.foes+S.mates-1);for(let i=0;i<n;i++)G.ents.push(makeEnt(names.pop(),i%2?'T':'CT',false));}
  else{for(let i=1;i<S.mates;i++)G.ents.push(makeEnt(names.pop(),side,false));for(let i=0;i<S.foes;i++)G.ents.push(makeEnt(names.pop(),other(side),false));}
  for(const e of G.ents){e.alive=false;e.money=800;e.sk=DIFF[e.team===p.team&&G.mode!=='ffa'?S.diffA:S.diffE];if(!e.isPlayer)e.model=makeModel(e.team,e.variant);}
  G.score={T:0,CT:0};G.streak={T:0,CT:0};G.round=0;
  const L=LEN[S.len];G.winRounds=L.rounds;G.limit=G.mode==='ffa'?L.ffa:L.tdm;G.matchT=L.time;
  buildPips();
  if(G.mode==='defuse')newRound();
  else{G.phase='live';G.rt=FREEZE;for(const e of G.ents)spawnDM(e);showMsg(G.mode==='ffa'?`First to ${G.limit} kills`:`First team to ${G.limit} kills`,2.5);}
  G.state='play';
  $('menu').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('banner').hidden=true;$('feed').innerHTML='';
}
function resetEnt(e){
  e.alive=true;e.hp=100;e.act=null;e.reloadT=0;e.fireCd=.3;e.spray=0;e.scoped=false;e.y=0;e.vy=0;e.punch=0;e.vx=e.vz=0;
  e.crouch=false;e.crouchV=0;e.blindUntil=0;e.roundKills=0;e.hurtFrom=null;e.killer=null;
  e.target=null;e.path=null;e.pathKey='';e.hunt=null;e.route=null;e.guard=null;e.lookAt=null;e.wantAct=null;e.seenFor=0;e.roam=null;e.lastKnown=null;
  if(e.model){e.model.visible=true;e.model.rotation.set(0,0,0);e.model.userData.dead=null;}
}
function applyLoadout(e,kind){
  const lo=loadoutFor(e.team,kind);
  e.primary=lo.primary?gun(lo.primary):null;e.secondary=lo.secondary?gun(lo.secondary):null;
  e.armor=100;e.helmet=true;e.kit=e.team==='CT';
  if(S.nades==='on'&&kind!=='knives')e.nades={he:1,flash:1,smoke:1};else e.nades={he:0,flash:0,smoke:0};
  e.slot=e.primary?'primary':e.secondary?'secondary':'knife';e.lastGun=e.slot;
}
function spawnFacing(x,z){return Math.atan2(WH/2-z,WW/2-x);}
function newRound(){
  G.round++;G.rt=0;G.phase='freeze';G.planted=false;G.spec=null;
  G.drops.forEach(d=>scene.remove(d.mesh));G.drops=[];clearNades();SMOKES.length=0;
  for(const p of pools.smoke)p.s.visible=false;
  const sp={T:shuffle(SPAWN.T.slice()),CT:shuffle(SPAWN.CT.slice())};
  for(const e of G.ents){
    const survived=e.alive&&G.round>1;
    resetEnt(e);
    if(S.loadout!=='buy')applyLoadout(e,S.loadout);
    else if(!survived){e.primary=null;e.secondary=gun(e.team==='T'?'glock':'usp');e.armor=0;e.helmet=false;e.kit=false;e.nades={he:0,flash:0,smoke:0};}
    if(!e.secondary&&S.loadout==='buy')e.secondary=gun(e.team==='T'?'glock':'usp');
    e.slot=e.primary?'primary':e.secondary?'secondary':'knife';e.lastGun=e.slot;
    const s=sp[e.team].pop()||pick(SPAWN[e.team]);e.x=tc(s[0])+rnd(-.4,.4);e.z=tc(s[1])+rnd(-.4,.4);
    e.yaw=spawnFacing(e.x,e.z);e.pitch=0;
  }
  const Ts=G.ents.filter(e=>e.team==='T');
  const carrier=G.player.team==='T'&&(Ts.length===1||Math.random()<.4)?G.player:pick(Ts);
  if(carrier!==G.player&&G.player.team==='T')setTimeout(()=>showMsg(`${carrier.name} has the bomb`,2.5),2100);
  G.bomb={state:'carried',carrier,x:0,z:0,timer:0,beep:0,site:null};
  G.siteTarget=Math.random()<.5?'A':'B';
  const st=STYLE[S.style];G.tGo=FREEZE+rnd(st.wait[0],st.wait[1]);
  const areas=shuffle(['A','B','M','A','B']);let ai=0;const used={A:0,B:0,M:0};
  for(const e of G.ents){
    if(e.team==='CT'&&!e.isPlayer){const ar=areas[ai++%areas.length],h=HOLDS[ar][used[ar]++%HOLDS[ar].length];
      e.area=ar;e.holdSpot={x:tc(h[0]),z:tc(h[1])};e.holdLook={x:tc(h[2]),z:tc(h[3])};e.pusher=Math.random()<st.push;}
    if(!e.isPlayer&&S.loadout==='buy')botBuy(e);
  }
  $('banner').hidden=true;closeBuy();
  showMsg(`Round ${G.round}`,2);
}
function spawnDM(e){
  resetEnt(e);
  applyLoadout(e,S.loadout==='buy'?'dm':S.loadout);
  if(e.isPlayer&&S.loadout==='buy'&&e.prefPrimary){e.primary=gun(e.prefPrimary);e.slot='primary';}
  let best=null,bs=-1;
  for(let i=0;i<24;i++){const t=pick(FLOOR),x=tc(t[0]),z=tc(t[1]);let md=60,seen=false;
    for(const o of G.ents){if(!o.alive||o===e||!foe(e,o))continue;const d=Math.hypot(o.x-x,o.z-z);md=Math.min(md,d);if(d<45&&los(x,z,o.x,o.z))seen=true;}
    const sc=md-(seen?40:0);if(sc>bs){bs=sc;best=[x,z];}}
  e.x=best[0];e.z=best[1];e.yaw=spawnFacing(e.x,e.z);e.pitch=0;
  e.protectUntil=G.clock+1.6;e.spawnT=G.clock;
}
function endRound(winner,reason){
  if(G.phase==='end')return;G.phase='end';G.endT=5;
  const loser=other(winner);G.score[winner]++;G.streak[winner]=0;G.streak[loser]=Math.min(5,G.streak[loser]+1);
  for(const e of G.ents){
    if(e.team===winner)e.money+=reason==='bomb'?3500:3250;
    else e.money+=1400+500*(G.streak[loser]-1)+(loser==='T'&&G.planted?800:0);
    e.money=Math.min(16000,e.money);
  }
  const R={elim:'Enemy team eliminated',bomb:'The bomb exploded',defuse:'The bomb was defused',time:'Time ran out'};
  $('bnT').textContent=winner==='T'?'Terrorists win':'Counter-Terrorists win';
  $('bnT').className='c'+winner;$('bnS').textContent=R[reason];
  const mvp=G.ents.filter(e=>e.team===winner).sort((a,b)=>b.roundKills-a.roundKills)[0];
  $('bnM').textContent=mvp&&mvp.roundKills?`MVP: ${mvp.name} · ${mvp.roundKills} kill${mvp.roundKills>1?'s':''}`:'';
  $('banner').hidden=false;
  tone(winner===G.player.team?660:220,.6,.25,'triangle');
  closeBuy();
}
function checkElim(){
  if(G.mode!=='defuse'||G.phase==='end')return;
  const t=alive('T').length,c=alive('CT').length;
  if(c===0)endRound('T','elim');
  else if(t===0&&G.bomb.state!=='planted')endRound('CT','elim');
}
function dmLeader(){return G.ents.slice().sort((a,b)=>b.k-a.k)[0];}
function checkDMEnd(){
  if(!isDM())return;
  let done=G.matchT<=0;
  if(G.mode==='ffa')done=done||dmLeader().k>=G.limit;else done=done||G.score.T>=G.limit||G.score.CT>=G.limit;
  if(done)matchOver();
}
function matchOver(){
  G.state='over';$('hud').hidden=true;exitLock();closeBuy();
  let title;
  if(G.mode==='ffa'){const l=dmLeader();title=l===G.player?'Victory <small>You topped the board</small>':`Defeat <small>${l.name} won with ${l.k}</small>`;}
  else{const win=G.score.T>G.score.CT?'T':G.score.CT>G.score.T?'CT':null,me=win===G.player.team;
    title=`${win?me?'Victory':'Defeat':'Draw'} <small class="c${win||'FFA'}">${G.score.T} : ${G.score.CT}</small>`;}
  $('overT').innerHTML=title;$('overBoard').innerHTML=boardHTML();$('over').hidden=false;
}

// ---------------- economy
function give(e,key){const def=WPN[key];
  if(def.nade){e.nades[key]=Math.min(def.max,e.nades[key]+1);return;}
  if(def.slot==='primary'){if(e.primary&&e.alive&&!isDM())dropWeapon(e,e.primary);e.primary=gun(key);e.slot='primary';}
  else{e.secondary=gun(key);if(e.slot!=='primary'||!e.primary)e.slot='secondary';}
  e.lastGun=e.slot;e.reloadT=0;
}
function botBuy(b){
  const T=b.team==='T',st=STYLE[S.style];
  if(!b.primary){
    const m=b.money;
    if(m>=5750&&Math.random()<.2){give(b,'awp');b.money-=4750;}
    else if(m>=(T?3700:4100)){const k=Math.random()<.15?(T?'sg553':'aug'):(T?'ak':'m4');give(b,k);b.money-=WPN[k].price;}
    else if(m>=(T?2800:3050)&&Math.random()<.7){const k=T?'galil':'famas';give(b,k);b.money-=WPN[k].price;}
    else if(m>=2700&&Math.random()<.15){give(b,'ssg08');b.money-=1700;}
    else if(m>=2100&&Math.random()<.55*st.hunt){const k=pick([T?'mac10':'mp9','ump','nova',m>=3350?'p90':'ump',m>=3000?'xm1014':'nova']);give(b,k);b.money-=WPN[k].price;}
  }
  if(b.armor<50&&b.money>=1000){b.armor=100;b.helmet=true;b.money-=1000;}
  else if(b.armor<50&&b.money>=650){b.armor=100;b.money-=650;}
  if(b.team==='CT'&&!b.kit&&b.money>=400&&Math.random()<.6){b.kit=true;b.money-=400;}
  if(!b.primary&&b.money>=500&&b.secondary&&['glock','usp','p250'].includes(b.secondary.key)&&Math.random()<.5){const k=pick(['deagle',T?'tec9':'fiveseven','p250']);if(b.money>=WPN[k].price){give(b,k);b.money-=WPN[k].price;}}
  if(S.nades==='on')for(const k of shuffle(['flash','smoke','he','flash'])){if(b.money>=WPN[k].price+200&&b.nades[k]<WPN[k].max&&Math.random()<.6){give(b,k);b.money-=WPN[k].price;}}
}
const SHOP=[
  ['Pistols',['glock','usp','p250','tec9','fiveseven','deagle']],
  ['SMGs',['mac10','mp9','ump','p90']],
  ['Heavy',['nova','xm1014','negev']],
  ['Rifles',['galil','famas','ak','m4','sg553','aug']],
  ['Snipers',['ssg08','awp']],
  ['Gear',['kevlar','armor','kit']],
  ['Grenades',['he','flash','smoke']],
];
function canBuy(){const p=G.player;if(G.state!=='play'||!p.alive)return false;
  if(isDM())return S.loadout==='buy'&&G.clock-p.spawnT<12;
  return S.loadout==='buy'&&G.phase!=='end'&&G.rt<BUY_TIME;}
function priceOf(k){return isDM()?0:(WPN[k]||GEAR[k]).price;}
function openBuy(){if(!canBuy())return;renderBuy();$('buy').hidden=false;exitLock();}
function closeBuy(){$('buy').hidden=true;}
function owns(p,k){if(WPN[k]&&WPN[k].nade)return p.nades[k]>=WPN[k].max||nadeCount(p)>=4;
  return(p.primary&&p.primary.key===k)||(p.secondary&&p.secondary.key===k)||(k==='armor'&&p.armor>=100&&p.helmet)||(k==='kevlar'&&p.armor>=100)||(k==='kit'&&p.kit);}
function renderBuy(){
  const p=G.player;$('buyMoney').textContent=isDM()?'Free in deathmatch':'$'+p.money;let h='';
  for(const[cat,items]of SHOP){
    if(isDM()&&cat==='Gear')continue;if(cat==='Grenades'&&S.nades!=='on')continue;
    h+=`<div class="bcat">${cat}</div><div class="bgrid">`;
    for(const k of items){const d=WPN[k]||GEAR[k];if(d.team&&d.team!==p.team&&G.mode!=='ffa')continue;
      const own=owns(p,k),pr=priceOf(k);
      h+=`<button class="item${own?' own':''}" data-k="${k}" ${own||p.money<pr?'disabled':''}><span>${d.name}</span><i>${pr?'$'+pr:'Free'}</i></button>`;}
    h+='</div>';}
  $('buyList').innerHTML=h;
}
function buyItem(k){
  if(!canBuy())return;const p=G.player,pr=priceOf(k);if(p.money<pr||owns(p,k))return;p.money-=pr;
  if(k==='armor'){p.armor=100;p.helmet=true;}else if(k==='kevlar')p.armor=100;else if(k==='kit')p.kit=true;
  else{give(p,k);if(isDM()&&WPN[k].slot==='primary')p.prefPrimary=k;}
  tone(880,.08,.15,'square');renderBuy();
}
function dropWeapon(e,w,thrown){
  const m=gunMesh(w.key);const a=e.yaw,dist=thrown?1.6:.3;
  m.position.set(e.x+Math.cos(a)*dist+rnd(-.3,.3),.05,e.z+Math.sin(a)*dist+rnd(-.3,.3));m.rotation.set(0,rnd(0,TAU),PI/2);m.scale.setScalar(1.15);scene.add(m);
  G.drops.push({key:w.key,mag:w.mag,res:w.res,x:m.position.x,z:m.position.z,mesh:m,t:G.clock});
  if(G.drops.length>16){const d=G.drops.shift();scene.remove(d.mesh);}
}
