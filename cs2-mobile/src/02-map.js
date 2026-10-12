// ---------------- maps
// Each map is carved out of solid rock on a tile grid (TILE metres per tile).
// grid values: 0 floor, 1 wall, 2 crate, 3 barrels
const TILE=3;
const MAPS={
  dunes:{name:'Dunes',desc:'Two-site desert classic. Long A, mid doors and B tunnels.',w:50,h:34,
    carve:[[1,1,12,10],[20,1,11,6],[37,1,12,10],[13,3,7,3],[31,3,6,3],[23,7,4,20],[27,12,10,3],[37,11,4,4],
      [44,11,4,17],[36,27,12,3],[14,27,22,6],[4,11,4,20],[8,28,6,3],[8,18,15,3],[14,9,6,5],[13,9,1,2],[20,11,3,2]],
    crates:[[3,3,2,2],[8,6,2,1],[40,3,2,2],[45,6,1,2],[38,8,2,1],[22,3,1,1],[24,14,2,1],[19,29,2,2],[30,30,2,1],[45,18,2,1],[14,19,1,1],[32,13,1,1],[16,11,1,1]],
    barrels:[[35,32],[47,27],[1,10],[30,1],[4,30]],
    arches:[[13,3,1,3],[31,3,1,3],[23,7,4,1],[37,11,4,1],[4,11,4,1],[44,11,4,1],[20,11,1,2],[13,9,1,2],[23,26,4,1],[36,27,1,3]],
    sites:{A:[37,1,12,10],B:[1,1,12,10]},spawn:{T:[15,28,20,5],CT:[20,1,10,5]},
    holds:{A:[[40,6,38,12],[46,9,45,20],[43,2,38,12]],B:[[8,4,5,14],[10,8,13,10],[3,9,6,14]],M:[[25,8,25,20],[21,4,24,15]]},
    routes:{A:[[45,22],[33,13]],B:[[5,16],[17,11]]},
    theme:{sky:['#6fa6d6','#efe4cc'],fog:0xe3d9c2,fogNear:70,fogFar:230,sun:0xfff0d2,sunI:.9,sunDir:[.7,.35],hemi:[0xfff3dc,0x6a5843,.72],
      wall:'sandstone',floor:'sand',crate:'wood',wallH:[5,8],trim:0xa98c63,base:0x7a6446,particles:'dust',skyline:'palms',win:'shutter'},
    roofs:[[4,14,4,12],[8,18,15,3]],
    callouts:[['B Site',1,1,12,10],['CT Spawn',20,1,11,6],['A Site',37,1,12,10],['B Doors',13,3,7,3],['A Doors',31,3,6,3],['Mid',23,7,4,20],['Catwalk',27,12,10,3],
      ['A Ramp',37,11,4,4],['Long A',44,11,4,17],['Long Corner',36,27,12,3],['T Spawn',14,27,22,6],['B Tunnels',4,11,4,20],['Lower Tunnels',8,18,15,3],['B Short',13,9,10,5],['Outside Tunnels',8,28,6,3]]},
  plaza:{name:'Plaza',desc:'Stucco town square. Wide mid, A ramp and the B apartments.',w:52,h:36,
    carve:[[40,28,10,6],[3,2,9,6],[34,3,14,10],[2,22,12,10],[16,16,22,4],[38,14,3,14],[38,16,2,4],[44,13,4,15],
      [16,8,4,8],[12,4,8,4],[20,4,14,3],[30,10,4,6],[24,30,16,3],[20,26,4,7],[14,26,6,3],[8,16,8,3],[8,19,3,3],[4,8,4,14]],
    crates:[[37,6,2,2],[42,9,1,2],[35,11,1,1],[5,25,2,2],[10,28,2,1],[26,17,2,1],[44,30,2,2],[6,4,1,1],[46,20,1,1],[21,29,1,1]],
    barrels:[[49,33],[2,31],[33,15],[11,2],[13,22]],
    arches:[[38,16,2,4],[16,15,4,1],[30,15,4,1],[44,13,4,1],[8,19,3,1],[14,26,1,3],[20,4,1,3],[4,8,4,1],[33,4,1,3],[24,30,1,3]],
    sites:{A:[34,3,14,10],B:[2,22,12,10]},spawn:{T:[41,29,8,4],CT:[4,3,7,4]},
    holds:{A:[[36,4,30,12],[46,11,45,20],[40,8,45,14]],B:[[6,24,15,27],[12,23,9,18],[3,28,16,27]],M:[[17,10,17,18],[21,5,25,17]]},
    routes:{A:[[45,20],[32,14]],B:[[18,27],[12,17]]},
    theme:{sky:['#4f95d9','#f1efe8'],fog:0xe9ebe8,fogNear:70,fogFar:240,sun:0xfff6e4,sunI:.95,sunDir:[-.5,.6],hemi:[0xf6f4ff,0x7a6656,.7],
      wall:'stucco',floor:'cobble',crate:'wood',wallH:[6,10],trim:0xc9b9a0,base:0x8a5a42,particles:null,skyline:'domes',win:'arch'},
    roofs:[[20,26,4,7],[14,26,6,3],[8,16,8,3]],
    callouts:[['T Spawn',40,28,10,6],['CT Spawn',3,2,9,6],['A Site',34,3,14,10],['B Site',2,22,12,10],['Mid',16,16,22,4],['Top Mid',38,14,3,14],['A Ramp',44,13,4,15],
      ['Window',16,8,4,8],['Jungle',12,4,8,4],['CT A',20,4,14,3],['Connector',30,10,4,6],['Apartments',24,30,16,3],['Apartments',14,26,10,7],['Short',8,16,8,6],['Market',4,8,4,14]]},
  foundry:{name:'Foundry',desc:'Concrete yard full of containers, with two long flanks.',w:48,h:40,
    carve:[[18,33,12,5],[18,2,12,5],[2,4,13,11],[33,4,13,11],[15,4,3,3],[30,4,3,3],[22,7,4,26],[6,34,12,3],[6,15,4,19],
      [30,34,12,3],[38,15,4,19],[10,20,12,3],[12,15,3,5],[26,24,12,3],[33,15,3,9]],
    crates:[[5,7,2,2],[10,11,2,1],[12,5,1,1],[36,6,2,2],[42,10,1,2],[39,12,2,1],[23,16,2,1],[22,27,1,1],[21,35,2,1],[7,26,1,1],[40,22,1,1],[16,21,1,1],[31,25,1,1]],
    barrels:[[18,37],[29,37],[2,14],[45,14],[29,2]],
    arches:[[15,4,1,3],[32,4,1,3],[22,7,4,1],[6,15,4,1],[38,15,4,1],[12,15,3,1],[33,15,3,1],[22,32,4,1],[17,34,1,3],[30,34,1,3]],
    sites:{A:[2,4,13,11],B:[33,4,13,11]},spawn:{T:[19,34,10,4],CT:[19,2,10,4]},
    holds:{A:[[8,13,7,25],[13,12,13,19],[4,6,8,20]],B:[[39,13,39,25],[34,12,34,22],[44,7,39,20]],M:[[23,9,23,25],[20,4,23,20]]},
    routes:{A:[[7,24],[13,18]],B:[[39,24],[34,20]]},
    theme:{sky:['#78838e','#cdd1d3'],fog:0xbcc1c4,fogNear:45,fogFar:175,sun:0xf2f0ea,sunI:.65,sunDir:[.4,-.6],hemi:[0xe4e8ee,0x4c4a46,.85],
      wall:'concrete',floor:'plate',crate:'metal',wallH:[7,11],trim:0x6c6e70,base:0x2a2a2a,particles:'dust',skyline:'stacks',win:'factory'},
    roofs:[[10,20,12,3],[26,24,12,3]],
    callouts:[['T Spawn',18,33,12,5],['CT Spawn',18,2,12,5],['A Site',2,4,13,11],['B Site',33,4,13,11],['Mid',22,7,4,26],['A Long',6,15,4,19],['A Long',6,34,12,3],
      ['B Long',38,15,4,19],['B Long',30,34,12,3],['Halls',10,20,12,3],['A Short',12,15,3,5],['Yard',26,24,12,3],['B Short',33,15,3,9],['A Door',15,4,3,3],['B Door',30,4,3,3]]},
  glacier:{name:'Glacier',desc:'Snowbound outpost. A heated lodge and cabin split the two longs.',w:50,h:38,
    carve:[[19,2,12,5],[19,32,12,5],[2,3,13,10],[35,3,13,10],[15,3,4,3],[31,3,4,3],[23,7,4,25],[8,33,11,3],[8,13,4,20],
      [31,33,11,3],[38,13,4,20],[14,16,8,8],[22,19,1,2],[12,18,2,2],[29,16,7,7],[27,18,2,2],[36,19,2,2],[13,13,3,3],[34,13,3,3]],
    crates:[[4,5,2,2],[10,9,2,1],[6,11,1,1],[43,5,2,2],[37,9,2,1],[45,10,1,2],[24,12,2,1],[23,25,1,1],[17,19,2,2],[31,18,1,2],[22,34,2,1],[27,33,1,1],[10,27,1,1],[40,27,1,1],[25,3,1,1]],
    barrels:[[30,2],[19,36],[30,36],[2,12],[47,12]],
    arches:[[15,3,1,3],[34,3,1,3],[23,7,4,1],[8,13,4,1],[38,13,4,1],[13,13,3,1],[34,13,3,1],[23,31,4,1],[18,33,1,3],[31,33,1,3]],
    roofs:[[14,16,8,8],[29,16,7,7],[8,22,4,6],[38,20,4,6]],
    sites:{A:[2,3,13,10],B:[35,3,13,10]},spawn:{T:[20,33,10,4],CT:[20,2,10,4]},
    holds:{A:[[9,11,9,25],[13,11,14,15],[4,7,10,20]],B:[[40,11,40,25],[36,11,35,15],[46,6,40,20]],M:[[24,8,24,25],[21,4,24,20]]},
    routes:{A:[[9,24],[15,18]],B:[[40,24],[32,19]]},
    theme:{sky:['#9db7cc','#e9eef2'],fog:0xdfe6eb,fogNear:40,fogFar:160,sun:0xeef4ff,sunI:.75,sunDir:[.3,.7],hemi:[0xeef4ff,0x5a6470,.85],
      wall:'planks',floor:'snow',crate:'wood',wallH:[5,8],trim:0xf2f5f8,base:0x3b2e24,particles:'snow',skyline:'pines',win:'cabin'},
    callouts:[['CT Spawn',19,2,12,5],['T Spawn',19,32,12,5],['A Site',2,3,13,10],['B Site',35,3,13,10],['Lodge',14,16,9,8],['Cabin',27,16,11,7],['Mid',23,7,4,25],
      ['A Long',8,13,4,20],['A Long',8,33,11,3],['B Long',38,13,4,20],['B Long',31,33,11,3],['A Short',13,13,3,3],['B Short',34,13,3,3],['A Door',15,3,4,3],['B Door',31,3,4,3]]},
  harbor:{name:'Harbor',desc:'Docks at sunset. A roofed warehouse sits between the piers.',w:54,h:34,
    carve:[[2,24,9,8],[43,2,9,7],[40,20,12,11],[14,2,12,9],[11,28,29,3],[4,12,4,12],[4,9,10,3],[26,3,17,3],[46,9,4,11],
      [20,14,14,8],[11,17,9,3],[8,17,3,3],[34,19,6,3],[27,6,3,8],[22,22,3,6]],
    crates:[[16,29,2,1],[26,28,1,2],[33,29,2,1],[43,23,2,2],[48,26,1,2],[42,29,2,1],[16,4,2,2],[21,7,2,1],[24,3,1,1],[23,16,2,2],[30,18,2,1],[45,4,1,1],[6,26,2,1]],
    barrels:[[10,31],[51,30],[13,10],[51,2],[33,14]],
    arches:[[11,17,1,3],[34,19,1,3],[27,13,3,1],[22,22,3,1],[4,12,4,1],[13,9,1,3],[46,9,4,1],[42,3,1,3],[39,28,1,3],[11,28,1,3]],
    roofs:[[20,14,14,8],[4,14,4,8]],
    sites:{A:[40,20,12,11],B:[14,2,12,9]},spawn:{T:[3,25,7,6],CT:[44,3,7,5]},
    holds:{A:[[42,21,36,20],[44,28,30,29],[48,21,47,12]],B:[[17,8,6,11],[24,8,28,10],[15,3,8,10]],M:[[28,8,28,16],[47,12,40,20]]},
    routes:{A:[[30,29],[36,20]],B:[[5,15],[28,9]]},
    theme:{sky:['#e2875a','#f7d9b2'],fog:0xe9c9a8,fogNear:50,fogFar:190,sun:0xffc890,sunI:.85,sunDir:[-.8,.4],hemi:[0xffe2c4,0x4a3a3a,.75],
      wall:'brick',floor:'asphalt',crate:'metal',wallH:[6,10],trim:0x5a4038,base:0x2c2826,particles:null,skyline:'cranes',win:'factory'},
    callouts:[['T Spawn',2,24,9,8],['CT Spawn',43,2,9,7],['A Site',40,20,12,11],['B Site',14,2,12,9],['Docks',11,28,29,3],['B Tunnel',4,9,10,15],['Catwalk',26,3,17,3],
      ['A Ramp',46,9,4,11],['Warehouse',20,14,14,8],['Alley',8,17,12,3],['A Door',34,19,6,3],['Vent',27,6,3,8],['Pier',22,22,3,6]]},
};
function buildGrid(def){
  const w=def.w,h=def.h,g=new Uint8Array(w*h).fill(1);
  const carve=(x,y,cw,ch,v)=>{for(let j=y;j<y+ch;j++)for(let i=x;i<x+cw;i++)if(i>=0&&j>=0&&i<w&&j<h)g[j*w+i]=v;};
  def.carve.forEach(r=>carve(r[0],r[1],r[2],r[3],0));
  def.crates.forEach(r=>carve(r[0],r[1],r[2],r[3],2));
  (def.barrels||[]).forEach(([x,y])=>{if(g[y*w+x]===0)g[y*w+x]=3;});
  return g;
}

// runtime map state
let MAP=null,MAPID='',MW=0,MH=0,WW=0,WH=0,grid=null,PEN=null,SITES={},SPAWN={},HOLDS={},ROUTES={},FLOOR=[];
const SMOKES=[];
const solid=(tx,ty)=>tx<0||ty<0||tx>=MW||ty>=MH||grid[ty*MW+tx]!==0;
const cell=(tx,ty)=>tx<0||ty<0||tx>=MW||ty>=MH?1:grid[ty*MW+tx];
const tc=i=>(i+.5)*TILE;
function locationName(x,z){const tx=Math.floor(x/TILE),ty=Math.floor(z/TILE);for(const[n,a,b,w,h]of MAP.callouts)if(tx>=a&&tx<a+w&&ty>=b&&ty<b+h)return n;return'';}
function underRoof(tx,ty){for(const[a,b,w,h]of MAP.roofs||[])if(tx>=a&&tx<a+w&&ty>=b&&ty<b+h)return true;return false;}
function floorTiles(x,y,w,h){const r=[];for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)if(!solid(i,j))r.push([i,j]);return r;}
function inSite(x,z){const tx=Math.floor(x/TILE),ty=Math.floor(z/TILE);for(const k in SITES){const[a,b,w,h]=SITES[k];if(tx>=a&&tx<a+w&&ty>=b&&ty<b+h)return k;}return null;}
let gS,came,stampA,closedA,stampN=0;
function loadMap(id){
  MAPID=id;MAP=MAPS[id];MW=MAP.w;MH=MAP.h;WW=MW*TILE;WH=MH*TILE;grid=buildGrid(MAP);
  SITES=MAP.sites;HOLDS=MAP.holds;ROUTES=MAP.routes;
  SPAWN={T:floorTiles(...MAP.spawn.T),CT:floorTiles(...MAP.spawn.CT)};
  FLOOR=floorTiles(0,0,MW,MH);
  PEN=new Float32Array(MW*MH);
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){if(solid(x,y))continue;let n=0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++)if(solid(x+i,y+j))n++;PEN[y*MW+x]=n?.5:0;}
  gS=new Float32Array(MW*MH);came=new Int32Array(MW*MH);stampA=new Uint32Array(MW*MH);closedA=new Uint32Array(MW*MH);stampN=0;
  SMOKES.length=0;
}

// ---------------- grid raycast (2D; walls, crates and barrels block bullets and sight)
let RNX=0,RNZ=0;
function rayGrid(ox,oz,dx,dz,max){
  let tx=Math.floor(ox/TILE),ty=Math.floor(oz/TILE);
  if(solid(tx,ty)){RNX=-dx;RNZ=-dz;return 0;}
  const sx=dx>0?1:-1,sy=dz>0?1:-1;
  const tdx=dx!==0?Math.abs(TILE/dx):Infinity,tdy=dz!==0?Math.abs(TILE/dz):Infinity;
  let tmx=dx!==0?((dx>0?(tx+1)*TILE-ox:ox-tx*TILE)/Math.abs(dx)):Infinity;
  let tmy=dz!==0?((dz>0?(ty+1)*TILE-oz:oz-ty*TILE)/Math.abs(dz)):Infinity;
  let t=0;
  for(let n=0;n<500;n++){
    let ax;
    if(tmx<tmy){t=tmx;tmx+=tdx;tx+=sx;ax=0;}else{t=tmy;tmy+=tdy;ty+=sy;ax=1;}
    if(t>max)return max;
    if(solid(tx,ty)){if(ax===0){RNX=-sx;RNZ=0;}else{RNX=0;RNZ=-sy;}return t;}
  }
  return max;
}
function los(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz);if(L<.01)return true;return rayGrid(ax,az,dx/L,dz/L,L)>=L-.01;}
function smokeBlocks(ax,az,bx,bz){
  for(const s of SMOKES){
    const age=G.clock-s.t0;if(age<1||G.clock>s.t1-1.2)continue;
    const r=s.r*Math.min(1,(age-1)/1.2+.4);
    const dx=bx-ax,dz=bz-az,L2=dx*dx+dz*dz||1;let t=((s.x-ax)*dx+(s.z-az)*dz)/L2;t=clamp(t,0,1);
    if(Math.hypot(ax+dx*t-s.x,az+dz*t-s.z)<r)return true;
  }
  return false;
}
const canSee=(a,b)=>los(a.x,a.z,b.x,b.z)&&!smokeBlocks(a.x,a.z,b.x,b.z);
function walkClear(ax,az,bx,bz){const dx=bx-ax,dz=bz-az,L=Math.hypot(dx,dz)||1,px=-dz/L*(RAD+.15),pz=dx/L*(RAD+.15);
  return los(ax+px,az+pz,bx+px,bz+pz)&&los(ax-px,az-pz,bx-px,bz-pz);}

// ---------------- A* pathfinding
const NB=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function nearestFloor(x,y){for(let r=1;r<10;r++)for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(!solid(x+i,y+j))return[x+i,y+j];return[x,y];}
function findPath(sx,sy,gx,gy){
  if(solid(gx,gy))[gx,gy]=nearestFloor(gx,gy);
  if(solid(sx,sy))[sx,sy]=nearestFloor(sx,sy);
  stampN++;const s=sy*MW+sx,g=gy*MW+gx;
  const hf=[],hi=[];
  const push=(f,i)=>{hf.push(f);hi.push(i);let c=hf.length-1;while(c>0){const p=(c-1)>>1;if(hf[p]<=hf[c])break;[hf[p],hf[c]]=[hf[c],hf[p]];[hi[p],hi[c]]=[hi[c],hi[p]];c=p;}};
  const pop=()=>{const r=hi[0],lf=hf.pop(),li=hi.pop();if(hf.length){hf[0]=lf;hi[0]=li;let c=0;for(;;){const l=c*2+1,rr=l+1;let m=c;if(l<hf.length&&hf[l]<hf[m])m=l;if(rr<hf.length&&hf[rr]<hf[m])m=rr;if(m===c)break;[hf[m],hf[c]]=[hf[c],hf[m]];[hi[m],hi[c]]=[hi[c],hi[m]];c=m;}}return r;};
  const H=(x,y)=>{const dx=Math.abs(x-gx),dy=Math.abs(y-gy);return Math.max(dx,dy)+.414*Math.min(dx,dy);};
  gS[s]=0;stampA[s]=stampN;came[s]=-1;push(H(sx,sy),s);
  while(hf.length){
    const cur=pop();if(cur===g)break;if(closedA[cur]===stampN)continue;closedA[cur]=stampN;
    const cx=cur%MW,cy=(cur/MW)|0;
    for(const[dx,dy,c]of NB){const nx=cx+dx,ny=cy+dy;if(solid(nx,ny))continue;if(dx&&dy&&(solid(cx+dx,cy)||solid(cx,cy+dy)))continue;
      const ni=ny*MW+nx,ng=gS[cur]+c+PEN[ni];if(stampA[ni]!==stampN||ng<gS[ni]){stampA[ni]=stampN;gS[ni]=ng;came[ni]=cur;push(ng+H(nx,ny),ni);}}
  }
  if(stampA[g]!==stampN)return[];
  const out=[];let c=g;while(c!==-1&&c!==s){out.push({x:tc(c%MW),z:tc((c/MW)|0)});c=came[c];}
  return out.reverse();
}
