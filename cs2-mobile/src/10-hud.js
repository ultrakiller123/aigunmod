// ---------------- radar
const rc=$('radar'),rg=rc.getContext('2d');let radarBg=null,RS=6;
function drawMiniMap(g,def,gridArr,px,showLetters){
  const w=def.w,h=def.h;g.clearRect(0,0,w*px,h*px);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=gridArr[y*w+x];if(v===1)continue;
    let site=false;for(const k in def.sites){const[a,b,sw,sh]=def.sites[k];if(x>=a&&x<a+sw&&y>=b&&y<b+sh)site=true;}
    g.fillStyle=v!==0?'rgba(150,130,100,.6)':site?'rgba(220,120,90,.5)':'rgba(225,212,180,.38)';g.fillRect(x*px,y*px,px,px);}
  if(showLetters){g.fillStyle='rgba(255,255,255,.8)';g.font=`700 ${px*3}px sans-serif`;g.textAlign='center';g.textBaseline='middle';
    for(const k in def.sites){const[a,b,sw,sh]=def.sites[k];g.fillText(k,(a+sw/2)*px,(b+sh/2)*px);}}
}
function buildRadar(){RS=Math.floor(300/MW);rc.width=MW*RS;rc.height=MH*RS;rc.style.height=(150*MH/MW)+'px';document.documentElement.style.setProperty('--rh',(150*MH/MW)+'px');
  radarBg=document.createElement('canvas');radarBg.width=rc.width;radarBg.height=rc.height;drawMiniMap(radarBg.getContext('2d'),MAP,grid,RS,true);}
function drawRadar(){
  const p=G.player,v=viewer()||p,sc=RS/TILE;
  rg.clearRect(0,0,rc.width,rc.height);rg.drawImage(radarBg,0,0);
  for(const s of SMOKES)if(G.clock<s.t1){rg.fillStyle='rgba(200,200,200,.5)';rg.beginPath();rg.arc(s.x*sc,s.z*sc,s.r*sc,0,TAU);rg.fill();}
  const dot=(e,col,r=4)=>{rg.fillStyle=col;rg.beginPath();rg.arc(e.x*sc,e.z*sc,r,0,TAU);rg.fill();};
  for(const e of G.ents){if(!e.alive)continue;
    if(e===v||e===p||(!foe(p,e)&&!ffaLike())){dot(e,e===p?'#ffffff':e.team==='T'?'#e3a23b':'#62a6ea',e===v?5:4);
      if(e===v){rg.strokeStyle='#fff';rg.lineWidth=2;rg.beginPath();rg.moveTo(e.x*sc,e.z*sc);rg.lineTo(e.x*sc+Math.cos(e.yaw)*14,e.z*sc+Math.sin(e.yaw)*14);rg.stroke();}}
    else if(e.spotT>G.clock)dot(e,'#e5534b');}
  const b=G.bomb;if(b.state==='planted'||(b.state==='dropped'&&p.team==='T')){rg.fillStyle=(G.clock*4|0)%2?'#ff4030':'#fff';rg.fillRect(b.x*sc-4,b.z*sc-4,8,8);}
}

// ---------------- HUD
const txt={};function setT(id,v){if(txt[id]!==v){txt[id]=v;$(id).textContent=v;}}
function buildPips(){for(const t of['T','CT']){const el=$('pipsT'.replace('T',t));el.innerHTML='';if(!isRounds())continue;
  G.ents.filter(e=>e.team===t).forEach(()=>el.insertAdjacentHTML('beforeend','<i class="pip"></i>'));}
  buildRadar();for(const k in txt)delete txt[k];}
function deathReport(p){const k=p.killer;if(!k)return'Killed by the bomb';
  const a=G.dmgLog[p.id+'>'+k.id]||{d:0,h:0},b=G.dmgLog[k.id+'>'+p.id]||{d:0,h:0};
  return`Killed by ${k.name}${WPN[p.killWk]?' · '+shortName(p.killWk):''}${k.alive?` · ${Math.ceil(k.hp)} HP left`:''}\nYou dealt ${Math.round(a.d)} in ${a.h} hit${a.h===1?'':'s'} · took ${Math.round(b.d)} in ${b.h} hit${b.h===1?'':'s'}`;}
function radio(e,text){if(!G.player||G.state!=='play')return;const el=$('radio'),d=document.createElement('div');
  d.innerHTML=`<b class="c${e?e.team:'FFA'}">${e?e.name:'Radio'}</b>: ${text}`;el.appendChild(d);while(el.children.length>4)el.firstChild.remove();setTimeout(()=>d.remove(),6500);tone(1500,.04,.05,'square');}
function radioClear(){$('radio').innerHTML='';}
function styleXh(el,extra){
  const x=S.xh,[u,d,l,r,dot]=el.children,L=x.size,T=x.thick,gap=x.gap+extra,sh=x.outline?'0 0 0 1px rgba(0,0,0,.75)':'none';
  for(const i of el.children)Object.assign(i.style,{background:x.color,boxShadow:sh,border:'none',borderRadius:'0',display:'block',position:'absolute'});
  const lines=x.style==='classic'||x.style==='cross';
  Object.assign(u.style,{width:T+'px',height:L+'px',left:-T/2+'px',top:(-gap-L)+'px',display:lines&&x.style!=='cross'?'block':'none'});
  Object.assign(d.style,{width:T+'px',height:L+'px',left:-T/2+'px',top:gap+'px',display:lines?'block':'none'});
  Object.assign(l.style,{width:L+'px',height:T+'px',top:-T/2+'px',left:(-gap-L)+'px',display:lines?'block':'none'});
  Object.assign(r.style,{width:L+'px',height:T+'px',top:-T/2+'px',left:gap+'px',display:lines?'block':'none'});
  if(x.style==='circle'){const R=gap+L/2;Object.assign(dot.style,{width:R*2+'px',height:R*2+'px',left:-R+'px',top:-R+'px',background:'none',border:`${T}px solid ${x.color}`,borderRadius:'50%',boxSizing:'border-box'});}
  else{const ds=x.style==='dot'?T+3:Math.max(2,T);Object.assign(dot.style,{width:ds+'px',height:ds+'px',left:-ds/2+'px',top:-ds/2+'px',borderRadius:x.style==='dot'?'50%':'0',display:x.dot||x.style==='dot'?'block':'none'});}
}
let msgT=0;function showMsg(s,d){$('msg').textContent=s;msgT=d;}
let noticeT=0;function notice(s,col){if(!s)return;const n=$('notice');n.textContent=s;n.style.color=col||'';n.style.opacity=1;noticeT=1.6;}
function feedPush(k,v,wk,hs){
  const div=document.createElement('div');if(k===G.player||v===G.player)div.className='me';
  const tc_=e=>ffaLike()&&e!==G.player?'FFA':e.team;
  const nm=e=>`<span class="c${tc_(e)}">${e.name}</span>`;
  div.innerHTML=(k&&k!==v?nm(k):'')+`<span class="w">${wk==='bomb'?'BOMB':shortName(wk)}</span>`+(hs?'<span class="hs">HS</span>':'')+nm(v);
  const f=$('feed');f.appendChild(div);while(f.children.length>5)f.firstChild.remove();setTimeout(()=>div.remove(),6000);
}
function boardHTML(){
  const row=e=>{const hsP=e.k?Math.round(e.hsk/e.k*100):0,adr=Math.round(e.dmgDealt/Math.max(1,G.round||1));
    return`<tr class="${e.isPlayer?'me':''} ${e.alive?'':'dead'}"><td>${e.name}</td><td>${e.k}</td><td>${e.d}</td><td>${hsP}%</td>${isDM()?'':`<td>${adr}</td><td>$${e.money}</td>`}</tr>`;};
  const head=`<tr><th>Player</th><th>K</th><th>D</th><th>HS</th>${isDM()?'':'<th>ADR</th><th>$</th>'}</tr>`;
  if(ffaLike())return'<table>'+head+G.ents.slice().sort((a,b)=>b.k-a.k).map(row).join('')+'</table>';
  let h='<table>'+head;
  for(const t of['CT','T']){h+=`<tr><td colspan="6" class="c${t}" style="padding-top:10px;font-family:var(--f-hud)">${t==='T'?'Terrorists':'Counter-Terrorists'} · ${G.score[t]}</td></tr>`;
    h+=G.ents.filter(e=>e.team===t).sort((a,b)=>b.k-a.k).map(row).join('');}
  return h+'</table>';
}
const fmt=s=>{s=Math.max(0,Math.ceil(s));return(s/60|0)+':'+String(s%60).padStart(2,'0');};
let fpsAcc=0,fpsN=0,fpsT=0;
function hud(dt){
  const p=G.player,v=viewer()||p;
  // spot enemies the player can see for the radar
  if(p.alive)for(const o of G.ents){if(!o.alive||!foe(p,o))continue;const da=Math.abs(angDiff(p.yaw,Math.atan2(o.z-p.z,o.x-p.x)));if(da<.9&&d2(p,o)<90&&canSee(p,o))o.spotT=G.clock+.3;}
  const ck=$('clock');
  if(G.mode==='horde'){const left=G.ents.filter(e=>e.zombie&&e.alive).length+Math.max(0,G.toSpawn);
    setT('scT',String(G.wave));setT('scCT',String(left));setT('lblL','Wave');setT('lblR','Infected');$('scT').classList.add('me');
    setT('clock',G.waveState==='break'?fmt(G.waveT):'—');ck.className=G.waveState==='break'?'freeze':'';}
  else if(G.mode==='aim'){setT('scT',String(G.aimScore));setT('scCT',(G.shots?Math.round(G.hits/G.shots*100):0)+'%');setT('lblL','Score');setT('lblR','Accuracy');$('scT').classList.add('me');setT('clock',fmt(G.aimT));ck.className='';}
  else if(isRounds()){
    setT('scT',String(G.score.T));setT('scCT',String(G.score.CT));setT('lblL','');setT('lblR','');$('scT').classList.remove('me');
    if(G.bomb.state==='planted'&&G.phase!=='end'){setT('clock','BOMB '+Math.ceil(G.bomb.timer));ck.className='bomb';}
    else if(G.phase==='freeze'){setT('clock',fmt(FREEZE-G.rt));ck.className='freeze';}
    else{setT('clock',fmt(G.phase==='end'?0:ROUND_TIME-(G.rt-FREEZE)));ck.className='';}
    for(const t of['T','CT']){const list=G.ents.filter(e=>e.team===t),pips=$('pips'+t).children;list.forEach((e,i)=>pips[i]&&pips[i].classList.toggle('dead',!e.alive));}
  }else{
    setT('clock',fmt(G.matchT));ck.className='';
    if(G.mode==='tdm'){setT('scT',String(G.score.T));setT('scCT',String(G.score.CT));setT('lblL','T kills');setT('lblR','CT kills');$('scT').classList.remove('me');}
    else if(G.mode==='arms'){const l=G.ents.slice().sort((a,b)=>b.arLevel-a.arLevel)[0];setT('scT',String(p.arLevel+1));setT('scCT',String(l.arLevel+1));setT('lblL','Your level');setT('lblR',l===p?'Leader: you':'Leader '+l.name);$('scT').classList.add('me');}
    else{const l=dmLeader();setT('scT',String(p.k));setT('scCT',String(l.k));setT('lblL','You');setT('lblR',l===p?'Leader: you':'Leader');$('scT').classList.add('me');}
  }
  setT('hpv',String(Math.ceil(v.hp)));$('hpv').classList.toggle('low',v.hp<30);setT('arv',String(Math.ceil(v.armor)));
  const kl=isDM()||G.mode==='aim'||G.mode==='retake';setT('mnv',kl?String(G.mode==='aim'?G.aimKills:p.k):'$'+p.money);setT('mnl',kl?'Kills':'Money');
  const w=curW(v),def=WPN[w.key];
  setT('amv',def.melee?'—':def.nade?String(v.nades[w.key]):String(w.mag));setT('rsv',def.melee||def.nade?'':' / '+w.res);
  const it=v===p&&!def.nade?equippedFor(w.key):null;
  setT('wnv',(it?(it.st?'StatTrak™ ':'')+def.name+' | '+SKINS[it.skin].name+(it.st?' · '+it.kills:'')+' · '+ABIL[SKINS[it.skin].ab].name:def.name)+(v.reloadT>0?' · reloading':''));
  setT('loc',locationName(v.x,v.z));
  setT('nades',NADES.filter(k=>v.nades[k]>0).map(k=>`${WPN[k].short}${v.nades[k]>1?'×'+v.nades[k]:''}`).join(' · '));
  setT('bSwitch',shortName(curKey(p)));
  $('bScope').hidden=!(p.alive&&WPN[curKey(p)].zoom);$('bScope').classList.toggle('on',p.scoped);
  $('bNade').hidden=!(p.alive&&nadeCount(p));
  const zoom=v.scoped?WPN[curKey(v)].zoom:0;
  $('scope').hidden=!(zoom&&zoom<.4);$('reddot').hidden=!(zoom&&zoom>=.4);
  const usable=canPlant(p)||canDefuse(p);$('bUse').hidden=!usable;setT('bUse',canPlant(p)?'Plant':'Defuse');
  $('bBuy').hidden=!canBuy();
  const xs=$('xh');xs.hidden=!!zoom||!v.alive;
  if(!xs.hidden)styleXh(xs,S.xh.dynamic?Math.min(40,spreadOf(v)*innerHeight*.9):0);
  $('vig').hidden=S.vignette!=='on';
  const hm=$('hitm');if(hm._t&&G.clock-hm._t>.12)hm.style.opacity=0;
  const di=$('dmg');
  if(v.hurtFrom&&G.clock-v.hurtFrom.t<1){const a=angDiff(v.yaw,Math.atan2(v.hurtFrom.z-v.z,v.hurtFrom.x-v.x));
    if(!di.firstChild)di.innerHTML='<i></i>';di.firstChild.style.transform=`rotate(${a}rad) translateY(-90px)`;di.style.opacity=1-(G.clock-v.hurtFrom.t);
    $('flash').style.opacity=Math.max(0,.8-(G.clock-v.hurtFrom.t)*1.6);}else{di.style.opacity=0;$('flash').style.opacity=0;}
  const bl=v.blindUntil-G.clock;$('flashW').style.opacity=bl>0?clamp(bl/1.2,0,1)*Math.min(1,v.blindAmt*1.3+.2):0;
  const act=v.act;$('prog').hidden=!act;if(act)$('prog').firstChild.style.width=(act.t/act.need*100)+'%';
  if(msgT>0){msgT-=dt;if(msgT<=0)$('msg').textContent='';}
  if(act&&v===p)$('msg').textContent=act.type==='plant'?'Planting the bomb':'Defusing'+(p.kit?' (kit)':'');
  if(noticeT>0){noticeT-=dt;if(noticeT<=0)$('notice').style.opacity=0;}
  const sp=$('spec');
  if(!p.alive&&(G.phase!=='end'||isDM())){sp.hidden=false;
    if(isDM())setT('spec',`Killed by ${p.killer?p.killer.name:'the bomb'} · respawning in ${Math.max(0,p.respawnAt-G.clock).toFixed(1)}s`);
    else setT('spec',deathReport(p)+(v&&v!==p?`\nSpectating ${v.name} · tap to switch`:''));}
  else if(p.alive&&G.clock<p.protectUntil){sp.hidden=false;setT('spec','Spawn protection');}
  else sp.hidden=true;
  if(!$('buy').hidden){if(!canBuy())closeBuy();}
  fpsAcc+=dt;fpsN++;fpsT-=dt;if(fpsT<=0){fpsT=.5;setT('fps',Math.round(fpsN/fpsAcc)+' fps');fpsAcc=0;fpsN=0;}
  $('fps').hidden=S.fps!=='on';
  drawRadar();
}

// ---------------- menu
const DESC={gfx:{low:'Lower resolution, no shadows, simple surfaces. Best for older phones.',med:'Sharper textures without shadows. A good default on phones.',high:'Real-time sun shadows, bump-mapped walls and full resolution.'}};
function buildMapCards(){
  const el=$('maps');el.innerHTML='';
  for(const id in MAPS){const d=MAPS[id],b=document.createElement('button');b.className='mapc';b.dataset.map=id;
    const c=document.createElement('canvas');const px=4;c.width=d.w*px;c.height=d.h*px;drawMiniMap(c.getContext('2d'),d,buildGrid(d),px,true);
    b.appendChild(c);b.insertAdjacentHTML('beforeend',`<b>${d.name}</b><span>${d.desc}</span>`);
    b.addEventListener('click',()=>{S.map=id;saveS();syncMenu();previewMap();});el.appendChild(b);}
}
function syncMenu(){
  const sel=(id,val)=>$(id).querySelectorAll('button').forEach(b=>b.classList.toggle('sel',b.dataset.v===String(val)));
  sel('optMode',S.mode);sel('optSide',S.side);sel('optMates',S.mates);sel('optFoes',S.foes);sel('optLen',S.len);
  sel('optDiffE',S.diffE);sel('optDiffA',S.diffA);sel('optStyle',S.style);sel('optLoadout',S.loadout);sel('optNades',S.nades);
  sel('optGfx',S.gfx);sel('optAssist',S.assist);sel('optFps',S.fps);
  document.querySelectorAll('.mapc').forEach(b=>b.classList.toggle('sel',b.dataset.map===S.map));
  document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('sel',b.dataset.preset===`${S.mates},${S.foes}`));
  $('optSens').value=S.sens;$('optFov').value=S.fov;$('optVol').value=S.vol;
  $('rvSens').textContent=S.sens;$('rvFov').textContent=S.fov+'°';$('rvVol').textContent=S.vol*10+'%';
  const ffa=S.mode==='ffa'||S.mode==='arms',L=LEN[S.len],solo=S.mode==='aim',hd=S.mode==='horde';
  $('rowSide').hidden=ffa||solo||hd;$('rowPreset').hidden=ffa||solo||hd;$('rowMates').hidden=ffa||solo;$('lblFoes').textContent=ffa?'Bots':'Enemies';
  $('optFoes').closest('.row').hidden=solo||hd;$('optLen').closest('.row').hidden=solo||hd;
  $('modeDesc').textContent=MODE_DESC[S.mode]||'';sel('optTod',S.tod);sel('optDyn',S.dynres);sel('optMusic',S.music);$('optBtn').value=Math.round(S.btnScale*100);$('rvBtn').textContent=Math.round(S.btnScale*100)+'%';applyLayout();
  $('lenDesc').textContent=S.mode==='defuse'?`First to ${L.rounds} rounds`:S.mode==='arms'?`Climb ${AR.length} weapons or ${L.time/60} min`:S.mode==='ffa'?`${L.ffa} kills or ${L.time/60} min`:`${L.tdm} team kills or ${L.time/60} min`;
  $('diffDesc').textContent=`Enemies: ${DIFF[S.diffE].label}`;
  $('gfxDesc').textContent=DESC.gfx[S.gfx];
  $('rot').hidden=!(isTouch&&innerHeight>innerWidth);
  sel('optVig',S.vignette);sel('xhStyle',S.xh.style);sel('xhColor',S.xh.color);
  document.querySelectorAll('#xhFlags button').forEach(b=>b.classList.toggle('sel',!!S.xh[b.dataset.f]));
  $('xhSize').value=S.xh.size;$('xhGap').value=S.xh.gap;$('xhThick').value=S.xh.thick;$('rvXhSize').textContent=S.xh.size;$('rvXhGap').textContent=S.xh.gap;$('rvXhThick').textContent=S.xh.thick;
  styleXh($('xhPrevIn'),0);renderRank();renderInv();
}
const MODE_DESC={defuse:'Plant or defuse the bomb. Buy between rounds.',retake:'The bomb is already planted. CTs retake the site, Ts hold it. Random loadouts each round.',
  tdm:'Two teams, instant respawns, free weapons.',ffa:'Everyone for themselves, instant respawns.',arms:'Every kill gives you the next gun. Finish with a knife kill.',
  horde:'Hold out with your squad against endless waves of infected. Buy between waves.',aim:'Sixty seconds of pop-up targets. Score, accuracy and kill speed are tracked.'};
for(const[id,k]of[['optTod','tod'],['optDyn','dynres'],['optMusic','music']])$(id).addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;S[k]=b.dataset.v;saveS();syncMenu();
  if(k==='tod')previewMap();if(k==='music'){if(S.music==='on'){audioInit();musicStart();}else musicStop();}});
$('optBtn').addEventListener('input',e=>{S.btnScale=+e.target.value/100;saveS();syncMenu();});
// touch layout editor
const EDITABLE=['bFire','bFireL','bReload','bSwitch','bScope','bJump','bCrouch','bNade','bUse','bBuy'];
function applyLayout(){document.documentElement.style.setProperty('--bs',S.btnScale);
  for(const id of EDITABLE){const el=$(id),L=S.layout[id];if(L){Object.assign(el.style,{left:L[0]*100+'vw',top:L[1]*100+'vh',right:'auto',bottom:'auto'});}else Object.assign(el.style,{left:'',top:'',right:'',bottom:''});}}
let editing=false,drag=null,savedHidden={},wasDesk=false;
function startEdit(){editing=true;wasDesk=desk();setDesk(false);document.body.classList.add('editing');$('menu').hidden=true;$('hud').hidden=false;$('editBar').hidden=false;
  for(const id of EDITABLE){savedHidden[id]=$(id).hidden;$(id).hidden=false;}$('bPause').hidden=true;}
function endEdit(){editing=false;setDesk(wasDesk);document.body.classList.remove('editing');$('hud').hidden=true;$('editBar').hidden=true;$('menu').hidden=false;
  for(const id of EDITABLE)$(id).hidden=savedHidden[id];$('bPause').hidden=false;saveS();}
$('bEditLayout').addEventListener('click',startEdit);$('bEditDone').addEventListener('click',endEdit);$('bEditReset').addEventListener('click',()=>{S.layout={};applyLayout();});
$('hud').addEventListener('pointerdown',ev=>{if(!editing)return;ev.stopPropagation();ev.preventDefault();const b=ev.target.closest('.btn');if(!b||!EDITABLE.includes(b.id))return;
  const r=b.getBoundingClientRect(),sc=S.btnScale,w=r.width/sc,h=r.height/sc;drag={el:b,dx:ev.clientX-r.left-(r.width-w)/2,dy:ev.clientY-r.top-(r.height-h)/2};},true);
addEventListener('pointermove',ev=>{if(!drag)return;S.layout[drag.el.id]=[clamp((ev.clientX-drag.dx)/innerWidth,0,.96),clamp((ev.clientY-drag.dy)/innerHeight,0,.94)];applyLayout();});
addEventListener('pointerup',()=>{drag=null;});
document.addEventListener('pointerdown',()=>{if(G.state==='menu'&&S.music==='on'&&!editing){audioInit();musicStart();}},{once:false});
$('xhPrevIn').innerHTML='<i></i><i></i><i></i><i></i><i></i>';
$('optVig').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;S.vignette=b.dataset.v;saveS();syncMenu();});
for(const[id,k]of[['xhStyle','style'],['xhColor','color']])$(id).addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;S.xh[k]=b.dataset.v;saveS();syncMenu();});
$('xhFlags').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;S.xh[b.dataset.f]=!S.xh[b.dataset.f];saveS();syncMenu();});
for(const[id,k]of[['xhSize','size'],['xhGap','gap'],['xhThick','thick']])$(id).addEventListener('input',e=>{S.xh[k]=+e.target.value;saveS();syncMenu();});
// ---------------- rank, inventory, cases
function renderRank(){const r=rankOf(INV.xp);$('rankCard').innerHTML=`<b>${r.name}</b><div class="bar"><i style="width:${Math.round(r.prog*100)}%"></i></div>${r.n>=RANKS.length-1?'Max rank':`${r.need} XP to ${RANKS[r.n+1]}`} · ${INV.matches} matches`;}
for(const[id,key,num]of[['optMode','mode'],['optSide','side'],['optMates','mates',1],['optFoes','foes',1],['optLen','len'],['optDiffE','diffE'],['optDiffA','diffA'],
  ['optStyle','style'],['optLoadout','loadout'],['optNades','nades'],['optGfx','gfx'],['optAssist','assist'],['optFps','fps']])
  $(id).addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;S[key]=num?+b.dataset.v:b.dataset.v;saveS();syncMenu();if(key==='gfx')previewMap();});
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const[m,f]=b.dataset.preset.split(',').map(Number);S.mates=m;S.foes=f;saveS();syncMenu();}));
for(const[id,key]of[['optSens','sens'],['optFov','fov'],['optVol','vol']])$(id).addEventListener('input',e=>{S[key]=+e.target.value;saveS();syncMenu();setVolume();});
document.querySelectorAll('.tabs button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.tabs button').forEach(x=>x.classList.toggle('sel',x===b));
  document.querySelectorAll('[data-pane]').forEach(p=>p.hidden=p.dataset.pane!==b.dataset.tab);}));
let previewTimer=0;
function previewMap(){clearTimeout(previewTimer);previewTimer=setTimeout(()=>{if(G.state!=='menu')return;if(MAPID!==S.map)loadMap(S.map);buildWorld();},60);}
function begin(){audioInit();startMatch();
  if(isTouch&&document.documentElement.requestFullscreen){try{const r=document.documentElement.requestFullscreen();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
  if(navigator.wakeLock&&navigator.wakeLock.request)navigator.wakeLock.request('screen').catch(()=>{});
  if(desk())requestLock();}
$('bStart').addEventListener('click',begin);
$('bAgain').addEventListener('click',begin);
function pauseGame(){if(G.state!=='play')return;G.state='paused';exitLock();$('pauseBoard').innerHTML=boardHTML();$('pause').hidden=false;}
$('bResume').addEventListener('click',()=>{$('pause').hidden=true;G.state='play';if(desk())requestLock();});
$('bRestart').addEventListener('click',begin);
$('bMenu2').addEventListener('click',()=>{renderRank();renderInv();});
function toMenu(){G.state='menu';$('vig').hidden=true;ambientStop();if(S.music==="on")musicStart();for(const e of G.ents)if(e.model)scene.remove(e.model);G.ents=[];bombMesh.visible=false;G.drops.forEach(d=>scene.remove(d.mesh));G.drops=[];clearNades();
  $('pause').hidden=true;$('over').hidden=true;$('hud').hidden=true;$('menu').hidden=false;syncMenu();previewMap();}
$('bQuit').addEventListener('click',toMenu);$('bMenu2').addEventListener('click',toMenu);
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGame();});
