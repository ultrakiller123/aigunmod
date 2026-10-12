// ---------------- renderer and scene
const cv=$('cv');
const renderer=new THREE.WebGLRenderer({canvas:cv,antialias:!isTouch,powerPreference:'high-performance'});
renderer.autoClear=false;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(75,1,.05,700);camera.rotation.order='YXZ';
const hemi=new THREE.HemisphereLight(0xffffff,0x444444,.8);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,.8);scene.add(sun);scene.add(sun.target);
const muzzleLight=new THREE.PointLight(0xffc070,0,10,2);scene.add(muzzleLight);
const boomLight=new THREE.PointLight(0xffa040,0,30,2);scene.add(boomLight);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);
vmScene.add(new THREE.HemisphereLight(0xffffff,0x504030,1));const vmSun=new THREE.DirectionalLight(0xffffff,.55);vmSun.position.set(.4,1,.5);vmScene.add(vmSun);
const vmLight=new THREE.PointLight(0xffc070,0,3,2);vmLight.position.set(.1,0,-.8);vmScene.add(vmLight);
let Q='med';
function applyQuality(){
  Q=S.gfx;const dpr=window.devicePixelRatio||1;
  renderer.setPixelRatio(Q==='low'?Math.min(dpr,1)*.75:Q==='med'?Math.min(dpr,1.35):Math.min(dpr,2));
  renderer.shadowMap.enabled=Q==='high';
}

// materials (rebuilt with the world so quality changes apply)
let MAT={};
function mat(c,o){const k=c+'|'+(o?JSON.stringify(o):'');if(MAT[k])return MAT[k];
  const M=Q==='high'?new THREE.MeshPhongMaterial(Object.assign({color:c,shininess:12,specular:0x161616},o||{})):new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
  return MAT[k]=M;}
function box(w,h,d,c,x=0,y=0,z=0){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);return m;}
function cyl(r,len,c,x=0,y=0,z=0,seg=8,axis='z'){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,seg),mat(c));if(axis==='z')m.rotation.x=PI/2;m.position.set(x,y,z);return m;}
const shade=(hex,f)=>{const r=(hex>>16&255)*f,g=(hex>>8&255)*f,b=(hex&255)*f;return(clamp(r|0,0,255)<<16)|(clamp(g|0,0,255)<<8)|clamp(b|0,0,255);};

// ---------------- procedural textures
function canvasTex(w,h,draw,rep){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);
  if(rep)t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=Math.min(Q==='low'?2:8,renderer.capabilities.getMaxAnisotropy());return t;}
function speckle(g,w,h,n,cols,sz=2){for(let i=0;i<n;i++){g.fillStyle=cols[i%cols.length];g.fillRect(Math.random()*w,Math.random()*h,1+Math.random()*sz,1+Math.random()*sz);}}
function blotch(g,x,y,r,col){const gr=g.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
function wrapBlotch(g,w,h,x,y,r,col){for(const ox of[-w,0,w])for(const oy of[-h,0,h])if(x+ox>-r&&x+ox<w+r&&y+oy>-r&&y+oy<h+r)blotch(g,x+ox,y+oy,r,col);}
const WALLTEX={
  sandstone(g,w,h){
    g.fillStyle='#c6aa80';g.fillRect(0,0,w,h);
    const rows=4,rh=h/rows;
    for(let r=0;r<rows;r++){const cols=3,cw=w/cols,off=(r%2)*cw/2;
      for(let c=-1;c<cols;c++){const x=c*cw+off,v=rnd(-14,14);g.fillStyle=`rgb(${198+v},${170+v},${128+v})`;g.fillRect(x+2,r*rh+2,cw-4,rh-4);
        for(let k=0;k<6;k++)blotch(g,x+rnd(0,cw),r*rh+rnd(0,rh),rnd(6,20),`rgba(${rnd(0,1)<.5?'120,90,55':'235,215,175'},.18)`);}
      g.fillStyle='rgba(96,72,44,.55)';g.fillRect(0,r*rh,w,3);
      for(let c=0;c<=3;c++){g.fillRect(c*(w/3)+off-1,r*rh,3,rh);}}
    speckle(g,w,h,w*h/14,['rgba(110,80,50,.3)','rgba(245,228,190,.3)','rgba(80,60,40,.2)']);
    for(let i=0;i<5;i++){g.strokeStyle='rgba(90,66,40,.35)';g.lineWidth=1;g.beginPath();let x=rnd(0,w),y=rnd(0,h);g.moveTo(x,y);for(let k=0;k<5;k++){x+=rnd(-12,12);y+=rnd(4,14);g.lineTo(x,y);}g.stroke();}
  },
  stucco(g,w,h){
    g.fillStyle='#e7dcc8';g.fillRect(0,0,w,h);
    for(let i=0;i<60;i++)wrapBlotch(g,w,h,rnd(0,w),rnd(0,h),rnd(10,50),i%3?'rgba(200,180,150,.12)':'rgba(255,250,240,.2)');
    for(let p=0;p<1;p++){const px=rnd(0,w*.7),py=rnd(0,h*.7),pw=rnd(w*.15,w*.3),ph=rnd(h*.1,h*.22);
      g.save();g.beginPath();g.ellipse(px+pw/2,py+ph/2,pw/2,ph/2,0,0,TAU);g.clip();g.fillStyle='#8c4a32';g.fillRect(px,py,pw,ph);
      for(let y=py;y<py+ph;y+=10)for(let x=px-((y/10|0)%2)*10;x<px+pw;x+=20){const v=rnd(-15,15);g.fillStyle=`rgb(${170+v},${88+v},${60+v})`;g.fillRect(x+1,y+1,18,8);}
      g.restore();g.strokeStyle='rgba(120,100,80,.5)';g.lineWidth=2;g.beginPath();g.ellipse(px+pw/2,py+ph/2,pw/2,ph/2,0,0,TAU);g.stroke();}
    speckle(g,w,h,w*h/18,['rgba(150,130,100,.25)','rgba(255,255,255,.3)']);
    g.strokeStyle='rgba(110,95,75,.35)';for(let i=0;i<4;i++){g.lineWidth=1;g.beginPath();let x=rnd(0,w),y=rnd(0,h);g.moveTo(x,y);for(let k=0;k<6;k++){x+=rnd(-10,14);y+=rnd(-4,12);g.lineTo(x,y);}g.stroke();}
  },
  concrete(g,w,h){
    g.fillStyle='#93968f';g.fillRect(0,0,w,h);
    for(let i=0;i<70;i++)wrapBlotch(g,w,h,rnd(0,w),rnd(0,h),rnd(8,40),i%2?'rgba(70,72,70,.12)':'rgba(190,192,186,.14)');
    for(let i=0;i<10;i++){const x=rnd(0,w),gr=g.createLinearGradient(0,0,0,h);gr.addColorStop(0,'rgba(50,48,44,.25)');gr.addColorStop(1,'rgba(50,48,44,0)');g.fillStyle=gr;g.fillRect(x,0,rnd(3,10),h*rnd(.3,.9));}
    speckle(g,w,h,w*h/12,['rgba(60,60,58,.3)','rgba(210,210,205,.25)']);
    g.fillStyle='rgba(50,50,48,.6)';g.fillRect(0,0,w,3);g.fillRect(0,0,3,h);g.fillRect(w/2,0,2,h);
    for(const x of[w*.25,w*.75])for(const y of[h*.25,h*.75]){g.fillStyle='rgba(40,40,38,.7)';g.beginPath();g.arc(x,y,4,0,TAU);g.fill();g.fillStyle='rgba(200,200,195,.3)';g.beginPath();g.arc(x+1,y+1,2,0,TAU);g.fill();}
  },
};
function drawFloor(g,FP,theme){
  const W=MW*FP,H=MH*FP;g.fillStyle='#3a3228';g.fillRect(0,0,W,H);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){
    if(cell(x,y)===1)continue;const X=x*FP,Y=y*FP,hsh=((x*73856093)^(y*19349663))>>>0;
    if(theme.floor==='sand'){const v=(hsh%7)*3-9;g.fillStyle=`rgb(${192+v},${168+v},${126+v})`;g.fillRect(X,Y,FP,FP);
      g.strokeStyle='rgba(95,72,45,.22)';g.lineWidth=1;g.strokeRect(X+.5,Y+.5,FP-1,FP-1);
      if(hsh%5===0){g.strokeStyle='rgba(95,72,45,.25)';g.beginPath();g.moveTo(X+FP*.2,Y+FP*.6);g.lineTo(X+FP*.5,Y+FP*.45);g.lineTo(X+FP*.7,Y+FP*.8);g.stroke();}}
    else if(theme.floor==='cobble'){g.fillStyle='#6d6455';g.fillRect(X,Y,FP,FP);const n=4,s=FP/n;
      for(let j=0;j<n;j++)for(let i=0;i<n;i++){const v=rnd(-18,18),warm=rnd(0,1)<.3;g.fillStyle=warm?`rgb(${170+v},${140+v},${110+v})`:`rgb(${150+v},${146+v},${136+v})`;
        const ox=(j%2)*s/2;g.beginPath();const r=s*.22,x0=X+i*s+ox-s/4+1.5,y0=Y+j*s+1.5,ww=s-3,hh=s-3;
        g.moveTo(x0+r,y0);g.arcTo(x0+ww,y0,x0+ww,y0+hh,r);g.arcTo(x0+ww,y0+hh,x0,y0+hh,r);g.arcTo(x0,y0+hh,x0,y0,r);g.arcTo(x0,y0,x0+ww,y0,r);g.fill();
        g.fillStyle='rgba(255,255,255,.08)';g.fillRect(x0+2,y0+1,ww-4,2);}}
    else{const v=(hsh%5)*3;g.fillStyle=`rgb(${128+v},${128+v},${122+v})`;g.fillRect(X,Y,FP,FP);
      if(hsh%9===0){g.fillStyle='#6f7376';g.fillRect(X+2,Y+2,FP-4,FP-4);g.strokeStyle='rgba(30,30,30,.35)';g.lineWidth=1;
        for(let i=-FP;i<FP;i+=6){g.beginPath();g.moveTo(X+2+i,Y+2);g.lineTo(X+2+i+FP,Y+FP-2);g.stroke();}}
      g.strokeStyle='rgba(40,40,38,.4)';g.lineWidth=1.5;if(x%2===0)g.strokeRect(X+.5,Y+.5,FP*2-1,FP*2-1);
      if(hsh%11===0)blotch(g,X+FP/2,Y+FP/2,FP*.7,'rgba(25,22,18,.35)');}
  }
  speckle(g,W,H,W*H/(theme.floor==='plate'?30:40),theme.floor==='plate'?['rgba(40,40,40,.25)','rgba(220,220,215,.2)']:['rgba(120,95,60,.25)','rgba(240,225,190,.22)','rgba(80,60,40,.18)']);
  if(theme.floor==='sand')for(let i=0;i<MW*MH/18;i++)blotch(g,rnd(0,W),rnd(0,H),rnd(FP*.5,FP*2),'rgba(235,215,170,.13)');
  // ambient occlusion along walls
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(solid(x,y))continue;const X=x*FP,Y=y*FP,s=FP*.32;
    const sh=(x0,y0,x1,y1,rx,ry,rw,rh)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,'rgba(30,22,12,.5)');gr.addColorStop(1,'rgba(30,22,12,0)');g.fillStyle=gr;g.fillRect(rx,ry,rw,rh);};
    if(solid(x,y-1))sh(X,Y,X,Y+s,X,Y,FP,s);if(solid(x,y+1))sh(X,Y+FP,X,Y+FP-s,X,Y+FP-s,FP,s);
    if(solid(x-1,y))sh(X,Y,X+s,Y,X,Y,s,FP);if(solid(x+1,y))sh(X+FP,Y,X+FP-s,Y,X+FP-s,Y,s,FP);}
  // bombsites
  for(const k in SITES){const[a,b,sw,sh]=SITES[k];g.save();
    g.fillStyle='rgba(205,70,45,.07)';g.fillRect((a+1)*FP,(b+1)*FP,(sw-2)*FP,(sh-2)*FP);
    g.setLineDash([FP*.45,FP*.3]);g.strokeStyle='rgba(190,60,40,.55)';g.lineWidth=FP*.12;g.strokeRect((a+1)*FP,(b+1)*FP,(sw-2)*FP,(sh-2)*FP);
    g.setLineDash([]);g.globalAlpha=.6;g.fillStyle='#b8372a';g.font=`700 ${FP*4}px "Arial Black",Arial,sans-serif`;g.textAlign='center';g.textBaseline='middle';
    g.fillText(k,(a+sw/2)*FP,(b+sh/2)*FP);g.restore();}
  g.fillStyle='rgba(255,255,255,.06)';for(const t of['T','CT']){const r=MAP.spawn[t];g.fillRect(r[0]*FP,r[1]*FP,r[2]*FP,r[3]*FP);}
}
function crateTex(style){return canvasTex(128,128,(g,w,h)=>{
  if(style==='metal'){g.fillStyle='#b8b8b4';g.fillRect(0,0,w,h);for(let x=0;x<w;x+=12){g.fillStyle='rgba(0,0,0,.18)';g.fillRect(x,0,4,h);g.fillStyle='rgba(255,255,255,.18)';g.fillRect(x+4,0,2,h);}
    g.fillStyle='rgba(60,40,30,.45)';for(let i=0;i<14;i++)g.fillRect(rnd(0,w),rnd(0,h),rnd(2,8),rnd(4,26));g.strokeStyle='rgba(30,30,30,.6)';g.lineWidth=6;g.strokeRect(3,3,w-6,h-6);}
  else{g.fillStyle='#a07a48';g.fillRect(0,0,w,h);for(let i=0;i<6;i++){const v=rnd(-14,14);g.fillStyle=`rgb(${160+v},${122+v},${74+v})`;g.fillRect(0,i*21+1,w,19);}
    speckle(g,w,h,900,['rgba(70,45,20,.4)','rgba(220,180,120,.3)']);
    g.strokeStyle='#5c3f1f';g.lineWidth=10;g.strokeRect(5,5,w-10,h-10);g.lineWidth=9;g.beginPath();g.moveTo(9,9);g.lineTo(w-9,h-9);g.stroke();
    g.fillStyle='#3a2a18';for(const[x,y]of[[10,10],[w-10,10],[10,h-10],[w-10,h-10]]){g.beginPath();g.arc(x,y,2.5,0,TAU);g.fill();}}
},true);}
const decalTex=canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,30);gr.addColorStop(0,'rgba(10,8,6,1)');gr.addColorStop(.25,'rgba(20,16,12,.95)');gr.addColorStop(.45,'rgba(60,50,40,.5)');gr.addColorStop(1,'rgba(60,50,40,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});
const bloodTex=canvasTex(64,64,(g)=>{g.fillStyle='rgba(110,10,10,.85)';for(let i=0;i<14;i++){g.beginPath();g.arc(32+gauss()*12,32+gauss()*12,rnd(3,11),0,TAU);g.fill();}});
const flashTex=canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,250,220,1)');gr.addColorStop(.3,'rgba(255,200,90,.9)');gr.addColorStop(1,'rgba(255,140,30,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  g.fillStyle='rgba(255,230,160,.8)';for(let i=0;i<5;i++){g.save();g.translate(32,32);g.rotate(i*TAU/5);g.fillRect(0,-2,30,4);g.restore();}});
const flashMat=new THREE.SpriteMaterial({map:flashTex,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
const puffTex=canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,.9)');gr.addColorStop(.6,'rgba(255,255,255,.35)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);});

// ---------------- world construction
let world=null,skyMesh=null,sunSprite=null;
function disposeTree(o){o.traverse(n=>{if(n.geometry)n.geometry.dispose();});}
function boxUV(geo,w,h,d,s){const uv=geo.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let v=0;v<4;v++){const i=f*4+v;uv.setXY(i,uv.getX(i)*dims[f][0]/s,uv.getY(i)*dims[f][1]/s);}uv.needsUpdate=true;}
function rects(val){const used=new Uint8Array(MW*MH),out=[];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x;if(grid[i]!==val||used[i])continue;
    let w=1;while(x+w<MW&&grid[i+w]===val&&!used[i+w])w++;
    let h=1;outer:while(y+h<MH){for(let k=0;k<w;k++){const j=(y+h)*MW+x+k;if(grid[j]!==val||used[j])break outer;}h++;}
    for(let j=0;j<h;j++)for(let k=0;k<w;k++)used[(y+j)*MW+x+k]=1;out.push([x,y,w,h]);}
  return out;}
function nearFloor(x,y,w,h){for(let j=y-1;j<=y+h;j++)for(let i=x-1;i<=x+w;i++)if(!solid(i,j))return true;return false;}
let builtKey='';
function buildWorld(){
  const key=MAPID+'|'+S.gfx;if(builtKey===key)return;builtKey=key;
  applyQuality();
  if(world){scene.remove(world);disposeTree(world);}
  Object.values(MAT).forEach(m=>m.dispose());MAT={};resetViewmodel();
  world=new THREE.Group();scene.add(world);
  const th=MAP.theme,hi=Q==='high',lo=Q==='low';
  scene.fog=new THREE.Fog(th.fog,th.fogNear*(lo?.8:1),th.fogFar*(lo?.75:1));scene.background=new THREE.Color(th.fog);
  hemi.color.setHex(th.hemi[0]);hemi.groundColor.setHex(th.hemi[1]);hemi.intensity=th.hemi[2];
  sun.color.setHex(th.sun);sun.intensity=th.sunI;
  sun.position.set(WW/2+th.sunDir[0]*120,140,WH/2+th.sunDir[1]*120);sun.target.position.set(WW/2,0,WH/2);
  sun.castShadow=hi;
  if(hi){sun.shadow.mapSize.set(2048,2048);const half=Math.hypot(WW,WH)/2+6,sc=sun.shadow.camera;sc.left=-half;sc.right=half;sc.top=half;sc.bottom=-half;sc.near=10;sc.far=400;sc.updateProjectionMatrix();
    sun.shadow.bias=-.0006;sun.shadow.normalBias=.03;}
  // sky dome
  const skyTex=canvasTex(512,256,(g,w,h)=>{const gr=g.createLinearGradient(0,0,0,h/2);gr.addColorStop(0,th.sky[0]);gr.addColorStop(1,th.sky[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);
    for(let i=0;i<40;i++){const x=rnd(0,w),y=rnd(h*.12,h*.45),r=rnd(10,40);g.save();g.scale(2.4,1);blotch(g,x/2.4,y,r,'rgba(255,255,255,.22)');blotch(g,(x+w)/2.4,y,r,'rgba(255,255,255,.22)');g.restore();}
    g.fillStyle=th.sky[1];g.fillRect(0,h/2,w,h/2);});
  skyMesh=new THREE.Mesh(new THREE.SphereGeometry(500,24,12),new THREE.MeshBasicMaterial({map:skyTex,side:THREE.BackSide,fog:false,depthWrite:false}));
  skyMesh.renderOrder=-1;world.add(skyMesh);
  sunSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xfff2d0,fog:false,depthWrite:false,blending:THREE.AdditiveBlending,transparent:true}));
  sunSprite.scale.setScalar(90);world.add(sunSprite);
  const outer=new THREE.Mesh(new THREE.PlaneGeometry(2000,2000),new THREE.MeshLambertMaterial({color:shade(th.base,1.1)}));outer.rotation.x=-PI/2;outer.position.set(WW/2,-.02,WH/2);world.add(outer);
  // floor
  const FP=Q==='high'?48:Q==='med'?36:24;
  const floorTex=canvasTex(MW*FP,MH*FP,(g)=>drawFloor(g,FP,th));
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(WW,WH),hi?new THREE.MeshPhongMaterial({map:floorTex,bumpMap:floorTex,bumpScale:.02,shininess:6,specular:0x111111}):new THREE.MeshLambertMaterial({map:floorTex}));
  floor.rotation.x=-PI/2;floor.position.set(WW/2,0,WH/2);floor.receiveShadow=hi;world.add(floor);
  // walls
  const N=lo?256:512;
  const wt=canvasTex(N,N,(g,w,h)=>WALLTEX[th.wall](g,w,h),true);
  const wallMat=hi?new THREE.MeshPhongMaterial({map:wt,bumpMap:wt,bumpScale:.05,shininess:4,specular:0x0c0c0c}):new THREE.MeshLambertMaterial({map:wt});
  const trimMat=mat(th.trim);
  let baseMat;
  if(th.wall==='concrete'){const bt=canvasTex(128,32,(g,w,h)=>{g.fillStyle='#e0b020';g.fillRect(0,0,w,h);g.fillStyle='#1a1a1a';for(let x=-h;x<w;x+=32){g.beginPath();g.moveTo(x,h);g.lineTo(x+16,h);g.lineTo(x+16+h,0);g.lineTo(x+h,0);g.fill();}},true);baseMat=new THREE.MeshLambertMaterial({map:bt});}
  else baseMat=mat(th.base);
  const span=th.wallH[1]-th.wallH[0]+1;
  for(const[x,y,w,h]of rects(1)){
    if(!nearFloor(x,y,w,h))continue;
    const W_=w*TILE,D_=h*TILE,H_=th.wallH[0]+((x*7+y*13+w*3)%span),cx=x*TILE+W_/2,cz=y*TILE+D_/2;
    const geo=new THREE.BoxGeometry(W_,H_,D_);boxUV(geo,W_,H_,D_,th.wall==='stucco'?11:6);
    const m=new THREE.Mesh(geo,wallMat);m.position.set(cx,H_/2,cz);m.castShadow=hi;m.receiveShadow=hi;world.add(m);
    if(!lo){const cap=new THREE.Mesh(new THREE.BoxGeometry(W_+.3,.3,D_+.3),trimMat);cap.position.set(cx,H_+.15,cz);cap.castShadow=hi;world.add(cap);
      const bg=new THREE.BoxGeometry(W_+.08,.4,D_+.08);if(baseMat.map)boxUV(bg,W_+.08,.4,D_+.08,1.6);const bm=new THREE.Mesh(bg,baseMat);bm.position.set(cx,.2,cz);world.add(bm);}
  }
  // far skyline blocks so the world does not end at the outer wall
  if(!lo)for(let i=0;i<26;i++){const a=i/26*TAU,r=Math.max(WW,WH)*.62+rnd(10,40),h=rnd(10,26),wd=rnd(12,30);
    const m=new THREE.Mesh(new THREE.BoxGeometry(wd,h,wd),wallMat);m.position.set(WW/2+Math.cos(a)*r,h/2,WH/2+Math.sin(a)*r);m.rotation.y=a;world.add(m);}
  // crates / containers
  const ct=crateTex(th.crate);
  const tints=th.crate==='metal'?[0xb04a32,0x3f6a9a,0x4f7a3e,0xc98a2a]:[0xffffff,0xe0d0b8,0xc9b496];
  const crateMats=tints.map(c=>hi?new THREE.MeshPhongMaterial({map:ct,color:c,shininess:th.crate==='metal'?30:4,specular:th.crate==='metal'?0x333333:0x080808}):new THREE.MeshLambertMaterial({map:ct,color:c}));
  for(const[x,y,w,h]of rects(2)){
    if(th.crate==='metal'){const W_=w*TILE,D_=h*TILE,H_=2.7,geo=new THREE.BoxGeometry(W_-.1,H_,D_-.1);boxUV(geo,W_,H_,D_,2.7);
      const m=new THREE.Mesh(geo,crateMats[(x+y)%crateMats.length]);m.position.set(x*TILE+W_/2,H_/2,y*TILE+D_/2);m.castShadow=m.receiveShadow=hi;world.add(m);continue;}
    for(let j=0;j<h;j++)for(let i=0;i<w;i++){const tx=x+i,ty=y+j,geo=new THREE.BoxGeometry(TILE-.06,CRATE_H,TILE-.06);boxUV(geo,TILE,CRATE_H,TILE,TILE);
      const m=new THREE.Mesh(geo,crateMats[(tx*3+ty)%crateMats.length]);m.position.set(tc(tx),CRATE_H/2,tc(ty));m.rotation.y=((tx+ty)%3-1)*.035;m.castShadow=m.receiveShadow=hi;world.add(m);
      if((tx*5+ty*3)%4===0){const s=1.5,top=new THREE.Mesh(new THREE.BoxGeometry(s,s,s),crateMats[(tx+ty+1)%crateMats.length]);top.position.set(tc(tx)+rnd(-.4,.4),CRATE_H+s/2,tc(ty)+rnd(-.4,.4));top.rotation.y=rnd(-.4,.4);top.castShadow=hi;world.add(top);}}
  }
  // barrels
  const bt=canvasTex(64,64,(g,w,h)=>{g.fillStyle='#fff';g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.35)';g.fillRect(0,8,w,4);g.fillRect(0,h-12,w,4);speckle(g,w,h,300,['rgba(90,50,30,.5)','rgba(0,0,0,.2)']);});
  const bCols=[0x2f5d8a,0x9a3b2c,0x6b6f3a,0x7a5a3a];
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(grid[y*MW+x]!==3)continue;
    for(const[ox,oz]of[[-.6,-.5],[.6,-.4],[0,.6]]){const m=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,BARREL_H,12),new THREE.MeshLambertMaterial({map:bt,color:pick(bCols)}));
      m.position.set(tc(x)+ox,BARREL_H/2,tc(y)+oz);m.castShadow=hi;world.add(m);}}
  // overhead door frames
  for(const[x,y,w,h]of MAP.arches){const W_=w*TILE+.4,D_=h*TILE+.4,m=new THREE.Mesh(new THREE.BoxGeometry(W_,1.4,D_),wallMat);
    boxUV(m.geometry,W_,1.4,D_,6);m.position.set(x*TILE+w*TILE/2,4.3,y*TILE+h*TILE/2);m.castShadow=hi;world.add(m);
    if(!lo){const t=new THREE.Mesh(new THREE.BoxGeometry(W_+.1,.18,D_+.1),trimMat);t.position.set(m.position.x,3.55,m.position.z);world.add(t);}}
  resetPools();
}

// ---------------- effect pools
const pools={tracers:[],puffs:[],smoke:[],chips:[],decals:[],blood:[]};let poolI={tracers:0,puffs:0,smoke:0,chips:0,decals:0,blood:0};
const traceMat=new THREE.MeshBasicMaterial({color:0xffe2a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false});
for(let i=0;i<24;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1,4,1,true),traceMat.clone());m.visible=false;scene.add(m);pools.tracers.push({m,life:0});}
for(let i=0;i<80;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false,opacity:0}));s.visible=false;scene.add(s);pools.puffs.push({s,life:0,max:1,v:new THREE.Vector3(),grow:1,size:1,g:0});}
for(let i=0;i<96;i++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xc9cbc8,transparent:true,depthWrite:false,opacity:0}));s.visible=false;scene.add(s);pools.smoke.push({s,t0:0,t1:0,size:1,base:new THREE.Vector3()});}
const chipGeo=new THREE.BoxGeometry(.05,.05,.05);
for(let i=0;i<48;i++){const m=new THREE.Mesh(chipGeo,new THREE.MeshLambertMaterial({color:0x777777}));m.visible=false;scene.add(m);pools.chips.push({m,v:new THREE.Vector3(),life:0});}
const decalGeo=new THREE.PlaneGeometry(.16,.16);
for(let i=0;i<120;i++){const m=new THREE.Mesh(decalGeo,new THREE.MeshBasicMaterial({map:decalTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,opacity:.9}));m.visible=false;scene.add(m);pools.decals.push({m});}
const bloodGeo=new THREE.PlaneGeometry(1,1);
for(let i=0;i<24;i++){const m=new THREE.Mesh(bloodGeo,new THREE.MeshBasicMaterial({map:bloodTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));m.visible=false;scene.add(m);pools.blood.push({m});}
function nextP(k){const a=pools[k];return a[poolI[k]++%a.length];}
function resetPools(){for(const k in pools)for(const p of pools[k]){(p.m||p.s).visible=false;p.life=0;}}
const UP=new THREE.Vector3(0,1,0),tmpA=new THREE.Vector3(),tmpB=new THREE.Vector3();
function tracer(a,b){const t=nextP('tracers'),m=t.m;tmpA.set(b.x-a.x,b.y-a.y,b.z-a.z);const L=tmpA.length();if(L<.5)return;
  m.position.set((a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);m.scale.set(1,L,1);m.quaternion.setFromUnitVectors(UP,tmpA.normalize());m.visible=true;t.life=.06;}
function puff(x,y,z,color,size,life,vy=.4,grow=1.5,grav=0){const p=nextP('puffs');p.s.position.set(x,y,z);p.s.material.color.setHex(color);p.s.scale.setScalar(size);p.s.visible=true;
  p.life=p.max=life;p.v.set(rnd(-.4,.4),vy,rnd(-.4,.4));p.grow=grow;p.size=size;p.g=grav;p.s.material.rotation=rnd(0,TAU);}
function chips(x,y,z,nx,ny,nz,color,n=4,spd=3){for(let i=0;i<n;i++){const c=nextP('chips');c.m.position.set(x,y,z);c.m.material.color.setHex(color);c.m.visible=true;c.life=rnd(.5,1);
  c.v.set(nx*spd+rnd(-1.5,1.5),ny*spd+rnd(.5,2.5),nz*spd+rnd(-1.5,1.5));c.m.scale.setScalar(rnd(.6,1.4));}}
function decal(x,y,z,nx,ny,nz){const d=nextP('decals'),m=d.m;m.position.set(x+nx*.012,y+ny*.012,z+nz*.012);tmpB.set(x+nx,y+ny,z+nz);m.lookAt(tmpB);m.rotateZ(rnd(0,TAU));m.scale.setScalar(rnd(.8,1.2));m.visible=true;}
function bloodSplat(x,z){const d=nextP('blood'),m=d.m;m.position.set(x,.015,z);m.rotation.set(-PI/2,0,rnd(0,TAU));m.scale.setScalar(rnd(.7,1.4));m.visible=true;}
function smokeCloud(x,z,t0,t1){for(let i=0;i<16;i++){const p=nextP('smoke');const a=rnd(0,TAU),r=rnd(0,3.2);
  p.base.set(x+Math.cos(a)*r,rnd(.6,3.2),z+Math.sin(a)*r);p.s.position.copy(p.base);p.t0=t0+rnd(0,.6);p.t1=t1+rnd(-1,1);p.size=rnd(3.5,5.5);p.s.visible=true;p.s.material.rotation=rnd(0,TAU);}}
function updateFx(dt){
  for(const t of pools.tracers){if(!t.m.visible)continue;t.life-=dt;if(t.life<=0)t.m.visible=false;else t.m.material.opacity=t.life/.06*.9;}
  for(const p of pools.puffs){if(!p.s.visible)continue;p.life-=dt;if(p.life<=0){p.s.visible=false;continue;}const k=p.life/p.max;
    p.s.material.opacity=k*.85;p.v.y-=p.g*dt;p.s.position.addScaledVector(p.v,dt);p.s.scale.setScalar(p.size*(1+(1-k)*p.grow));}
  for(const p of pools.smoke){if(!p.s.visible)continue;const age=G.clock-p.t0;if(G.clock>p.t1+1.5||age<-2){p.s.visible=false;continue;}
    const grow=clamp(age/1.4,0,1),fade=clamp((p.t1+1.5-G.clock)/1.5,0,1);p.s.material.opacity=Math.max(0,grow)*fade*.92;
    p.s.scale.setScalar(p.size*(.3+.7*grow));p.s.position.y=p.base.y+Math.sin(G.clock*.4+p.base.x)*.15;}
  for(const c of pools.chips){if(!c.m.visible)continue;c.life-=dt;if(c.life<=0){c.m.visible=false;continue;}c.v.y-=GRAV*.7*dt;c.m.position.addScaledVector(c.v,dt);
    if(c.m.position.y<.03){c.m.position.y=.03;c.v.set(c.v.x*.4,-c.v.y*.3,c.v.z*.4);}c.m.rotation.x+=dt*9;c.m.rotation.y+=dt*7;}
  muzzleLight.intensity=Math.max(0,muzzleLight.intensity-dt*60);boomLight.intensity=Math.max(0,boomLight.intensity-dt*8);vmLight.intensity=Math.max(0,vmLight.intensity-dt*40);
}
