/* ===== mesas and buttes =====
   Each is its own landform: a flat caprock top, cliffs stepped into benches, a scree apron at the base,
   and an outline notched by gullies. Buttes are the small, eroded ones; mesas are broader.
   They cluster in the red desert, a few in the ranges, and keep clear of roads, towns, rivers and canyons. */
const MESA_CELL=6000,MESA_N=32,mesaCache=new Map(),nMesaCl=vnoise(149);
function mesaAt(ix,iy){const key=ix*100003+iy;if(mesaCache.has(key))return mesaCache.get(key);let m=null;
  const r=rng(hash2(ix*7+3,iy*13+5)),x=(ix+0.18+0.64*r())*MESA_CELL,y=(iy+0.18+0.64*r())*MESA_CELL,f=terrainFactors(x,y);
  const cluster=clamp((fbm(nMesaCl,x/40000,y/40000,2)-0.38)*3.2,0,1.3),p=f.mesa*0.6*cluster;
  if(r()<p){const butte=r()<0.62,R=butte?60+r()*90:170+r()*240,rad=new Float32Array(MESA_N),stretch=butte?0.75+r()*0.25:0.55+r()*0.4,rot=r()*TAU;
    const gullies=[];for(let g=0,n=butte?1+Math.floor(r()*2):2+Math.floor(r()*4);g<n;g++)gullies.push({a:r()*TAU,depth:0.15+r()*0.25,w:0.1+r()*0.12});
    const ph1=r()*TAU,ph2=r()*TAU;let maxR=0;
    for(let i=0;i<MESA_N;i++){const a=i/MESA_N*TAU,ca=Math.cos(a-rot),sa=Math.sin(a-rot);let v=R/Math.hypot(ca,sa/stretch)*Math.sqrt(stretch);   // a squashed oval
      v*=1+0.07*Math.sin(a*3+ph1)+0.05*Math.sin(a*7+ph2);                         // uneven edges
      for(const g of gullies){let d=Math.abs(((a-g.a)%TAU+TAU+Math.PI)%TAU-Math.PI);v*=1-g.depth*Math.exp(-(d*d)/(2*g.w*g.w));}   // gullies cut in
      rad[i]=v;if(v>maxR)maxR=v;}
    const clear=landValue(x,y)>0.05&&roadInfo(x,y).d>maxR+280&&!nearLoc(x,y,maxR+800)&&
      [0,1,2,3,4,5,6,7].every(k=>{const a=k/8*TAU,t=terrainRaw(x+Math.cos(a)*(maxR+90),y+Math.sin(a)*(maxR+90));return t===T.GROUND||t===T.DRY;})&&terrainRaw(x,y)===T.GROUND;
    if(clear)m={id:'m'+ix+'_'+iy,x,y,R,maxR,rad,butte,seed:hash2(ix,iy)};}
  mesaCache.set(key,m);return m;}
// the cliff's distance from the centre, in a given direction
function mesaR(m,a){const f=((a%TAU)+TAU)%TAU/TAU*MESA_N,i=Math.floor(f)%MESA_N,t=f-Math.floor(f);return m.rad[i]*(1-t)+m.rad[(i+1)%MESA_N]*t;}
function mesasNear(x,y,range){const out=[],i0=Math.floor((x-range)/MESA_CELL),i1=Math.floor((x+range)/MESA_CELL),j0=Math.floor((y-range)/MESA_CELL),j1=Math.floor((y+range)/MESA_CELL);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const m=mesaAt(i,j);if(m)out.push(m);}return out;}
// is this point on (or within pad of) a mesa's cliffs?
function insideMesa(x,y,pad){pad=pad||0;for(const m of mesasNear(x,y,500)){const dx=x-m.x,dy=y-m.y,d=Math.hypot(dx,dy);if(d>m.maxR+pad)continue;if(d<mesaR(m,Math.atan2(dy,dx))+pad)return m;}return null;}
// push a moving thing out of any cliff it has run into; returns the outward normal if it hit
function collideMesas(b){for(const m of mesasNear(b.x,b.y,500)){const dx=b.x-m.x,dy=b.y-m.y,d=Math.hypot(dx,dy)||1;if(d>m.maxR+b.r+4)continue;
    const a=Math.atan2(dy,dx),edge=mesaR(m,a)+b.r*0.9;if(d<edge){const nx=dx/d,ny=dy/d;b.x=m.x+nx*edge;b.y=m.y+ny*edge;return {nx,ny};}}return null;}
