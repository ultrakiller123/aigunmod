// ---------------- weapon models
const GM={
  glock:{t:'pistol',L:.19,c:0x2a2b2e},usp:{t:'pistol',L:.22,c:0x2a2b2e,sup:.13},p250:{t:'pistol',L:.2,c:0x3a3a3c},
  tec9:{t:'pistol',L:.26,c:0x2f3033,longmag:1},fiveseven:{t:'pistol',L:.21,c:0x55524c},deagle:{t:'pistol',L:.27,c:0xa3a7ac},
  mac10:{t:'smg',L:.3,c:0x2a2b2e,stock:'none',mag:'grip'},mp9:{t:'smg',L:.36,c:0x1f2022,stock:'fold',mag:'grip'},
  ump:{t:'smg',L:.5,c:0x26272a,stock:'solid',mag:'straight'},p90:{t:'bull',L:.5,c:0x1d1e20,mag:'top'},
  nova:{t:'shotgun',L:.95,c:0x232323,wood:0x6b4a2a},xm1014:{t:'shotgun',L:.95,c:0x2a2b2e},
  negev:{t:'rifle',L:.95,c:0x2b2d30,mag:'box',stock:'solid'},
  galil:{t:'rifle',L:.8,c:0x3a3a33,wood:0x5d4a30,mag:'curved',stock:'skeleton'},famas:{t:'bull',L:.72,c:0x2c2d2f,handle:1,mag:'straight'},
  ak:{t:'rifle',L:.82,c:0x2a2b2e,wood:0x7a4a24,mag:'curved',stock:'solid'},m4:{t:'rifle',L:.78,c:0x24252a,mag:'straight',stock:'skeleton',rail:1},
  sg553:{t:'rifle',L:.8,c:0x3d3d36,mag:'curved',stock:'solid',scope:'small'},aug:{t:'bull',L:.72,c:0x4d5a3f,scope:'small',mag:'straight'},
  ssg08:{t:'rifle',L:1,c:0x3a4048,scope:'big',stock:'solid',mag:'small'},awp:{t:'rifle',L:1.1,c:0x3d4a33,scope:'big',stock:'solid',mag:'small'},
};
function nadeMesh(k){const g=new THREE.Group();
  if(k==='he'){const s=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),mat(0x4b5a2c));g.add(s);g.add(box(.02,.05,.015,0x888888,.02,.04,0));g.add(cyl(.012,.02,0x666666,0,.05,0,6,'y'));}
  else{g.add(cyl(.032,.12,k==='flash'?0x8a8c8f:0x55635a,0,0,0,10,'y'));g.add(cyl(.034,.02,k==='flash'?0x2a2a2a:0xb8a040,0,.03,0,10,'y'));g.add(box(.018,.06,.012,0x888888,.03,.03,0));}
  g.userData={tip:0,mag:null};return g;}
const BLADE=0xc8ccd2;
function seg(a,b,w,h,color){const len=a.distanceTo(b);const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,len),mat(color));m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);return m;}
function knifeMesh(type){
  const g=new THREE.Group(),dark=0x1b1b1d;
  if(type==='karambit'){const pts=[[0,0,-.06],[0,-.012,-.11],[0,-.03,-.16],[0,-.035,-.2],[0,-.02,-.235],[0,.01,-.255]];
    for(let i=0;i<pts.length-1;i++)g.add(seg(V3(...pts[i]),V3(...pts[i+1]),.01,.038-i*.004,BLADE));
    g.add(box(.03,.04,.11,dark,0,0,0));const ring=new THREE.Mesh(new THREE.TorusGeometry(.026,.007,6,14),mat(dark));ring.rotation.y=PI/2;ring.position.set(0,0,.075);g.add(ring);g.userData.tip=-.25;}
  else if(type==='butterfly'){g.add(box(.011,.034,.17,BLADE,0,0,-.15));const t=box(.011,.022,.05,BLADE,0,.006,-.255);t.rotation.x=.3;g.add(t);
    g.add(box(.012,.028,.13,0x2a2a2e,.013,0,0));g.add(box(.012,.028,.13,0x2a2a2e,-.013,0,0));g.add(box(.04,.01,.012,0x888888,0,-.014,.06));g.userData.tip=-.27;}
  else if(type==='bayonet'){g.add(box(.013,.05,.24,BLADE,0,.004,-.19));g.add(box(.004,.008,.2,0x8a8e94,.008,.012,-.18));const t=box(.013,.032,.06,BLADE,0,-.004,-.32);t.rotation.x=-.35;g.add(t);
    g.add(box(.075,.024,.02,0x333333,0,0,-.065));for(let i=0;i<5;i++)g.add(box(.034,.046,.016,i%2?0x3a2a1a:0x2a1c10,0,0,-.04+i*.024));g.userData.tip=-.34;}
  else{g.add(box(.012,.045,.19,BLADE,0,.005,-.16));const tipM=box(.012,.03,.06,BLADE,0,0,-.27);tipM.rotation.x=.35;g.add(tipM);
    g.add(box(.055,.02,.018,0x222222,0,0,-.065));g.add(box(.03,.042,.12,dark,0,0,0));g.userData.tip=-.3;}
  return g;
}
const STD={};
function stdMat(hex){if(STD[hex+Q])return STD[hex+Q];const wood=[0x7a4a24,0x6b4a2a,0x5d4a30,0x6b3f1f].includes(hex);
  return STD[hex+Q]=new THREE.MeshStandardMaterial({color:hex,metalness:wood?0:hex===BLADE?.9:.55,roughness:wood?.75:hex===BLADE?.18:.42});}
function finishGun(g,key,skin){
  const s=GM[key]||{},c=s.c,bodyCols=new Set(key==='knife'?[BLADE]:[c,s.wood,shade(c||0,1.15),shade(c||0,.9),shade(c||0,.95)]);
  const sm=skin?skinMat(skin):null;
  g.traverse(n=>{if(!n.isMesh||!n.material.color)return;const hex=n.material.color.getHex();
    if(sm&&bodyCols.has(hex))n.material=sm;else if(Q==='high')n.material=stdMat(hex);});
  return g;
}
function gunMesh(key,skin){
  const g=new THREE.Group();g.userData={tip:-.3,mag:null};
  if(key==='knife'){const k=knifeMesh(skin?SKINS[skin.skin].kt:'default');k.userData.mag=null;return finishGun(k,key,skin);}
  if(WPN[key].nade)return nadeMesh(key);
  const s=GM[key],L=s.L,c=s.c,dark=0x18191b;
  if(s.t==='pistol'){
    g.add(box(.034,.045,L,c,0,.03,-L/2+.03));
    g.add(box(.03,.03,L*.8,dark,0,-.004,-L/2+.05));
    const grip=box(.032,.11,.05,dark,0,-.07,.03);grip.rotation.x=-.22;g.add(grip);
    g.add(box(.008,.03,.05,dark,0,-.03,-.03));
    g.add(box(.008,.012,.008,0x111111,0,.058,-L+.05));g.add(box(.022,.012,.008,0x111111,0,.058,.0));
    if(s.sup)g.add(cyl(.019,s.sup,0x1d1d1d,0,.03,-L-s.sup/2+.03));
    const mag=s.longmag?box(.026,.14,.035,0x222222,0,-.11,-.05):box(.026,.03,.042,0x111111,0,-.135,.045);g.add(mag);g.userData.mag=mag;
    g.userData.tip=-L-(s.sup||0)+.02;return finishGun(g,key,skin);
  }
  const bull=s.t==='bull',wood=s.wood;
  const rz=bull?L*.06:-L*.1;
  g.add(box(.058,.088,L*.42,c,0,0,rz));
  if(s.rail||s.scope)g.add(box(.032,.014,L*.34,0x161616,0,.05,rz));
  g.add(cyl(.0135,L*.45,dark,0,.016,-L*.56));
  g.add(cyl(.02,.06,0x111111,0,.016,-L*.8));
  g.add(box(.056,.062,L*.24,wood||shade(c,1.15),0,.004,-L*.38));
  const grip=box(.04,.1,.05,0x202020,0,-.085,bull?-L*.1:.03);grip.rotation.x=-.25;g.add(grip);
  if(s.t==='shotgun'){g.add(cyl(.013,L*.38,0x151515,0,-.026,-L*.46));const pump=box(.052,.05,.16,wood||0x262626,0,-.03,-L*.47);g.add(pump);g.userData.mag=pump;}
  else{let mag;
    if(s.mag==='curved'){mag=new THREE.Group();mag.position.set(0,-.05,bull?L*.12:-L*.12);mag.add(box(.034,.1,.05,shade(c,.9),0,-.04,0));const m2=box(.034,.09,.05,shade(c,.9),0,-.12,-.035);m2.rotation.x=.42;mag.add(m2);}
    else if(s.mag==='straight'){mag=box(.032,.15,.048,0x1e1e1e,0,-.11,bull?L*.14:-L*.12);}
    else if(s.mag==='box'){mag=box(.1,.12,.12,0x3d3d30,-.02,-.1,-L*.08);}
    else if(s.mag==='top'){mag=box(.05,.03,L*.6,0x3a3a3a,0,.06,-L*.05);}
    else if(s.mag==='grip'){mag=box(.028,.05,.04,0x111111,0,-.15,.05);}
    else if(s.mag==='small'){mag=box(.032,.06,.07,0x1e1e1e,0,-.07,-L*.08);}
    if(mag){g.add(mag);g.userData.mag=mag;}}
  if(bull){g.add(box(.064,.11,L*.42,c,0,-.012,L*.22));if(s.handle)g.add(box(.02,.06,L*.5,c,0,.08,-L*.05));}
  else{const st=s.stock||(s.t==='shotgun'?'solid':'solid');
    if(st==='solid'){const m=box(.05,.1,L*.32,wood||shade(c,.95),0,-.025,L*.27);g.add(m);g.add(box(.052,.05,.03,0x111111,0,-.035,L*.43));}
    else if(st==='skeleton'){g.add(box(.038,.07,L*.3,0x1f1f1f,0,-.015,L*.24));g.add(box(.04,.09,.025,0x111111,0,-.03,L*.39));}
    else if(st==='fold'){g.add(box(.01,.01,.22,0x222222,.02,-.01,.13));g.add(box(.01,.01,.22,0x222222,-.02,-.01,.13));}}
  if(s.scope==='big'){g.add(cyl(.024,.34,0x121212,0,.088,-L*.12));g.add(cyl(.034,.07,0x121212,0,.088,-L*.12-.18));g.add(cyl(.03,.06,0x121212,0,.088,-L*.12+.17));
    g.add(box(.02,.04,.02,0x121212,0,.06,-L*.12-.08));g.add(box(.02,.04,.02,0x121212,0,.06,-L*.12+.08));}
  else if(s.scope==='small'){g.add(cyl(.02,.13,0x151515,0,.078,-L*.1));}
  else if(!bull){g.add(box(.008,.025,.008,0x111111,0,.05,-L*.78));}
  g.userData.tip=-L*.8-.04;return finishGun(g,key,skin);
}

// ---------------- characters
const CHAR={
  T:[{shirt:0x8a7350,pants:0x4a4236,vest:0x5f4b31,head:'balaclava',hc:0x26221f,acc:0xe3a23b,skin:0xc99a74},
     {shirt:0x5b5f3e,pants:0x3b3a30,vest:0x3d3a2a,head:'cap',hc:0x6a2d24,acc:0xe3a23b,skin:0xb8875f},
     {shirt:0x3a3836,pants:0x2a2a2c,vest:0x4a3a2a,head:'bandana',hc:0x8a2a1e,acc:0xe3a23b,skin:0xa8754f}],
  CT:[{shirt:0x3d5068,pants:0x2b3644,vest:0x26364a,head:'helmet',hc:0x1f2a38,acc:0x62a6ea,skin:0xd6a982},
      {shirt:0x4d5a4a,pants:0x3a4237,vest:0x2f382c,head:'helmet',hc:0x2a3326,acc:0x62a6ea,skin:0xc4936a},
      {shirt:0x2d3440,pants:0x252a33,vest:0x1d222a,head:'capset',hc:0x1a1d22,acc:0x62a6ea,skin:0xe0b48f}]};
const V3=(x,y,z)=>new THREE.Vector3(x,y,z);
function limb(a,b,th,color){const len=a.distanceTo(b);const m=new THREE.Mesh(new THREE.BoxGeometry(th,th,len),mat(color));m.position.copy(a).add(b).multiplyScalar(.5);m.lookAt(b);return m;}
function makeModel(team,vi){
  const c=CHAR[team][vi%3],root=new THREE.Group();root.rotation.order='YXZ';
  const hips=new THREE.Group();hips.position.y=.95;root.add(hips);
  hips.add(box(.36,.18,.24,c.pants,0,0,0));hips.add(box(.38,.05,.26,0x1d1b19,0,.07,0));
  const legs=[];
  for(const sx of[-1,1]){const th=new THREE.Group();th.position.set(.1*sx,-.05,0);hips.add(th);
    th.add(box(.17,.46,.2,c.pants,0,-.23,0));th.add(box(.06,.12,.12,shade(c.pants,.8),.1*sx,-.2,0));
    const kn=new THREE.Group();kn.position.y=-.46;th.add(kn);
    kn.add(box(.15,.42,.18,c.pants,0,-.21,0));kn.add(box(.17,.12,.3,0x1d1b19,0,-.44,-.04));kn.add(box(.13,.1,.04,0x22201e,0,-.03,-.1));
    legs.push({th,kn});}
  const spine=new THREE.Group();spine.position.y=.08;hips.add(spine);
  spine.add(box(.42,.52,.24,c.shirt,0,.27,0));spine.add(box(.46,.38,.3,c.vest,0,.3,0));
  for(const px of[-.13,0,.13])spine.add(box(.1,.12,.06,shade(c.vest,.8),px,.2,-.17));
  spine.add(box(.48,.04,.31,c.acc,0,.12,0));
  if(team==='CT'){spine.add(box(.24,.3,.12,0x1c1f24,0,.32,.2));spine.add(cyl(.008,.3,0x111111,.08,.62,.22,4,'y'));}
  else spine.add(box(.3,.36,.14,shade(c.shirt,.7),0,.3,.19));
  spine.add(box(.14,.12,.2,c.shirt,-.27,.46,0));spine.add(box(.14,.12,.2,c.shirt,.27,.46,0));
  const head=new THREE.Group();head.position.y=.58;spine.add(head);
  head.add(box(.09,.08,.09,c.skin,0,.03,0));head.add(box(.2,.24,.22,c.skin,0,.17,0));
  if(c.head==='balaclava'){head.add(box(.215,.25,.235,c.hc,0,.175,0));head.add(box(.15,.04,.01,c.skin,0,.19,-.118));}
  else{head.add(box(.035,.018,.01,0x1a1a1a,-.05,.19,-.111));head.add(box(.035,.018,.01,0x1a1a1a,.05,.19,-.111));head.add(box(.06,.015,.01,shade(c.skin,.75),0,.09,-.111));}
  if(c.head==='cap'||c.head==='capset'){head.add(box(.23,.08,.24,c.hc,0,.28,0));head.add(box(.2,.02,.12,c.hc,0,.25,-.16));
    if(c.head==='capset'){head.add(box(.04,.09,.09,0x111111,-.12,.18,0));head.add(box(.04,.09,.09,0x111111,.12,.18,0));head.add(box(.24,.025,.03,0x111111,0,.27,0));}}
  if(c.head==='bandana'){head.add(box(.225,.05,.235,c.hc,0,.25,0));head.add(box(.21,.09,.02,c.hc,0,.08,-.112));}
  let helmet=null;
  if(c.head==='helmet'){const hm=helmet=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8,0,TAU,0,PI/2),mat(c.hc));hm.scale.set(1,.85,1.08);hm.position.y=.22;head.add(hm);
    head.add(box(.24,.04,.02,0x111111,0,.235,-.13));head.add(box(.17,.05,.03,0x203038,0,.2,-.125));head.add(box(.012,.14,.012,0x111111,-.105,.13,0));head.add(box(.012,.14,.012,0x111111,.105,.13,0));}
  const aim=new THREE.Group();aim.position.y=.44;spine.add(aim);
  const flash=new THREE.Sprite(flashMat);flash.scale.set(.5,.5,.5);flash.visible=false;
  const bombPack=box(.3,.22,.12,0x8a1f1a,0,.32,.27);bombPack.visible=false;spine.add(bombPack);
  if(!helmet&&c.head==='cap'||c.head==='capset')helmet=head.children.find(m=>m.geometry&&m.geometry.parameters&&m.geometry.parameters.height===.08)||null;
  root.userData={c,hips,legs,spine,head,aim,arms:null,gun:null,gunKey:null,flash,bombPack,phase:rnd(0,6),dead:null,helmet};
  if(Q==='high')root.traverse(n=>{if(n.isMesh)n.castShadow=true;});
  scene.add(root);return root;
}
function setModelGun(m,key){
  const u=m.userData;if(u.gunKey===key)return;u.gunKey=key;
  if(u.arms){u.aim.remove(u.arms);}
  const arms=new THREE.Group();u.aim.add(arms);u.arms=arms;
  const g=gunMesh(key);u.gun=g;const c=u.c;
  const kind=key==='knife'?'knife':WPN[key].nade?'nade':WPN[key].cat==='pistol'?'pistol':'rifle';
  let gp,rh,lh;
  if(kind==='rifle'){const L=(GM[key]||{L:.8}).L;gp=V3(.1,-.08,-.22);rh=V3(.1,-.16,-.2);lh=V3(.1,-.09,-.22-L*.38);}
  else if(kind==='pistol'){gp=V3(.02,-.04,-.5);rh=V3(.03,-.1,-.47);lh=V3(-.01,-.11,-.45);}
  else if(kind==='knife'){gp=V3(.2,-.18,-.36);rh=V3(.2,-.18,-.34);lh=V3(-.26,-.42,-.06);}
  else{gp=V3(.22,-.12,-.32);rh=V3(.22,-.16,-.3);lh=V3(-.26,-.42,-.06);}
  g.position.copy(gp);arms.add(g);
  for(const[S_,H]of[[V3(.23,0,0),rh],[V3(-.23,0,0),lh]]){const E=S_.clone().add(H).multiplyScalar(.5).add(V3(Math.sign(S_.x)*.08,-.16,.06));
    arms.add(limb(S_,E,.11,c.shirt));arms.add(limb(E,H,.095,c.shirt));arms.add(box(.08,.08,.1,0x1f1d1b,H.x,H.y,H.z));
    const bandP=S_.clone().lerp(E,.35);const band=limb(S_.clone().lerp(E,.25),bandP,.118,c.acc);arms.add(band);}
  g.add(u.flash);u.flash.position.set(0,.015,g.userData.tip);
  if(Q==='high')arms.traverse(n=>{if(n.isMesh)n.castShadow=true;});
}
function animateModel(e,dt){
  const m=e.model,u=m.userData,key=curKey(e);
  m.position.set(e.x,e.y,e.z);m.rotation.y=-e.yaw-PI/2;
  setModelGun(m,key);
  u.bombPack.visible=G.bomb&&G.bomb.state==='carried'&&G.bomb.carrier===e;
  if(!e.alive){
    const d=u.dead;if(!d)return;d.t+=dt;const k=1-Math.pow(1-Math.min(1,d.t/.6),3);
    m.rotation.x=d.dir*k*1.5;m.rotation.z=d.side*k*.35;
    m.position.x+=Math.cos(d.push)*k*.5;m.position.z+=Math.sin(d.push)*k*.5;
    u.hips.position.y=.95-k*.15;
    u.legs[0].th.rotation.x=k*.5*d.dir;u.legs[1].th.rotation.x=k*.2;u.legs[0].kn.rotation.x=-k*.7;u.legs[1].kn.rotation.x=-k*1.1;
    u.spine.rotation.x=k*.35*d.dir;u.aim.rotation.x=-1.1*k;u.aim.rotation.z=.4*k;u.head.rotation.x=d.hs?-.6*k:.3*k;
    u.flash.visible=false;if(u.gun)u.gun.visible=d.t<.15;
    return;}
  if(u.gun)u.gun.visible=true;m.rotation.x=0;m.rotation.z=0;
  const spd=Math.min(1,e.moving/SPEED),grounded=e.y<=.01,c=e.crouchV;
  if(grounded&&spd>.05)u.phase+=dt*(4+spd*7);
  u.hips.position.y=.95-c*.42+(grounded?Math.abs(Math.cos(u.phase))*.045*spd:0);
  for(let i=0;i<2;i++){const L=u.legs[i];
    if(!grounded){L.th.rotation.x=.6-i*.3;L.kn.rotation.x=-1.0;continue;}
    const ph=u.phase+(i?PI:0);
    L.th.rotation.x=Math.sin(ph)*.75*spd+c*1.3;L.kn.rotation.x=-(Math.max(0,Math.sin(ph+1.2))*1.15*spd)-c*2.15;}
  u.spine.rotation.x=-.1*spd-c*.18;u.spine.rotation.y=Math.sin(u.phase)*.08*spd;
  const def=WPN[key];
  const rl=e.reloadT>0&&def.reload?Math.sin(clamp(e.reloadT/def.reload,0,1)*PI):0;
  const sinceShot=G.clock-e.lastShot,kick=clamp((.09-sinceShot)/.09,0,1);
  u.aim.rotation.x=e.pitch+.1*spd+c*.18-rl*.55;u.aim.rotation.y=-u.spine.rotation.y+(key==='knife'&&sinceShot<.3?Math.sin(sinceShot/.3*PI)*.9:0);
  u.aim.rotation.z=rl*.35;u.aim.position.z=kick*.06;
  if(def.nade&&sinceShot<.4)u.aim.rotation.x+=Math.sin(sinceShot/.4*PI)*-.9;
  u.head.rotation.x=e.pitch*.5;u.head.rotation.y=0;
  u.flash.visible=sinceShot<.05&&!def.melee&&!def.nade;
  if(u.flash.visible){u.flash.material.rotation=rnd(0,TAU);u.flash.scale.setScalar(rnd(.35,.6));}
}

// ---------------- first-person viewmodel
const VM={root:new THREE.Group(),holder:new THREE.Group(),key:null,team:null,owner:null,base:V3(.17,-.17,-.38),draw:0,inspect:0,swayX:0,swayY:0,kick:0,knifeT:0,knifeSide:1,throwT:0,land:0,bobT:0,lastYaw:0,lastPitch:0,mag:null,magY:0,flash:null,wasAir:false};
VM.root.add(VM.holder);VM.root.scale.setScalar(.82);vmScene.add(VM.root);
VM.flash=new THREE.Sprite(flashMat);VM.flash.scale.setScalar(.32);VM.flash.visible=false;
function resetViewmodel(){VM.key=null;VM.owner=null;}
function buildVM(v,key){
  VM.key=key;VM.team=v.team;VM.owner=v;
  while(VM.holder.children.length)VM.holder.remove(VM.holder.children[0]);
  const skin=v===G.player&&!WPN[key].nade?equippedFor(key):null;VM.skin=skin;
  const c=CHAR[v.team][(v.variant||0)%3],g=gunMesh(key,skin);VM.knifeType=key==='knife'&&skin?SKINS[skin.skin].kt:'default';
  const kind=key==='knife'?'knife':WPN[key].nade?'nade':WPN[key].cat==='pistol'?'pistol':'rifle';
  let rh,lh;
  if(kind==='rifle'){const L=(GM[key]||{L:.8}).L;rh=V3(0,-.1,.03);lh=V3(-.005,-.04,-L*.38);VM.base=V3(.16,-.17,-.36);}
  else if(kind==='pistol'){rh=V3(0,-.1,.04);lh=V3(-.03,-.1,.02);VM.base=V3(.12,-.15,-.36);}
  else if(kind==='knife'){rh=V3(0,0,.03);lh=null;VM.base=V3(.2,-.2,-.36);}
  else{rh=V3(0,-.02,.03);lh=null;VM.base=V3(.18,-.2,-.34);}
  VM.holder.add(g);
  const arm=(from,to)=>{const el=from.clone().lerp(to,.55).add(V3(0,-.06,0));VM.holder.add(limb(from,el,.085,c.shirt));VM.holder.add(limb(el,to,.072,shade(c.shirt,.9)));
    const glove=box(.075,.07,.1,0x1d1c1a,to.x,to.y,to.z);VM.holder.add(glove);VM.holder.add(box(.08,.02,.06,c.acc,el.x,el.y+.04,el.z));};
  arm(V3(.18,-.3,.45),rh);if(lh)arm(V3(-.28,-.32,.4),lh);
  VM.mag=g.userData.mag;VM.magY=VM.mag?VM.mag.position.y:0;
  g.add(VM.flash);VM.flash.position.set(0,.016,g.userData.tip);
  VM.draw=.45;if(v===G.player)sfxDraw();
}
function animateVM(v,dt){
  const key=curKey(v);
  if(key!==VM.key||v.team!==VM.team||v!==VM.owner)buildVM(v,key);
  const def=WPN[key],spd=Math.min(1,v.moving/SPEED),grounded=v.y<=.01;
  const dYaw=angDiff(VM.lastYaw,v.yaw),dPitch=v.pitch-VM.lastPitch;VM.lastYaw=v.yaw;VM.lastPitch=v.pitch;
  const k=Math.min(1,dt*10);VM.swayX=lerp(VM.swayX,clamp(dYaw*-1.6,-.05,.05),k);VM.swayY=lerp(VM.swayY,clamp(dPitch*-1.2,-.04,.04),k);
  if(grounded)VM.bobT+=dt*(3+spd*8);
  if(VM.wasAir&&grounded)VM.land=1;VM.wasAir=!grounded;
  VM.land=Math.max(0,VM.land-dt*4);VM.draw=Math.max(0,VM.draw-dt);VM.inspect=Math.max(0,VM.inspect-dt);
  VM.kick=Math.max(0,VM.kick-dt*(VM.kick*14+.2));VM.knifeT=Math.max(0,VM.knifeT-dt);VM.throwT=Math.max(0,VM.throwT-dt);
  const bx=Math.sin(VM.bobT)*.014*spd,by=-Math.abs(Math.cos(VM.bobT))*.014*spd;
  let px=VM.base.x+bx+VM.swayX,py=VM.base.y+by+VM.swayY-VM.land*.05-v.crouchV*.01,pz=VM.base.z;
  let rx=0,ry=VM.swayX*1.5,rz=VM.swayX*2;
  const dk=VM.draw/.45;rx-=dk*1.1;py-=dk*.25;ry-=dk*.3;
  if(v.reloadT>0&&def.reload){const r=1-v.reloadT/def.reload,env=Math.sin(r*PI);rz+=env*.55;rx+=env*.22;py-=env*.04;px-=env*.03;
    if(VM.mag){const mm=r<.15?0:r<.32?(r-.15)/.17:r<.6?1:r<.8?1-(r-.6)/.2:0;VM.mag.position.y=VM.magY-mm*.35;VM.mag.visible=mm<.98;}}
  else if(VM.mag){VM.mag.position.y=VM.magY;VM.mag.visible=true;}
  if(VM.inspect>0){const t=1-VM.inspect/2.4,s=Math.sin(t*PI);
    if(key==='knife'&&VM.knifeType!=='default'){const e=t<.15?t/.15:t>.85?(1-t)/.15:1;rz+=(VM.knifeType==='butterfly'?t*TAU*3:-t*TAU*2)*e;ry+=s*.6;px-=s*.05;py+=s*.03;}
    else{ry+=s*1.15;rz+=s*.35;px-=s*.07;rx+=Math.sin(t*TAU)*.15;}}
  pz+=VM.kick*.6;rx+=VM.kick*2.2;
  if(VM.knifeT>0){const t=1-VM.knifeT/.3,s=Math.sin(t*PI);ry+=VM.knifeSide*(t*2-1)*.9*s+(-.3*s);rx-=s*.5;pz-=s*.12;px-=VM.knifeSide*s*.06;}
  if(VM.throwT>0){const t=1-VM.throwT/.5;if(t<.4){pz+=t/.4*.12;py+=t/.4*.06;rx+=t/.4*.6;}else{const s=(t-.4)/.6;pz-=Math.sin(s*PI)*.18;rx-=Math.sin(s*PI)*.9;py-=s*.2;}}
  VM.root.position.set(px*.95,py*.95,pz-.06);VM.root.rotation.set(rx,ry,rz);
  updateShells(dt);
  const fl=G.clock-v.lastShot<.05&&!def.melee&&!def.nade;VM.flash.visible=fl;
  if(fl){VM.flash.material.rotation=rnd(0,TAU);VM.flash.scale.setScalar(rnd(.22,.38));vmLight.intensity=3;}
}

// brass casings ejected in first person
const shellGeo=new THREE.CylinderGeometry(.006,.006,.028,6);const shellMat=new THREE.MeshLambertMaterial({color:0xc9a040,emissive:0x2a1a00});
const SHELLS=[];for(let i=0;i<12;i++){const m=new THREE.Mesh(shellGeo,shellMat);m.visible=false;vmScene.add(m);SHELLS.push({m,v:new THREE.Vector3(),life:0});}let shellI=0;
function ejectShell(){const sh=SHELLS[shellI++%SHELLS.length];VM.root.updateMatrixWorld();sh.m.position.copy(V3(.02,.03,-.1).applyMatrix4(VM.root.matrixWorld));
  sh.v.set(rnd(.9,1.5),rnd(.8,1.3),rnd(-.1,.3));sh.life=.7;sh.m.visible=true;sh.m.rotation.set(rnd(0,3),rnd(0,3),rnd(0,3));}
function updateShells(dt){for(const sh of SHELLS){if(!sh.m.visible)continue;sh.life-=dt;if(sh.life<=0){sh.m.visible=false;continue;}sh.v.y-=5*dt;sh.m.position.addScaledVector(sh.v,dt);sh.m.rotation.x+=dt*18;sh.m.rotation.z+=dt*11;}}
