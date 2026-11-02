/* ===== townsfolk: daily routines, walking in and out of buildings ===== */
const ROLE_LABEL={wanderer:'drifter',companion:'companion',publican:'publican',mechanic:'mechanic',doctor:'doctor',guard:'guard',settler:'settler',trader:'trader',scavenger:'scavenger'};
function npcLook(seed){const r=rng(seed),pick=a=>a[Math.floor(r()*a.length)];
  return {shirt:pick(['#8a5a3a','#5f6b45','#7c3a2a','#3f5a6a','#a8834a','#6a4a6a','#c9b28a','#4a4038']),skin:pick(['#d9b48c','#c49a6c','#8d5f3c','#e3c09a','#6b4428']),
    hat:r()<0.45?pick(['#5a3f2a','#3b3026','#a8834a','#2b2420']):null};}
function hourNow(){return (G.clock%DAY)/60;}
function syncNPCs(){const b=body(),have=new Set(G.npcs.map(n=>n.def.id));
  for(const o of LOCS){if(!o.npcs.length||Math.hypot(o.x-b.x,o.y-b.y)>2800)continue;
    for(const def of o.npcs)if(!have.has(def.id)&&!G.npcGone.has(def.id)&&!G.flags['recruited_'+def.id]&&!G.flags['dead_'+def.id])G.npcs.push(spawnNPC(o,def));}
  G.npcs=G.npcs.filter(n=>Math.hypot(n.loc.x-b.x,n.loc.y-b.y)<3600);}
function spawnNPC(o,def){const n={kind:'npc',def,loc:o,x:o.x,y:o.y,vx:0,vy:0,a:Math.random()*TAU,r:8,path:[],wait:rand(0,4),walk:0,stuck:0,
  look:npcLook(def.seed),talking:false,speed:0};
  const t=chooseTarget(n);n.x=t.x;n.y=t.y;collideBuildings(n);return n;}
// an outdoor spot that isn't inside (or right up against) a building
function clearOutdoor(o,x,y){return o.bld.every(b=>!bInside(b,x,y,-22));}
function plazaPoint(o,r){for(let t=0;t<12;t++){const rad=(o.type==='city'?220:o.type==='outpost'?120:150)*Math.sqrt(r()),a=Math.random()*TAU,x=o.x+Math.cos(a)*rad,y=o.y+Math.sin(a)*rad;
  if(clearOutdoor(o,x,y)||t===11)return {b:-1,x,y};}}
function indoorPoint(o,bi){const b=o.bld[bi];if(!b)return plazaPoint(o,Math.random);
  const p=b.L((Math.random()-0.5)*(b.w-40),(Math.random()-0.5)*(b.h-44));return {b:bi,x:p.x,y:p.y};}
// where should this person be heading now? depends on their job and the time of day
function chooseTarget(n){const o=n.loc,d=n.def,h=hourNow(),night=h<6||h>=21,r=Math.random;
  switch(d.role){
    case 'publican':{const b=o.bld[d.work];if(b&&r()<0.85){const p=b.L((r()-0.5)*(b.w-70),-b.h/2+36);return {b:d.work,x:p.x,y:p.y};}return night?indoorPoint(o,d.work):{b:-1,x:b.doorOut.x,y:b.doorOut.y};}
    case 'mechanic':{if(night)return indoorPoint(o,d.home);const b=o.bld[d.work];if(r()<0.6)return {b:-1,x:b.doorOut.x+rand(-30,30),y:b.doorOut.y+rand(-20,20)};return indoorPoint(o,d.work);}
    case 'doctor':case 'trader':return indoorPoint(o,d.work);
    case 'guard':{for(let t=0;t<12;t++){const a=r()*TAU,rad=o.type==='city'?380:240,x=o.x+Math.cos(a)*rad,y=o.y+Math.sin(a)*rad;if(clearOutdoor(o,x,y))return {b:-1,x,y};}return plazaPoint(o,r);}
    case 'scavenger':return r()<0.6?indoorPoint(o,d.home):plazaPoint(o,r);
    default:{if(night)return indoorPoint(o,d.home);const x=r();if(x<0.45)return plazaPoint(o,r);if(x<0.7)return indoorPoint(o,d.home);
      const pub=o.bld.findIndex(b=>b.kind==='pub');return indoorPoint(o,pub>=0?pub:d.home);}}}
// simple route: out of the building you're in by its door, in through the target's door
// ---- path-finding in a city: a walkability map of every wall, tank and tower (doorways kept open), searched with A* ----
const NAV=24;
function navGrid(o){if(o.nav)return o.nav;const R=o.rad,N=Math.ceil(2*R/NAV),g=new Uint8Array(N*N),ox=o.x-R,oy=o.y-R,pad=15;   // keep a body's width off every wall
  for(let j=0;j<N;j++)for(let i=0;i<N;i++)if(Math.hypot(ox+(i+0.5)*NAV-o.x,oy+(j+0.5)*NAV-o.y)>R-70)g[j*N+i]=1;   // stay inside the town wall
  for(const b of o.bld){const boxes=b.tank?[[-b.w/2,-b.h/2,b.w/2,b.h/2]]:wallBoxes(b),reach=Math.hypot(b.w,b.h)/2+pad+NAV;
    const i0=Math.max(0,Math.floor((b.x-reach-ox)/NAV)),i1=Math.min(N-1,Math.floor((b.x+reach-ox)/NAV)),j0=Math.max(0,Math.floor((b.y-reach-oy)/NAV)),j1=Math.min(N-1,Math.floor((b.y+reach-oy)/NAV));
    for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const [lx,ly]=bLocal(b,ox+(i+0.5)*NAV,oy+(j+0.5)*NAV);
      const indoors=!b.tank&&Math.abs(lx)<b.w/2&&Math.abs(ly)<b.h/2,p=indoors?5:pad;   // a full margin outside; only a light one inside, so rooms stay walkable
      for(const q of boxes)if(lx>q[0]-p&&lx<q[2]+p&&ly>q[1]-p&&ly<q[3]+p){g[j*N+i]=1;break;}}
    if(!b.tank){// clear the doorway, a cell either side of the front wall
      for(let t=-1;t<=1;t++)for(const ly of [b.h/2-NAV*2,b.h/2-NAV,b.h/2,b.h/2+NAV]){const p=b.L(t*Math.min(NAV*0.5,b.door/2-6),ly),i=Math.floor((p.x-ox)/NAV),j=Math.floor((p.y-oy)/NAV);if(i>=0&&j>=0&&i<N&&j<N)g[j*N+i]=0;}}}
  o.nav={N,g,ox,oy};return o.nav;}
function navCell(nv,x,y){return [clamp(Math.floor((x-nv.ox)/NAV),0,nv.N-1),clamp(Math.floor((y-nv.oy)/NAV),0,nv.N-1)];}
function navFree(nv,i,j){return i>=0&&j>=0&&i<nv.N&&j<nv.N&&!nv.g[j*nv.N+i];}
function nearestFree(nv,i,j){if(navFree(nv,i,j))return [i,j];for(let r=1;r<6;r++)for(let dj=-r;dj<=r;dj++)for(let di=-r;di<=r;di++)if(navFree(nv,i+di,j+dj))return [i+di,j+dj];return null;}
function lineFree(nv,a,b){const d=Math.hypot(b.x-a.x,b.y-a.y),n=Math.ceil(d/8);for(let k=1;k<n;k++){const x=a.x+(b.x-a.x)*k/n,y=a.y+(b.y-a.y)*k/n,[i,j]=navCell(nv,x,y);if(!navFree(nv,i,j))return false;}return true;}
function navPath(o,a,b){const nv=navGrid(o),N=nv.N;
  // parked cars are in the way too: block their cells for this one search, then put the map back
  const marked=[];for(const c of G.cars||[]){if(c.speed>5||Math.hypot(c.x-o.x,c.y-o.y)>o.rad)continue;const rr=c.r+14,[ci,cj]=navCell(nv,c.x,c.y),k=Math.ceil(rr/NAV);
    for(let dj=-k;dj<=k;dj++)for(let di=-k;di<=k;di++){const i=ci+di,j=cj+dj;if(i<0||j<0||i>=N||j>=N)continue;const x=nv.ox+(i+0.5)*NAV,y=nv.oy+(j+0.5)*NAV;
      if(Math.hypot(x-c.x,y-c.y)<rr&&!nv.g[j*N+i]){nv.g[j*N+i]=1;marked.push(j*N+i);}}}
  try{return navSearch(nv,a,b);}finally{for(const k of marked)nv.g[k]=0;}}
function navSearch(nv,a,b){const N=nv.N,s=nearestFree(nv,...navCell(nv,a.x,a.y)),e=nearestFree(nv,...navCell(nv,b.x,b.y));if(!s||!e)return null;
  const si=s[1]*N+s[0],ei=e[1]*N+e[0],gs=new Float32Array(N*N).fill(1e9),from=new Int32Array(N*N).fill(-1),closed=new Uint8Array(N*N),heap=[],H=k=>{const dx=Math.abs(k%N-e[0]),dy=Math.abs((k/N|0)-e[1]);return Math.max(dx,dy)+0.414*Math.min(dx,dy);};
  const push=(k,f)=>{heap.push([f,k]);let c=heap.length-1;while(c>0){const p=(c-1)>>1;if(heap[p][0]<=heap[c][0])break;[heap[p],heap[c]]=[heap[c],heap[p]];c=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let c=0;for(;;){const l=c*2+1,r=l+1;let m=c;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===c)break;[heap[m],heap[c]]=[heap[c],heap[m]];c=m;}}return top;};
  gs[si]=0;push(si,H(si));let found=false,steps=0;
  while(heap.length&&steps++<40000){const [,k]=pop();if(closed[k])continue;closed[k]=1;if(k===ei){found=true;break;}const ci=k%N,cj=k/N|0;
    for(let dj=-1;dj<=1;dj++)for(let di=-1;di<=1;di++){if(!di&&!dj)continue;const ni=ci+di,nj=cj+dj;if(!navFree(nv,ni,nj))continue;if(di&&dj&&(!navFree(nv,ci+di,cj)||!navFree(nv,ci,cj+dj)))continue;   // no cutting corners
      const nk=nj*N+ni,ng=gs[k]+(di&&dj?1.414:1);if(ng<gs[nk]){gs[nk]=ng;from[nk]=k;push(nk,ng+H(nk));}}}
  if(!found)return null;const cells=[];for(let k=ei;k>=0;k=from[k]){cells.push({x:nv.ox+(k%N+0.5)*NAV,y:nv.oy+((k/N|0)+0.5)*NAV});if(k===si)break;}cells.reverse();
  // smooth it: keep only the turns you need, walking in straight lines wherever the way is clear
  const out=[];let cur={x:a.x,y:a.y};let k=0;while(k<cells.length){let far=k;for(let m=cells.length-1;m>k;m--)if(lineFree(nv,cur,cells[m])){far=m;break;}out.push(cells[far]);cur=cells[far];k=far+1;}
  out.push({x:b.x,y:b.y});return out;}
let navBudget=0;   // how many city routes may be planned this frame
function planPath(n,t){const o=n.loc,pts=[];
  if(o.grid){if(navBudget<=0){n.wait=0.05+Math.random()*0.1;n.pendingT=t;return;}navBudget--;
    // exact door points to get out of and into buildings (doors are narrow); the path-finder only for the walk between doorsteps
    const cur=o.bld.findIndex(b=>!b.tank&&bInside(b,n.x,n.y,2)),pts=[];let from={x:n.x,y:n.y};
    if(cur>=0&&cur===t.b){n.path=[{x:t.x,y:t.y}];return;}
    if(cur>=0){const b=o.bld[cur];pts.push({x:b.doorIn.x,y:b.doorIn.y},{x:b.doorOut.x,y:b.doorOut.y});from=b.doorOut;}
    const tb=t.b>=0?o.bld[t.b]:null,goal=tb?tb.doorOut:{x:t.x,y:t.y},mid=navPath(o,from,goal);
    if(mid){pts.push(...mid);if(tb)pts.push({x:tb.doorIn.x,y:tb.doorIn.y},{x:t.x,y:t.y});n.path=pts.map(p=>({x:p.x,y:p.y}));return;}}
  const cur=o.bld.findIndex(b=>!b.tank&&bInside(b,n.x,n.y,2));
  if(cur>=0&&cur!==t.b){const b=o.bld[cur];pts.push(b.doorIn,b.doorOut);}
  const next=t.b>=0&&t.b!==cur?o.bld[t.b].doorOut:{x:t.x,y:t.y},from=pts.length?pts[pts.length-1]:{x:n.x,y:n.y};
  // doors all face the square, so if a building is in the way, cut through the square instead
  const blocked=o.bld.some((b,i)=>i!==cur&&i!==t.b&&segDist(b.x,b.y,from.x,from.y,next.x,next.y)<Math.hypot(b.w,b.h)/2+10);
  if(blocked){const sx=(from.x+next.x)/2,sy=(from.y+next.y)/2,k=0.3;pts.push({x:o.x+(sx-o.x)*k,y:o.y+(sy-o.y)*k});}
  if(t.b>=0&&t.b!==cur){const b=o.bld[t.b];pts.push(b.doorOut,b.doorIn);}
  pts.push({x:t.x,y:t.y});n.path=pts.map(p=>({x:p.x,y:p.y}));}
function updateNPC(n,dt){const h=G.hero;
  if(n.talking){n.a=Math.atan2(h.y-n.y,h.x-n.x);n.vx=n.vy=0;n.speed=0;return;}
  if(n.fleeT>0){n.fleeT-=dt;const ax=n.x-h.x,ay=n.y-h.y,l=Math.hypot(ax,ay)||1;n.vx=ax/l*60;n.vy=ay/l*60;n.x+=n.vx*dt;n.y+=n.vy*dt;n.a=Math.atan2(ay,ax);n.walk+=8*dt;n.speed=60;collideBuildings(n);return;}
  // stop and look at you when you're close and on foot
  const dh=Math.hypot(h.x-n.x,h.y-n.y);
  if(!h.inCar&&dh<55&&n.def.role!=='guard'&&!townHostile(n.loc)){n.a+=angDiff(Math.atan2(h.y-n.y,h.x-n.x),n.a)*Math.min(1,dt*6);n.speed=0;return;}
  if(n.wait>0){n.wait-=dt;n.speed=0;if(n.wait<=0){const t=n.pendingT||chooseTarget(n);n.pendingT=null;planPath(n,t);}return;}
  if(!n.path.length){n.wait=rand(3,10);return;}
  const p=n.path[0],dx=p.x-n.x,dy=p.y-n.y,d=Math.hypot(dx,dy),sp=n.def.role==='guard'?26:21;
  if(d<7){n.path.shift();if(!n.path.length)n.wait=rand(3,10);return;}
  const ox=n.x,oy=n.y;n.vx=dx/d*sp;n.vy=dy/d*sp;n.x+=n.vx*dt;n.y+=n.vy*dt;n.a=Math.atan2(dy,dx);n.walk+=sp*dt*0.14;n.speed=sp;
  collideBuildings(n);
  // got stuck on a corner: step around it, then carry on
  if(Math.hypot(n.x-ox,n.y-oy)<sp*dt*0.3){n.stuck+=dt;if(n.stuck>1.6){n.stuck=0;n.x+=-dy/d*14;n.y+=dx/d*14;collideBuildings(n);
    if(n.loc.grid&&n.path&&n.path.length){const fin=n.path[n.path.length-1];n.pendingT={x:fin.x,y:fin.y,b:-1};n.path=[];n.wait=0.05;}   // in a city: find a fresh way to the same place
    else if(Math.random()<0.3)n.path=[];}}else n.stuck=Math.max(0,n.stuck-dt);
}
// people get out of the way of cars, and you can't walk through them
function npcContacts(){const h=G.hero;
  for(const n of G.npcs){if(!h.inCar){const dx=n.x-h.x,dy=n.y-h.y,d=Math.hypot(dx,dy),m=n.r+h.r;if(d<m&&d>1e-4){n.x+=dx/d*(m-d)*0.6;h.x-=dx/d*(m-d)*0.4;h.y-=dy/d*(m-d)*0.4;n.y+=dy/d*(m-d)*0.6;}}
    for(const c of G.cars){if(c.speed<5)continue;const dx=n.x-c.x,dy=n.y-c.y,d=Math.hypot(dx,dy),m=n.r+c.r+4;
      if(d<m+40&&d>1e-4){const push=(m+40-d)/40;n.x+=dx/d*push*6;n.y+=dy/d*push*6;
        if(d<m&&c.speed>60&&!n.yelled){n.yelled=true;popText(n.x,n.y-20,'Oi! Watch it!','#efe2c4');setTimeout(()=>{n.yelled=false;},3000);}}}}}
function nearestNPC(r){const h=G.hero;let best=null,bd=r;for(const n of G.npcs){const d=Math.hypot(n.x-h.x,n.y-h.y);if(d<bd){bd=d;best=n;}}return best;}
