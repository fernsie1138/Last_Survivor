/* ===== terrain: hills, mountains, mesas, canyons, rivers, boulder fields =====
   Each chunk carries a 20 x 20 grid of 32 px cells (what's there) and 21 x 21 corner heights (for slopes).
   Canyons and flowing rivers are impassable; where a road meets one, it crosses on a bridge. Towns are always on clear ground.
   Mesas and buttes are separate landforms, placed one by one (see the mesa module). */
const T={GROUND:0,SEA:1,RIVER:2,DRY:3,CANYON:4,MOUNT:5,MESA:6,CUT:7,BRIDGE_W:8,BRIDGE_C:9};
const T_BLOCKED=[false,true,true,false,true,true,true,false,false,false];
const nMount=vnoise(101),nMesa=vnoise(103),nCan=vnoise(107),nCanM=vnoise(109),nRiv=vnoise(113),nRivF=vnoise(127),nBould=vnoise(131),nHill=vnoise(137),nHill2=vnoise(139);
// how each kind of country shapes the land
const BIOME_TERRAIN={salt:{m:0,mesa:0,can:0,hill:0,flow:0.62},red:{m:0.35,mesa:1,can:1,hill:220,flow:0.62},ranges:{m:1,mesa:0.2,can:0.8,hill:420,flow:0.62},
  mallee:{m:0.25,mesa:0,can:0.2,hill:150,flow:0.42},coast:{m:0.15,mesa:0,can:0,hill:120,flow:0.42}};
// blend those factors from the chunk corners, so hills and mountains don't stop dead at a zone border
const cornerCache=new Map();
function cornerTerrain(ix,iy){const k=ix*100003+iy;let v=cornerCache.get(k);if(!v){v=BIOME_TERRAIN[zoneAt(ix*CH,iy*CH).biome];cornerCache.set(k,v);}return v;}
function terrainFactors(x,y){const fx=x/CH,fy=y/CH,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy;
  const a=cornerTerrain(ix,iy),b=cornerTerrain(ix+1,iy),c=cornerTerrain(ix,iy+1),d=cornerTerrain(ix+1,iy+1),w0=(1-tx)*(1-ty),w1=tx*(1-ty),w2=(1-tx)*ty,w3=tx*ty;
  const mix=k=>a[k]*w0+b[k]*w1+c[k]*w2+d[k]*w3;return {m:mix('m'),mesa:mix('mesa'),can:mix('can'),hill:mix('hill'),flow:mix('flow')};}
function ridge(n,x,y,s,o){return 1-Math.abs(2*fbm(n,x/s,y/s,o)-1);}
function heightRaw(x,y,f){f=f||terrainFactors(x,y);if(!f.hill)return 0;
  let h=f.hill*((fbm(nHill,x/5000,y/5000,3)-0.5)*2+0.35*(fbm(nHill2,x/1600,y/1600,2)-0.5)*2);
  return h;}
// what the land is at a point, before roads and towns get their say
function terrainRaw(x,y,f){f=f||terrainFactors(x,y);
  if(ridge(nRiv,x,y,70000,3)>0.9978)return fbm(nRivF,x/90000,y/90000,2)>f.flow?T.RIVER:T.DRY;
  if(f.can>0.3&&fbm(nCanM,x/90000,y/90000,2)>0.56&&ridge(nCan,x,y,45000,3)>0.9972)return T.CANYON;
  return T.GROUND;}
const TN=CH/32;   // 20 cells a side
function buildTerrain(c){const ox=c.cx*CH,oy=c.cy*CH,terr=new Uint8Array(TN*TN),hgt=new Float32Array((TN+1)*(TN+1));
  const nearSea=landValue(ox+CH/2,oy+CH/2)<0.08,near=nearLoc(ox+CH/2,oy+CH/2,1400);
  for(let j=0;j<TN;j++)for(let i=0;i<TN;i++){const x=ox+(i+0.5)*32,y=oy+(j+0.5)*32;let t;
    if(nearSea&&landValue(x,y)<0)t=T.SEA;else{t=terrainRaw(x,y);
      if(t!==T.GROUND&&t!==T.DRY){
        if(near&&nearLoc(x,y,500))t=T.GROUND;   // towns sit on clear ground
        else{const ri=roadInfo(x,y);if(ri.r>=0&&ri.d<ri.w/2+40)t=t===T.RIVER?T.BRIDGE_W:T.BRIDGE_C;}}}   // the road crosses on a bridge
    terr[j*TN+i]=t;}
  for(let j=0;j<=TN;j++)for(let i=0;i<=TN;i++)hgt[j*(TN+1)+i]=heightRaw(ox+i*32,oy+j*32);
  c.terr=terr;c.hgt=hgt;c.boulders=fbm(nBould,(ox+CH/2)/15000,(oy+CH/2)/15000,2)>0.73;}
function cellType(c,x,y){return c.terr[clamp(Math.floor((y-c.cy*CH)/32),0,TN-1)*TN+clamp(Math.floor((x-c.cx*CH)/32),0,TN-1)];}
function terrainAt(x,y){return cellType(getChunk(Math.floor(x/CH),Math.floor(y/CH)),x,y);}
function blockedAt(x,y){return T_BLOCKED[terrainAt(x,y)];}
function waterAt(x,y){const t=terrainAt(x,y);return t===T.SEA||t===T.RIVER;}
// height anywhere, smoothly, from the chunk's corner grid
function heightAt(x,y){const c=getChunk(Math.floor(x/CH),Math.floor(y/CH)),fx=(x-c.cx*CH)/32,fy=(y-c.cy*CH)/32,i=clamp(Math.floor(fx),0,TN-1),j=clamp(Math.floor(fy),0,TN-1),tx=fx-i,ty=fy-j,h=c.hgt,R=TN+1;
  return h[j*R+i]*(1-tx)*(1-ty)+h[j*R+i+1]*tx*(1-ty)+h[(j+1)*R+i]*(1-tx)*ty+h[(j+1)*R+i+1]*tx*ty;}
// climbing slows you down; going downhill helps a little. dir is the direction of travel.
function slopeFactor(x,y,dx,dy,car){const l=Math.hypot(dx,dy);if(l<1e-6)return 1;const ux=dx/l,uy=dy/l,g=(heightAt(x+ux*24,y+uy*24)-heightAt(x,y))/24;
  if(car)return g>0?Math.max(0.5,1-2*g):Math.min(1.12,1-0.8*g);return g>0?Math.max(0.45,1-2.6*g):Math.min(1.15,1-0.6*g);}
