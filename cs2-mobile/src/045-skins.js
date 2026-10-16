// ---------------- skins, cases, ranks
const RARITY=[
  {name:'Mil-Spec',col:'#4b69ff',odds:.7992},{name:'Restricted',col:'#8847ff',odds:.1598},{name:'Classified',col:'#d32ce6',odds:.032},
  {name:'Covert',col:'#eb4b4b',odds:.0064},{name:'Rare Special',col:'#e4ae39',odds:.0026}];
// [id, weapon, name, pattern, colors, rarity, knifeType]
const SKIN_LIST=[
  ['glock_sand','glock','Sandstorm','camo',['#c2a26e','#8a6a3e','#e0cfa0'],0],['usp_torque','usp','Torque','digital',['#3a4a5a','#b0b8c0','#e07030'],0],
  ['p250_splash','p250','Splash','splash',['#2a2a2a','#e05a3a','#f0c040'],0],['mp9_rod','mp9','Hot Rod','solid',['#c4302b'],0],
  ['ump_grid','ump','Urban Grid','digital',['#5a5f66','#8a9096','#2a2e33'],0],['nova_leaf','nova','Forest Leaves','camo',['#3e4a2e','#6b7a4a','#2a2f20'],0],
  ['galil_cerb','galil','Cerberus','tiger',['#7a2a20','#1a1a1a'],0],['famas_pulse','famas','Pulse','hex',['#101418','#30c0ff'],0],
  ['mac10_apple','mac10','Candy Apple','solid',['#d01e3a'],0],['fs_copper','fiveseven','Copper Galaxy','fade',['#5a2a1a','#c07040','#2a1a40'],0],
  ['negev_bulk','negev','Army Sheen','camo',['#4a4f3a','#2f3326','#6a6f50'],0],
  ['ak_pin','ak','Emerald Pinstripe','damascus',['#1e4a32','#3a8a5a'],1],['m4_storm','m4','Desert Storm','camo',['#cdb68a','#9a7a4a','#6a5638'],1],
  ['de_blaze','deagle','Blaze','flame',['#141414','#ff7a1a','#ffd040'],1],['p90_trigon','p90','Trigon','neon',['#0a0a0a','#ff2a7a','#2aefff'],1],
  ['ssg_moon','ssg08','Blood Moon','fade',['#200008','#c01020','#ff6040'],1],['tec9_fuel','tec9','Fuel Line','neon',['#1a1a1a','#ffd000','#ff4000'],1],
  ['xm_tranq','xm1014','Tranquil','marble',['#e8f0f0','#7aa0b0'],1],['aug_cham','aug','Chameleon','fade',['#2a6a3a','#c0d040','#2a4a8a'],1],
  ['sg_tiger','sg553','Tiger Moth','tiger',['#e0a030','#2a1a08'],1],
  ['ak_viper','ak','Neon Viper','hex',['#0b0b12','#b030ff'],2],['m4_tide','m4','Cyber Tide','fade',['#00c0d0','#2050ff','#8020ff'],2],
  ['awp_dragon','awp','Inferno Dragon','flame',['#1a0505','#ff3010','#ffb020'],2],['de_scroll','deagle','Golden Scroll','gold',['#d8b04a','#7a5a18'],2],
  ['usp_koi','usp','Midnight Koi','tiger',['#101830','#ff8030'],2],['glock_water','glock','Water Color','splash',['#f0f4f8','#40a0ff','#ff60a0'],2],
  ['p90_carbon','p90','Carbon Strike','carbon',['#141414','#3a3a3a','#e0302a'],2],
  ['ak_jade','ak','Jade Monarch','marble',['#0d3b2e','#7fe3c0'],3],['awp_solar','awp','Solar Flare','fade',['#ffeb3b','#ff5722','#d81b60'],3],
  ['m4_prism','m4','Prism Wave','neon',['#0a0a14','#00ffd0','#ff00e0'],3],['usp_orbit','usp','Orbit','hex',['#080810','#ffd040'],3],
  ['k_kara_fade','knife','Fade','fade',['#ffd400','#ff3c8a','#7a2aff'],4,'karambit'],['k_bfly_dop','knife','Doppler','doppler',['#1a0a2a','#6a30ff','#ff40c0'],4,'butterfly'],
  ['k_bayo_tiger','knife','Tiger Tooth','tiger',['#f0a020','#3a2005'],4,'bayonet'],['k_kara_dam','knife','Damascus Steel','damascus',['#9aa0a6','#3a3f44'],4,'karambit'],
  ['k_bfly_web','knife','Crimson Web','web',['#8a0c10','#120404'],4,'butterfly'],['k_bayo_marble','knife','Marble Fade','marble',['#ffde3a','#e8364a','#2a5aff'],4,'bayonet'],
];
// Ember and Frost collections (field 7 = collection)
SKIN_LIST.push(
  ['ak_ember','ak','Ember Lotus','flame',['#1a0a06','#ff5a1a','#ffc040'],2,null,'ember'],['m4_cinder','m4','Cinderfall','fade',['#2a0a04','#c83a10','#ffb050'],1,null,'ember'],
  ['de_magma','deagle','Magma Core','flame',['#120404','#ff2a00','#ffe060'],3,null,'ember'],['glock_ash','glock','Ashen','camo',['#3a3a3a','#6a5a50','#2a2420'],0,null,'ember'],
  ['mp9_sunset','mp9','Sunset Strip','fade',['#ff9a40','#e04a6a','#5a2a7a'],1,null,'ember'],['awp_phoenix','awp','Phoenix Rising','flame',['#200400','#ff6a00','#fff080'],3,null,'ember'],
  ['tec9_brand','tec9','Branded','neon',['#140808','#ff4020','#ffa030'],0,null,'ember'],['galil_kiln','galil','Kiln','marble',['#5a2a18','#ffb070'],1,null,'ember'],
  ['ump_lava','ump','Lava Flow','marble',['#1a0a08','#ff5a20','#ffd060'],2,null,'ember'],['xm_furnace','xm1014','Furnace','carbon',['#1a1412','#3a2a24','#ff6a20'],0,null,'ember'],
  ['k_kara_ember','knife','Ember Fade','fade',['#ffe040','#ff5010','#7a0a10'],4,'karambit','ember'],['k_bayo_magma','knife','Magma Damascus','damascus',['#ff5010','#2a0804'],4,'bayonet','ember'],
  ['ak_glacier','ak','Glacier Bloom','marble',['#e8f6ff','#4aa0d8'],2,null,'frost'],['m4_frostbite','m4','Frostbite','tiger',['#d8eef8','#2a6a9a'],1,null,'frost'],
  ['usp_aurora','usp','Aurora','fade',['#20e0a0','#3060ff','#a030ff'],3,null,'frost'],['awp_permafrost','awp','Permafrost','hex',['#06121c','#7fd8ff'],2,null,'frost'],
  ['p90_snow','p90','Snowcap','digital',['#e8eef2','#9fb2c0','#5a6a78'],0,null,'frost'],['famas_tundra','famas','Tundra','camo',['#c8d4dc','#7a8a96','#eef4f8'],0,null,'frost'],
  ['ssg_icicle','ssg08','Icicle','fade',['#ffffff','#9adfff','#2a6aaa'],1,null,'frost'],['nova_rime','nova','Rime','splash',['#dfeaf0','#4a8ab0','#ffffff'],0,null,'frost'],
  ['aug_polar','aug','Polar Night','neon',['#04070e','#4ae3ff','#b0f0ff'],3,null,'frost'],['fs_crystal','fiveseven','Crystal','hex',['#0a1a2a','#9fe8ff'],1,null,'frost'],
  ['k_bfly_frost','knife','Frost Doppler','doppler',['#020814','#30a0ff','#c0f4ff'],4,'butterfly','frost'],['k_kara_ice','knife','Ice Tiger','tiger',['#e0f6ff','#1a4a7a'],4,'karambit','frost']);
// abilities: every skin grants one while that weapon is in your hands; rarer skins are stronger
const ABIL={
  quick:{name:'Quickdraw',desc:'Draw and swap weapons faster'},reload:{name:'Speed Loader',desc:'Reload faster'},
  steady:{name:'Steady Hands',desc:'Tighter bullet spread'},vamp:{name:'Vampire',desc:'Heal from the damage you deal'},
  boom:{name:'Explosive Rounds',desc:'Kills detonate and hurt nearby enemies'},burn:{name:'Incendiary Rounds',desc:'Hits set the ground on fire under the target'},
  mag:{name:'Extended Mag',desc:'Bigger magazine'},fleet:{name:'Fleet Foot',desc:'Move faster while held'},
  exec:{name:'Executioner',desc:'Extra damage to wounded enemies'},pierce:{name:'Armor Piercing',desc:'Ignore armor and punch through walls'},
  bounty:{name:'Bounty Hunter',desc:'Bonus money and points per kill'},crit:{name:'Lucky Shot',desc:'Chance to deal double damage'},
  frost:{name:'Frost Rounds',desc:'Hits slow enemies to a crawl'},ghost:{name:'Ghost',desc:'Silent footsteps while held'},
  second:{name:'Second Wind',desc:'Once per life, survive a lethal hit'},chain:{name:'Chain Lightning',desc:'Hits arc to a second enemy'},
  recoil:{name:'Recoil Dampener',desc:'Much less spray climb'},eagle:{name:'Eagle Eye',desc:'Enemies you hit stay on your radar'},
};
const SKIN_AB={glock_sand:'fleet',usp_torque:'quick',p250_splash:'crit',mp9_rod:'fleet',ump_grid:'mag',nova_leaf:'steady',galil_cerb:'mag',famas_pulse:'recoil',
  mac10_apple:'vamp',fs_copper:'pierce',negev_bulk:'recoil',ak_pin:'steady',m4_storm:'eagle',de_blaze:'burn',p90_trigon:'chain',ssg_moon:'exec',tec9_fuel:'burn',
  xm_tranq:'frost',aug_cham:'ghost',sg_tiger:'crit',ak_viper:'chain',m4_tide:'reload',awp_dragon:'burn',de_scroll:'bounty',usp_koi:'ghost',glock_water:'vamp',
  p90_carbon:'pierce',ak_jade:'vamp',awp_solar:'boom',m4_prism:'chain',usp_orbit:'crit',k_kara_fade:'second',k_bfly_dop:'fleet',k_bayo_tiger:'vamp',
  k_kara_dam:'ghost',k_bfly_web:'second',k_bayo_marble:'bounty',ak_ember:'burn',m4_cinder:'burn',de_magma:'boom',glock_ash:'quick',mp9_sunset:'fleet',
  awp_phoenix:'second',tec9_brand:'burn',galil_kiln:'mag',ump_lava:'burn',xm_furnace:'boom',k_kara_ember:'boom',k_bayo_magma:'vamp',ak_glacier:'frost',
  m4_frostbite:'frost',usp_aurora:'eagle',awp_permafrost:'frost',p90_snow:'ghost',famas_tundra:'steady',ssg_icicle:'frost',nova_rime:'frost',aug_polar:'chain',
  fs_crystal:'reload',k_bfly_frost:'frost',k_kara_ice:'second'};
const SKINS={};for(const[id,w,name,pat,cols,r,kt,col]of SKIN_LIST)SKINS[id]={id,w,name,pat,cols,r,kt,col:col||'clutch',ab:SKIN_AB[id]||'steady'};
const CASES={
  clutch:{name:'Clutch Case',price:250,col:'#e3a23b',desc:'The original collection.',luck:1},
  ember:{name:'Ember Case',price:550,col:'#ff5a1a',desc:'Fire-themed skins. Better odds for Classified and up.',luck:1.6},
  frost:{name:'Frost Case',price:900,col:'#62c8ff',desc:'Ice-themed skins. Knives twice as likely.',luck:2.2},
};
const KNIFE_NAMES={karambit:'Karambit',butterfly:'Butterfly Knife',bayonet:'Bayonet'};
const WEAR=[[.07,'Factory New'],[.15,'Minimal Wear'],[.38,'Field-Tested'],[.45,'Well-Worn'],[1,'Battle-Scarred']];
const wearName=f=>WEAR.find(w=>f<w[0])[1];
const skinTitle=(it,short)=>{const s=SKINS[it.skin];const wn=s.w==='knife'?'★ '+KNIFE_NAMES[s.kt]:WPN[s.w].name;return(it.st?'StatTrak™ ':'')+wn+' | '+s.name+(short?'':' ('+wearName(it.float)+')');};

// procedural skin patterns
const skinCanvasCache={};
function seeded(seed){let s=seed>>>0||1;return()=>{s^=s<<13;s^=s>>>17;s^=s<<5;return((s>>>0)%10000)/10000;};}
function skinCanvas(id,wearF){
  const tier=WEAR.findIndex(w=>wearF<w[0]),key=id+'|'+tier;if(skinCanvasCache[key])return skinCanvasCache[key];
  const s=SKINS[id],c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),R=seeded([...id].reduce((a,ch)=>a*31+ch.charCodeAt(0),7)),r=(a,b)=>a+R()*(b-a);
  const C=s.cols,W=128,H=128;
  const lin=(cols,ang)=>{const gr=g.createLinearGradient(0,0,Math.cos(ang)*W,Math.sin(ang)*H+H*.3);cols.forEach((col,i)=>gr.addColorStop(i/(cols.length-1),col));return gr;};
  switch(s.pat){
    case'solid':g.fillStyle=C[0];g.fillRect(0,0,W,H);g.fillStyle='rgba(255,255,255,.12)';g.fillRect(0,0,W,H*.3);break;
    case'camo':g.fillStyle=C[0];g.fillRect(0,0,W,H);for(let i=0;i<34;i++){g.fillStyle=C[1+(i%(C.length-1))];g.beginPath();g.ellipse(r(0,W),r(0,H),r(6,20),r(4,12),r(0,PI),0,TAU);g.fill();}break;
    case'digital':g.fillStyle=C[0];g.fillRect(0,0,W,H);for(let i=0;i<220;i++){g.fillStyle=C[1+(i%(C.length-1))];const sz=8*(1+(R()*2|0));g.fillRect((r(0,W)/8|0)*8,(r(0,H)/8|0)*8,sz,8);}break;
    case'splash':g.fillStyle=C[0];g.fillRect(0,0,W,H);for(let i=0;i<26;i++){g.fillStyle=C[1+(i%(C.length-1))];const x=r(0,W),y=r(0,H);g.beginPath();g.arc(x,y,r(3,12),0,TAU);g.fill();
      for(let k=0;k<5;k++){g.beginPath();g.arc(x+r(-18,18),y+r(-18,18),r(1,3),0,TAU);g.fill();}}break;
    case'tiger':g.fillStyle=C[0];g.fillRect(0,0,W,H);g.fillStyle=C[1];for(let i=0;i<9;i++){const y=i*15+r(-4,4);g.beginPath();g.moveTo(0,y);
      for(let x=0;x<=W;x+=16)g.lineTo(x,y+Math.sin(x*.08+i)*5+r(-2,2));for(let x=W;x>=0;x-=16)g.lineTo(x,y+r(3,7)+Math.sin(x*.08+i)*5);g.fill();}break;
    case'fade':g.fillStyle=lin(C,.7);g.fillRect(0,0,W,H);g.fillStyle='rgba(255,255,255,.15)';g.fillRect(0,0,W,H*.15);break;
    case'doppler':g.fillStyle=C[0];g.fillRect(0,0,W,H);for(let i=0;i<40;i++){const gr=g.createRadialGradient(r(0,W),r(0,H),0,r(0,W),r(0,H),r(20,50));gr.addColorStop(0,i%2?C[1]:C[2]);gr.addColorStop(1,'rgba(0,0,0,0)');g.globalAlpha=.5;g.fillStyle=gr;g.fillRect(0,0,W,H);}g.globalAlpha=1;break;
    case'hex':g.fillStyle=C[0];g.fillRect(0,0,W,H);g.strokeStyle=C[1];g.lineWidth=2;g.shadowColor=C[1];g.shadowBlur=6;const rr=10;
      for(let y=0;y<H+rr;y+=rr*1.5)for(let x=0;x<W+rr;x+=rr*1.732){const ox=((y/(rr*1.5))|0)%2?rr*.866:0;g.beginPath();for(let k=0;k<6;k++){const a=k*PI/3+PI/6;g.lineTo(x+ox+Math.cos(a)*rr*.9,y+Math.sin(a)*rr*.9);}g.closePath();g.stroke();}g.shadowBlur=0;break;
    case'neon':g.fillStyle=C[0];g.fillRect(0,0,W,H);g.lineWidth=4;g.lineCap='round';for(let i=0;i<14;i++){g.strokeStyle=C[1+(i%(C.length-1))];g.shadowColor=g.strokeStyle;g.shadowBlur=8;g.beginPath();g.moveTo(r(0,W),r(0,H));g.lineTo(r(0,W),r(0,H));g.lineTo(r(0,W),r(0,H));g.stroke();}g.shadowBlur=0;break;
    case'carbon':for(let y=0;y<H;y+=8)for(let x=0;x<W;x+=8){g.fillStyle=((x+y)/8)%2?C[0]:C[1];g.fillRect(x,y,8,8);g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x,y,8,2);}
      g.fillStyle=C[2];g.fillRect(0,H*.45,W,6);break;
    case'marble':g.fillStyle=lin(C.length>2?C:[C[0],C[0]],.3);g.fillRect(0,0,W,H);g.strokeStyle=C[1];g.lineWidth=1.5;g.globalAlpha=.7;
      for(let i=0;i<12;i++){g.beginPath();let x=r(0,W),y=0;g.moveTo(x,y);while(y<H){x+=r(-10,10);y+=r(4,10);g.lineTo(x,y);}g.stroke();}g.globalAlpha=1;break;
    case'damascus':g.fillStyle=C[1];g.fillRect(0,0,W,H);g.strokeStyle=C[0];g.lineWidth=2.5;for(let i=-10;i<30;i++){g.beginPath();for(let x=0;x<=W;x+=4)g.lineTo(x,i*6+Math.sin(x*.07+i*.6)*7+Math.sin(x*.21)*2);g.stroke();}break;
    case'gold':{const gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,C[0]);gr.addColorStop(.5,'#fff1b0');gr.addColorStop(1,C[0]);g.fillStyle=gr;g.fillRect(0,0,W,H);
      g.strokeStyle=C[1];g.lineWidth=1.5;for(let i=0;i<10;i++){g.beginPath();g.arc(r(0,W),r(0,H),r(6,16),r(0,PI),r(PI,TAU));g.stroke();}break;}
    case'flame':g.fillStyle=C[0];g.fillRect(0,0,W,H);for(let i=0;i<12;i++){const x=r(0,W),gr=g.createLinearGradient(x,H,x,r(0,H*.5));gr.addColorStop(0,C[2]);gr.addColorStop(.5,C[1]);gr.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=gr;g.beginPath();g.moveTo(x-14,H);g.quadraticCurveTo(x-r(0,20),H*.5,x+r(-8,8),r(0,H*.4));g.quadraticCurveTo(x+r(0,20),H*.6,x+14,H);g.fill();}break;
    case'web':g.fillStyle=C[0];g.fillRect(0,0,W,H);g.strokeStyle=C[1];g.lineWidth=1.6;const cx=W*.4,cy=H*.6;
      for(let k=0;k<12;k++){g.beginPath();g.moveTo(cx,cy);g.lineTo(cx+Math.cos(k*TAU/12)*200,cy+Math.sin(k*TAU/12)*200);g.stroke();}
      for(let rr2=10;rr2<180;rr2+=14){g.beginPath();for(let k=0;k<=12;k++)g.lineTo(cx+Math.cos(k*TAU/12)*rr2,cy+Math.sin(k*TAU/12)*rr2);g.stroke();}break;
  }
  const wear=[0,.15,.35,.55,.8][tier]||0;
  for(let i=0;i<wear*260;i++){g.fillStyle=R()<.5?'rgba(40,40,40,.55)':'rgba(170,170,170,.45)';g.fillRect(r(0,W),r(0,H),r(1,4)*wear+1,1);}
  for(let i=0;i<wear*14;i++){g.strokeStyle='rgba(120,120,120,.5)';g.lineWidth=1;g.beginPath();const x=r(0,W),y=r(0,H);g.moveTo(x,y);g.lineTo(x+r(-14,14),y+r(-6,6));g.stroke();}
  return skinCanvasCache[key]=c;
}
const skinMatCache={};
function skinMat(it){
  const s=SKINS[it.skin],key=it.skin+'|'+WEAR.findIndex(w=>it.float<w[0])+'|'+Q;if(skinMatCache[key])return skinMatCache[key];
  const t=new THREE.CanvasTexture(skinCanvas(it.skin,it.float));t.wrapS=t.wrapT=THREE.RepeatWrapping;
  const metal=s.pat==='gold'||s.pat==='fade'||s.pat==='doppler'||s.pat==='damascus'||s.w==='knife';
  return skinMatCache[key]=Q==='high'?new THREE.MeshStandardMaterial({map:t,metalness:metal?.75:.25,roughness:metal?.28:.55,envMapIntensity:1}):new THREE.MeshLambertMaterial({map:t});
}

// inventory persistence
const INV={cases:3,xp:0,items:[],equip:{},matches:0,nextId:1,credits:1500,bag:null,lastDaily:0,upgrades:0,upWins:0};
try{Object.assign(INV,JSON.parse(localStorage.getItem('clutchpoint-inv')||'{}'));}catch(e){}
if(!INV.bag){INV.bag={clutch:INV.cases||0,ember:0,frost:0};}
INV.items=INV.items.filter(i=>SKINS[i.skin]);
const saveInv=()=>{try{localStorage.setItem('clutchpoint-inv',JSON.stringify(INV));}catch(e){}};
const invItem=id=>INV.items.find(i=>i.id===id);
function equippedFor(key){const id=INV.equip[key];return id?invItem(id)||null:null;}
function rollTier(luck){const w=RARITY.map((r,i)=>r.odds*(i>=2?luck:1)*(i===4&&luck>2?1.4:1));const tot=w.reduce((a,b)=>a+b,0);let x=Math.random()*tot;
  for(let i=w.length-1;i>=0;i--){x-=w[i];if(x<0)return i;}return 0;}
function makeItem(skinId,float){return{id:INV.nextId++,skin:skinId,float:float===undefined?Math.min(.999,Math.pow(Math.random(),1.3)):float,st:Math.random()<.1,kills:0};}
function rollCase(type='clutch'){
  const c=CASES[type]||CASES.clutch,tier=rollTier(c.luck);
  let pool=Object.values(SKINS).filter(s=>s.r===tier&&s.col===type);if(!pool.length)pool=Object.values(SKINS).filter(s=>s.r===tier);
  return makeItem(pick(pool).id);
}
const RVAL=[35,140,520,1700,7000],WVAL=[1.45,1.15,1,.82,.68];
function skinBase(id){const s=SKINS[id];let h=0;for(const ch of id)h=(h*31+ch.charCodeAt(0))>>>0;return RVAL[s.r]*(.8+(h%50)/100)*(s.w==='awp'||s.w==='ak'||s.w==='m4'?1.25:1);}
function itemValue(it){return Math.max(5,Math.round(skinBase(it.skin)*WVAL[WEAR.findIndex(w=>it.float<w[0])]*(it.st?1.6:1)));}
function abilityOf(it){const s=SKINS[it.skin];return{k:s.ab,s:1+s.r*.22,...ABIL[s.ab]};}
function upgradeChance(stake,target){return clamp(stake/target*.9,.01,.8);}
// ranks
const RANKS=['Silver I','Silver II','Silver III','Silver IV','Silver Elite','Silver Elite Master','Gold Nova I','Gold Nova II','Gold Nova III','Gold Nova Master',
  'Master Guardian I','Master Guardian II','Master Guardian Elite','Distinguished Master Guardian','Legendary Eagle','Legendary Eagle Master','Supreme Master First Class','The Global Elite'];
const rankXP=n=>300*n+40*n*n;
function rankOf(xp){let n=0;while(n<RANKS.length-1&&xp>=rankXP(n+1))n++;const lo=rankXP(n),hi=rankXP(n+1);return{n,name:RANKS[n],prog:n>=RANKS.length-1?1:(xp-lo)/(hi-lo),need:hi-xp};}
function awardMatch(won,p){
  const before=rankOf(INV.xp).n;
  const xp=p.k*15+p.hsk*5+(won?220:70)+(isRounds()?G.score[p.team]*20:G.mode==='horde'?(G.wave||0)*60:G.mode==='aim'?(G.aimScore||0)/20:0);
  const cr=G.mode==='aim'?Math.round(40+Math.min(p.k,40)*3):Math.round(p.k*20+(won?250:90)+p.hsk*5);
  INV.xp+=xp;INV.matches++;INV.bag.clutch++;INV.credits+=cr;
  const after=rankOf(INV.xp).n;if(after>before){INV.bag[after>=10?'frost':'ember']++;}
  saveInv();return{xp,cr,rankUp:after>before,rank:RANKS[after]};
}
