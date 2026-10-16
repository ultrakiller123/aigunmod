// ---------------- inventory, case shop, upgrader
const fmtCr=n=>Math.round(n).toLocaleString('en-US')+' PTS';
const weaponLabel=s=>s.w==='knife'?'★ '+KNIFE_NAMES[s.kt]:WPN[s.w].name;
function skinCard(it,eq,opts={}){
  const s=SKINS[it.skin],b=document.createElement('button');b.className='card'+(eq?' eq':'')+(opts.sel?' picked':'');b.style.setProperty('--rc',RARITY[s.r].col);
  const c=document.createElement('canvas');c.width=120;c.height=56;const g=c.getContext('2d');g.drawImage(skinCanvas(it.skin,it.float),0,0,128,60,0,0,120,56);
  g.fillStyle='rgba(0,0,0,.4)';g.fillRect(0,40,120,16);g.fillStyle='#fff';g.font='600 11px sans-serif';g.fillText(weaponLabel(s),5,52);
  b.appendChild(c);const ab=ABIL[s.ab];
  b.insertAdjacentHTML('beforeend',`<b>${it.st?'<span class="st">ST™</span> ':''}${s.name}</b><span>${wearName(it.float)} · ${fmtCr(itemValue(it))}</span><span class="abl">${ab.name}</span>`);
  return b;
}
function renderWallet(){
  $('wallet').textContent=fmtCr(INV.credits);
  const ready=Date.now()-INV.lastDaily>20*3600e3;$('bDaily').disabled=!ready;
  $('bDaily').textContent=ready?'Claim daily bonus':'Daily bonus claimed';
}
let invTab='items';
function renderInv(){
  renderWallet();
  document.querySelectorAll('#invTabs button').forEach(b=>b.classList.toggle('sel',b.dataset.st===invTab));
  document.querySelectorAll('[data-sp]').forEach(p=>p.hidden=p.dataset.sp!==invTab);
  if(invTab==='items'){const g=$('invGrid');g.innerHTML='';
    if(!INV.items.length){g.innerHTML='<p class="desc">No skins yet. Open a case to get your first one.</p>';return;}
    for(const it of INV.items.slice().sort((a,b)=>itemValue(b)-itemValue(a))){const s=SKINS[it.skin],c=skinCard(it,INV.equip[s.w]===it.id);c.addEventListener('click',()=>openItem(it));g.appendChild(c);}}
  else if(invTab==='cases')renderCases();
}
$('invTabs').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;if(b.dataset.st==='up'){openUpgrader();return;}invTab=b.dataset.st;renderInv();});
$('bDaily').addEventListener('click',()=>{if(Date.now()-INV.lastDaily<20*3600e3)return;INV.lastDaily=Date.now();INV.credits+=600;INV.bag.clutch++;saveInv();audioInit();tone(990,.2,.2,'triangle');renderInv();});

// cases
function caseArt(type,w=150,h=84){const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d'),C=CASES[type];
  const gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,'#1a1c20');gr.addColorStop(1,C.col);g.fillStyle=gr;g.fillRect(0,0,w,h);
  g.fillStyle='rgba(0,0,0,.35)';g.fillRect(w*.12,h*.2,w*.76,h*.6);g.strokeStyle='rgba(255,255,255,.5)';g.lineWidth=2;g.strokeRect(w*.12,h*.2,w*.76,h*.6);
  g.fillStyle='#fff';g.font=`700 ${h*.2}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.fillText(C.name.split(' ')[0].toUpperCase(),w/2,h/2);return c;}
function renderCases(){
  const g=$('caseGrid');g.innerHTML='';
  for(const k in CASES){const C=CASES[k],d=document.createElement('div');d.className='casec';d.style.setProperty('--rc',C.col);d.appendChild(caseArt(k));
    const best=Object.values(SKINS).filter(s=>s.col===k).sort((a,b)=>b.r-a.r).slice(0,3).map(s=>`<i style="color:${RARITY[s.r].col}">${s.w==='knife'?'★ '+KNIFE_NAMES[s.kt]:WPN[s.w].name} | ${s.name}</i>`).join('');
    d.insertAdjacentHTML('beforeend',`<b>${C.name}</b><span>${C.desc}</span><div class="casebest">${best}</div><span>Owned: ${INV.bag[k]||0}</span>
      <div class="btns"><button class="pbtn" data-buy="${k}" ${INV.credits<C.price?'disabled':''}>Buy ${fmtCr(C.price)}</button><button class="big" data-open="${k}" ${INV.bag[k]?'':'disabled'}>Open</button></div>`);
    g.appendChild(d);}
}
$('caseGrid').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;
  if(b.dataset.buy){const C=CASES[b.dataset.buy];if(INV.credits<C.price)return;INV.credits-=C.price;INV.bag[b.dataset.buy]=(INV.bag[b.dataset.buy]||0)+1;saveInv();audioInit();tone(700,.08,.15,'square');renderInv();}
  if(b.dataset.open)openCase(b.dataset.open);});
let caseResult=null,caseType='clutch',reelAnim=0;
function openCase(type){
  type=type||caseType;if(!INV.bag[type])return;caseType=type;audioInit();INV.bag[type]--;caseResult=rollCase(type);INV.items.push(caseResult);saveInv();
  $('caseOvl').hidden=false;$('caseTitle').textContent=CASES[type].name;$('caseRes').innerHTML='';$('bCaseEquip').hidden=true;$('bCaseAgain').hidden=true;
  const reel=$('reel');reel.innerHTML='';reel.style.transition='none';reel.style.transform='translateX(0)';
  const N=46,WIN=40,saveId=INV.nextId;for(let i=0;i<N;i++){const it=i===WIN?caseResult:rollCase(type);reel.appendChild(skinCard(it,false));}
  INV.nextId=saveId;saveInv();
  const W=reel.parentElement.clientWidth,target=-(WIN*126+60-W/2+rnd(-48,48));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{reel.style.transition='transform 6s cubic-bezier(.06,.55,.1,1)';reel.style.transform=`translateX(${target}px)`;}));
  let lastIdx=-1;cancelAnimationFrame(reelAnim);
  const tick=()=>{const m=new DOMMatrix(getComputedStyle(reel).transform);const idx=Math.floor((-m.m41+W/2)/126);if(idx!==lastIdx){lastIdx=idx;tone(1100,.025,.07,'square');}
    if(Math.abs(m.m41-target)>.5)reelAnim=requestAnimationFrame(tick);};reelAnim=requestAnimationFrame(tick);
  reel.addEventListener('transitionend',function done(){reel.removeEventListener('transitionend',done);cancelAnimationFrame(reelAnim);
    const s=SKINS[caseResult.skin],ab=abilityOf(caseResult);
    $('caseRes').innerHTML=`<span style="color:${RARITY[s.r].col}">${skinTitle(caseResult)}</span><small>${RARITY[s.r].name} · ${fmtCr(itemValue(caseResult))} · Ability: ${ab.name}, ${ab.desc.toLowerCase()}</small>`;
    tone(s.r>=3?1320:880,.4,.2,'triangle');if(s.r>=3)setTimeout(()=>tone(1760,.5,.2,'triangle'),180);
    $('bCaseEquip').hidden=false;$('bCaseAgain').hidden=!INV.bag[type];renderInv();});
}
$('bCaseAgain').addEventListener('click',()=>openCase(caseType));
$('bCaseClose').addEventListener('click',()=>{$('caseOvl').hidden=true;renderInv();});
$('bCaseEquip').addEventListener('click',()=>{if(!caseResult)return;INV.equip[SKINS[caseResult.skin].w]=caseResult.id;saveInv();resetViewmodel();$('caseOvl').hidden=true;renderInv();});

// 3D inspect
let pv=null,pvItem=null,pvRaf=0,pvYaw=.6,pvDrag=null;
function openItem(it){
  pvItem=it;const s=SKINS[it.skin],ab=abilityOf(it),eq=INV.equip[s.w]===it.id;
  $('itTitle').textContent=skinTitle(it,true);$('itTitle').style.color=RARITY[s.r].col;
  $('itInfo').innerHTML=`<p><b>${RARITY[s.r].name}</b> · ${CASES[s.col].name}</p><p>${wearName(it.float)} · float ${it.float.toFixed(4)}</p>
    ${it.st?`<p class="st">StatTrak™ · ${it.kills} confirmed kills</p>`:''}<p class="val">${fmtCr(itemValue(it))}</p>
    <div class="abbox"><b>${ab.name}</b> <small>power ${Math.round(ab.s*100)}%</small><span>${ab.desc}. Active while this ${s.w==='knife'?'knife':'weapon'} is in your hands.</span></div>`;
  $('bItEquip').textContent=eq?'Unequip':'Equip';$('bItSell').textContent=`Sell for ${fmtCr(itemValue(it))}`;
  $('itemOvl').hidden=false;startPreview(it);
}
function startPreview(it){
  try{
    if(!pv){const r=new THREE.WebGLRenderer({canvas:$('itView'),antialias:true,alpha:true});r.setPixelRatio(Math.min(2,devicePixelRatio||1));
      const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x303040,1.1));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(1,2,2);sc.add(dl);
      const cam=new THREE.PerspectiveCamera(30,1,.01,20);cam.position.set(0,.1,2.2);cam.lookAt(0,0,0);pv={r,sc,cam,obj:null};}
    pv.sc.environment=envTex;
    if(pv.obj)pv.sc.remove(pv.obj);const s=SKINS[it.skin],g=gunMesh(s.w,it),hold=new THREE.Group();
    const box3=new THREE.Box3().setFromObject(g),size=box3.getSize(new THREE.Vector3()),ctr=box3.getCenter(new THREE.Vector3());g.position.sub(ctr);
    hold.add(g);hold.scale.setScalar(1.6/Math.max(size.x,size.y,size.z));pv.obj=hold;pv.sc.add(hold);
    cancelAnimationFrame(pvRaf);const loop=()=>{if($('itemOvl').hidden)return;const cvs=$('itView'),w=cvs.clientWidth,h=cvs.clientHeight;
      if(cvs.width!==Math.round(w*pv.r.getPixelRatio())){pv.r.setSize(w,h,false);pv.cam.aspect=w/h;pv.cam.updateProjectionMatrix();}
      if(!pvDrag)pvYaw+=.008;hold.rotation.set(.25,pvYaw,0);pv.r.render(pv.sc,pv.cam);pvRaf=requestAnimationFrame(loop);};loop();
  }catch(e){}
}
$('itView').addEventListener('pointerdown',ev=>{pvDrag={x:ev.clientX,yaw:pvYaw};try{$('itView').setPointerCapture(ev.pointerId);}catch(e){}});
$('itView').addEventListener('pointermove',ev=>{if(pvDrag)pvYaw=pvDrag.yaw+(ev.clientX-pvDrag.x)*.012;});
$('itView').addEventListener('pointerup',()=>{pvDrag=null;});
$('bItClose').addEventListener('click',()=>{$('itemOvl').hidden=true;renderInv();});
$('bItEquip').addEventListener('click',()=>{const s=SKINS[pvItem.skin];if(INV.equip[s.w]===pvItem.id)delete INV.equip[s.w];else INV.equip[s.w]=pvItem.id;saveInv();resetViewmodel();openItem(pvItem);});
$('bItSell').addEventListener('click',()=>{const it=pvItem,s=SKINS[it.skin];INV.credits+=itemValue(it);INV.items=INV.items.filter(i=>i!==it);if(INV.equip[s.w]===it.id)delete INV.equip[s.w];
  saveInv();resetViewmodel();tone(600,.1,.15,'square');$('itemOvl').hidden=true;renderInv();});


// upgrader: stake a skin and/or points, aim at a pricier skin, spin
const UPG={stake:null,add:0,target:null,spinning:false,angle:0,sort:'asc'};
function catalog(){const out=[];for(const s of Object.values(SKINS))for(const f of[.03,.1,.25,.42])out.push({skin:s.id,float:f,st:false,kills:0});return out.sort((a,b)=>itemValue(a)-itemValue(b));}
const CATALOG=catalog();
function stakeValue(){return(UPG.stake?itemValue(UPG.stake):0)+UPG.add;}
function inMatch(){return G.state==='play'||G.state==='paused';}
function upgraderOpenNow(){
  if(!inMatch())return true;if(G.mode==='aim')return false;
  if(isRounds())return G.phase==='freeze'||G.phase==='end'||G.rt<BUY_TIME;
  if(G.mode==='horde')return G.waveState==='break';
  return true;
}
function openUpgrader(stakeItem){
  if(stakeItem)UPG.stake=stakeItem;UPG.target=null;$('upOvl').hidden=false;exitLock();renderUpgrader();
}
function closeUpgrader(){if(UPG.spinning)return;$('upOvl').hidden=true;if(inMatch()){if(desk()&&G.state==='play')requestLock();}else renderInv();}
function renderUpgrader(){
  $('upBal').textContent=fmtCr(INV.credits)+(inMatch()?' · closes when buy time ends':'');
  if(UPG.stake&&!INV.items.includes(UPG.stake))UPG.stake=null;
  UPG.add=clamp(UPG.add,0,INV.credits);$('upAdd').max=Math.max(0,Math.floor(INV.credits/10)*10);$('upAdd').value=UPG.add;$('rvUpAdd').textContent=fmtCr(UPG.add);
  const st=$('upStake');st.innerHTML='';
  if(UPG.stake){const c=skinCard(UPG.stake,false);c.addEventListener('click',()=>{if(!UPG.spinning){UPG.stake=null;UPG.target=null;renderUpgrader();}});st.appendChild(c);}
  if(UPG.add)st.insertAdjacentHTML('beforeend',`<div class="crstake">${UPG.stake?'+ ':''}${fmtCr(UPG.add)}</div>`);
  if(!UPG.stake&&!UPG.add)st.innerHTML='<p class="desc">Tap one of your skins below, add points, or both</p>';
  const pk=$('upPick');pk.innerHTML='';
  for(const it of INV.items.slice().sort((a,b)=>itemValue(a)-itemValue(b))){const c=skinCard(it,INV.equip[SKINS[it.skin].w]===it.id,{sel:it===UPG.stake});
    c.addEventListener('click',()=>{if(UPG.spinning)return;UPG.stake=UPG.stake===it?null:it;UPG.target=null;renderUpgrader();});pk.appendChild(c);}
  if(!INV.items.length)pk.innerHTML='<p class="desc">No skins yet. Stake points instead: you earn them for kills and at the end of every round.</p>';
  const sv=stakeValue(),tl=$('upTargets');tl.innerHTML='';
  let opts=CATALOG.filter(t=>{const v=itemValue(t);return sv&&v>sv*1.05&&upgradeChance(sv,v)>=.01;});
  if(UPG.sort==='desc')opts=opts.slice().reverse();opts=opts.slice(0,72);
  if(UPG.target&&itemValue(UPG.target)<=sv)UPG.target=null;
  for(const t of opts){const c=skinCard(t,false,{sel:UPG.target&&UPG.target.skin===t.skin&&UPG.target.float===t.float});
    c.insertAdjacentHTML('beforeend',`<span class="pct">${(upgradeChance(sv,itemValue(t))*100).toFixed(1)}%</span>`);
    c.addEventListener('click',()=>{if(UPG.spinning)return;UPG.target=t;renderUpgrader();});tl.appendChild(c);}
  if(!sv)tl.innerHTML='<p class="desc">Choose a stake first.</p>';
  const tg=$('upTarget');tg.innerHTML='';if(UPG.target)tg.appendChild(skinCard(UPG.target,false));else tg.innerHTML='<p class="desc">Pick a target or a multiplier</p>';
  const ch=sv&&UPG.target?upgradeChance(sv,itemValue(UPG.target)):0,open=upgraderOpenNow();
  $('upChance').textContent=ch?`${(ch*100).toFixed(1)}%`:'—';$('bUpgrade').disabled=!ch||UPG.spinning||!open;
  $('bUpgrade').textContent=open?'Upgrade':'Opens at buy time';
  $('upStat').textContent=`${INV.upWins} won of ${INV.upgrades} upgrades`;
  document.querySelectorAll('#upSort button').forEach(b=>b.classList.toggle('sel',b.dataset.v===UPG.sort));
  drawWheel(ch,UPG.angle);
}
function drawWheel(ch,ang){
  const c=$('upWheel'),g=c.getContext('2d'),W=c.width,R=W/2-14;g.clearRect(0,0,W,W);
  g.lineWidth=20;g.strokeStyle='rgba(239,233,220,.1)';g.beginPath();g.arc(W/2,W/2,R,0,TAU);g.stroke();
  for(let i=0;i<60;i++){const a=i/60*TAU;g.strokeStyle='rgba(239,233,220,.18)';g.lineWidth=i%5?1:2;g.beginPath();g.moveTo(W/2+Math.cos(a)*(R-14),W/2+Math.sin(a)*(R-14));g.lineTo(W/2+Math.cos(a)*(R-20),W/2+Math.sin(a)*(R-20));g.stroke();}
  if(ch){g.lineWidth=20;g.strokeStyle='#6cc68a';g.shadowColor='#6cc68a';g.shadowBlur=14;g.beginPath();g.arc(W/2,W/2,R,-PI/2,-PI/2+ch*TAU);g.stroke();g.shadowBlur=0;}
  g.save();g.translate(W/2,W/2);g.rotate(ang);g.fillStyle='#efe9dc';g.beginPath();g.moveTo(-7,0);g.lineTo(7,0);g.lineTo(0,-R+2);g.closePath();g.fill();
  g.beginPath();g.arc(0,0,11,0,TAU);g.fill();g.restore();
}
$('bUpClose').addEventListener('click',closeUpgrader);
$('bItUp').addEventListener('click',()=>{$('itemOvl').hidden=true;openUpgrader(pvItem);});
$('upAdd').addEventListener('input',e=>{if(UPG.spinning)return;UPG.add=+e.target.value;UPG.target=null;renderUpgrader();});
$('upSort').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b)return;UPG.sort=b.dataset.v;renderUpgrader();});
$('upMult').addEventListener('click',ev=>{const b=ev.target.closest('button');if(!b||UPG.spinning)return;const sv=stakeValue();if(!sv)return;const want=sv*+b.dataset.m;
  let best=null,bd=1e9;for(const t of CATALOG){const v=itemValue(t);if(v<=sv*1.05)continue;const d=Math.abs(Math.log(v/want));if(d<bd){bd=d;best=t;}}UPG.target=best;renderUpgrader();});
$('bUpgrade').addEventListener('click',()=>{
  const sv=stakeValue();if(!sv||!UPG.target||UPG.spinning||!upgraderOpenNow())return;if(INV.credits<UPG.add)return;audioInit();
  const ch=upgradeChance(sv,itemValue(UPG.target)),landing=Math.random(),win=landing<ch;
  // the stake is taken before the spin, so leaving mid-spin cannot dodge a loss
  INV.credits-=UPG.add;if(UPG.stake){const s=SKINS[UPG.stake.skin];INV.items=INV.items.filter(i=>i!==UPG.stake);if(INV.equip[s.w]===UPG.stake.id)delete INV.equip[s.w];}
  let prize=null;if(win){prize=makeItem(UPG.target.skin,UPG.target.float);prize.st=false;INV.items.push(prize);INV.equip[SKINS[prize.skin].w]=prize.id;INV.upWins++;}
  INV.upgrades++;saveInv();resetViewmodel();
  UPG.spinning=true;$('bUpgrade').disabled=true;$('upMsg').textContent='Spinning…';
  const start=UPG.angle%TAU,end=TAU*6+landing*TAU,t0=performance.now(),dur=4200;let lastTick=0;
  const step=now=>{const k=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-k,4);UPG.angle=start+(end-start)*e;drawWheel(ch,UPG.angle);
    const tk=Math.floor(UPG.angle/(TAU/40));if(tk!==lastTick){lastTick=tk;tone(1000,.02,.05,'square');}
    if(k<1){requestAnimationFrame(step);return;}
    UPG.spinning=false;
    if(win){tone(1320,.35,.2,'triangle');setTimeout(()=>tone(1760,.45,.2,'triangle'),160);const s=SKINS[prize.skin];
      let extra='';if(inMatch()&&G.player.alive&&s.w!=='knife'){give(G.player,s.w);extra=' The weapon is in your hands now.';}
      $('upMsg').innerHTML=`<span class="win">Upgraded!</span> ${skinTitle(prize)} (${fmtCr(itemValue(prize))}) is equipped: ${ABIL[s.ab].name}.${extra}`;
      if(inMatch())notice(`Upgraded: ${s.name}`,'#6cc68a');UPG.stake=prize;}
    else{tone(180,.5,.25,'sawtooth');$('upMsg').innerHTML='<span class="lose">Lost.</span> The needle stopped outside the green arc.';UPG.stake=null;}
    UPG.target=null;UPG.add=0;renderWallet();renderUpgrader();};
  requestAnimationFrame(step);
});
// points earned in matches
function addPts(n,why){if(!G.player||n<=0)return;n=Math.round(n);INV.credits+=n;G.matchPts=(G.matchPts||0)+n;
  const el=$('ptsPop');el.textContent=`+${n} PTS${why?' · '+why:''}`;el.classList.remove('on');void el.offsetWidth;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('on'),1300);}
$('bUpg').addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();audioInit();$('upOvl').hidden?openUpgrader():closeUpgrader();});
