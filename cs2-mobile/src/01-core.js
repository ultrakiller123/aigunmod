// ---------------- helpers
const $=id=>document.getElementById(id);
const rnd=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.random()*a.length|0];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const PI=Math.PI,TAU=PI*2;
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};
const turn=(a,t,m)=>a+clamp(angDiff(a,t),-m,m);
const d2=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const gauss=()=>(Math.random()+Math.random()+Math.random()-1.5)/1.5;
const isTouch=('ontouchstart' in window)||navigator.maxTouchPoints>0;

if(!window.THREE){document.body.insertAdjacentHTML('beforeend','<div class="ovl"><div class="panel">Could not load the 3D engine. Check your connection and reload.</div></div>');return;}

// ---------------- constants
const EYE=1.62,BODY_H=1.85,HEAD_Y=1.5,RAD=0.42,SPEED=6.3,GRAV=18,WALK=.52,CROUCH_DROP=.55;
const CRATE_H=2.4,BARREL_H=1.25;
const FREEZE=6,BOMB_TIME=40,BUY_TIME=22,RESPAWN=2.6,ROUND_TIME=105;

// ---------------- weapons
function W(name,cat,team,price,dmg,rof,mag,res,reload,spread,move,recoil,speed,pen,reward,kick,extra){
  return Object.assign({name,cat,slot:cat==='pistol'?'secondary':'primary',team,price,dmg,rof,mag,res,reload,spread,move,recoil,speed,pen,reward,kick},extra||{});}
const WPN={
  knife:{name:'Knife',slot:'knife',cat:'melee',dmg:40,rof:.42,melee:1,speed:1.08,pen:.85,reward:1500},
  he:{name:'HE Grenade',short:'HE',slot:'grenade',cat:'nade',nade:1,price:300,speed:1,rof:.9,max:1},
  flash:{name:'Flashbang',short:'Flash',slot:'grenade',cat:'nade',nade:1,price:200,speed:1,rof:.9,max:2},
  smoke:{name:'Smoke Grenade',short:'Smoke',slot:'grenade',cat:'nade',nade:1,price:300,speed:1,rof:.9,max:1},
  molly:{name:'Molotov',short:'Molly',slot:'grenade',cat:'nade',nade:1,price:400,speed:1,rof:.9,max:1,pen:1},
  glock:W('Glock-18','pistol','T',200,30,.13,20,120,2.2,.012,.05,.012,1,.47,300,.012),
  usp:W('USP-S','pistol','CT',200,35,.16,12,24,2.2,.008,.045,.014,1,.5,300,.014,{short:'USP-S'}),
  p250:W('P250','pistol',null,300,38,.15,13,26,2.2,.011,.05,.02,1,.64,300,.02),
  tec9:W('Tec-9','pistol','T',500,33,.12,18,90,2.5,.016,.06,.018,1,.9,300,.018),
  fiveseven:W('Five-SeveN','pistol','CT',500,32,.12,20,100,2.2,.011,.05,.016,1,.91,300,.016),
  deagle:W('Desert Eagle','pistol',null,700,63,.32,7,35,2.2,.008,.11,.05,.96,.93,300,.05,{short:'Deagle'}),
  mac10:W('MAC-10','smg','T',1050,29,.075,30,100,2.6,.02,.03,.009,.98,.57,600,.008,{auto:1}),
  mp9:W('MP9','smg','CT',1250,26,.07,30,120,2.1,.016,.03,.008,.96,.6,600,.008,{auto:1}),
  ump:W('UMP-45','smg',null,1200,35,.09,25,100,3.5,.016,.035,.01,.92,.65,600,.01,{auto:1}),
  p90:W('P90','smg',null,2350,26,.07,50,100,3.3,.018,.03,.007,.92,.69,300,.007,{auto:1}),
  nova:W('Nova','heavy',null,1050,26,.88,8,32,3.5,.07,.02,0,.88,.5,900,.06,{pellets:9}),
  xm1014:W('XM1014','heavy',null,2000,20,.35,7,32,3,.075,.02,0,.87,.8,900,.045,{pellets:6,auto:1}),
  negev:W('Negev','heavy',null,1700,35,.075,150,200,5.7,.02,.14,.006,.78,.71,300,.01,{auto:1}),
  galil:W('Galil AR','rifle','T',1800,30,.09,35,90,3,.009,.1,.012,.86,.775,300,.014,{auto:1,short:'Galil'}),
  famas:W('FAMAS','rifle','CT',2050,30,.09,25,90,3.3,.008,.1,.011,.88,.7,300,.013,{auto:1}),
  ak:W('AK-47','rifle','T',2700,36,.1,30,90,2.4,.006,.11,.011,.86,.775,300,.016,{auto:1}),
  m4:W('M4A4','rifle','CT',3100,33,.09,30,90,3,.005,.1,.009,.9,.7,300,.013,{auto:1}),
  sg553:W('SG 553','rifle','T',3000,30,.09,30,90,2.8,.005,.11,.01,.84,1,300,.013,{auto:1,zoom:.55}),
  aug:W('AUG','rifle','CT',3300,28,.09,30,90,3.8,.005,.1,.009,.88,.9,300,.012,{auto:1,zoom:.55}),
  ssg08:W('SSG 08','sniper',null,1700,88,1.25,10,90,3.7,.03,.05,0,.92,.85,300,.04,{zoom:.3,scoped:.0015,sniper:1,short:'Scout'}),
  awp:W('AWP','sniper',null,4750,115,1.45,5,30,3.6,.09,.25,0,.8,.975,100,.06,{zoom:.28,scoped:.0012,sniper:1}),
};
for(const k in WPN)WPN[k].key=k;
const NADES=['he','flash','smoke','molly'];
const KNIFE={key:'knife',mag:Infinity,res:0};
const NADEW={he:{key:'he',mag:Infinity,res:0},flash:{key:'flash',mag:Infinity,res:0},smoke:{key:'smoke',mag:Infinity,res:0},molly:{key:'molly',mag:Infinity,res:0}};
const GEAR={kevlar:{name:'Kevlar Vest',price:650},armor:{name:'Kevlar + Helmet',price:1000},kit:{name:'Defuse Kit',price:400,team:'CT'}};
const gun=k=>({key:k,mag:WPN[k].mag,res:WPN[k].res});
const shortName=k=>WPN[k].short||WPN[k].name;

// ---------------- bot skill and behaviour
const DIFF={
  easy:{comp:.15,react:.7,err:.12,turn:3.2,hs:.1,acc:1.9,stop:.1,see:50,crouch:0,label:'Slow to react, sprays wide, rarely aims for the head.'},
  normal:{comp:.45,react:.42,err:.065,turn:5.5,hs:.22,acc:1.35,stop:.4,see:65,crouch:.1,label:'Casual opponents that still punish you in the open.'},
  hard:{comp:.7,react:.26,err:.035,turn:9,hs:.38,acc:1.05,stop:.75,see:80,crouch:.25,label:'Counter-strafes, bursts and hunts for headshots.'},
  expert:{comp:.85,react:.17,err:.02,turn:13,hs:.52,acc:.9,stop:.9,see:95,crouch:.35,label:'Fast flicks and tight sprays. Expect to lose duels you take carelessly.'},
  insane:{comp:.95,react:.1,err:.01,turn:20,hs:.7,acc:.75,stop:1,see:110,crouch:.4,label:'Near-instant reactions. For clutch masochists.'},
};
const STYLE={
  passive:{hunt:.45,wait:[7,16],rot:.25,push:0},
  balanced:{hunt:1,wait:[1,7],rot:.4,push:.15},
  aggressive:{hunt:1.6,wait:[0,2],rot:.6,push:.45},
};
// recoil: auto weapons climb, then wander left and right; semi-autos kick a little
function sprayOffset(def,n){
  if(!def||!def.kick||def.melee||def.nade||n<.5)return[0,0];
  const k=def.kick;
  if(!def.auto)return[0,Math.min(n,3)*k*.35];
  const up=Math.min(n,10)*k*.55+Math.max(0,n-10)*k*.06;
  const side=n<5?Math.sin(n*1.3)*k*.15:Math.sin((n-5)*.42+def.key.length)*k*2.2*Math.min(1,(n-5)/4);
  return[side,up];
}
const AR=['awp','ak','m4','sg553','famas','galil','p90','ump','xm1014','nova','negev','mac10','deagle','fiveseven','tec9','p250','glock','knife'];
const LEN={short:{rounds:5,ffa:15,tdm:30,time:240},normal:{rounds:8,ffa:25,tdm:50,time:360},long:{rounds:13,ffa:40,tdm:80,time:540}};
const NAMES=['Ace','Blitz','Cobra','Dingo','Echo','Fury','Ghost','Havoc','Jinx','Kilo','Lynx','Mamba','Nova','Onyx','Pike','Rook','Sarge','Talon','Viper','Wolf','Brick','Cinder','Dusk','Flint','Gauge','Hex','Ivy','Jett','Knox','Rust'];

function loadoutFor(team,kind){
  const T=team==='T',pistol=T?'glock':'usp';
  switch(kind){
    case 'pistols':return{primary:null,secondary:pick(T?['glock','p250','tec9','deagle']:['usp','p250','fiveseven','deagle'])};
    case 'smgs':return{primary:pick([T?'mac10':'mp9','ump','p90','nova','xm1014']),secondary:pistol};
    case 'rifles':return{primary:pick(T?['ak','ak','galil','sg553']:['m4','m4','famas','aug']),secondary:pistol};
    case 'snipers':return{primary:pick(['awp','ssg08']),secondary:'deagle'};
    case 'knives':return{primary:null,secondary:null};
    default:return{primary:pick(T?['ak','ak','ak','galil','sg553','awp','mac10','p90','ssg08','nova']:['m4','m4','m4','famas','aug','awp','mp9','p90','ssg08','xm1014']),secondary:pistol};
  }
}

// ---------------- settings
const S={tod:'day',music:'on',dynres:'on',layout:{},btnScale:1,xh:{style:'classic',color:'#9ff59a',size:7,gap:4,thick:2,dot:true,outline:true,dynamic:true},vignette:'on',mode:'defuse',map:'dunes',side:'T',mates:5,foes:5,len:'normal',diffE:'normal',diffA:'normal',style:'balanced',loadout:'buy',nades:'on',
  gfx:isTouch?'med':'high',sens:7,fov:100,vol:7,assist:'on',fps:'off'};
try{Object.assign(S,JSON.parse(localStorage.getItem('clutchpoint3d-v2')||'{}'));}catch(e){}
const saveS=()=>{try{localStorage.setItem('clutchpoint3d-v2',JSON.stringify(S));}catch(e){}};
